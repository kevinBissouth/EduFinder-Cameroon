"""Lecture publique des établissements : seul le statut publié est visible."""
from django.db.models import Prefetch, QuerySet

from edufinder.models import (
    Establishment,
    ExamResult,
    Media,
    ProgramOffer,
    SchoolFee,
    SchoolFeePaymentMethod,
    Service,
)
from edufinder.services.data_rules import (
    exclude_results_contradicting_establishment_type,
)


def find_published_establishment_profile(institution_uuid: str) -> Establishment | None:
    return (
        with_profile_relations(Establishment.objects.published())
        .filter(uuid=institution_uuid)
        .first()
    )


# Je charge toute la fiche en un nombre fixe de requêtes (une par liste
# imbriquée) : sans ces préchargements, chaque frais et chaque résultat
# déclencherait ses propres requêtes. Les tris sont explicites pour que
# l'ordre des listes ne dépende jamais de l'index choisi par le moteur.
def with_profile_relations(establishments: QuerySet) -> QuerySet:
    return establishments.select_related(
        "city__region", "type", "sector", "linguistic_section"
    ).prefetch_related(
        Prefetch("fees", queryset=_ordered_fees()),
        Prefetch("services", queryset=Service.objects.order_by("name")),
        Prefetch("exam_results", queryset=_ordered_exam_results()),
        Prefetch("program_offers", queryset=_ordered_program_offers()),
        Prefetch("media", queryset=Media.objects.order_by("id_media")),
    )


def _ordered_fees() -> QuerySet:
    ordered_payment_methods = SchoolFeePaymentMethod.objects.select_related(
        "payment_method"
    ).order_by("payment_method")
    return (
        SchoolFee.objects.select_related("level__stage")
        .prefetch_related(Prefetch("payment_methods", queryset=ordered_payment_methods))
        .order_by("id_fee")
    )


def _ordered_exam_results() -> QuerySet:
    return exclude_results_contradicting_establishment_type(
        ExamResult.objects.select_related("exam")
    ).order_by("id_result")


def _ordered_program_offers() -> QuerySet:
    return ProgramOffer.objects.select_related("program").order_by("program")
