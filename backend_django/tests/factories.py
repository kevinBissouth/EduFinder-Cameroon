"""Aides de création de données partagées entre les fichiers de test."""
from decimal import Decimal

from edufinder.models import (
    Establishment,
    Exam,
    ExamResult,
    SchoolFee,
    Stage,
    StudyLevel,
)

SCHOOL_YEAR = "2026-2027"
EXAM_SESSION = "2026"


def add_school_fee(
    establishment: Establishment, level_label: str, amount: str
) -> SchoolFee:
    stage, _ = Stage.objects.get_or_create(label="Secondary")
    study_level, _ = StudyLevel.objects.get_or_create(label=level_label, stage=stage)
    return SchoolFee.objects.create(
        establishment=establishment,
        level=study_level,
        amount=Decimal(amount),
        school_year=SCHOOL_YEAR,
    )


def add_exam_result(
    establishment: Establishment, exam_label: str, pass_rate: str
) -> ExamResult:
    exam, _ = Exam.objects.get_or_create(label=exam_label)
    return ExamResult.objects.create(
        establishment=establishment,
        exam=exam,
        session=EXAM_SESSION,
        pass_rate=Decimal(pass_rate),
    )
