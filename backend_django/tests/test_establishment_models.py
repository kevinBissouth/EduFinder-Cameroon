from decimal import Decimal

import pytest
from django.db import IntegrityError

from edufinder.models import (
    Establishment,
    Exam,
    ExamResult,
    Program,
    ProgramOffer,
    SchoolFee,
    Stage,
    StudyLevel,
    User,
    UserEstablishment,
    UserRole,
)
from edufinder.models.identifiers import PUBLIC_UUID_LENGTH

SCHOOL_YEAR = "2026-2027"


@pytest.fixture(name="study_level")
def study_level_fixture() -> StudyLevel:
    stage = Stage.objects.create(label="Secondaire")
    return StudyLevel.objects.create(label="6e", stage=stage)


@pytest.mark.django_db
def test_establishment_gets_a_public_uuid_and_zeroed_counters(establishment):
    stored_establishment = Establishment.objects.get(pk=establishment.pk)

    assert len(stored_establishment.uuid) == PUBLIC_UUID_LENGTH
    assert stored_establishment.recommended is False
    assert stored_establishment.views_count == 0
    assert stored_establishment.inquiries_count == 0
    assert stored_establishment.updated_at is None


@pytest.mark.django_db
def test_establishment_uuid_is_unique(establishment):
    with pytest.raises(IntegrityError):
        Establishment.objects.create(
            name="Other school",
            uuid=establishment.uuid,
            city=establishment.city,
            type=establishment.type,
            sector=establishment.sector,
            linguistic_section=establishment.linguistic_section,
            status=establishment.status,
        )


@pytest.mark.django_db
def test_user_email_is_unique(manager):
    with pytest.raises(IntegrityError):
        User.objects.create(
            name="Duplicate",
            email=manager.email,
            password_hash="not-a-real-hash",
            role=UserRole.MANAGER,
        )


@pytest.mark.django_db
def test_manager_is_linked_to_an_establishment_only_once(manager, establishment):
    UserEstablishment.objects.create(user=manager, establishment=establishment)

    assert manager.user_establishments.filter(establishment=establishment).exists()
    with pytest.raises(IntegrityError):
        UserEstablishment.objects.create(user=manager, establishment=establishment)


@pytest.mark.django_db
def test_program_is_offered_only_once_by_an_establishment(establishment):
    program = Program.objects.create(name="Informatique")
    ProgramOffer.objects.create(establishment=establishment, program=program)

    with pytest.raises(IntegrityError):
        ProgramOffer.objects.create(establishment=establishment, program=program)


@pytest.mark.django_db
def test_school_fee_rejects_a_negative_amount(establishment, study_level):
    with pytest.raises(IntegrityError):
        SchoolFee.objects.create(
            establishment=establishment,
            level=study_level,
            amount=Decimal("-1.00"),
            school_year=SCHOOL_YEAR,
        )


@pytest.mark.django_db
def test_school_fee_is_unique_per_level_and_school_year(establishment, study_level):
    SchoolFee.objects.create(
        establishment=establishment,
        level=study_level,
        amount=Decimal("150000.00"),
        school_year=SCHOOL_YEAR,
    )

    SchoolFee.objects.create(
        establishment=establishment,
        level=study_level,
        amount=Decimal("140000.00"),
        school_year="2025-2026",
    )

    with pytest.raises(IntegrityError):
        SchoolFee.objects.create(
            establishment=establishment,
            level=study_level,
            amount=Decimal("160000.00"),
            school_year=SCHOOL_YEAR,
        )


@pytest.mark.django_db
@pytest.mark.parametrize("out_of_range_pass_rate", [Decimal("-0.01"), Decimal("100.01")])
def test_exam_result_rejects_a_pass_rate_outside_0_100(
    establishment, out_of_range_pass_rate
):
    exam = Exam.objects.create(label="BEPC")

    with pytest.raises(IntegrityError):
        ExamResult.objects.create(
            establishment=establishment,
            exam=exam,
            session="2026",
            pass_rate=out_of_range_pass_rate,
        )
