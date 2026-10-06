"""Construction de la requête de recherche publique des établissements.

Chaque famille de filtres a sa fonction : elle reçoit la requête en cours et
la renvoie enrichie (ou inchangée si le filtre n'est pas demandé). Ajouter un
filtre revient à écrire une fonction et à l'appeler dans
build_institution_search_stmt, sans toucher aux autres.
"""
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from app.models import (
    City,
    Establishment,
    EstablishmentStatus,
    ExamResult,
    ProgramOffer,
    SchoolFee,
    Sector,
    Service,
)
from app.schemas.institution import InstitutionFilters

MAX_PASS_RATE = 100

# Filtres qui se traduisent par une simple égalité sur une colonne de
# l'établissement : nom du champ de InstitutionFilters -> colonne comparée.
_EXACT_MATCH_COLUMNS = {
    "city_id": Establishment.id_city,
    "type_id": Establishment.id_type,
    "linguistic_section_id": Establishment.id_linguistic_section,
}


def build_institution_search_stmt(session: Session, filters: InstitutionFilters):
    # Règle d'or : la recherche part toujours des seuls établissements publiés.
    search_stmt = select(Establishment).where(
        Establishment.status == EstablishmentStatus.published
    )
    search_stmt = _filter_by_exact_match(search_stmt, filters)
    search_stmt = _filter_by_sector_group(session, search_stmt, filters.sector_id)
    search_stmt = _filter_by_region(search_stmt, filters.region_id)
    search_stmt = _filter_by_program(search_stmt, filters.program_id)
    search_stmt = _filter_by_name(search_stmt, filters.search_term)
    search_stmt = _filter_by_budget(search_stmt, filters)
    search_stmt = _filter_by_services(search_stmt, filters.service_names)
    search_stmt = _filter_by_exam_results(search_stmt, filters.exam_requirements)
    search_stmt = search_stmt.order_by(
        Establishment.recommended.desc(), Establishment.id_establishment
    )
    return _paginate(search_stmt, filters)


def _filter_by_exact_match(search_stmt, filters: InstitutionFilters):
    requested_conditions = [
        column == getattr(filters, filter_name)
        for filter_name, column in _EXACT_MATCH_COLUMNS.items()
        if getattr(filters, filter_name) is not None
    ]
    return search_stmt.where(*requested_conditions)


def _filter_by_sector_group(session: Session, search_stmt, sector_id: int | None):
    if sector_id is None:
        return search_stmt
    return search_stmt.where(
        Establishment.id_sector.in_(_sector_ids_in_same_group(session, sector_id))
    )


def _sector_ids_in_same_group(session: Session, sector_id: int) -> list[int]:
    # Les libellés de secteur sont hétérogènes (« private », « privé »…) :
    # choisir l'un d'eux doit ramener tout le groupe public ou tout le groupe
    # privé, d'où le regroupement sur la colonne is_public.
    selected_sector = session.get(Sector, sector_id)
    if selected_sector is None:
        return [sector_id]
    same_group_stmt = select(Sector.id_sector).where(
        Sector.is_public == selected_sector.is_public
    )
    return list(session.exec(same_group_stmt).all())


def _filter_by_region(search_stmt, region_id: int | None):
    if region_id is None:
        return search_stmt
    return search_stmt.join(City).where(City.id_region == region_id)


def _filter_by_program(search_stmt, program_id: int | None):
    if program_id is None:
        return search_stmt
    return search_stmt.join(ProgramOffer).where(ProgramOffer.id_program == program_id)


def _filter_by_name(search_stmt, search_term: str | None):
    if not search_term:
        return search_stmt
    return search_stmt.where(Establishment.name.contains(search_term))


def _filter_by_budget(search_stmt, filters: InstitutionFilters):
    if filters.min_fee is None and filters.max_fee is None:
        return search_stmt
    # Le budget se compare au frais annuel le plus bas de l'établissement :
    # c'est le montant d'entrée, celui que le parent regarde en premier.
    fee_floor_subq = _minimum_fee_subquery()
    search_stmt = search_stmt.join(
        fee_floor_subq,
        Establishment.id_establishment == fee_floor_subq.c.id_establishment,
    )
    if filters.min_fee is not None:
        search_stmt = search_stmt.where(fee_floor_subq.c.min_amount >= filters.min_fee)
    if filters.max_fee is not None:
        search_stmt = search_stmt.where(fee_floor_subq.c.min_amount <= filters.max_fee)
    return search_stmt


def _minimum_fee_subquery():
    return (
        select(
            SchoolFee.id_establishment,
            func.min(SchoolFee.amount).label("min_amount"),
        )
        .group_by(SchoolFee.id_establishment)
        .subquery()
    )


def _filter_by_services(search_stmt, service_names: list[str]):
    # Un EXISTS par service : l'établissement doit les proposer tous.
    for service_name in service_names:
        search_stmt = search_stmt.where(
            select(Service.id_service)
            .where(
                Service.id_establishment == Establishment.id_establishment,
                func.lower(Service.name) == service_name.lower(),
            )
            .exists()
        )
    return search_stmt


def _filter_by_exam_results(search_stmt, exam_requirements: list[str]):
    for raw_requirement in exam_requirements:
        exam_id, minimum_rate = _parse_exam_requirement(raw_requirement)
        search_stmt = search_stmt.where(
            select(ExamResult.id_result)
            .where(
                ExamResult.id_establishment == Establishment.id_establishment,
                ExamResult.id_exam == exam_id,
                ExamResult.pass_rate >= minimum_rate,
            )
            .exists()
        )
    return search_stmt


def _parse_exam_requirement(raw_requirement: str) -> tuple[int, Decimal]:
    """Décompose « exam_id:taux_min » en couple typé.

    Le schéma Pydantic garantit déjà un seul séparateur, mais je refuse
    explicitement un taux au-dessus de 100 (incohérence de données).
    """
    raw_exam_id, raw_pass_rate = raw_requirement.split(":")
    minimum_rate = Decimal(raw_pass_rate)
    if minimum_rate > MAX_PASS_RATE:
        raise HTTPException(
            status_code=422,
            detail=f"Pass rate must be <= {MAX_PASS_RATE} in '{raw_requirement}'",
        )
    return int(raw_exam_id), minimum_rate


def _paginate(search_stmt, filters: InstitutionFilters):
    # Pagination optionnelle : sans limit, toute la sélection est renvoyée
    # (l'interface actuelle n'utilise pas encore la pagination).
    if filters.limit is not None:
        search_stmt = search_stmt.limit(filters.limit)
    if filters.offset is not None:
        search_stmt = search_stmt.offset(filters.offset)
    return search_stmt
