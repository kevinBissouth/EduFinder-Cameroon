from dataclasses import dataclass

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from edufinder.models import (
    City,
    Establishment,
    EstablishmentType,
    Exam,
    LinguisticSection,
    Media,
    MediaType,
    Program,
    ProgramOffer,
    Region,
    Sector,
    Service,
)
from tests.constants import HIDDEN_STATUSES
from tests.factories import add_exam_result, add_school_fee


@dataclass(frozen=True)
class SearchCatalog:
    alpha: Establishment
    beta: Establishment
    gamma: Establishment
    yaounde: City
    primary_type: EstablishmentType
    anglophone_section: LinguisticSection
    public_sector: Sector
    second_private_sector: Sector
    computing_program: Program
    cep_exam: Exam


# Trois établissements publiés aux profils distincts. Alpha est créé en
# dernier : il ne peut arriver en tête que grâce à son statut recommandé.
#   Gamma : Douala, secondaire, francophone, privé, frais 50 000, aucun résultat.
#   Beta  : Yaoundé, primaire, anglophone, privé (autre libellé), frais 300 000,
#           CEP 75 %, services « cantine » et « Internat », un PDF seulement.
#   Alpha : Yaoundé, primaire, anglophone, public, recommandé, frais 100 000 et
#           120 000, CEP 85,5 %, service « Cantine », une image.
@pytest.fixture(name="catalog")
def catalog_fixture(create_establishment) -> SearchCatalog:
    yaounde = City.objects.create(
        name="Yaoundé", region=Region.objects.create(name="Centre")
    )
    primary_type = EstablishmentType.objects.create(label="Primary")
    anglophone_section = LinguisticSection.objects.create(label="Anglophone")
    public_sector = Sector.objects.create(label="public", is_public=True)
    second_private_sector = Sector.objects.create(label="private")
    computing_program = Program.objects.create(name="Informatique")
    yaounde_primary_school = {
        "city": yaounde,
        "type": primary_type,
        "linguistic_section": anglophone_section,
    }

    gamma = create_establishment(name="Gamma College")
    add_school_fee(gamma, "6e", "50000")

    beta = create_establishment(
        name="Beta Primary School",
        sector=second_private_sector,
        **yaounde_primary_school,
    )
    add_school_fee(beta, "CM2", "300000")
    add_exam_result(beta, "CEP", "75")
    Service.objects.create(establishment=beta, name="cantine")
    Service.objects.create(establishment=beta, name="Internat")
    ProgramOffer.objects.create(establishment=beta, program=computing_program)
    Media.objects.create(
        establishment=beta, type=MediaType.PDF, url="/media/brochure_b.pdf"
    )

    alpha = create_establishment(
        name="Alpha Primary School",
        sector=public_sector,
        recommended=True,
        **yaounde_primary_school,
    )
    add_school_fee(alpha, "CM1", "120000")
    add_school_fee(alpha, "CM2", "100000")
    add_exam_result(alpha, "CEP", "85.5")
    Service.objects.create(establishment=alpha, name="Cantine")
    ProgramOffer.objects.create(establishment=alpha, program=computing_program)
    Media.objects.create(
        establishment=alpha, type=MediaType.IMAGE, url="/media/profil_a.jpg"
    )
    Media.objects.create(
        establishment=alpha, type=MediaType.IMAGE, url="/media/cour_a.jpg"
    )

    return SearchCatalog(
        alpha=alpha,
        beta=beta,
        gamma=gamma,
        yaounde=yaounde,
        primary_type=primary_type,
        anglophone_section=anglophone_section,
        public_sector=public_sector,
        second_private_sector=second_private_sector,
        computing_program=computing_program,
        cep_exam=Exam.objects.get(label="CEP"),
    )


def search_names(client, query_string: str = "") -> list[str]:
    response = client.get(f"/institutions{query_string}")
    assert response.status_code == 200, response.content
    return [institution["name"] for institution in response.json()]


# --- Liste, ordre et résumé ---------------------------------------------------


@pytest.mark.django_db
def test_list_without_data_is_empty(client):
    assert search_names(client) == []


