"""Tests des endpoints publics : succès, échecs et règle de visibilité.

Règle centrale vérifiée partout : seuls les établissements `published`
existent aux yeux de l'API publique.
"""
from tests.conftest import insert_public_demo_data


def test_health_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


# --- GET /institutions -------------------------------------------------------

def test_list_returns_only_published(client, seed_ids):
    response = client.get("/institutions")
    assert response.status_code == 200
    institutions = response.json()
    returned_uuids = [item["uuid"] for item in institutions]
    assert set(returned_uuids) == {
        seed_ids["published_alpha_uuid"],
        seed_ids["published_beta_uuid"],
        seed_ids["published_gamma_uuid"],
    }


def test_list_orders_recommended_first(client, seed_ids):
    response = client.get("/institutions")
    uuids = [item["uuid"] for item in response.json()]
    assert uuids[0] == seed_ids["published_alpha_uuid"]


def test_list_pagination_limit_and_offset(client, seed_ids):
    ordering = client.get("/institutions").json()
    all_uuids = [item["uuid"] for item in ordering]

    limited = client.get("/institutions?limit=2").json()
    assert [item["uuid"] for item in limited] == all_uuids[:2]

    offset = client.get("/institutions?offset=1&limit=2").json()
    assert [item["uuid"] for item in offset] == all_uuids[1:]

    invalid = client.get("/institutions?limit=0")
    assert invalid.status_code == 422


def test_summary_carries_aggregates(client, seed_ids):
    response = client.get("/institutions")
    by_uuid = {item["uuid"]: item for item in response.json()}

    alpha = by_uuid[seed_ids["published_alpha_uuid"]]
    assert float(alpha["min_tuition"]) == 100000.0
    assert float(alpha["best_pass_rate"]) == 85.5
    assert alpha["cover_url"] == "/media/profil_a.jpg"

    beta = by_uuid[seed_ids["published_beta_uuid"]]
    # Pas d'image chez Beta, seulement un PDF : pas de couverture.
    assert beta["cover_url"] is None
    assert float(beta["best_pass_rate"]) == 75.0

    gamma = by_uuid[seed_ids["published_gamma_uuid"]]
    assert gamma["best_pass_rate"] is None


def test_filter_by_city(client, seed_ids):
    response = client.get(f"/institutions?city_id={seed_ids['city_yaounde']}")
    uuids = [item["uuid"] for item in response.json()]
    assert seed_ids["published_gamma_uuid"] not in uuids
    assert len(uuids) == 2


def test_filter_by_type_and_language(client, seed_ids):
    response = client.get(
        f"/institutions?type_id={seed_ids['type_secondary']}"
        f"&linguistic_section_id={seed_ids['language_fr']}"
    )
    uuids = [item["uuid"] for item in response.json()]
    assert uuids == [seed_ids["published_gamma_uuid"]]


def test_sector_filter_groups_all_private_sectors(client, seed_ids):
    # 'privé' et 'private' sont deux secteurs distincts mais du même groupe :
    # filtrer sur l'un doit renvoyer les deux (colonne is_public).
    response = client.get(f"/institutions?sector_id={seed_ids['sector_private_two']}")
    uuids = {item["uuid"] for item in response.json()}
    assert uuids == {seed_ids["published_beta_uuid"], seed_ids["published_gamma_uuid"]}


def test_sector_filter_public_group(client, seed_ids):
    response = client.get(f"/institutions?sector_id={seed_ids['sector_public']}")
    uuids = [item["uuid"] for item in response.json()]
    assert uuids == [seed_ids["published_alpha_uuid"]]


def test_unknown_sector_returns_empty_list(client):
    response = client.get("/institutions?sector_id=9999")
    assert response.status_code == 200
    assert response.json() == []


def test_filter_by_region_via_city_join(client, seed_ids):
    response = client.get(f"/institutions?region_id={seed_ids['region_littoral']}")
    uuids = [item["uuid"] for item in response.json()]
    assert uuids == [seed_ids["published_gamma_uuid"]]


def test_filter_by_program(client, seed_ids):
    response = client.get(f"/institutions?program_id={seed_ids['program_computing']}")
    uuids = {item["uuid"] for item in response.json()}
    assert uuids == {seed_ids["published_alpha_uuid"], seed_ids["published_beta_uuid"]}


