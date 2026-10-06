"""Endpoints publics : santé, recherche d'établissements, statistiques et méta.

Seule la lecture publique vit ici. Les espaces responsable et administrateur
sont montés dans leurs routers dédiés (manager.py, admin.py), et la couche
d'authentification dans auth.py — ce fichier ne fait qu'exposer le moteur de
recherche et la fiche publique.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, text
from sqlmodel import Session, select

from app.api.common import collect_summary_extras
from app.api.search import build_institution_search_stmt
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
from app.services.tracking import (
    INQUIRY_EVENT,
    VIEW_EVENT,
    TrackingEventDeduplicator,
    get_tracking_deduplicator,
)

public_router = APIRouter()

UNKNOWN_CLIENT_ADDRESS = "unknown"


@public_router.get("/health")
def health(session: Session = Depends(get_db)):
    session.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@public_router.get("/institutions", response_model=list[InstitutionSummary])
def list_institutions(
    filters: Annotated[InstitutionFilters, Query()],
    session: Session = Depends(get_db),
):
    establishments = session.exec(
        build_institution_search_stmt(session, filters)
    ).all()
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


def _get_published_establishment_or_404(
    session: Session, institution_uuid: str
) -> Establishment:
    establishment = session.exec(
        select(Establishment).where(
            Establishment.uuid == institution_uuid,
            Establishment.status == EstablishmentStatus.published,
        )
    ).first()
    if establishment is None:
        raise HTTPException(status_code=404, detail="Institution not found")
    return establishment


def _get_client_address(request: Request) -> str:
    # Je lis l'adresse de la connexion et jamais l'en-tête X-Forwarded-For :
    # le client peut le forger pour contourner le dédoublonnage. Derrière un
    # reverse proxy, c'est uvicorn (--proxy-headers) qui doit rétablir la
    # vraie adresse.
    if request.client is None:
        return UNKNOWN_CLIENT_ADDRESS
    return request.client.host


@public_router.get("/institutions/{institution_uuid}", response_model=InstitutionDetail)
def get_institution(institution_uuid: str, session: Session = Depends(get_db)):
    establishment = _get_published_establishment_or_404(session, institution_uuid)
    return to_institution_detail(establishment)


@public_router.post("/institutions/{institution_uuid}/track-view")
def track_institution_view(
    institution_uuid: str,
    request: Request,
    session: Session = Depends(get_db),
    deduplicator: TrackingEventDeduplicator = Depends(get_tracking_deduplicator),
):
    establishment = _get_published_establishment_or_404(session, institution_uuid)
    # Un événement répété reçoit la même réponse 200 qu'un événement compté :
    # je ne signale pas au client que sa requête a été ignorée.
    if deduplicator.should_count(
        _get_client_address(request), establishment.uuid, VIEW_EVENT
    ):
        establishment.views_count = (establishment.views_count or 0) + 1
        session.add(establishment)
        session.commit()
    return {"views_count": establishment.views_count}


@public_router.post("/institutions/{institution_uuid}/track-inquiry")
def track_institution_inquiry(
    institution_uuid: str,
    request: Request,
    session: Session = Depends(get_db),
    deduplicator: TrackingEventDeduplicator = Depends(get_tracking_deduplicator),
):
    establishment = _get_published_establishment_or_404(session, institution_uuid)
    if deduplicator.should_count(
        _get_client_address(request), establishment.uuid, INQUIRY_EVENT
    ):
        establishment.inquiries_count = (establishment.inquiries_count or 0) + 1
        session.add(establishment)
        session.commit()
    return {"inquiries_count": establishment.inquiries_count}
