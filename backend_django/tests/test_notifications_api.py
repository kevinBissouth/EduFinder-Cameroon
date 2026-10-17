from datetime import timedelta
from io import StringIO

import pytest
from django.core.management import call_command
from django.utils import timezone

from edufinder.models import (
    Media,
    MediaType,
    Notification,
    NotificationKind,
    Submission,
    SubmissionStatus,
    SubmissionType,
    User,
    UserEstablishment,
    UserRole,
)
from edufinder.services.notifications import (
    NOTIFICATIONS_PAGE_SIZE,
    READ_NOTIFICATION_RETENTION_DAYS,
)

UNKNOWN_UUID = "00000000-0000-0000-0000-000000000000"
REJECTION_REASON = "Fees are not documented"
SUSPENSION_REASON = "Reported as closed"
NEW_ADDRESS = {"address": "Rue de la Joie, Akwa"}


@pytest.fixture(name="other_manager")
def other_manager_fixture() -> User:
    return User.objects.create(
        name="Paul Other",
        email="other@example.com",
        password_hash="not-a-real-hash",
        role=UserRole.MANAGER,
    )


@pytest.fixture(name="managed_establishment")
def managed_establishment_fixture(establishment, manager):
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    return establishment


@pytest.fixture(name="pending_submission")
def pending_submission_fixture(managed_establishment, manager) -> Submission:
    return Submission.objects.create(
        user=manager,
        establishment=managed_establishment,
        type=SubmissionType.MODIFICATION,
        status=SubmissionStatus.PENDING,
        content=NEW_ADDRESS,
    )


def notify(recipient: User, establishment, **notification_fields) -> Notification:
    return Notification.objects.create(
        recipient=recipient,
        establishment=establishment,
        **{"kind": NotificationKind.SUBMISSION_APPROVED, **notification_fields},
    )


def kinds_received_by(user: User) -> list[str]:
    return list(Notification.objects.filter(recipient=user).values_list("kind", flat=True))


# --- Accès --------------------------------------------------------------------


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("method", "url"),
    [
        ("get", "/notifications"),
        ("post", "/notifications/read-all"),
        ("post", f"/notifications/{UNKNOWN_UUID}/read"),
    ],
)
def test_notification_routes_require_authentication(client, method, url):
    response = getattr(client, method)(url)

    assert response.status_code == 401


# --- Émission -----------------------------------------------------------------


@pytest.mark.django_db
def test_a_new_submission_notifies_every_super_admin_and_nobody_else(
    client, log_in_as, manager, super_admin, managed_establishment
):
    second_super_admin = User.objects.create(
        name="Lea Admin",
        email="lea@example.com",
        password_hash="not-a-real-hash",
        role=UserRole.SUPER_ADMIN,
    )
    log_in_as(manager)

    response = client.post(
        f"/my/establishments/{managed_establishment.uuid}/modification-proposals",
        NEW_ADDRESS,
        format="json",
    )

    assert response.status_code == 201
    submission = Submission.objects.get()
    for admin in (super_admin, second_super_admin):
        notification = Notification.objects.get(recipient=admin)
        assert notification.kind == NotificationKind.SUBMISSION_RECEIVED
        assert notification.submission == submission
        assert notification.read_at is None
    assert kinds_received_by(manager) == []


@pytest.mark.django_db
def test_a_rejected_proposal_notifies_nobody(
    client, log_in_as, manager, super_admin, managed_establishment
):
    log_in_as(manager)

    response = client.post(
        f"/my/establishments/{managed_establishment.uuid}/modification-proposals",
        {},
        format="json",
    )

    assert response.status_code == 422
    assert Notification.objects.count() == 0


@pytest.mark.django_db
def test_approval_notifies_the_manager_who_submitted(
    client, log_in_as, manager, super_admin, pending_submission
):
    log_in_as(super_admin)

    response = client.post(f"/admin/submissions/{pending_submission.uuid}/approve")

    assert response.status_code == 200
    notification = Notification.objects.get(recipient=manager)
    assert notification.kind == NotificationKind.SUBMISSION_APPROVED
    assert notification.submission == pending_submission
    assert notification.reason is None


@pytest.mark.django_db
def test_rejection_notifies_the_manager_with_the_reason(
    client, log_in_as, manager, super_admin, pending_submission
):
    log_in_as(super_admin)

    response = client.post(
        f"/admin/submissions/{pending_submission.uuid}/reject",
        {"reason": REJECTION_REASON},
        format="json",
    )

    assert response.status_code == 200
    notification = Notification.objects.get(recipient=manager)
    assert notification.kind == NotificationKind.SUBMISSION_REJECTED
    assert notification.reason == REJECTION_REASON


@pytest.mark.django_db
def test_a_refused_decision_notifies_nobody(
    client, log_in_as, manager, super_admin, pending_submission
):
    log_in_as(super_admin)
    client.post(f"/admin/submissions/{pending_submission.uuid}/approve")

    response = client.post(f"/admin/submissions/{pending_submission.uuid}/approve")

    assert response.status_code == 409
    assert kinds_received_by(manager) == [NotificationKind.SUBMISSION_APPROVED]