def test_search_term_filters_by_name(client, seed_ids):
    response = client.get("/institutions?q=Beta")
    uuids = [item["uuid"] for item in response.json()]
    assert uuids == [seed_ids["published_beta_uuid"]]


def test_fee_range_filters_on_minimum_tuition(client, seed_ids):
    response = client.get("/institutions?min_fee=60000&max_fee=150000")
    uuids = [item["uuid"] for item in response.json()]
    # Alpha : minimum 100 000 ; Gamma : 50 000 (trop bas) ; Beta : 300 000.
    assert uuids == [seed_ids["published_alpha_uuid"]]


def test_service_filter_is_case_insensitive(client, seed_ids):
    response = client.get("/institutions?service=CANTINE")
    uuids = {item["uuid"] for item in response.json()}
    assert uuids == {seed_ids["published_alpha_uuid"], seed_ids["published_beta_uuid"]}


def test_exam_requirement_filters_by_pass_rate(client, seed_ids):
    response = client.get(f"/institutions?exam={seed_ids['exam_cep']}:80")
    uuids = [item["uuid"] for item in response.json()]
    assert uuids == [seed_ids["published_alpha_uuid"]]


def test_exam_requirement_above_100_is_rejected(client, seed_ids):
    response = client.get(f"/institutions?exam={seed_ids['exam_cep']}:150")
    assert response.status_code == 422


def test_malformed_exam_requirement_is_rejected(client):
    response = client.get("/institutions?exam=pasuntaux")
    assert response.status_code == 422


# --- GET /institutions/{id} --------------------------------------------------

def test_detail_of_published_institution(client, seed_ids):
    response = client.get(f"/institutions/{seed_ids['published_alpha_uuid']}")
    assert response.status_code == 200
    detail = response.json()
    assert detail["name"] == "Alpha Primary School"
    assert len(detail["fees"]) == 2
    assert len(detail["exam_results"]) == 1
    assert detail["programs"] == ["Informatique"]
    assert detail["media"][0]["url"] == "/media/profil_a.jpg"


def test_detail_of_pending_institution_is_hidden(client, seed_ids):
    response = client.get(f"/institutions/{seed_ids['pending_uuid']}")
    assert response.status_code == 404


def test_detail_of_suspended_institution_is_hidden(client, seed_ids):
    response = client.get(f"/institutions/{seed_ids['suspended_uuid']}")
    assert response.status_code == 404


def test_detail_of_unknown_institution_is_404(client):
    response = client.get("/institutions/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    assert response.json()["detail"] == "Institution not found"


def test_detail_of_malformed_identifier_is_404(client):
    # Pas de 422 distinct : on ne révèle pas si l'identifiant est mal formé.
    response = client.get("/institutions/not-a-uuid")
    assert response.status_code == 404


# --- GET /filters-meta et /stats ---------------------------------------------

def test_filters_meta_dedupes_services_case_insensitively(client, seed_ids):
    response = client.get("/filters-meta")
    assert response.status_code == 200
    services = response.json()["services"]
    lowered = [name.lower() for name in services]
    assert len(lowered) == len(set(lowered))
    assert "cantine" in lowered
    # Le service d'un établissement non publié ne sort jamais.
    assert "piscine" not in lowered


def test_stats_count_only_published_data(client, database_session, seed_ids):
    # Re-seed dans une session fraîche pour ce test isolé n'est pas nécessaire :
    # les compteurs sont vérifiés directement sur le jeu standard.
    response = client.get("/stats")
    assert response.status_code == 200
    assert response.json() == {
        "institutions": 3,
        "cities": 2,
        "fee_plans": 4,
        "exam_results": 2,
    }


def test_stats_without_data_returns_zeros(client):
    response = client.get("/stats")
    assert response.status_code == 200
    assert response.json() == {
        "institutions": 0,
        "cities": 0,
        "fee_plans": 0,
        "exam_results": 0,
    }


def test_seed_helper_is_reusable(database_session):
    seed_ids = insert_public_demo_data(database_session)
    assert seed_ids["published_alpha"] == 200