@pytest.mark.django_db
def test_list_orders_recommended_first_then_by_creation(client, catalog):
    assert search_names(client) == [
        "Alpha Primary School",
        "Gamma College",
        "Beta Primary School",
    ]


@pytest.mark.django_db
@pytest.mark.parametrize("hidden_status", HIDDEN_STATUSES)
def test_list_returns_only_published(client, create_establishment, hidden_status):
    create_establishment(name="Published school")
    create_establishment(name="Hidden school", status=hidden_status)

    assert search_names(client) == ["Published school"]
    assert search_names(client, "?q=Hidden") == []


@pytest.mark.django_db
def test_summary_carries_aggregates_and_public_fields_only(client, catalog):
    response = client.get("/institutions")

    summaries_by_name = {summary["name"]: summary for summary in response.json()}
    assert summaries_by_name["Alpha Primary School"] == {
        "uuid": catalog.alpha.uuid,
        "name": "Alpha Primary School",
        "city": "Yaoundé",
        "type": "Primary",
        "sector": "public",
        "linguistic_section": "Anglophone",
        "phone": None,
        "website": None,
        "recommended": True,
        "min_tuition": "100000.00",
        "best_pass_rate": "85.50",
        "cover_url": "/media/profil_a.jpg",
    }
    # Pas d'image chez Beta, seulement un PDF : pas de couverture.
    assert summaries_by_name["Beta Primary School"]["cover_url"] is None
    assert summaries_by_name["Beta Primary School"]["best_pass_rate"] == "75.00"
    assert summaries_by_name["Gamma College"]["best_pass_rate"] is None


@pytest.mark.django_db
def test_summary_ignores_an_exam_result_that_contradicts_the_type(client, catalog):
    # Gamma est un établissement secondaire : un CEP (examen du primaire) y est
    # une incohérence de données et ne doit ni s'afficher ni servir de filtre.
    secondary_type = EstablishmentType.objects.create(label="Secondary general")
    catalog.gamma.type = secondary_type
    catalog.gamma.save()
    add_exam_result(catalog.gamma, "CEP", "99")

    response = client.get("/institutions?q=Gamma")

    assert response.json()[0]["best_pass_rate"] is None
    assert "Gamma College" not in search_names(client, f"?exam={catalog.cep_exam.pk}:90")


@pytest.mark.django_db
def test_list_query_count_does_not_grow_with_the_number_of_results(
    client, create_establishment
):
    create_establishment(name="First school")
    with CaptureQueriesContext(connection) as queries_with_one_result:
        client.get("/institutions")

    create_establishment(name="Second school")
    create_establishment(name="Third school")
    with CaptureQueriesContext(connection) as queries_with_three_results:
        client.get("/institutions")

    assert len(queries_with_three_results) == len(queries_with_one_result)


# --- Filtres ------------------------------------------------------------------


@pytest.mark.django_db
def test_filter_by_city(client, catalog):
    assert search_names(client, f"?city_id={catalog.yaounde.pk}") == [
        "Alpha Primary School",
        "Beta Primary School",
    ]


@pytest.mark.django_db
def test_filter_by_type_and_language(client, catalog):
    query_string = (
        f"?type_id={catalog.gamma.type.pk}"
        f"&linguistic_section_id={catalog.gamma.linguistic_section.pk}"
    )

    assert search_names(client, query_string) == ["Gamma College"]


@pytest.mark.django_db
def test_combined_filters_without_match_return_an_empty_list(client, catalog):
    query_string = f"?type_id={catalog.gamma.type.pk}&city_id={catalog.yaounde.pk}"

    assert search_names(client, query_string) == []


@pytest.mark.django_db
def test_sector_filter_groups_all_private_sectors(client, catalog):
    # « Privé laïc » et « private » sont deux secteurs distincts du même
    # groupe : filtrer sur l'un doit renvoyer les deux.
    assert search_names(client, f"?sector_id={catalog.second_private_sector.pk}") == [
        "Gamma College",
        "Beta Primary School",
    ]


@pytest.mark.django_db
def test_sector_filter_public_group(client, catalog):
    assert search_names(client, f"?sector_id={catalog.public_sector.pk}") == [
        "Alpha Primary School"
    ]


