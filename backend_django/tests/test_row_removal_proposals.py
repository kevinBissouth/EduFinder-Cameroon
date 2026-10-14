"""Demander le retrait d'un frais ou d'un résultat publié : la demande passe
par le super admin, et l'approbation marque la ligne retirée sans l'effacer."""
import pytest

from edufinder.models import ExamResult, SchoolFee, Submission, UserEstablishment
from tests.factories import EXAM_SESSION, add_exam_result, add_school_fee

# Un examen hors de la cartographie par type : seule la demande de retrait
# décide s'il reste visible.
UNMAPPED_EXAM_LABEL = "Concours d'entrée"


@pytest.fixture(name="published_rows")
def published_rows_fixture(establishment, manager):
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    return {
        "fee": add_school_fee(establishment, "6e", "50000"),
        "exam_result": add_exam_result(establishment, UNMAPPED_EXAM_LABEL, "70"),
    }


def fee_removal(school_fee: SchoolFee) -> dict:
    return {"id_level": school_fee.level_id, "school_year": school_fee.school_year}


def exam_result_removal(exam_result: ExamResult) -> dict:
    return {"id_exam": exam_result.exam_id, "session": exam_result.session}


def propose(client, establishment, content: dict):
    return client.post(
        f"/my/establishments/{establishment.uuid}/modification-proposals",
        content,
        format="json",
    )


@pytest.mark.django_db
def test_a_manager_can_ask_to_remove_published_rows(
    client, log_in_as, manager, establishment, published_rows
):
    log_in_as(manager)
    removals = {
        "fee_removals": [fee_removal(published_rows["fee"])],
        "exam_result_removals": [exam_result_removal(published_rows["exam_result"])],
    }

    response = propose(client, establishment, removals)

    assert response.status_code == 201
    assert Submission.objects.get().content == removals
    # Rien ne change tant que le super admin n'a pas validé.
    assert SchoolFee.objects.active().count() == 1
    assert ExamResult.objects.active().count() == 1


@pytest.mark.django_db
@pytest.mark.parametrize(
    "removal_overrides", [{"id_level": 999999}, {"school_year": "2020-2021"}]
)
def test_removing_a_fee_the_profile_does_not_have_is_rejected(
    client, log_in_as, manager, establishment, published_rows, removal_overrides
):
    log_in_as(manager)
    removal = {**fee_removal(published_rows["fee"]), **removal_overrides}

    response = propose(client, establishment, {"fee_removals": [removal]})

    assert response.status_code == 422
    assert response.json()["detail"].startswith("Unknown fee to remove:")
    assert Submission.objects.count() == 0


# Une ligne déjà retirée n'est plus sur la fiche : la retirer encore n'a pas
# de sens.
@pytest.mark.django_db
def test_removing_an_already_removed_result_is_rejected(
    client, log_in_as, manager, establishment, published_rows
):
    exam_result = published_rows["exam_result"]
    ExamResult.objects.filter(pk=exam_result.pk).update(deleted_at="2026-01-01T00:00Z")
    log_in_as(manager)

    response = propose(
        client, establishment, {"exam_result_removals": [exam_result_removal(exam_result)]}
    )

    assert response.status_code == 422
    assert response.json()["detail"].startswith("Unknown exam result to remove:")


@pytest.mark.django_db
def test_a_line_cannot_be_changed_and_removed_in_the_same_proposal(
    client, log_in_as, manager, establishment, published_rows
):
    log_in_as(manager)
    school_fee = published_rows["fee"]
    changed_fee = {**fee_removal(school_fee), "amount": "60000"}

    response = propose(
        client,
        establishment,
        {"fees": [changed_fee], "fee_removals": [fee_removal(school_fee)]},
    )

    assert response.status_code == 422
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_the_same_removal_twice_is_rejected(
    client, log_in_as, manager, establishment, published_rows
):
    log_in_as(manager)
    removal = fee_removal(published_rows["fee"])

    response = propose(client, establishment, {"fee_removals": [removal, removal]})

    assert response.status_code == 422


@pytest.mark.django_db
def test_approving_a_removal_marks_the_rows_removed_without_deleting_them(
    client, log_in_as, manager, super_admin, establishment, published_rows
):
    log_in_as(manager)
    propose(
        client,
        establishment,
        {
            "fee_removals": [fee_removal(published_rows["fee"])],
            "exam_result_removals": [exam_result_removal(published_rows["exam_result"])],
        },
    )
    log_in_as(super_admin)

    response = client.post(f"/admin/submissions/{Submission.objects.get().uuid}/approve")

    assert response.status_code == 200
    assert SchoolFee.objects.active().count() == 0
    assert ExamResult.objects.active().count() == 0
    # La ligne reste en base, datée de son retrait.
    assert SchoolFee.objects.get().deleted_at is not None
    assert ExamResult.objects.get().deleted_at is not None
    detail = client.get(f"/institutions/{establishment.uuid}").json()
    assert (detail["fees"], detail["exam_results"]) == ([], [])


# Deux demandes de retrait de la même ligne peuvent attendre ensemble : la
# seconde approuvée n'a plus rien à faire, sans échouer pour autant.
@pytest.mark.django_db
def test_approving_a_removal_of_a_line_removed_meanwhile_still_succeeds(
    client, log_in_as, manager, super_admin, establishment, published_rows
):
    log_in_as(manager)
    removal = {"fee_removals": [fee_removal(published_rows["fee"])]}
    propose(client, establishment, removal)
    propose(client, establishment, removal)
    first_submission, second_submission = Submission.objects.order_by("pk")
    log_in_as(super_admin)

    client.post(f"/admin/submissions/{first_submission.uuid}/approve")
    removed_at = SchoolFee.objects.get().deleted_at
    response = client.post(f"/admin/submissions/{second_submission.uuid}/approve")

    assert response.status_code == 200
    assert SchoolFee.objects.get().deleted_at == removed_at


@pytest.mark.django_db
def test_a_removal_targets_only_the_session_it_names(
    client, log_in_as, manager, super_admin, establishment, published_rows
):
    exam_result = published_rows["exam_result"]
    other_session = ExamResult.objects.create(
        establishment=establishment,
        exam=exam_result.exam,
        session=str(int(EXAM_SESSION) - 1),
        pass_rate=exam_result.pass_rate,
    )
    log_in_as(manager)
    propose(client, establishment, {"exam_result_removals": [exam_result_removal(exam_result)]})
    log_in_as(super_admin)

    client.post(f"/admin/submissions/{Submission.objects.get().uuid}/approve")

    assert list(ExamResult.objects.active()) == [other_session]
