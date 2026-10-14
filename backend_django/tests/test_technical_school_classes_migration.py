"""La migration qui complète la nomenclature, jouée sur des données de test :
elle renomme une classe et déplace des frais, je vérifie donc ce qu'elle
touche et ce qu'elle laisse."""
import importlib
from decimal import Decimal

import pytest
from django.apps import apps

from edufinder.models import (
    Establishment,
    EstablishmentType,
    Exam,
    SchoolFee,
    Stage,
    StudyLevel,
)

nomenclature_migration = importlib.import_module(
    "edufinder.migrations.0009_technical_school_classes"
)

TECHNICAL_LEVEL_LABELS = {
    "Technical lower secondary": ["1ère année", "2e année", "3e année", "4e année"],
    "Technical upper secondary": ["2nde", "1ère", "Terminale"],
}
SCHOOL_YEAR = "2026-2027"


def run_migration() -> None:
    nomenclature_migration.complete_school_nomenclature(apps, None)


def list_level_labels(stage_label: str) -> list[str]:
    return list(
        StudyLevel.objects.filter(stage__label=stage_label)
        .order_by("id_level")
        .values_list("label", flat=True)
    )


def add_level(stage_label: str, level_label: str) -> StudyLevel:
    stage, _ = Stage.objects.get_or_create(label=stage_label)
    return StudyLevel.objects.create(stage=stage, label=level_label)


def add_fee(establishment: Establishment, level: StudyLevel, amount: str) -> SchoolFee:
    return SchoolFee.objects.create(
        establishment=establishment,
        level=level,
        amount=Decimal(amount),
        school_year=SCHOOL_YEAR,
    )


@pytest.fixture(name="technical_type")
def technical_type_fixture() -> EstablishmentType:
    return EstablishmentType.objects.create(label="Secondary technical")


@pytest.mark.django_db
def test_an_empty_nomenclature_is_left_empty():
    run_migration()

    assert Stage.objects.count() == 0
    assert StudyLevel.objects.count() == 0
    assert Exam.objects.count() == 0


@pytest.mark.django_db
def test_technical_stages_get_their_classes_and_both_labels(technical_type):
    run_migration()

    for stage_label, level_labels in TECHNICAL_LEVEL_LABELS.items():
        assert list_level_labels(stage_label) == level_labels
    lower_stage = Stage.objects.get(label="Technical lower secondary")
    assert lower_stage.label_fr == "Premier cycle technique"
    assert lower_stage.label_en == "Technical lower secondary"


@pytest.mark.django_db
def test_existing_stages_get_their_missing_class():
    add_level("Primaire", "CP")
    add_level("Primary", "Class 5")

    run_migration()

    assert list_level_labels("Primaire") == ["CP", "SIL"]
    assert list_level_labels("Primary") == ["Class 5", "Class 6"]


@pytest.mark.django_db
def test_the_third_nursery_year_becomes_pre_nursery_and_keeps_its_id():
    third_year = add_level("Nursery", "Nursery 3")

    run_migration()

    third_year.refresh_from_db()
    assert third_year.label == "Pre-Nursery"
    assert not StudyLevel.objects.filter(label="Nursery 3").exists()


@pytest.mark.django_db
def test_a_francophone_nursery_class_is_not_renamed():
    add_level("Maternelle", "Nursery 3")

    run_migration()

    assert list_level_labels("Maternelle") == ["Nursery 3"]


@pytest.mark.django_db
def test_fslc_is_added_beside_cep_only():
    run_migration()
    assert not Exam.objects.filter(label="FSLC").exists()

    Exam.objects.create(label="CEP")
    run_migration()

    assert Exam.objects.filter(label="FSLC").count() == 1


@pytest.mark.django_db
def test_fees_of_a_technical_school_move_to_the_matching_technical_class(
    create_establishment, technical_type
):
    technical_school = create_establishment(type=technical_type)
    first_year_fee = add_fee(technical_school, add_level("Collège", "6e"), "45000")
    final_year_fee = add_fee(technical_school, add_level("Lycée", "Terminale"), "80000")

    run_migration()

    first_year_fee.refresh_from_db()
    final_year_fee.refresh_from_db()
    assert (first_year_fee.level.stage.label, first_year_fee.level.label) == (
        "Technical lower secondary",
        "1ère année",
    )
    assert (final_year_fee.level.stage.label, final_year_fee.level.label) == (
        "Technical upper secondary",
        "Terminale",
    )
    assert first_year_fee.amount == Decimal("45000")
    assert first_year_fee.school_year == SCHOOL_YEAR
    assert SchoolFee.objects.count() == 2


@pytest.mark.django_db
def test_fees_of_a_general_school_stay_on_their_class(
    create_establishment, establishment, technical_type
):
    # Le type technique existe (les cycles sont donc créés), mais cette école
    # est du type par défaut des tests, pas technique.
    sixth_grade = add_level("Collège", "6e")
    general_fee = add_fee(establishment, sixth_grade, "50000")

    run_migration()

    general_fee.refresh_from_db()
    assert general_fee.level == sixth_grade


@pytest.mark.django_db
def test_running_the_migration_twice_changes_nothing_more(
    create_establishment, technical_type
):
    add_level("Primaire", "CP")
    add_level("Nursery", "Nursery 3")
    Exam.objects.create(label="CEP")
    add_fee(create_establishment(type=technical_type), add_level("Collège", "6e"), "45000")

    run_migration()
    counts_after_first_run = (
        Stage.objects.count(),
        StudyLevel.objects.count(),
        Exam.objects.count(),
        SchoolFee.objects.count(),
    )
    run_migration()

    assert counts_after_first_run == (
        Stage.objects.count(),
        StudyLevel.objects.count(),
        Exam.objects.count(),
        SchoolFee.objects.count(),
    )
    assert list_level_labels("Nursery") == ["Pre-Nursery"]