@pytest.mark.django_db
def test_unknown_sector_returns_empty_list(client, catalog):
    assert search_names(client, "?sector_id=999999") == []


@pytest.mark.django_db
def test_filter_by_region(client, catalog):
    assert search_names(client, f"?region_id={catalog.gamma.city.region.pk}") == [
        "Gamma College"
    ]


@pytest.mark.django_db
def test_filter_by_program(client, catalog):
    assert search_names(client, f"?program_id={catalog.computing_program.pk}") == [
        "Alpha Primary School",
        "Beta Primary School",
    ]


@pytest.mark.django_db
def test_search_term_filters_by_name_ignoring_case(client, catalog):
    assert search_names(client, "?q=beta") == ["Beta Primary School"]


@pytest.mark.django_db
def test_blank_search_term_is_ignored(client, catalog):
    assert len(search_names(client, "?q=")) == 3


@pytest.mark.django_db
@pytest.mark.parametrize("wildcard", ["%25", "_"])
def test_search_term_treats_sql_wildcards_as_plain_text(client, catalog, wildcard):
    assert search_names(client, f"?q={wildcard}") == []


@pytest.mark.django_db
def test_fee_range_filters_on_minimum_tuition(client, catalog):
    # Alpha : minimum 100 000 ; Gamma : 50 000 (trop bas) ; Beta : 300 000.
    assert search_names(client, "?min_fee=60000&max_fee=150000") == [
        "Alpha Primary School"
    ]


@pytest.mark.django_db
def test_fee_filter_excludes_establishments_without_any_fee(
    client, create_establishment
):
    create_establishment(name="School without fees")

    assert search_names(client, "?min_fee=0") == []
    assert search_names(client) == ["School without fees"]


@pytest.mark.django_db
def test_service_filter_is_case_insensitive(client, catalog):
    assert search_names(client, "?service=CANTINE") == [
        "Alpha Primary School",
        "Beta Primary School",
    ]


@pytest.mark.django_db
def test_several_services_must_all_be_offered(client, catalog):
    assert search_names(client, "?service=Cantine&service=Internat") == [
        "Beta Primary School"
    ]


@pytest.mark.django_db
def test_exam_requirement_filters_by_pass_rate(client, catalog):
    assert search_names(client, f"?exam={catalog.cep_exam.pk}:80") == [
        "Alpha Primary School"
    ]
    assert search_names(client, f"?exam={catalog.cep_exam.pk}:75") == [
        "Alpha Primary School",
        "Beta Primary School",
    ]


# --- Pagination ---------------------------------------------------------------


@pytest.mark.django_db
def test_pagination_limit_and_offset(client, catalog):
    all_names = search_names(client)

    assert search_names(client, "?limit=2") == all_names[:2]
    assert search_names(client, "?offset=1&limit=1") == all_names[1:2]
    assert search_names(client, "?offset=1") == all_names[1:]
    assert search_names(client, "?offset=10") == []


# --- Entrées invalides --------------------------------------------------------


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("query_string", "rejected_parameter"),
    [
        ("?limit=0", "limit"),
        ("?limit=201", "limit"),
        ("?offset=-1", "offset"),
        ("?city_id=abc", "city_id"),
        ("?min_fee=-1", "min_fee"),
        ("?max_fee=cheap", "max_fee"),
        ("?exam=pasuntaux", "exam"),
        ("?exam=3:150", "exam"),
        ("?exam=3:80%0A", "exam"),
        ("?q=" + "a" * 101, "q"),
        ("?service=" + "a" * 101, "service"),
        ("?" + "&".join(f"service=s{index}" for index in range(9)), "service"),
        ("?" + "&".join(f"exam={index}:50" for index in range(6)), "exam"),
    ],
)
def test_invalid_filter_is_rejected_with_422(client, query_string, rejected_parameter):
    response = client.get(f"/institutions{query_string}")

    assert response.status_code == 422
    assert rejected_parameter in response.json()


@pytest.mark.django_db
def test_unknown_parameter_is_ignored(client, catalog):
    assert len(search_names(client, "?unknown_filter=1")) == 3
