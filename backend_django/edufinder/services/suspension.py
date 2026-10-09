"""Suspension et réactivation d'un établissement par le super administrateur.

Ces deux actions changent le statut directement, sans soumission : chacune
laisse une ligne dans establishment_status_change (qui, quand, pourquoi).
"""
from django.db import transaction
from django.db.models import OuterRef, QuerySet, Subquery

from edufinder.models import (
    Establishment,
    EstablishmentStatus,
    EstablishmentStatusChange,
    User,
)
from edufinder.services.errors import ConflictError
from edufinder.services.notifications import notify_establishment_status_changed


class StatusConflictError(ConflictError):
    """Le statut actuel de la fiche ne permet pas l'action demandée."""


def suspend_establishment(
    establishment: Establishment, admin_user: User, reason: str
) -> Establishment:
    return _change_status(
        establishment,
        admin_user,
        required_status=EstablishmentStatus.PUBLISHED,
        new_status=EstablishmentStatus.SUSPENDED,
        reason=reason,
        conflict_message="Only a published establishment can be suspended",
    )


# Je n'autorise que le retour depuis « suspended » : réactiver une fiche en
# attente ou refusée reviendrait à publier un établissement jamais validé.
def reactivate_establishment(
    establishment: Establishment, admin_user: User
) -> Establishment:
    return _change_status(
        establishment,
        admin_user,
        required_status=EstablishmentStatus.SUSPENDED,
        new_status=EstablishmentStatus.PUBLISHED,
        reason=None,
        conflict_message="Only a suspended establishment can be reactivated",
    )


@transaction.atomic
def _change_status(
    establishment: Establishment,
    admin_user: User,
    *,
    required_status: EstablishmentStatus,
    new_status: EstablishmentStatus,
    reason: str | None,
    conflict_message: str,
) -> Establishment:
    # Je relis la fiche en la verrouillant : deux administrateurs agissant en
    # même temps ne peuvent pas enregistrer deux fois le même changement.
    locked_establishment = Establishment.objects.select_for_update().get(
        pk=establishment.pk
    )
    if locked_establishment.status != required_status:
        raise StatusConflictError(conflict_message)
    EstablishmentStatusChange.objects.create(
        establishment=locked_establishment,
        user=admin_user,
        previous_status=locked_establishment.status,
        new_status=new_status,
        reason=reason,
    )
    locked_establishment.status = new_status
    locked_establishment.save(update_fields=["status"])
    notify_establishment_status_changed(locked_establishment, reason)
    return locked_establishment


# Motif de la suspension la plus récente, annoté par la base pour toute une
# liste en une seule requête.
def with_latest_suspension_reason(establishments: QuerySet) -> QuerySet:
    latest_suspension_reason = (
        EstablishmentStatusChange.objects.filter(
            establishment=OuterRef("pk"), new_status=EstablishmentStatus.SUSPENDED
        )
        .order_by("-id_status_change")
        .values("reason")[:1]
    )
    return establishments.annotate(
        latest_suspension_reason=Subquery(latest_suspension_reason)
    )


# Le motif n'est rendu que tant que la fiche est suspendue : une fois
# réactivée, l'ancienne suspension n'a plus à s'afficher.
def read_current_suspension_reason(establishment: Establishment) -> str | None:
    if establishment.status != EstablishmentStatus.SUSPENDED:
        return None
    return establishment.latest_suspension_reason
