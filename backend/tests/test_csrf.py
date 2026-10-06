"""Tests du contrôle d'origine sur les requêtes mutantes, /auth/ compris."""
from app.core.config import settings

UNTRUSTED_ORIGIN = "https://evil.example"
# Origine de l'API vue par le client de test (base_url par défaut).
API_OWN_ORIGIN = "http://testserver"


def login_from_origin(client, account: dict, origin: str):
    return client.post(
        "/auth/login",
        data={"username": account["email"], "password": account["password"]},
        headers={"Origin": origin},
    )


def test_login_from_untrusted_origin_is_rejected(client, manager_account):
    response = login_from_origin(client, manager_account, UNTRUSTED_ORIGIN)

    assert response.status_code == 403
    assert "set-cookie" not in response.headers


def test_logout_from_untrusted_origin_is_rejected(client):
    response = client.post("/auth/logout", headers={"Origin": UNTRUSTED_ORIGIN})

    assert response.status_code == 403


def test_login_from_allowed_frontend_origin_succeeds(client, manager_account):
    response = login_from_origin(client, manager_account, settings.cors_origins[0])

    assert response.status_code == 200


def test_login_from_api_own_origin_succeeds(client, manager_account):
    response = login_from_origin(client, manager_account, API_OWN_ORIGIN)

    assert response.status_code == 200


def test_mutating_request_from_untrusted_origin_is_rejected(client, seed_ids):
    response = client.post(
        f"/institutions/{seed_ids['published_alpha_uuid']}/track-view",
        headers={"Origin": UNTRUSTED_ORIGIN},
    )

    assert response.status_code == 403


def test_safe_request_from_untrusted_origin_is_not_blocked(client):
    response = client.get("/institutions", headers={"Origin": UNTRUSTED_ORIGIN})

    assert response.status_code == 200
