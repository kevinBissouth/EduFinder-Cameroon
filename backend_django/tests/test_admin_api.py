from datetime import timedelta

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from edufinder.models import (
    DecisionStatus,
    Establishment,
    EstablishmentStatus,
    EstablishmentStatusChange,
    Submission,
    SubmissionStatus,
    SubmissionType,
    User,
    UserEstablishment,
    UserRole,
    ValidationDecision,
)

UNKNOWN_UUID = "00000000-0000-0000-0000-000000000000"
PROPOSED_CONTENT = {"name": "New name"}
SUSPENSION_REASON = "Fees have not been updated for two years"


def add_submission(user, establishment, status=SubmissionStatus.PENDING) -> Submission:
    return Submission.objects.create(
        user=user,
        establishment=establishment,
        type=SubmissionType.MODIFICATION,
        status=status,
        content=PROPOSED_CONTENT,
    )


def suspend_url(establishment: Establishment) -> str:
    return f"/admin/establishments/{establishment.uuid}/suspend"


def reactivate_url(establishment: Establishment) -> str:
    return f"/admin/establishments/{establishment.uuid}/reactivate"


def admin_requests(client, establishment: Establishment) -> list:
    return [
        client.get("/admin/submissions"),
        client.get(f"/admin/submissions/{UNKNOWN_UUID}"),
        client.get("/admin/establishments"),
        client.post(suspend_url(establishment), {"reason": SUSPENSION_REASON}, format="json"),
        client.post(reactivate_url(establishment)),
    ]


# --- Accès --------------------------------------------------------------------


@pytest.mark.django_db
def test_admin_routes_require_authentication(client, establishment):
    responses = admin_requests(client, establishment)

    assert [response.status_code for response in responses] == [401] * 5


@pytest.mark.django_db
def test_manager_cannot_use_admin_routes(client, log_in_as, manager, establishment):
    # Même pour son propre établissement : la suspension est réservée au
    # super administrateur.
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    log_in_as(manager)

    responses = admin_requests(client, establishment)

    assert [response.status_code for response in responses] == [403] * 5
    assert responses[0].json() == {"detail": "Admin role required"}
    establishment.refresh_from_db()
    assert establishment.status == EstablishmentStatus.PUBLISHED
    assert EstablishmentStatusChange.objects.count() == 0


@pytest.mark.django_db
def test_suspension_from_untrusted_origin_is_rejected(
    client, log_in_as, super_admin, establishment
):
    log_in_as(super_admin)

    response = client.post(
        suspend_url(establishment),
        {"reason": SUSPENSION_REASON},
        format="json",
        HTTP_ORIGIN="https://evil.example",
    )

    assert response.status_code == 403
    establishment.refresh_from_db()
    assert establishment.status == EstablishmentStatus.PUBLISHED


# --- GET /admin/submissions ---------------------------------------------------


@pytest.mark.django_db
def test_submissions_default_to_pending_newest_first(
    client, log_in_as, super_admin, manager, establishment
):
    older_submission = add_submission(manager, establishment)
    older_submission.submitted_at = timezone.now() - timedelta(days=1)
    older_submission.save()
    newer_submission = add_submission(manager, establishment)
    add_submission(manager, establishment, SubmissionStatus.APPROVED)
    log_in_as(super_admin)

    response = client.get("/admin/submissions")

    assert response.status_code == 200
    newest_item = response.json()[0]
    assert [item["submission_uuid"] for item in response.json()] == [
        newer_submission.uuid,
        older_submission.uuid,
    ]
    assert newest_item == {
        "submission_uuid": newer_submission.uuid,
        "establishment_uuid": establishment.uuid,
        "establishment_name": "Collège de la Paix",
        "proposer_name": "Awa Manager",
        "submission_type": "modification",
        "submission_status": "pending",
        "submitted_at": newest_item["submitted_at"],
        "rejection_reason": None,
    }


@pytest.mark.django_db
def test_submissions_can_be_filtered_by_status_with_their_reason(
    client, log_in_as, super_admin, manager, establishment
):
    add_submission(manager, establishment)
    rejected_submission = add_submission(manager, establishment, SubmissionStatus.REJECTED)
    ValidationDecision.objects.create(
        submission=rejected_submission,
        user=super_admin,
        status=DecisionStatus.REJECTED,
        rejection_reason="Fees are not documented",
    )
    log_in_as(super_admin)

    response = client.get("/admin/submissions?status=rejected")

    assert [item["submission_uuid"] for item in response.json()] == [
        rejected_submission.uuid
    ]
    assert response.json()[0]["rejection_reason"] == "Fees are not documented"
    assert client.get("/admin/submissions?status=approved").json() == []


