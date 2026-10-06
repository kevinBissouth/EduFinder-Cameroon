"""Helpers partagés entre les routers publics, responsable et administrateur.

Je regroupe ici la logique de filtrage de recherche, de calcul des extra
(résumés de liste, benchmarks) et la traduction des erreurs métier en codes
HTTP, pour éviter de la réimplémenter dans chaque espace de l'API.
"""
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from app.models import ExamResult, Media, MediaType, SchoolFee


def parse_exam_requirement(raw_requirement: str) -> tuple[int, Decimal]:
    """Décompose « exam_id:taux_min » en couple typé pour le filtre de recherche.

    Le schéma Pydantic garantit déjà un seul séparateur, mais je refuse
    explicitement un taux au-dessus de 100 (incohérence de données).
    """
    raw_exam_id, raw_pass_rate = raw_requirement.split(":")
    minimum_rate = Decimal(raw_pass_rate)
    if minimum_rate > 100:
        raise HTTPException(
            status_code=422,
            detail=f"Pass rate must be <= 100 in '{raw_requirement}'",
        )
    return int(raw_exam_id), minimum_rate


def minimum_fee_subquery():
    """Sous-requête du frais annuel minimal par établissement (filtre budget)."""
    return (
        select(
            SchoolFee.id_establishment,
            func.min(SchoolFee.amount).label("min_amount"),
        )
        .group_by(SchoolFee.id_establishment)
        .subquery()
    )


def collect_summary_extras(session: Session, establishment_ids: list[int]):
    """Frais minimum, meilleur taux de réussite et image de couverture pour une
    liste d'établissements, en trois dictionnaires indexés par id interne.

    Le niveau d'indirection via les ids internes (jamais les UUID) évite de
    refaire une requête par établissement : on groupe en une seule passe.
    """
    if not establishment_ids:
        return {}, {}, {}

    fee_minimums = dict(
        session.exec(
            select(SchoolFee.id_establishment, func.min(SchoolFee.amount))
            .where(SchoolFee.id_establishment.in_(establishment_ids))
            .group_by(SchoolFee.id_establishment)
        ).all()
    )
    best_pass_rates = dict(
        session.exec(
            select(ExamResult.id_establishment, func.max(ExamResult.pass_rate))
            .where(ExamResult.id_establishment.in_(establishment_ids))
            .group_by(ExamResult.id_establishment)
        ).all()
    )

    cover_urls: dict[int, str] = {}
    image_media_rows = session.exec(
        select(Media)
        .where(
            Media.id_establishment.in_(establishment_ids),
            Media.type == MediaType.image,
        )
        .order_by(Media.id_media)
    ).all()
    for media_row in image_media_rows:
        # setdefault garde la toute première image (par id croissant) comme couverture.
        cover_urls.setdefault(media_row.id_establishment, media_row.url)

    return fee_minimums, best_pass_rates, cover_urls


def proposal_error_status(error: ValueError) -> int:
    """Code HTTP associé à une erreur métier de proposition (422/409)."""
    from app.services.proposals import DuplicatePendingSubmissionError, UnknownReferenceError

    if isinstance(error, UnknownReferenceError):
        return 422
    if isinstance(error, DuplicatePendingSubmissionError):
        return 409
    return 422

