import pytest
from django.db import IntegrityError

from edufinder.models import (
    DecisionStatus,
    EstablishmentStatus,
    EstablishmentStatusChange,
    Submission,
    SubmissionStatus,
    SubmissionType,
    ValidationDecision,
)
from edufinder.models.identifiers import PUBLIC_UUID_LENGTH

PROPOSED_CONTENT = {"name": "Collège de la Paix", "services": ["Cantine", "Bus"]}


@pytest.fixture(name="submission")
def submission_fixture(manager, establishment) -> Submission:
    return Submission.objects.create(
        user=manager,
        establishment=establishment,
        type=SubmissionType.MODIFICATION,
        status=SubmissionStatus.PENDING,
        content=PROPOSED_CONTENT,
    )


@pytest.mark.django_db
def test_submission_keeps_its_json_content_and_gets_a_public_uuid(submission):
    stored_submission = Submission.objects.get(pk=submission.pk)

    assert stored_submission.content == PROPOSED_CONTENT
    assert len(stored_submission.uuid) == PUBLIC_UUID_LENGTH
    assert stored_submission.submitted_at is not None


@pytest.mark.django_db
def test_submission_requires_a_content(manager, establishment):
    with pytest.raises(IntegrityError):
        Submission.objects.create(
            user=manager,
            establishment=establishment,
            type=SubmissionType.CREATION,
            status=SubmissionStatus.PENDING,
            content=None,
        )


@pytest.mark.django_db
def test_submission_accepts_a_single_decision(submission, super_admin):
    decision = ValidationDecision.objects.create(
        submission=submission, user=super_admin, status=DecisionStatus.APPROVED
    )

    assert submission.decision == decision
    with pytest.raises(IntegrityError):
        ValidationDecision.objects.create(
            submission=submission,
            user=super_admin,
            status=DecisionStatus.REJECTED,
            rejection_reason="Second decision on the same submission",
        )


@pytest.mark.django_db
def test_status_change_records_who_changed_what(establishment, super_admin):
    EstablishmentStatusChange.objects.create(
        establishment=establishment,
        user=super_admin,
        previous_status=EstablishmentStatus.PUBLISHED,
        new_status=EstablishmentStatus.SUSPENDED,
        reason="Outdated fees",
    )

    status_change = establishment.status_changes.get()
    assert status_change.user == super_admin
    assert status_change.new_status == EstablishmentStatus.SUSPENDED
    assert status_change.changed_at is not None
