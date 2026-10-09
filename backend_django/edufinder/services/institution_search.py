"""Recherche publique des établissements.

Chaque famille de filtres a sa fonction : elle reçoit la sélection en cours et
la renvoie restreinte (ou inchangée si le filtre n'est pas demandé). Ajouter
un filtre revient à écrire une fonction et à l'appeler dans
search_published_establishments, sans toucher aux autres.
"""
from collections.abc import Sequence
from dataclasses import dataclass
from decimal import Decimal
from typing import NamedTuple

from django.db.models import Exists, OuterRef, Q, QuerySet

from edufinder.models import Establishment, ProgramOffer, Sector, Service
from edufinder.services.summary_aggregates import (
    coherent_exam_results_of_outer_establishment,
    with_cover_url,
    with_profile_completeness,
    with_tuition_and_pass_rate,
)


class ExamRequirement(NamedTuple):
    exam_id: int
    minimum_pass_rate: Decimal


@dataclass(frozen=True)
class InstitutionSearchFilters:
    city_id: int | None = None
    type_id: int | None = None
    linguistic_section_id: int | None = None
    program_id: int | None = None
    sector_id: int | None = None
    region_id: int | None = None
    min_fee: Decimal | None = None
    max_fee: Decimal | None = None
    service_names: Sequence[str] = ()
    exam_requirements: Sequence[ExamRequirement] = ()
    search_term: str | None = None
    limit: int | None = None
    offset: int | None = None


# Filtres qui se traduisent par une simple égalité : nom du champ de
# InstitutionSearchFilters -> relation comparée côté établissement.
_EXACT_MATCH_LOOKUPS = {
    "city_id": "city",
    "type_id": "type",
    "linguistic_section_id": "linguistic_section",
    "region_id": "city__region",
    "program_id": "program_offers__program",
}


def search_published_establishments(filters: InstitutionSearchFilters) -> QuerySet:
    # Règle d'or : la recherche part toujours des seuls établissements publiés.
    establishments = _with_summary_aggregates(Establishment.objects.published())
    establishments = _filter_by_exact_match(establishments, filters)
    establishments = _filter_by_sector_group(establishments, filters.sector_id)
    establishments = _filter_by_search_term(establishments, filters.search_term)
    establishments = _filter_by_budget(establishments, filters)
    establishments = _filter_by_services(establishments, filters.service_names)
    establishments = _filter_by_exam_results(establishments, filters.exam_requirements)
    # Les fiches complètes d'abord, puis l'ordre alphabétique : aucun
    # établissement n'est mis en avant par choix de la plateforme.
    establishments = establishments.order_by(
        "-is_profile_complete", "name", "id_establishment"
    )
    return _paginate(establishments, filters)


# Le filtre budget et le résumé lisent le même frais minimum, annoté une seule
# fois par la requête de recherche.
def _with_summary_aggregates(establishments: QuerySet) -> QuerySet:
    return with_profile_completeness(
        with_cover_url(
            with_tuition_and_pass_rate(
                establishments.select_related(
                    "city", "type", "sector", "linguistic_section"
                )
            )
        )
    )


def _filter_by_exact_match(
    establishments: QuerySet, filters: InstitutionSearchFilters
) -> QuerySet:
    requested_lookups = {
        lookup: getattr(filters, filter_name)
        for filter_name, lookup in _EXACT_MATCH_LOOKUPS.items()
        if getattr(filters, filter_name) is not None
    }
    return establishments.filter(**requested_lookups)


# Les libellés de secteur sont hétérogènes (« private », « privé »…) : choisir
# l'un d'eux doit ramener tout le groupe public ou tout le groupe privé, d'où
# le regroupement sur la colonne is_public.
def _filter_by_sector_group(establishments: QuerySet, sector_id: int | None) -> QuerySet:
    if sector_id is None:
        return establishments
    selected_sector = Sector.objects.filter(pk=sector_id).first()
    if selected_sector is None:
        return establishments.none()
    return establishments.filter(sector__is_public=selected_sector.is_public)


# La recherche libre porte sur ce qu'un parent tape spontanément : le nom de
# l'établissement, sa ville ou une filière. La filière se cherche sous sa clé
# et sous ses deux libellés, pour répondre dans la langue du visiteur. Je passe
# par EXISTS : une jointure renverrait l'établissement une fois par filière.
def _filter_by_search_term(
    establishments: QuerySet, search_term: str | None
) -> QuerySet:
    if not search_term:
        return establishments
    offers_matching_program = ProgramOffer.objects.filter(
        establishment=OuterRef("pk")
    ).filter(
        Q(program__name__icontains=search_term)
        | Q(program__label_fr__icontains=search_term)
        | Q(program__label_en__icontains=search_term)
    )
    return establishments.filter(
        Q(name__icontains=search_term)
        | Q(city__name__icontains=search_term)
        | Exists(offers_matching_program)
    )


# Le budget se compare au frais annuel le plus bas de l'établissement : c'est
# le montant d'entrée, celui que le parent regarde en premier. Un établissement
# sans aucun frais saisi ne peut pas répondre à un critère de budget.
def _filter_by_budget(
    establishments: QuerySet, filters: InstitutionSearchFilters
) -> QuerySet:
    if filters.min_fee is not None:
        establishments = establishments.filter(min_tuition__gte=filters.min_fee)
    if filters.max_fee is not None:
        establishments = establishments.filter(min_tuition__lte=filters.max_fee)
    return establishments


# Un EXISTS par service : l'établissement doit les proposer tous.
def _filter_by_services(
    establishments: QuerySet, service_names: Sequence[str]
) -> QuerySet:
    for service_name in service_names:
        establishments = establishments.filter(
            Exists(
                Service.objects.filter(
                    establishment=OuterRef("pk"), name__iexact=service_name
                )
            )
        )
    return establishments


def _filter_by_exam_results(
    establishments: QuerySet, exam_requirements: Sequence[ExamRequirement]
) -> QuerySet:
    for exam_requirement in exam_requirements:
        establishments = establishments.filter(
            Exists(
                coherent_exam_results_of_outer_establishment().filter(
                    exam=exam_requirement.exam_id,
                    pass_rate__gte=exam_requirement.minimum_pass_rate,
                )
            )
        )
    return establishments


# Pagination optionnelle : sans limit, toute la sélection est renvoyée (la page
# d'accueil charge la liste complète une seule fois).
def _paginate(establishments: QuerySet, filters: InstitutionSearchFilters) -> QuerySet:
    first_index = filters.offset or 0
    if filters.limit is None:
        return establishments[first_index:]
    return establishments[first_index : first_index + filters.limit]
