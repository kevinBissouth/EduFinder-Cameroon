"""Un frais ou un résultat retiré reste en base, marqué supprimé : il ne sort
plus nulle part, ni sur le site public ni dans l'espace responsable."""
from decimal import Decimal

import pytest
from django.utils import timezone

from edufinder.models import (
    ExamResult,
    SchoolFee,
    Submission,
    SubmissionStatus,
    SubmissionType,
    UserEstablishment,
)
from tests.factories import EXAM_SESSION, SCHOOL_YEAR, add_exam_result, add_school_fee

# Un examen hors de la cartographie par type : la règle de cohérence ne le
# masque pas, seul le retrait peut le faire.
UNMAPPED_EXAM_LABEL = "Concours d'entrée"


def remove(row) -> None:
    row.deleted_at = timezone.now()
    row.save()


@pytest.fixture(name="school_with_removed_rows")
def school_with_removed_rows_fixture(establishment):
    remove(add_school_fee(establishment, "6e", "50000"))
    add_school_fee(establishment, "5e", "90000")
    remove(add_exam_result(establishment, UNMAPPED_EXAM_LABEL, "95"))
    return establishment


@pytest.mark.django_db
def test_the_public_profile_hides_removed_rows(client, school_with_removed_rows):
    detail = client.get(f"/institutions/{school_with_removed_rows.uuid}").json()

    assert [fee["amount"] for fee in detail["fees"]] == ["90000.00"]
    assert detail["exam_results"] == []


@pytest.mark.django_db
def test_the_search_summary_ignores_removed_rows(client, school_with_removed_rows):
    [summary] = client.get("/institutions").json()

    assert summary["min_tuition"] == "90000.00"
    assert summary["best_pass_rate"] is None


@pytest.mark.django_db
def test_the_exam_filter_ignores_a_removed_result(client, school_with_removed_rows):
    removed_exam_id = ExamResult.objects.get().exam_id

    response = client.get(f"/institutions?exam={removed_exam_id}:80")

    assert response.json() == []


@pytest.mark.django_db
def test_the_platform_stats_do_not_count_removed_rows(client, school_with_removed_rows):
    stats = client.get("/stats").json()

    assert stats["fee_plans"] == 1
    assert stats["exam_results"] == 0


@pytest.mark.django_db
def test_the_published_year_of_a_manager_ignores_a_removed_fee(
    client, log_in_as, establishment, manager
):
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    remove(add_school_fee(establishment, "6e", "50000"))
    log_in_as(manager)

    [item] = client.get("/my/establishments").json()

    assert item["published_year"] is None


# La contrainte d'unicité garde la ligne retirée : la publier de nouveau la
# remet en service avec ses nouvelles valeurs, sans doublon.
@pytest.mark.django_db
def test_approving_a_removed_line_again_restores_it(
    client, log_in_as, establishment, manager, super_admin
):
    removed_fee = add_school_fee(establishment, "6e", "50000")
    removed_result = add_exam_result(establishment, UNMAPPED_EXAM_LABEL, "60")
    remove(removed_fee)
    remove(removed_result)
    submission = Submission.objects.create(
        user=manager,
        establishment=establishment,
        type=SubmissionType.MODIFICATION,
        status=SubmissionStatus.PENDING,
        content={
            "fees": [
                {"id_level": removed_fee.level_id, "amount": "55000", "school_year": SCHOOL_YEAR}
            ],
            "exam_results": [
                {"id_exam": removed_result.exam_id, "session": EXAM_SESSION, "pass_rate": "65"}
            ],
        },
    )
    log_in_as(super_admin)

    response = client.post(f"/admin/submissions/{submission.uuid}/approve")

    assert response.status_code == 200
    removed_fee.refresh_from_db()
    removed_result.refresh_from_db()
    assert (removed_fee.amount, removed_fee.deleted_at) == (Decimal("55000"), None)
    assert (removed_result.pass_rate, removed_result.deleted_at) == (Decimal("65"), None)
    assert SchoolFee.objects.count() == 1
