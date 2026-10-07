from datetime import timedelta

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from edufinder.models import (
    DecisionStatus,
    EstablishmentStatus,
    EstablishmentType,
    Media,
    MediaType,
    Submission,
    SubmissionStatus,
    SubmissionType,
    User,
    UserEstablishment,
    UserRole,
    ValidationDecision,
)
from tests.factories import add_exam_result, add_school_fee

INVALID_CREDENTIALS_BODY = {"detail": "Invalid or missing credentials"}
NOT_MANAGED_BODY = {"detail": "You do not manage this establishment"}
PROPOSED_CONTENT = {"name": "New name", "fees": []}
# Examen absent de la cartographie examen/type : la règle de cohérence ne
# l'écarte donc pas, quel que soit le type de l'établissement de test.
UNMAPPED_EXAM_LABEL = "Brevet blanc"


@pytest.fixture(name="other_manager")
def other_manager_fixture() -> User:
    return User.objects.create(
        name="Other Manager",
        email="other.manager@example.com",
        password_hash="not-a-real-hash",
        role=UserRole.MANAGER,
    )


@pytest.fixture(name="managed_establishment")
def managed_establishment_fixture(establishment, manager):
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    return establishment


def add_submission(user, establishment, status=SubmissionStatus.PENDING) -> Submission:
    return Submission.objects.create(
        user=user,
        establishment=establishment,
        type=SubmissionType.MODIFICATION,
        status=status,
        content=PROPOSED_CONTENT,
    )


def private_paths(establishment_uuid: str) -> list[str]:
    return [
        "/my/establishments",
        "/my/submissions",
        f"/my/establishments/{establishment_uuid}",
        f"/my/establishments/{establishment_uuid}/benchmarks",
    ]


# --- Accès --------------------------------------------------------------------


@pytest.mark.django_db
def test_anonymous_is_rejected_on_every_route(client, managed_establishment):
    for path in private_paths(managed_establishment.uuid):
        response = client.get(path)

        assert response.status_code == 401, path
        assert response.json() == INVALID_CREDENTIALS_BODY


@pytest.mark.django_db
def test_account_without_a_private_role_is_rejected(client, log_in_as, establishment):
    visitor = User.objects.create(
        name="Visitor", email="visitor@example.com", password_hash="x", role="visitor"
    )
    log_in_as(visitor)

    for path in private_paths(establishment.uuid):
        response = client.get(path)

        assert response.status_code == 403, path
        assert response.json() == {"detail": "Manager or admin role required"}


@pytest.mark.django_db
def test_manager_cannot_read_an_establishment_of_another_manager(
    client, log_in_as, managed_establishment, other_manager
):
    log_in_as(other_manager)

    for path in private_paths(managed_establishment.uuid)[2:]:
        response = client.get(path)

        assert response.status_code == 403, path
        assert response.json() == NOT_MANAGED_BODY


@pytest.mark.django_db
def test_unknown_establishment_is_404(client, log_in_as, manager):
    log_in_as(manager)

    for path in private_paths("unknown-uuid")[2:]:
        response = client.get(path)

        assert response.status_code == 404, path
        assert response.json() == {"detail": "Establishment unknown-uuid not found"}


@pytest.mark.django_db
def test_super_admin_can_read_any_establishment(
    client, log_in_as, managed_establishment, super_admin
):
    log_in_as(super_admin)

    for path in private_paths(managed_establishment.uuid)[2:]:
        assert client.get(path).status_code == 200, path


# --- GET /my/establishments ---------------------------------------------------


@pytest.mark.django_db
def test_my_establishments_lists_owned_only_sorted_by_name(
    client, log_in_as, create_establishment, manager, other_manager
):
    for name in ("Zeta School", "Alpha School"):
        UserEstablishment.objects.create(
            user=manager, establishment=create_establishment(name=name)
        )
    UserEstablishment.objects.create(
        user=other_manager, establishment=create_establishment(name="Foreign School")
    )
    log_in_as(manager)

    response = client.get("/my/establishments")

    assert response.status_code == 200
    assert [item["name"] for item in response.json()] == ["Alpha School", "Zeta School"]


@pytest.mark.django_db
def test_my_establishments_item_describes_a_published_school(
    client, log_in_as, managed_establishment, manager
):
    add_school_fee(managed_establishment, "6e", "150000")
    Media.objects.create(
        establishment=managed_establishment, type=MediaType.IMAGE, url="/media/a.jpg"
    )
    log_in_as(manager)

    response = client.get("/my/establishments")

    assert response.json() == [
        {
            "establishment_uuid": managed_establishment.uuid,
            "name": "Collège de la Paix",
            "establishment_status": "published",
            "has_pending_submission": False,
            "cover_url": "/media/a.jpg",
            "city": "Douala",
            "type": "Secondaire",
            "sector": "Privé laïc",
            "published_year": "2026-2027",
        }
    ]


@pytest.mark.django_db
def test_my_establishments_flags_pending_work_and_hides_year_until_published(
    client, log_in_as, create_establishment, manager
):
    pending_establishment = create_establishment(status=EstablishmentStatus.PENDING)
    UserEstablishment.objects.create(user=manager, establishment=pending_establishment)
    add_school_fee(pending_establishment, "6e", "150000")
    add_submission(manager, pending_establishment)
    log_in_as(manager)

    item = client.get("/my/establishments").json()[0]

    assert item["establishment_status"] == "pending"
    assert item["has_pending_submission"] is True
    assert item["published_year"] is None


