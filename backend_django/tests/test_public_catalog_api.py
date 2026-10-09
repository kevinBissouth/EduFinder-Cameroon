import pytest

from edufinder.models import (
    City,
    EstablishmentType,
    PaymentMethod,
    Program,
    Region,
    Service,
    Stage,
    StudyLevel,
)
from tests.constants import HIDDEN_STATUSES
from tests.factories import add_exam_result, add_school_fee


def add_fee_and_exam_result(establishment) -> None:
    add_school_fee(establishment, "6e", "150000")
    add_exam_result(establishment, "BEPC", "87.5")


# --- GET /stats ---------------------------------------------------------------


@pytest.mark.django_db
def test_stats_without_data_returns_zeros(client):
    response = client.get("/stats")

    assert response.status_code == 200
    assert response.json() == {
        "institutions": 0,
        "cities": 0,
        "regions": 0,
        "fee_plans": 0,
        "exam_results": 0,
    }


@pytest.mark.django_db
@pytest.mark.parametrize("hidden_status", HIDDEN_STATUSES)
def test_stats_count_only_published_data(client, create_establishment, hidden_status):
    add_fee_and_exam_result(create_establishment(name="Published school"))
    add_fee_and_exam_result(
        create_establishment(name="Hidden school", status=hidden_status)
    )

    response = client.get("/stats")

    assert response.json() == {
        "institutions": 1,
        "cities": 1,
        "regions": 1,
        "fee_plans": 1,
        "exam_results": 1,
    }


@pytest.mark.django_db
def test_stats_count_each_city_once(client, create_establishment, city):
    other_city = City.objects.create(name="Limbe", region=city.region)
    create_establishment(name="First school")
    create_establishment(name="Second school")
    create_establishment(name="Third school", city=other_city)

    response = client.get("/stats")

    assert response.json()["institutions"] == 3
    assert response.json()["cities"] == 2


@pytest.mark.django_db
def test_stats_count_only_regions_holding_a_published_school(
    client, create_establishment, city
):
    Region.objects.create(name="Empty region")
    other_region = Region.objects.create(name="Centre")
    other_city = City.objects.create(name="Yaoundé", region=other_region)
    create_establishment(name="First school")
    create_establishment(name="Second school", city=other_city)

    assert client.get("/stats").json()["regions"] == 2


# --- GET /filters-meta --------------------------------------------------------


@pytest.mark.django_db
def test_filters_meta_exposes_references_as_id_and_name(client, establishment):
    PaymentMethod.objects.create(label="2 tranches")
    stage = Stage.objects.create(label="Primaire")
    study_level = StudyLevel.objects.create(label="CM2", stage=stage)

    response = client.get("/filters-meta")

    assert response.status_code == 200
    filters_meta = response.json()
    assert filters_meta["regions"] == [
        {"id": establishment.city.region.pk, "name": "Littoral"}
    ]
    assert filters_meta["cities"] == [{"id": establishment.city.pk, "name": "Douala"}]
    assert filters_meta["types"] == [{"id": establishment.type.pk, "name": "Secondaire"}]
    assert filters_meta["sectors"] == [
        {"id": establishment.sector.pk, "name": "Privé laïc"}
    ]
    assert filters_meta["languages"] == [
        {"id": establishment.linguistic_section.pk, "name": "Francophone"}
    ]
    assert filters_meta["levels"] == [
        {"id": study_level.pk, "name": "Primaire — CM2", "stage": "Primaire", "label": "CM2"}
    ]
    assert filters_meta["payment_methods"] == ["2 tranches"]
    assert filters_meta["exams"] == []
    assert filters_meta["programs"] == []


@pytest.mark.django_db
def test_filters_meta_orders_regions_by_name(client):
    Region.objects.create(name="Ouest")
    Region.objects.create(name="Centre")

    response = client.get("/filters-meta")

    region_names = [region["name"] for region in response.json()["regions"]]
    assert region_names == ["Centre", "Ouest"]


@pytest.mark.django_db
def test_filters_meta_dedupes_services_case_insensitively(client, create_establishment):
    Service.objects.create(
        establishment=create_establishment(name="First school"), name="Cantine"
    )
    Service.objects.create(
        establishment=create_establishment(name="Second school"), name="cantine"
    )

    response = client.get("/filters-meta")

    service_names = response.json()["services"]
    assert len(service_names) == 1
    assert service_names[0].lower() == "cantine"


@pytest.mark.django_db
@pytest.mark.parametrize("hidden_status", HIDDEN_STATUSES)
def test_filters_meta_hides_services_of_unpublished_establishments(
    client, create_establishment, hidden_status
):
    hidden_establishment = create_establishment(status=hidden_status)
    Service.objects.create(establishment=hidden_establishment, name="Internat")

    response = client.get("/filters-meta")

    assert response.json()["services"] == []
    assert response.json()["featured_type_ids"] == []


@pytest.mark.django_db
def test_filters_meta_features_the_most_represented_types_first(
    client, create_establishment
):
    rare_type = EstablishmentType.objects.create(label="Université")
    common_type = EstablishmentType.objects.create(label="Primaire")
    create_establishment(name="University", type=rare_type)
    create_establishment(name="First primary school", type=common_type)
    create_establishment(name="Second primary school", type=common_type)

    response = client.get("/filters-meta")

    assert response.json()["featured_type_ids"] == [common_type.pk, rare_type.pk]


# --- GET /reference-labels ----------------------------------------------------


@pytest.mark.django_db
def test_reference_labels_map_each_key_to_both_languages(client):
    EstablishmentType.objects.create(
        label="Nursery", label_fr="Maternelle", label_en="Nursery"
    )
    Region.objects.create(name="Far North", label_fr="Extrême-Nord", label_en="Far North")
    Program.objects.create(
        name="Sciences pures", label_fr="Sciences pures", label_en="Pure sciences"
    )

    response = client.get("/reference-labels")

    assert response.status_code == 200
    reference_labels = response.json()
    assert reference_labels["types"] == {"Nursery": {"fr": "Maternelle", "en": "Nursery"}}
    assert reference_labels["regions"] == {
        "Far North": {"fr": "Extrême-Nord", "en": "Far North"}
    }
    assert reference_labels["programs"] == {
        "Sciences pures": {"fr": "Sciences pures", "en": "Pure sciences"}
    }


@pytest.mark.django_db
def test_reference_labels_fall_back_to_the_key_when_untranslated(client):
    PaymentMethod.objects.create(label="Trimestriel")
    Stage.objects.create(label="Lycée", label_en="Upper secondary")

    reference_labels = client.get("/reference-labels").json()

    assert reference_labels["payment_methods"] == {
        "Trimestriel": {"fr": "Trimestriel", "en": "Trimestriel"}
    }
    assert reference_labels["stages"] == {
        "Lycée": {"fr": "Lycée", "en": "Upper secondary"}
    }


@pytest.mark.django_db
def test_reference_labels_list_every_translated_kind_even_when_empty(client):
    assert client.get("/reference-labels").json() == {
        "regions": {},
        "types": {},
        "sections": {},
        "sectors": {},
        "exams": {},
        "stages": {},
        "programs": {},
        "payment_methods": {},
    }


@pytest.mark.django_db
def test_reference_labels_reject_writes(client):
    assert client.post("/reference-labels", {}, format="json").status_code == 405
