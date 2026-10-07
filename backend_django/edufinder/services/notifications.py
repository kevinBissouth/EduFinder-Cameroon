"""Notifications du circuit de validation.

Chaque événement important prévient les comptes concernés : les super
administrateurs quand une soumission arrive, le responsable quand elle est
décidée, les responsables d'un établissement quand il est suspendu ou
réactivé. Les fonctions d'émission sont appelées dans la transaction de
l'événement : si celui-ci échoue, aucune notification ne reste.
"""
from django.db.models import QuerySet
from django.utils import timezone

from edufinder.models import (
    Establishment,
    EstablishmentStatus,
    Notification,
    NotificationKind,
    Submission,
    SubmissionStatus,
    User,
    UserRole,
)

LISTED_NOTIFICATIONS_LIMIT = 50

_KIND_BY_DECISION = {
    SubmissionStatus.APPROVED: NotificationKind.SUBMISSION_APPROVED,
    SubmissionStatus.REJECTED: NotificationKind.SUBMISSION_REJECTED,
}
_KIND_BY_NEW_STATUS = {
    EstablishmentStatus.SUSPENDED: NotificationKind.ESTABLISHMENT_SUSPENDED,
    EstablishmentStatus.PUBLISHED: NotificationKind.ESTABLISHMENT_REACTIVATED,
}


class NotificationNotFoundError(Exception):
    """Aucune notification de ce compte ne porte cet identifiant."""


# --- Émission -----------------------------------------------------------------


def notify_submission_received(submission: Submission) -> None:
    super_admins = User.objects.filter(role=UserRole.SUPER_ADMIN)
    Notification.objects.bulk_create(
        Notification(
            recipient=super_admin,
            kind=NotificationKind.SUBMISSION_RECEIVED,
            establishment=submission.establishment,
            submission=submission,
        )
        for super_admin in super_admins
    )


def notify_submission_decided(submission: Submission, reason: str | None) -> None:
    Notification.objects.create(
        recipient=submission.user,
        kind=_KIND_BY_DECISION[submission.status],
        establishment=submission.establishment,
        submission=submission,
        reason=reason,
    )


def notify_establishment_status_changed(
    establishment: Establishment, reason: str | None
) -> None:
    managers = User.objects.filter(user_establishments__establishment=establishment)
    Notification.objects.bulk_create(
        Notification(
            recipient=manager,
            kind=_KIND_BY_NEW_STATUS[establishment.status],
            establishment=establishment,
            reason=reason,
        )
        for manager in managers
    )


# --- Lecture ------------------------------------------------------------------


# Tout part des notifications du compte connecté : aucune fonction de ce
# module ne peut lire ni modifier celles d'un autre compte.
def _notifications_of(user: User) -> QuerySet[Notification]:
    return Notification.objects.filter(recipient=user)


def list_recent_notifications(user: User) -> QuerySet[Notification]:
    return (
        _notifications_of(user)
        .select_related("establishment", "submission")
        .order_by("-created_at", "-id_notification")[:LISTED_NOTIFICATIONS_LIMIT]
    )


def count_unread_notifications(user: User) -> int:
    return _notifications_of(user).filter(read_at__isnull=True).count()


def mark_notification_read(user: User, notification_uuid: str) -> None:
    notification = _notifications_of(user).filter(uuid=notification_uuid).first()
    if notification is None:
        raise NotificationNotFoundError(notification_uuid)
    # Relire une notification déjà lue ne change pas la date de première lecture.
    if notification.read_at is None:
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at"])


def mark_all_notifications_read(user: User) -> None:
    _notifications_of(user).filter(read_at__isnull=True).update(read_at=timezone.now())