@pytest.mark.django_db
@pytest.mark.parametrize("unknown_status", ["published", "PENDING", "all"])
def test_unknown_submission_status_is_rejected(
    client, log_in_as, super_admin, unknown_status
):
    log_in_as(super_admin)

    response = client.get(f"/admin/submissions?status={unknown_status}")

    assert response.status_code == 422
    assert "status" in response.json()


@pytest.mark.django_db
def test_empty_status_filter_falls_back_to_pending(
    client, log_in_as, super_admin, manager, establishment
):
    pending_submission = add_submission(manager, establishment)
    add_submission(manager, establishment, SubmissionStatus.APPROVED)
    log_in_as(super_admin)

    response = client.get("/admin/submissions?status=")

    assert [item["submission_uuid"] for item in response.json()] == [
        pending_submission.uuid
    ]


@pytest.mark.django_db
def test_submission_list_query_count_does_not_grow_with_the_list(
    client, log_in_as, super_admin, manager, establishment
):
    log_in_as(super_admin)
    add_submission(manager, establishment)
    with CaptureQueriesContext(connection) as queries_with_one_submission:
        client.get("/admin/submissions")

    add_submission(manager, establishment)
    add_submission(manager, establishment)
    with CaptureQueriesContext(connection) as queries_with_three_submissions:
        client.get("/admin/submissions")

    assert len(queries_with_three_submissions) == len(queries_with_one_submission)


# --- GET /admin/submissions/{uuid} --------------------------------------------


@pytest.mark.django_db
def test_submission_detail_carries_the_proposed_content(
    client, log_in_as, super_admin, manager, establishment
):
    submission = add_submission(manager, establishment)
    log_in_as(super_admin)

    response = client.get(f"/admin/submissions/{submission.uuid}")

    assert response.status_code == 200
    assert response.json()["content"] == PROPOSED_CONTENT
    assert response.json()["proposer_name"] == "Awa Manager"


@pytest.mark.django_db
@pytest.mark.parametrize("unknown_identifier", [UNKNOWN_UUID, "not-a-uuid"])
def test_unknown_submission_is_404(client, log_in_as, super_admin, unknown_identifier):
    log_in_as(super_admin)

    response = client.get(f"/admin/submissions/{unknown_identifier}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Submission not found"}


# --- GET /admin/establishments ------------------------------------------------


@pytest.mark.django_db
def test_establishments_are_listed_whatever_their_status_with_their_owners(
    client, log_in_as, super_admin, manager, create_establishment
):
    co_manager = User.objects.create(
        name="Bob Co-manager",
        email="bob@example.com",
        password_hash="x",
        role=UserRole.MANAGER,
    )
    shared_establishment = create_establishment(name="Alpha School")
    for owner in (manager, co_manager):
        UserEstablishment.objects.create(user=owner, establishment=shared_establishment)
    create_establishment(name="Zeta School", status=EstablishmentStatus.PENDING)
    log_in_as(super_admin)

    response = client.get("/admin/establishments")

    assert response.status_code == 200
    assert response.json() == [
        {
            "establishment_uuid": shared_establishment.uuid,
            "name": "Alpha School",
            "establishment_status": "published",
            "city": "Douala",
            "type": "Secondaire",
            "sector": "Privé laïc",
            "owners": ["Awa Manager", "Bob Co-manager"],
            "suspension_reason": None,
        },
        {
            "establishment_uuid": response.json()[1]["establishment_uuid"],
            "name": "Zeta School",
            "establishment_status": "pending",
            "city": "Douala",
            "type": "Secondaire",
            "sector": "Privé laïc",
            "owners": [],
            "suspension_reason": None,
        },
    ]
    # Les coordonnées privées des responsables ne sortent pas, seulement leur nom.
    assert "example.com" not in response.content.decode()


@pytest.mark.django_db
def test_establishment_list_query_count_does_not_grow_with_the_list(
    client, log_in_as, super_admin, manager, create_establishment
):
    log_in_as(super_admin)
    UserEstablishment.objects.create(
        user=manager, establishment=create_establishment(name="First school")
    )
    with CaptureQueriesContext(connection) as queries_with_one_school:
        client.get("/admin/establishments")

    for name in ("Second school", "Third school"):
        UserEstablishment.objects.create(
            user=manager, establishment=create_establishment(name=name)
        )
    with CaptureQueriesContext(connection) as queries_with_three_schools:
        client.get("/admin/establishments")

    assert len(queries_with_three_schools) == len(queries_with_one_school)


# --- Suspension et réactivation -----------------------------------------------


