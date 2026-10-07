from decimal import Decimal

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from edufinder.models import (
    EstablishmentType,
    Media,
    MediaType,
    PaymentMethod,
    Program,
    ProgramOffer,
    SchoolFeePaymentMethod,
    Service,
    UserEstablishment,
)
from tests.constants import HIDDEN_STATUSES
from tests.factories import add_exam_result, add_school_fee

NOT_FOUND_BODY = {"detail": "Institution not found"}
PRIVATE_FIELD_NAMES = {
    "id_establishment",
    "status",
    "views_count",
    "inquiries_count",
    "recommended",
    "created_at",
    "updated_at",
    "user_establishments",
}


@pytest.fixture(name="secondary_establishment")
def secondary_establishment_fixture(create_establishment):
    return create_establishment(
        name="Lycée de Bonamoussadi",
        type=EstablishmentType.objects.create(label="Secondary general"),
        description="Établissement d'enseignement général.",
        director_name="Mme Ngo Bassa",
        contact_email="secretariat@example.com",
        latitude=Decimal("4.089100"),
        longitude=Decimal("9.741200"),
    )


@pytest.mark.django_db
def test_detail_exposes_the_full_public_profile(client, secondary_establishment):
    school_fee = add_school_fee(secondary_establishment, "6e", "150000")
    for payment_method_label in ("1 tranche", "2 tranches"):
        SchoolFeePaymentMethod.objects.create(
            fee=school_fee,
            payment_method=PaymentMethod.objects.create(label=payment_method_label),
        )
    Service.objects.create(establishment=secondary_establishment, name="Cantine")
    exam_result = add_exam_result(secondary_establishment, "BEPC", "87.5")
    ProgramOffer.objects.create(
        establishment=secondary_establishment,
        program=Program.objects.create(name="Sciences pures"),
    )
    media = Media.objects.create(
        establishment=secondary_establishment,
        type=MediaType.IMAGE,
        url="/media/facade.jpg",
    )

    response = client.get(f"/institutions/{secondary_establishment.uuid}")

    assert response.status_code == 200
    detail = response.json()
    assert detail["uuid"] == secondary_establishment.uuid
    assert detail["name"] == "Lycée de Bonamoussadi"
    assert detail["city"] == "Douala"
    assert detail["region"] == "Littoral"
    assert detail["type"] == "Secondary general"
    assert detail["sector"] == "Privé laïc"
    assert detail["linguistic_section"] == "Francophone"
    assert detail["contact_email"] == "secretariat@example.com"
    assert detail["latitude"] == pytest.approx(4.0891)
    assert detail["longitude"] == pytest.approx(9.7412)
    assert detail["fees"] == [
        {
            "id_level": school_fee.level_id,
            "class": "6e",
            "stage": "Secondary",
            "amount": "150000.00",
            "school_year": "2026-2027",
            "payment_methods": ["1 tranche", "2 tranches"],
        }
    ]
    assert detail["services"] == [{"name": "Cantine", "description": None}]
    assert detail["exam_results"] == [
        {
            "id_exam": exam_result.exam_id,
            "exam": "BEPC",
            "session": "2026",
            "pass_rate": "87.50",
        }
    ]
    assert detail["programs"] == ["Sciences pures"]
    assert detail["media"] == [
        {
            "id_media": media.pk,
            "type": "image",
            "url": "/media/facade.jpg",
            "caption": None,
        }
    ]


@pytest.mark.django_db
def test_detail_returns_null_for_missing_optional_fields(client, establishment):
    response = client.get(f"/institutions/{establishment.uuid}")

    detail = response.json()
    assert detail["description"] is None
    assert detail["director_name"] is None
    assert detail["latitude"] is None
    assert detail["fees"] == []
    assert detail["programs"] == []


@pytest.mark.django_db
def test_detail_never_exposes_private_fields(client, establishment, manager):
    UserEstablishment.objects.create(user=manager, establishment=establishment)

    response = client.get(f"/institutions/{establishment.uuid}")

    assert PRIVATE_FIELD_NAMES.isdisjoint(response.json())
    assert manager.email not in response.content.decode()


@pytest.mark.django_db
def test_detail_hides_an_exam_result_that_contradicts_the_type(
    client, secondary_establishment
):
    add_exam_result(secondary_establishment, "BEPC", "80")
    add_exam_result(secondary_establishment, "CEP", "95")

    response = client.get(f"/institutions/{secondary_establishment.uuid}")

    exam_labels = [result["exam"] for result in response.json()["exam_results"]]
    assert exam_labels == ["BEPC"]


@pytest.mark.django_db
@pytest.mark.parametrize("hidden_status", HIDDEN_STATUSES)
def test_detail_of_unpublished_institution_is_hidden(
    client, create_establishment, hidden_status
):
    hidden_establishment = create_establishment(status=hidden_status)

    response = client.get(f"/institutions/{hidden_establishment.uuid}")

    assert response.status_code == 404
    assert response.json() == NOT_FOUND_BODY


@pytest.mark.django_db
@pytest.mark.parametrize(
    "unknown_identifier",
    ["00000000-0000-0000-0000-000000000000", "not-a-uuid", "1"],
)
def test_detail_of_unknown_or_malformed_identifier_is_404(client, unknown_identifier):
    # Pas de 422 distinct : je ne révèle pas si l'identifiant est mal formé.
    response = client.get(f"/institutions/{unknown_identifier}")

    assert response.status_code == 404
    assert response.json() == NOT_FOUND_BODY


@pytest.mark.django_db
def test_detail_is_not_reachable_by_internal_id(client, establishment):
    response = client.get(f"/institutions/{establishment.id_establishment}")

    assert response.status_code == 404


@pytest.mark.django_db
def test_detail_query_count_does_not_grow_with_the_number_of_fees(
    client, secondary_establishment
):
    add_school_fee(secondary_establishment, "6e", "150000")
    with CaptureQueriesContext(connection) as queries_with_one_fee:
        client.get(f"/institutions/{secondary_establishment.uuid}")

    for level_label in ("5e", "4e", "3e"):
        add_school_fee(secondary_establishment, level_label, "160000")
    with CaptureQueriesContext(connection) as queries_with_four_fees:
        client.get(f"/institutions/{secondary_establishment.uuid}")

    assert len(queries_with_four_fees) == len(queries_with_one_fee)


@pytest.mark.django_db
def test_detail_lists_services_in_alphabetical_order(client, establishment):
    for service_name in ("Internat", "Bibliothèque", "Cantine"):
        Service.objects.create(establishment=establishment, name=service_name)

    response = client.get(f"/institutions/{establishment.uuid}")

    service_names = [service["name"] for service in response.json()["services"]]
    assert service_names == ["Bibliothèque", "Cantine", "Internat"]
