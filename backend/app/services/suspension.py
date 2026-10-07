"""Suspension et réactivation d'un établissement par le super admin.

Ces deux actions changent le statut directement, sans soumission : chacune
laisse une ligne dans establishment_status_change (qui, quand, pourquoi).
"""
from sqlmodel import Session, select

from app.models import (
    Establishment,
    EstablishmentStatus,
    EstablishmentStatusChange,
    User,
)
from app.services.proposals import get_establishment_by_uuid
from app.services.workflow import ensure_transition


class EstablishmentNotFoundError(LookupError):
    """Aucun établissement pour cet UUID -> 404 côté route."""


class EstablishmentNotSuspendedError(ValueError):
    """Réactivation demandée sur une fiche non suspendue -> 409 côté route."""


def suspend_establishment(
    session: Session, admin_user: User, establishment_uuid: str, reason: str
) -> Establishment:
    establishment = _get_establishment_or_error(session, establishment_uuid)
    ensure_transition(establishment.status, EstablishmentStatus.suspended)
    status_change = _build_status_change(
        establishment, admin_user, EstablishmentStatus.suspended, reason
    )
    return _apply_status_change(session, establishment, status_change)


def reactivate_establishment(
    session: Session, admin_user: User, establishment_uuid: str
) -> Establishment:
    establishment = _get_establishment_or_error(session, establishment_uuid)
    # ensure_transition ne suffit pas ici : il accepte aussi pending -> published
    # et published -> published, donc une « réactivation » publierait une fiche
    # jamais validée. Je n'autorise que le retour depuis suspended.
    if establishment.status != EstablishmentStatus.suspended:
        raise EstablishmentNotSuspendedError(
            "Only a suspended establishment can be reactivated"
        )
    status_change = _build_status_change(
        establishment, admin_user, EstablishmentStatus.published
    )
    return _apply_status_change(session, establishment, status_change)


def get_suspension_reasons(
    session: Session, establishment_ids: list[int]
) -> dict[int, str | None]:
    """Motif de la dernière suspension de chaque établissement demandé."""
    if not establishment_ids:
        return {}
    suspensions = session.exec(
        select(EstablishmentStatusChange)
        .where(
            EstablishmentStatusChange.id_establishment.in_(establishment_ids),
            EstablishmentStatusChange.new_status == EstablishmentStatus.suspended,
        )
        .order_by(EstablishmentStatusChange.id_status_change)
    ).all()
    # Parcours par id croissant : la suspension la plus récente écrase les
    # précédentes dans le dictionnaire.
    return {
        suspension.id_establishment: suspension.reason for suspension in suspensions
    }


def _get_establishment_or_error(
    session: Session, establishment_uuid: str
) -> Establishment:
    establishment = get_establishment_by_uuid(session, establishment_uuid)
    if establishment is None:
        raise EstablishmentNotFoundError("Establishment not found")
    return establishment


def _build_status_change(
    establishment: Establishment,
    admin_user: User,
    new_status: EstablishmentStatus,
    reason: str | None = None,
) -> EstablishmentStatusChange:
    return EstablishmentStatusChange(
        id_establishment=establishment.id_establishment,
        id_user=admin_user.id_user,
        previous_status=establishment.status,
        new_status=new_status,
        reason=reason,
    )


def _apply_status_change(
    session: Session,
    establishment: Establishment,
    status_change: EstablishmentStatusChange,
) -> Establishment:
    establishment.status = status_change.new_status
    session.add(establishment)
    session.add(status_change)
    session.commit()
    session.refresh(establishment)
    return establishment