@pytest.mark.django_db
def test_suspension_hides_the_establishment_and_records_who_and_why(
    client, log_in_as, super_admin, establishment
):
    log_in_as(super_admin)

    response = client.post(
        suspend_url(establishment), {"reason": f"  {SUSPENSION_REASON}  "}, format="json"
    )

    assert response.status_code == 200
    assert response.json() == {
        "establishment_uuid": establishment.uuid,
        "establishment_status": "suspended",
    }
    # Règle d'or : une fiche suspendue disparaît de l'API publique.
    assert client.get(f"/institutions/{establishment.uuid}").status_code == 404
    assert client.get("/institutions").json() == []
    status_change = EstablishmentStatusChange.objects.get()
    assert status_change.establishment == establishment
    assert status_change.user == super_admin
    assert status_change.previous_status == "published"
    assert status_change.new_status == "suspended"
    assert status_change.reason == SUSPENSION_REASON


@pytest.mark.django_db
def test_reactivation_makes_the_establishment_public_again(
    client, log_in_as, super_admin, establishment
):
    log_in_as(super_admin)
    client.post(suspend_url(establishment), {"reason": SUSPENSION_REASON}, format="json")

    response = client.post(reactivate_url(establishment))

    assert response.status_code == 200
    assert response.json()["establishment_status"] == "published"
    assert client.get(f"/institutions/{establishment.uuid}").status_code == 200
    reactivation = EstablishmentStatusChange.objects.order_by("pk").last()
    assert reactivation.previous_status == "suspended"
    assert reactivation.new_status == "published"
    assert reactivation.reason is None
    assert EstablishmentStatusChange.objects.count() == 2


@pytest.mark.django_db
def test_admin_list_shows_the_reason_only_while_suspended(
    client, log_in_as, super_admin, establishment
):
    log_in_as(super_admin)

    def listed_reason() -> str | None:
        return client.get("/admin/establishments").json()[0]["suspension_reason"]

    client.post(suspend_url(establishment), {"reason": "First reason"}, format="json")
    client.post(reactivate_url(establishment))
    assert listed_reason() is None

    client.post(suspend_url(establishment), {"reason": "Second reason"}, format="json")
    assert listed_reason() == "Second reason"


@pytest.mark.django_db
@pytest.mark.parametrize(
    "unsuspendable_status",
    [EstablishmentStatus.PENDING, EstablishmentStatus.REJECTED, EstablishmentStatus.SUSPENDED],
)
def test_only_a_published_establishment_can_be_suspended(
    client, log_in_as, super_admin, create_establishment, unsuspendable_status
):
    establishment = create_establishment(status=unsuspendable_status)
    log_in_as(super_admin)

    response = client.post(
        suspend_url(establishment), {"reason": SUSPENSION_REASON}, format="json"
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Only a published establishment can be suspended"}
    assert EstablishmentStatusChange.objects.count() == 0


@pytest.mark.django_db
@pytest.mark.parametrize(
    "inactive_status",
    [EstablishmentStatus.PENDING, EstablishmentStatus.REJECTED, EstablishmentStatus.PUBLISHED],
)
def test_only_a_suspended_establishment_can_be_reactivated(
    client, log_in_as, super_admin, create_establishment, inactive_status
):
    # Sans cette règle, « réactiver » publierait une fiche jamais validée.
    establishment = create_establishment(status=inactive_status)
    log_in_as(super_admin)

    response = client.post(reactivate_url(establishment))

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Only a suspended establishment can be reactivated"
    }
    establishment.refresh_from_db()
    assert establishment.status == inactive_status
    assert EstablishmentStatusChange.objects.count() == 0


@pytest.mark.django_db
@pytest.mark.parametrize("invalid_reason", ["", "  ", "no", "a" * 501, None])
def test_suspension_requires_a_meaningful_reason(
    client, log_in_as, super_admin, establishment, invalid_reason
):
    log_in_as(super_admin)

    response = client.post(
        suspend_url(establishment), {"reason": invalid_reason}, format="json"
    )

    assert response.status_code == 422
    assert "reason" in response.json()
    establishment.refresh_from_db()
    assert establishment.status == EstablishmentStatus.PUBLISHED


@pytest.mark.django_db
def test_suspending_an_unknown_establishment_is_404(client, log_in_as, super_admin):
    log_in_as(super_admin)

    suspend_response = client.post(
        f"/admin/establishments/{UNKNOWN_UUID}/suspend",
        {"reason": SUSPENSION_REASON},
        format="json",
    )
    reactivate_response = client.post(f"/admin/establishments/{UNKNOWN_UUID}/reactivate")

    assert suspend_response.status_code == 404
    assert suspend_response.json() == {"detail": "Establishment not found"}
    assert reactivate_response.status_code == 404
