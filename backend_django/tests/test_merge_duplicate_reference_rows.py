"""La migration de fusion des doublons de référence, jouée sur des données
de test : elle supprime des lignes, je vérifie donc ce qu'elle rattache."""
import importlib

import pytest
from django.apps import apps

from edufinder.models import (
    Establishment,
    PaymentMethod,
    Program,
    ProgramOffer,
    SchoolFeePaymentMethod,
    Sector,
    Submission,
    SubmissionStatus,
    SubmissionType,
)
from tests.factories import add_school_fee

merge_migration = importlib.import_module(
    "edufinder.migrations.0007_merge_duplicate_reference_rows"
)


def run_merge() -> None:
    merge_migration.merge_duplicate_reference_rows(apps, None)


@pytest.fixture(name="payment_methods")
def payment_methods_fixture() -> dict[str, PaymentMethod]:
    return {
        label: PaymentMethod.objects.create(label=label)
        for label in ("2 tranches", "2 installments")
    }


@pytest.fixture(name="programs")
def programs_fixture() -> dict[str, Program]:
    return {
        name: Program.objects.create(name=name)
        for name in ("Sciences pures", "Pure sciences")
    }


@pytest.mark.django_db
def test_schools_of_the_duplicate_sector_join_the_kept_one(create_establishment):
    kept_sector = Sector.objects.create(label="private")
    duplicate_sector = Sector.objects.create(label="privé")
    establishment = create_establishment(sector=duplicate_sector)

    run_merge()

    establishment.refresh_from_db()
    assert establishment.sector == kept_sector
    assert not Sector.objects.filter(label="privé").exists()


@pytest.mark.django_db
def test_fee_plans_move_to_the_kept_payment_method(establishment, payment_methods):
    school_fee = add_school_fee(establishment, "6e", "70000")
    SchoolFeePaymentMethod.objects.create(
        fee=school_fee, payment_method=payment_methods["2 tranches"]
    )

    run_merge()

    assert list(school_fee.payment_methods.values_list("payment_method__label", flat=True)) == [
        "2 installments"
    ]
    assert not PaymentMethod.objects.filter(label="2 tranches").exists()


# Un frais lié aux deux versions de la même modalité n'en garde qu'une.
@pytest.mark.django_db
def test_fee_linked_to_both_versions_keeps_a_single_plan(establishment, payment_methods):
    school_fee = add_school_fee(establishment, "6e", "70000")
    for payment_method in payment_methods.values():
        SchoolFeePaymentMethod.objects.create(fee=school_fee, payment_method=payment_method)

    run_merge()

    assert school_fee.payment_methods.count() == 1


@pytest.mark.django_db
def test_programme_offers_move_to_the_kept_programme(establishment, programs):
    ProgramOffer.objects.create(establishment=establishment, program=programs["Sciences pures"])

    run_merge()

    assert list(establishment.program_offers.values_list("program__name", flat=True)) == [
        "Pure sciences"
    ]
    assert not Program.objects.filter(name="Sciences pures").exists()


@pytest.mark.django_db
def test_submission_content_follows_the_kept_rows(
    manager, establishment, payment_methods, programs
):
    kept_sector = Sector.objects.create(label="private")
    duplicate_sector = Sector.objects.create(label="privé")
    submission = Submission.objects.create(
        user=manager,
        establishment=establishment,
        type=SubmissionType.MODIFICATION,
        status=SubmissionStatus.PENDING,
        content={
            "id_sector": duplicate_sector.pk,
            "program_ids": [programs["Sciences pures"].pk, programs["Pure sciences"].pk],
            "fees": [{"id_level": 1, "payment_methods": ["2 tranches", "2 installments"]}],
            "phone": "699000000",
        },
    )

    run_merge()

    submission.refresh_from_db()
    assert submission.content == {
        "id_sector": kept_sector.pk,
        "program_ids": [programs["Pure sciences"].pk],
        "fees": [{"id_level": 1, "payment_methods": ["2 installments"]}],
        "phone": "699000000",
    }


# Une base qui n'a qu'une des deux lignes n'a rien à fusionner : rien ne doit
# être supprimé.
@pytest.mark.django_db
def test_a_lone_row_is_left_untouched(create_establishment):
    lone_sector = Sector.objects.create(label="privé")
    establishment = create_establishment(sector=lone_sector)

    run_merge()

    assert Sector.objects.filter(label="privé").exists()
    assert Establishment.objects.get(pk=establishment.pk).sector == lone_sector
