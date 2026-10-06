"""Endpoints publics : santé, recherche d'établissements, statistiques et méta.

Seule la lecture publique vit ici. Les espaces responsable et administrateur
sont montés dans leurs routers dédiés (manager.py, admin.py), et la couche
d'authentification dans auth.py — ce fichier ne fait qu'exposer le moteur de
recherche et la fiche publique.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, text
from sqlmodel import Session, select

from app.api.common import collect_summary_extras, minimum_fee_subquery, parse_exam_requirement
from app.db.session import get_db
from app.models import (
    City,
    Establishment,
    EstablishmentStatus,
    EstablishmentType,
    Exam,
    ExamResult,
    LinguisticSection,
    PaymentMethod,
    Program,
    ProgramOffer,
    Region,
    SchoolFee,
    Sector,
    Service,
    StudyLevel,
)
from app.schemas.institution import (
    FiltersMeta,
    InstitutionDetail,
    InstitutionFilters,
    InstitutionSummary,
    PlatformStats,
    to_filters_meta,
    to_institution_detail,
    to_institution_summary,
)

public_router = APIRouter()


@public_router.get("/health")
def health(session: Session = Depends(get_db)):
    session.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@public_router.get("/institutions", response_model=list[InstitutionSummary])
def list_institutions(
    filters: Annotated[InstitutionFilters, Query()],
    session: Session = Depends(get_db),
):
    # Je construis la requête de recherche sur les seuls établissements
    # publiés (règle d'or) puis j'applique l'ensemble des filtres.
    published_establishments_stmt = select(Establishment).where(
        Establishment.status == EstablishmentStatus.published
    )
    if filters.city_id is not None:
        published_establishments_stmt = published_establishments_stmt.where(
            Establishment.id_city == filters.city_id
        )
    if filters.type_id is not None:
        published_establishments_stmt = published_establishments_stmt.where(
            Establishment.id_type == filters.type_id
        )
    if filters.linguistic_section_id is not None:
        published_establishments_stmt = published_establishments_stmt.where(
            Establishment.id_linguistic_section == filters.linguistic_section_id
        )
    if filters.sector_id is not None:
        selected_sector = session.get(Sector, filters.sector_id)
        if selected_sector is None:
            matched_ids = [filters.sector_id]
        else:
            same_group_stmt = select(Sector.id_sector).where(
                Sector.is_public == selected_sector.is_public
            )
            matched_ids = session.exec(same_group_stmt).all()
        published_establishments_stmt = published_establishments_stmt.where(
            Establishment.id_sector.in_(matched_ids)
        )
    if filters.region_id is not None:
        published_establishments_stmt = published_establishments_stmt.join(City).where(
            City.id_region == filters.region_id
        )
    if filters.program_id is not None:
        published_establishments_stmt = published_establishments_stmt.join(
            ProgramOffer
        ).where(ProgramOffer.id_program == filters.program_id)
    if filters.search_term:
        published_establishments_stmt = published_establishments_stmt.where(
            Establishment.name.contains(filters.search_term)
        )

    if filters.min_fee is not None or filters.max_fee is not None:
        fee_floor_subq = minimum_fee_subquery()
        published_establishments_stmt = published_establishments_stmt.join(
            fee_floor_subq,
            Establishment.id_establishment == fee_floor_subq.c.id_establishment,
        )
        if filters.min_fee is not None:
            published_establishments_stmt = published_establishments_stmt.where(
                fee_floor_subq.c.min_amount >= filters.min_fee
            )
        if filters.max_fee is not None:
            published_establishments_stmt = published_establishments_stmt.where(
                fee_floor_subq.c.min_amount <= filters.max_fee
            )

    for service_name in filters.service_names:
        published_establishments_stmt = published_establishments_stmt.where(
            select(Service.id_service)
            .where(
                Service.id_establishment == Establishment.id_establishment,
                func.lower(Service.name) == service_name.lower(),
            )
            .exists()
        )
    for exam_id, minimum_rate in [
        parse_exam_requirement(requirement) for requirement in filters.exam_requirements
    ]:
        published_establishments_stmt = published_establishments_stmt.where(
            select(ExamResult.id_result)
            .where(
                ExamResult.id_establishment == Establishment.id_establishment,
                ExamResult.id_exam == exam_id,
                ExamResult.pass_rate >= minimum_rate,
            )
            .exists()
        )

    published_establishments_stmt = published_establishments_stmt.order_by(
        Establishment.recommended.desc(), Establishment.id_establishment
    )

    # Pagination optionnelle : si le client demande limit/offset, je limite la
    # sélection en base au lieu de tout charger. Sans limit, comportement
    # inchangé (l'interface actuelle n'utilise pas encore la pagination).
    if filters.limit is not None:
        published_establishments_stmt = published_establishments_stmt.limit(filters.limit)
    if filters.offset is not None:
        published_establishments_stmt = published_establishments_stmt.offset(filters.offset)

    establishments = session.exec(published_establishments_stmt).all()
    fee_minimums, best_pass_rates, cover_urls = collect_summary_extras(
        session, [item.id_establishment for item in establishments]
    )
    return [
        to_institution_summary(
            item,
            min_tuition=fee_minimums.get(item.id_establishment),
            best_pass_rate=best_pass_rates.get(item.id_establishment),
            cover_url=cover_urls.get(item.id_establishment),
        )
        for item in establishments
    ]


@public_router.get("/stats", response_model=PlatformStats)
def get_platform_stats(session: Session = Depends(get_db)):
    published_condition = Establishment.status == EstablishmentStatus.published

    institution_count = session.exec(
        select(func.count()).select_from(Establishment).where(published_condition)
    ).one()
    city_count = session.exec(
        select(func.count(func.distinct(Establishment.id_city))).where(
            published_condition
        )
    ).one()
    fee_plan_count = session.exec(
        select(func.count())
        .select_from(SchoolFee)
        .join(Establishment, SchoolFee.id_establishment == Establishment.id_establishment)
        .where(published_condition)
    ).one()
    exam_result_count = session.exec(
        select(func.count())
        .select_from(ExamResult)
        .join(Establishment, ExamResult.id_establishment == Establishment.id_establishment)
        .where(published_condition)
    ).one()

    return PlatformStats(
        institutions=institution_count,
        cities=city_count,
        fee_plans=fee_plan_count,
        exam_results=exam_result_count,
    )


@public_router.get("/filters-meta", response_model=FiltersMeta)
def get_filters_meta(session: Session = Depends(get_db)):
    regions = session.exec(select(Region).order_by(Region.name)).all()
    sectors = session.exec(select(Sector).order_by(Sector.label)).all()
    exams = session.exec(select(Exam).order_by(Exam.label)).all()
    cities = session.exec(select(City).order_by(City.id_city)).all()
    types = session.exec(select(EstablishmentType).order_by(EstablishmentType.id_type)).all()
    languages = session.exec(
        select(LinguisticSection).order_by(LinguisticSection.id_linguistic_section)
    ).all()
    levels = session.exec(
        select(StudyLevel).order_by(StudyLevel.id_stage, StudyLevel.label)
    ).all()
    programs = session.exec(select(Program).order_by(Program.name)).all()
    payment_methods = session.exec(select(PaymentMethod).order_by(PaymentMethod.label)).all()
    published_services_stmt = (
        select(Service.name)
        .join(Establishment)
        .where(Establishment.status == EstablishmentStatus.published)
        .distinct()
    )
    distinct_services = session.exec(published_services_stmt).all()

    # Je déduplique les services en ignorant la casse (collation MySQL déjà
    # insensible, mais je le garantis aussi côté Python pour les autres bases).
    unique_services: list[str] = []
    seen_service_names: set = set()
    for service_name in distinct_services:
        lowered_service_name = service_name.lower()
        if lowered_service_name in seen_service_names:
            continue
        seen_service_names.add(lowered_service_name)
        unique_services.append(service_name)

    featured_type_ids = list(
        session.exec(
            select(Establishment.id_type)
            .where(Establishment.status == EstablishmentStatus.published)
            .group_by(Establishment.id_type)
            .order_by(func.count(Establishment.id_establishment).desc())
            .limit(4)
        ).all()
    )

    return to_filters_meta(
        regions,
        sectors,
        exams,
        unique_services,
        cities,
        types,
        languages,
        levels,
        programs,
        payment_methods=payment_methods,
        featured_type_ids=featured_type_ids,
    )


@public_router.get("/institutions/{institution_uuid}", response_model=InstitutionDetail)
def get_institution(institution_uuid: str, session: Session = Depends(get_db)):
    establishment = session.exec(
        select(Establishment).where(
            Establishment.uuid == institution_uuid,
            Establishment.status == EstablishmentStatus.published,
        )
    ).first()
    if establishment is None:
        raise HTTPException(status_code=404, detail="Institution not found")
    return to_institution_detail(establishment)


@public_router.post("/institutions/{institution_uuid}/track-view")
def track_institution_view(institution_uuid: str, session: Session = Depends(get_db)):
    establishment = session.exec(
        select(Establishment).where(
            Establishment.uuid == institution_uuid,
            Establishment.status == EstablishmentStatus.published,
        )
    ).first()
    if establishment is None:
        raise HTTPException(status_code=404, detail="Institution not found")
    establishment.views_count = (establishment.views_count or 0) + 1
    session.add(establishment)
    session.commit()
    return {"views_count": establishment.views_count}


@public_router.post("/institutions/{institution_uuid}/track-inquiry")
def track_institution_inquiry(
    institution_uuid: str, session: Session = Depends(get_db)
):
    establishment = session.exec(
        select(Establishment).where(
            Establishment.uuid == institution_uuid,
            Establishment.status == EstablishmentStatus.published,
        )
    ).first()
    if establishment is None:
        raise HTTPException(status_code=404, detail="Institution not found")
    establishment.inquiries_count = (establishment.inquiries_count or 0) + 1
    session.add(establishment)
    session.commit()
    return {"inquiries_count": establishment.inquiries_count}