@pytest.mark.django_db
def test_suspension_then_reactivation_notify_every_manager_of_the_establishment(
    client, log_in_as, manager, other_manager, super_admin, managed_establishment
):
    second_manager = User.objects.create(
        name="Nina Second",
        email="second@example.com",
        password_hash="not-a-real-hash",
        role=UserRole.MANAGER,
    )
    UserEstablishment.objects.create(user=second_manager, establishment=managed_establishment)
    log_in_as(super_admin)

    suspension = client.post(
        f"/admin/establishments/{managed_establishment.uuid}/suspend",
        {"reason": SUSPENSION_REASON},
        format="json",
    )
    reactivation = client.post(
        f"/admin/establishments/{managed_establishment.uuid}/reactivate"
    )

    assert (suspension.status_code, reactivation.status_code) == (200, 200)
    expected_kinds = [
        NotificationKind.ESTABLISHMENT_SUSPENDED,
        NotificationKind.ESTABLISHMENT_REACTIVATED,
    ]
    assert kinds_received_by(manager) == expected_kinds
    assert kinds_received_by(second_manager) == expected_kinds
    assert kinds_received_by(other_manager) == []
    suspension_notification = Notification.objects.get(
        recipient=manager, kind=NotificationKind.ESTABLISHMENT_SUSPENDED
    )
    assert suspension_notification.reason == SUSPENSION_REASON
    assert suspension_notification.submission is None


@pytest.mark.django_db
def test_a_refused_suspension_notifies_nobody(
    client, log_in_as, manager, super_admin, managed_establishment
):
    log_in_as(super_admin)

    response = client.post(
        f"/admin/establishments/{managed_establishment.uuid}/reactivate"
    )

    assert response.status_code == 409
    assert Notification.objects.count() == 0


# --- Lecture ------------------------------------------------------------------


@pytest.mark.django_db
def test_list_returns_only_my_notifications_newest_first_with_the_unread_count(
    client, log_in_as, manager, other_manager, establishment, pending_submission
):
    older = notify(manager, establishment, submission=pending_submission)
    newer = notify(
        manager,
        establishment,
        kind=NotificationKind.SUBMISSION_REJECTED,
        submission=pending_submission,
        reason=REJECTION_REASON,
    )
    notify(other_manager, establishment)
    log_in_as(manager)

    response = client.get("/notifications")

    assert response.status_code == 200
    body = response.json()
    assert body["unread_count"] == 2
    assert [item["notification_uuid"] for item in body["notifications"]] == [
        newer.uuid,
        older.uuid,
    ]
    assert body["notifications"][0] == {
        "notification_uuid": newer.uuid,
        "kind": "submission_rejected",
        "establishment_uuid": establishment.uuid,
        "establishment_name": establishment.name,
        "cover_url": None,
        "submission_uuid": pending_submission.uuid,
        "reason": REJECTION_REASON,
        "created_at": body["notifications"][0]["created_at"],
        "is_read": False,
        # Les rubriques de la soumission, pour savoir laquelle a été décidée.
        "changed_fields": ["address"],
    }
    assert body["has_more"] is False


# La photo de l'école suit la règle de couverture du site : la première image
# téléversée, jamais une vidéo.
@pytest.mark.django_db
def test_each_notification_carries_the_cover_of_its_school(
    client, log_in_as, manager, establishment
):
    Media.objects.create(
        establishment=establishment, type=MediaType.VIDEO, url="/media/tour.mp4"
    )
    first_image = Media.objects.create(
        establishment=establishment, type=MediaType.IMAGE, url="/media/front.jpg"
    )
    Media.objects.create(
        establishment=establishment, type=MediaType.IMAGE, url="/media/yard.jpg"
    )
    notify(manager, establishment)
    log_in_as(manager)

    body = client.get("/notifications").json()

    assert body["notifications"][0]["cover_url"] == first_image.url


@pytest.mark.django_db
def test_list_of_an_account_without_notification_is_empty(client, log_in_as, manager):
    log_in_as(manager)

    response = client.get("/notifications")

    assert response.json() == {
        "unread_count": 0,
        "notifications": [],
        "has_more": False,
    }


@pytest.mark.django_db
def test_list_is_paged_but_the_unread_count_is_not(
    client, log_in_as, manager, establishment
):
    notification_count = NOTIFICATIONS_PAGE_SIZE + 3
    for _ in range(notification_count):
        notify(manager, establishment)
    log_in_as(manager)

    body = client.get("/notifications").json()

    assert len(body["notifications"]) == NOTIFICATIONS_PAGE_SIZE
    assert body["has_more"] is True
    assert body["unread_count"] == notification_count


