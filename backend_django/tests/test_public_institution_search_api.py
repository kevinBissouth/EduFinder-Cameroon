from dataclasses import dataclass

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from edufinder.models import (
    City,
    Establishment,
    EstablishmentType,
    Exam,
    ExamResult,
    LinguisticSection,
    Media,
    MediaType,
    Program,
    ProgramOffer,
    Region,
    SchoolFee,
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


# Trois établissements publiés aux profils distincts, sans description : aucune
# fiche n'est complète au départ. Alpha porte le drapeau interne « recommandé »,
# qui ne doit plus rien changer à l'ordre.
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


def find_summary(client, establishment_name: str) -> dict:
    summaries = client.get("/institutions").json()
    return next(summary for summary in summaries if summary["name"] == establishment_name)


# Ajoute ce qui manque le plus souvent à une fiche : une description, un frais
# et une photo. Les résultats d'examens restent ceux que l'établissement a déjà.
def complete_profile(establishment: Establishment) -> None:
    Establishment.objects.filter(pk=establishment.pk).update(
        description="What the school offers, in a few lines."
    )
    add_school_fee(establishment, "Completion level", "90000")
    Media.objects.create(
        establishment=establishment, type=MediaType.IMAGE, url="/media/cover.jpg"
    )


PROFILE_PART_REMOVERS = {
    "description": lambda establishment: Establishment.objects.filter(
        pk=establishment.pk
    ).update(description=""),
    "fees": lambda establishment: SchoolFee.objects.filter(
        establishment=establishment
    ).delete(),
    "photos": lambda establishment: Media.objects.filter(
        establishment=establishment, type=MediaType.IMAGE
    ).delete(),
    "exam_results": lambda establishment: ExamResult.objects.filter(
        establishment=establishment
    ).delete(),
}


def remove_profile_part(establishment: Establishment, profile_part: str) -> None:
    PROFILE_PART_REMOVERS[profile_part](establishment)


# --- Liste, ordre et résumé ---------------------------------------------------


@pytest.mark.django_db
def test_list_without_data_is_empty(client):
    assert search_names(client) == []


@pytest.mark.django_db
def test_list_is_alphabetical_when_no_profile_is_complete(client, catalog):
    assert search_names(client) == [
        "Alpha Primary School",
        "Beta Primary School",
        "Gamma College",
    ]


@pytest.mark.django_db
def test_list_puts_complete_profiles_first(client, catalog):
    complete_profile(catalog.beta)

    assert search_names(client) == [
        "Beta Primary School",
        "Alpha Primary School",
        "Gamma College",
    ]


# Le drapeau interne ne doit plus rien changer à l'ordre : seule la complétude
# de la fiche, un fait vérifiable, fait remonter un établissement.
@pytest.mark.django_db
def test_list_ignores_the_internal_recommended_flag(client, catalog):
    assert catalog.alpha.recommended is True
    complete_profile(catalog.beta)

    assert search_names(client)[0] == "Beta Primary School"


@pytest.mark.django_db
def test_profile_is_complete_with_description_fee_photo_and_results(client, catalog):
    complete_profile(catalog.beta)

    assert find_summary(client, "Beta Primary School")["is_profile_complete"] is True


@pytest.mark.django_db
@pytest.mark.parametrize(
    "removed_part", ["description", "fees", "photos", "exam_results"]
)
def test_profile_is_incomplete_when_one_part_is_missing(client, catalog, removed_part):
    complete_profile(catalog.beta)
    remove_profile_part(catalog.beta, removed_part)

    assert find_summary(client, "Beta Primary School")["is_profile_complete"] is False


# Une université ne présente aucun examen officiel de la cartographie : lui
# demander des résultats la priverait à jamais d'une fiche complète.
@pytest.mark.django_db
def test_profile_without_official_exams_is_complete_without_results(
    client, create_establishment
):
    university = create_establishment(
        name="Delta University",
        type=EstablishmentType.objects.create(label="University"),
    )
    complete_profile(university)

    assert find_summary(client, "Delta University")["is_profile_complete"] is True


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
        "is_profile_complete": False,
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
        "Beta Primary School",
        "Gamma College",
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
def test_search_term_finds_schools_by_city(client, catalog):
    assert search_names(client, "?q=douala") == ["Gamma College"]


# Sans accent dans la saisie, la ville accentuée est trouvée quand même.
@pytest.mark.django_db
def test_search_term_finds_a_city_typed_without_accents(client, catalog):
    assert search_names(client, "?q=yaounde") == [
        "Alpha Primary School",
        "Beta Primary School",
    ]


@pytest.mark.django_db
def test_search_term_finds_schools_by_programme(client, catalog):
    assert search_names(client, "?q=informatique") == [
        "Alpha Primary School",
        "Beta Primary School",
    ]


# La filière se trouve aussi sous son libellé dans l'autre langue, et un
# établissement qui en propose plusieurs ne sort qu'une fois.
@pytest.mark.django_db
def test_search_term_finds_a_programme_by_its_translated_label(client, catalog):
    Program.objects.filter(pk=catalog.computing_program.pk).update(
        label_fr="Informatique", label_en="Computer science"
    )
    second_program = Program.objects.create(
        name="Sciences informatiques", label_en="Computer engineering"
    )
    ProgramOffer.objects.create(establishment=catalog.alpha, program=second_program)

    assert search_names(client, "?q=computer") == [
        "Alpha Primary School",
        "Beta Primary School",
    ]


@pytest.mark.django_db
@pytest.mark.parametrize("hidden_status", HIDDEN_STATUSES)
def test_search_term_never_finds_a_hidden_school_by_its_city(
    client, create_establishment, hidden_status
):
    create_establishment(name="Hidden school", status=hidden_status)

    assert search_names(client, "?q=douala") == []


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


# MySQL ignore les accents et la casse dans la recherche ; SQLite (tests et
# hébergement de démonstration) doit faire pareil, sinon « college » ne
# trouverait plus aucun collège.
@pytest.mark.django_db
@pytest.mark.parametrize(
    "search_term", ["college", "COLLÈGE", "collége", "ecole", "École", "superieure"]
)
def test_name_search_ignores_accents_and_case(client, create_establishment, search_term):
    create_establishment(name="Collège de l'École Supérieure")
    create_establishment(name="Lycée Technique")

    assert search_names(client, f"?q={search_term}") == ["Collège de l'École Supérieure"]


@pytest.mark.django_db
def test_name_search_treats_like_wildcards_as_plain_text(client, create_establishment):
    create_establishment(name="100% Réussite")
    create_establishment(name="Lycée Technique")

    assert search_names(client, "?q=100%25") == ["100% Réussite"]
    assert search_names(client, "?q=_") == []