@pytest.mark.django_db
def test_my_establishments_query_count_does_not_grow_with_the_list(
    client, log_in_as, create_establishment, manager
):
    log_in_as(manager)
    UserEstablishment.objects.create(
        user=manager, establishment=create_establishment(name="First school")
    )
    with CaptureQueriesContext(connection) as queries_with_one_school:
        client.get("/my/establishments")

    for name in ("Second school", "Third school"):
        UserEstablishment.objects.create(
            user=manager, establishment=create_establishment(name=name)
        )
    with CaptureQueriesContext(connection) as queries_with_three_schools:
        client.get("/my/establishments")

    assert len(queries_with_three_schools) == len(queries_with_one_school)


# --- GET /my/establishments/{uuid} --------------------------------------------


@pytest.mark.django_db
def test_detail_adds_the_private_fields_to_the_public_profile(
    client, log_in_as, create_establishment, manager
):
    establishment = create_establishment(views_count=12, inquiries_count=3)
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    add_submission(manager, establishment)
    log_in_as(manager)

    detail = client.get(f"/my/establishments/{establishment.uuid}").json()

    assert detail["name"] == "Collège de la Paix"
    assert detail["status"] == "published"
    assert detail["has_pending_submission"] is True
    assert detail["views_count"] == 12
    assert detail["inquiries_count"] == 3
    assert detail["recommended"] is False
    assert detail["updated_at"] is None
    assert detail["fees"] == []


@pytest.mark.django_db
@pytest.mark.parametrize(
    "unpublished_status",
    [EstablishmentStatus.PENDING, EstablishmentStatus.REJECTED, EstablishmentStatus.SUSPENDED],
)
def test_manager_reads_an_own_establishment_whatever_its_status(
    client, log_in_as, create_establishment, manager, unpublished_status
):
    establishment = create_establishment(status=unpublished_status)
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    log_in_as(manager)

    response = client.get(f"/my/establishments/{establishment.uuid}")

    assert response.status_code == 200
    assert response.json()["status"] == unpublished_status


# --- GET /my/submissions ------------------------------------------------------


@pytest.mark.django_db
def test_my_submissions_lists_own_history_newest_first(
    client, log_in_as, managed_establishment, manager, other_manager, super_admin
):
    rejected_submission = add_submission(
        manager, managed_establishment, SubmissionStatus.REJECTED
    )
    rejected_submission.submitted_at = timezone.now() - timedelta(days=2)
    rejected_submission.save()
    ValidationDecision.objects.create(
        submission=rejected_submission,
        user=super_admin,
        status=DecisionStatus.REJECTED,
        rejection_reason="Fees are not documented",
    )
    pending_submission = add_submission(manager, managed_establishment)
    add_submission(other_manager, managed_establishment)
    log_in_as(manager)

    response = client.get("/my/submissions")

    assert response.status_code == 200
    newest_item, oldest_item = response.json()
    assert newest_item == {
        "submission_uuid": pending_submission.uuid,
        "establishment_uuid": managed_establishment.uuid,
        "establishment_name": "Collège de la Paix",
        "submission_type": "modification",
        "submission_status": "pending",
        "submitted_at": newest_item["submitted_at"],
        "rejection_reason": None,
        "content": PROPOSED_CONTENT,
    }
    assert newest_item["submitted_at"].endswith("Z")
    assert oldest_item["submission_uuid"] == rejected_submission.uuid
    assert oldest_item["rejection_reason"] == "Fees are not documented"


# --- GET /my/establishments/{uuid}/benchmarks ---------------------------------


@pytest.mark.django_db
def test_benchmarks_compare_with_published_schools_of_the_same_type(
    client, log_in_as, create_establishment, managed_establishment, manager
):
    add_school_fee(managed_establishment, "6e", "100000")
    add_school_fee(managed_establishment, "5e", "140000")
    add_exam_result(managed_establishment, UNMAPPED_EXAM_LABEL, "80")
    peer_with_data = create_establishment(name="Peer with data")
    add_school_fee(peer_with_data, "6e", "50001")
    add_exam_result(peer_with_data, UNMAPPED_EXAM_LABEL, "70.5")
    create_establishment(name="Peer without data")
    other_type = EstablishmentType.objects.create(label="Université")
    add_school_fee(create_establishment(name="Other type", type=other_type), "L1", "900000")
    hidden_peer = create_establishment(name="Hidden", status=EstablishmentStatus.PENDING)
    add_school_fee(hidden_peer, "6e", "1")
    log_in_as(manager)

    response = client.get(f"/my/establishments/{managed_establishment.uuid}/benchmarks")

    assert response.status_code == 200
    assert response.json() == {
        "your_min_tuition": "100000.00",
        # (100 000 + 50 001) / 2 = 75 000,5, arrondi au franc supérieur.
        "avg_min_tuition_same_type": "75001",
        "same_type_sample_size": 3,
        "your_best_pass_rate": "80.00",
        # (80 + 70,5) / 2 = 75,25, arrondi au dixième.
        "avg_best_pass_rate_same_type": "75.3",
        "pass_rate_sample_size": 2,
    }


@pytest.mark.django_db
def test_benchmarks_of_an_unpublished_school_keep_own_values_empty(
    client, log_in_as, create_establishment, manager
):
    pending_establishment = create_establishment(status=EstablishmentStatus.PENDING)
    UserEstablishment.objects.create(user=manager, establishment=pending_establishment)
    add_school_fee(pending_establishment, "6e", "100000")
    log_in_as(manager)

    response = client.get(f"/my/establishments/{pending_establishment.uuid}/benchmarks")

    assert response.json() == {
        "your_min_tuition": None,
        "avg_min_tuition_same_type": None,
        "same_type_sample_size": 0,
        "your_best_pass_rate": None,
        "avg_best_pass_rate_same_type": None,
        "pass_rate_sample_size": 0,
    }