# « Afficher plus » demande les notifications plus anciennes que la dernière
# affichée : aucune n'est sautée ni répétée, même si plusieurs ont la même date.
@pytest.mark.django_db
def test_the_next_page_starts_after_the_last_shown_notification(
    client, log_in_as, manager, establishment
):
    created_at = timezone.now()
    notifications = [
        notify(manager, establishment, created_at=created_at)
        for _ in range(NOTIFICATIONS_PAGE_SIZE + 3)
    ]
    log_in_as(manager)

    first_page = client.get("/notifications").json()
    last_shown_uuid = first_page["notifications"][-1]["notification_uuid"]
    next_page = client.get(f"/notifications?before={last_shown_uuid}").json()

    shown_uuids = [
        item["notification_uuid"]
        for item in first_page["notifications"] + next_page["notifications"]
    ]
    created_uuids = [notification.uuid for notification in notifications]
    assert sorted(shown_uuids) == sorted(created_uuids)
    assert len(set(shown_uuids)) == len(notifications)
    assert next_page["has_more"] is False


@pytest.mark.django_db
def test_paging_after_the_notification_of_another_account_is_404(
    client, log_in_as, manager, other_manager, establishment
):
    foreign_notification = notify(other_manager, establishment)
    log_in_as(manager)

    responses = [
        client.get(f"/notifications?before={foreign_notification.uuid}"),
        client.get(f"/notifications?before={UNKNOWN_UUID}"),
    ]

    assert [response.status_code for response in responses] == [404, 404]


# --- Nettoyage ------------------------------------------------------------------


@pytest.mark.django_db
def test_purge_deletes_only_the_notifications_read_long_ago(manager, establishment):
    long_ago = timezone.now() - timedelta(days=READ_NOTIFICATION_RETENTION_DAYS + 1)
    recently = timezone.now() - timedelta(days=READ_NOTIFICATION_RETENTION_DAYS - 1)
    read_long_ago = notify(manager, establishment, read_at=long_ago)
    kept = [
        notify(manager, establishment, read_at=recently),
        # Une notification jamais lue reste, si vieille soit-elle.
        notify(manager, establishment, created_at=long_ago),
    ]
    output = StringIO()

    call_command("purge_read_notifications", stdout=output)

    assert not Notification.objects.filter(pk=read_long_ago.pk).exists()
    assert set(Notification.objects.all()) == set(kept)
    assert "1 read notification" in output.getvalue()


@pytest.mark.django_db
def test_list_query_count_does_not_grow_with_the_list(
    client, log_in_as, manager, establishment, django_assert_max_num_queries
):
    for _ in range(5):
        notify(manager, establishment)
    log_in_as(manager)

    # 1 compte + 1 décompte des non lues + 1 liste avec ses jointures.
    with django_assert_max_num_queries(3):
        client.get("/notifications")


@pytest.mark.django_db
def test_marking_my_notification_read_lowers_the_unread_count(
    client, log_in_as, manager, establishment
):
    notification = notify(manager, establishment)
    notify(manager, establishment)
    log_in_as(manager)

    response = client.post(f"/notifications/{notification.uuid}/read")

    assert response.status_code == 204
    body = client.get("/notifications").json()
    assert body["unread_count"] == 1
    read_flags = {item["notification_uuid"]: item["is_read"] for item in body["notifications"]}
    assert read_flags[notification.uuid] is True


@pytest.mark.django_db
def test_reading_twice_keeps_the_first_read_date(client, log_in_as, manager, establishment):
    notification = notify(manager, establishment)
    log_in_as(manager)
    client.post(f"/notifications/{notification.uuid}/read")
    notification.refresh_from_db()
    first_read_at = notification.read_at

    response = client.post(f"/notifications/{notification.uuid}/read")

    notification.refresh_from_db()
    assert response.status_code == 204
    assert notification.read_at == first_read_at


@pytest.mark.django_db
def test_marking_the_notification_of_another_account_is_404_and_changes_nothing(
    client, log_in_as, manager, other_manager, establishment
):
    foreign_notification = notify(other_manager, establishment)
    log_in_as(manager)

    response = client.post(f"/notifications/{foreign_notification.uuid}/read")

    foreign_notification.refresh_from_db()
    assert response.status_code == 404
    assert foreign_notification.read_at is None


@pytest.mark.django_db
def test_marking_an_unknown_notification_is_404(client, log_in_as, manager):
    log_in_as(manager)

    response = client.post(f"/notifications/{UNKNOWN_UUID}/read")

    assert response.status_code == 404


@pytest.mark.django_db
def test_read_all_only_touches_my_notifications(
    client, log_in_as, manager, other_manager, establishment
):
    notify(manager, establishment)
    notify(manager, establishment)
    foreign_notification = notify(other_manager, establishment)
    log_in_as(manager)

    response = client.post("/notifications/read-all")

    foreign_notification.refresh_from_db()
    assert response.status_code == 204
    assert client.get("/notifications").json()["unread_count"] == 0
    assert foreign_notification.read_at is None


@pytest.mark.django_db
def test_super_admin_reads_their_own_notifications(
    client, log_in_as, manager, super_admin, establishment
):
    notify(super_admin, establishment, kind=NotificationKind.SUBMISSION_RECEIVED)
    notify(manager, establishment)
    log_in_as(super_admin)

    body = client.get("/notifications").json()

    assert [item["kind"] for item in body["notifications"]] == ["submission_received"]
