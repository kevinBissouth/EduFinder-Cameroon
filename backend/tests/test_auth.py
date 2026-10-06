"""Tests de l'authentification minimale : login, /auth/me, refus 401."""
from fastapi.testclient import TestClient

from app.core.config import settings


def login(client: TestClient, email: str, password: str):
    return client.post("/auth/login", data={"username": email, "password": password})


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_login_ok(client, manager_account):
    response = login(client, manager_account["email"], manager_account["password"])
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 20


def test_login_wrong_password_returns_401(client, manager_account):
    response = login(client, manager_account["email"], "totally-wrong")
    assert response.status_code == 401


def test_login_unknown_email_returns_401(client, admin_account):
    # Le mot de passe est le bon mais l'email n'existe pas : même message
    # et même statut qu'un mauvais mot de passe.
    response = login(client, "ghost@demo.cm", admin_account["password"])
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_me_without_token_returns_401(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_with_garbage_token_returns_401(client):
    response = client.get("/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert response.status_code == 401


def test_me_with_manager_token_returns_profile(client, manager_account):
    token = login(
        client,
        manager_account["email"],
        manager_account["password"],
    ).json()["access_token"]
    response = client.get("/auth/me", headers=auth_headers(token))
    assert response.status_code == 200
    profile = response.json()
    assert profile["id_user"] == manager_account["id_user"]
    assert profile["email"] == manager_account["email"]
    assert profile["role"] == "manager"


def test_login_cookie_is_http_only_and_not_secure_by_default(client, manager_account):
    response = login(client, manager_account["email"], manager_account["password"])

    cookie_attributes = response.headers["set-cookie"].lower()
    assert "httponly" in cookie_attributes
    assert "secure" not in cookie_attributes


def test_login_cookie_is_secure_when_enabled(client, manager_account, monkeypatch):
    monkeypatch.setattr(settings, "cookie_secure", True)

    response = login(client, manager_account["email"], manager_account["password"])

    assert "secure" in response.headers["set-cookie"].lower()


def test_login_cookie_lifetime_matches_token_lifetime(client, manager_account):
    response = login(client, manager_account["email"], manager_account["password"])

    expected_max_age = settings.access_token_expire_minutes * 60
    assert f"max-age={expected_max_age}" in response.headers["set-cookie"].lower()
