"""Notifications du circuit de validation.

Chaque événement important prévient les comptes concernés : les super
administrateurs quand une soumission arrive, le responsable quand elle est
décidée, les responsables d'un établissement quand il est suspendu ou
réactivé. Les fonctions d'émission sont appelées dans la transaction de
l'événement : si celui-ci échoue, aucune notification ne reste.
"""
from datetime import timedelta

from django.db.models import OuterRef, Q, QuerySet
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
from edufinder.services.summary_aggregates import cover_url_of

NOTIFICATIONS_PAGE_SIZE = 20
# Une notification lue sert à retrouver une décision récente ; au-delà, la
# soumission et son motif restent consultables, la notification n'apporte rien.
READ_NOTIFICATION_RETENTION_DAYS = 90

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


def _find_own_notification(user: User, notification_uuid: str) -> Notification:
    notification = _notifications_of(user).filter(uuid=notification_uuid).first()
    if notification is None:
        raise NotificationNotFoundError(notification_uuid)
    return notification


# Plusieurs notifications peuvent naître au même instant (une décision les
# envoie toutes ensemble) : l'identifiant départage, pour qu'« Afficher plus »
# ne saute ni ne répète aucune notification.
def _older_than(notification: Notification) -> Q:
    return Q(created_at__lt=notification.created_at) | Q(
        created_at=notification.created_at,
        id_notification__lt=notification.id_notification,
    )


def list_notifications_page(
    user: User, before_uuid: str | None = None
) -> tuple[list[Notification], bool]:
    """Une page des notifications, les plus récentes d'abord, et s'il en reste."""
    notifications = (
        _notifications_of(user)
        .select_related("establishment", "submission")
        .annotate(cover_url=cover_url_of(OuterRef("establishment")))
        .order_by("-created_at", "-id_notification")
    )
    if before_uuid is not None:
        notifications = notifications.filter(
            _older_than(_find_own_notification(user, before_uuid))
        )
    page = list(notifications[: NOTIFICATIONS_PAGE_SIZE + 1])
    return page[:NOTIFICATIONS_PAGE_SIZE], len(page) > NOTIFICATIONS_PAGE_SIZE


def count_unread_notifications(user: User) -> int:
    return _notifications_of(user).filter(read_at__isnull=True).count()


def mark_notification_read(user: User, notification_uuid: str) -> None:
    notification = _find_own_notification(user, notification_uuid)
    # Relire une notification déjà lue ne change pas la date de première lecture.
    if notification.read_at is None:
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at"])


def mark_all_notifications_read(user: User) -> None:
    _notifications_of(user).filter(read_at__isnull=True).update(read_at=timezone.now())


# --- Nettoyage ------------------------------------------------------------------


def purge_old_read_notifications() -> int:
    """Supprime les notifications lues depuis plus longtemps que la conservation."""
    read_before = timezone.now() - timedelta(days=READ_NOTIFICATION_RETENTION_DAYS)
    deleted_count, _ = Notification.objects.filter(read_at__lt=read_before).delete()
    return deleted_count
