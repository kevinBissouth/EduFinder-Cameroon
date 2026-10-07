from urllib.parse import urlencode

import bcrypt
import pytest
from jose import jwt

from edufinder.models import User
from edufinder.services import security
from edufinder.services.security import ALGORITHM, create_access_token

MANAGER_PASSWORD = "correct horse battery staple"
# Coût bcrypt minimal : les tests n'ont pas à payer le coût de production.
FAST_BCRYPT_ROUNDS = 4
FORM_CONTENT_TYPE = "application/x-www-form-urlencoded"
INCORRECT_CREDENTIALS_BODY = {"detail": "Incorrect email or password"}
INVALID_CREDENTIALS_BODY = {"detail": "Invalid or missing credentials"}
UNTRUSTED_ORIGIN = "https://evil.example"
LOGIN_ATTEMPTS_PER_MINUTE = 10


@pytest.fixture(name="manager_account")
def manager_account_fixture(manager) -> User:
    manager.password_hash = bcrypt.hashpw(
        MANAGER_PASSWORD.encode(), bcrypt.gensalt(rounds=FAST_BCRYPT_ROUNDS)
    ).decode()
    manager.save()
    return manager


def post_login(client, email: str, password: str, **request_headers):
    return client.post(
        "/auth/login",
        data=urlencode({"username": email, "password": password}),
        content_type=FORM_CONTENT_TYPE,
        **request_headers,
    )


def log_in(client, account: User) -> None:
    response = post_login(client, account.email, MANAGER_PASSWORD)
    assert response.status_code == 200, response.content


# --- POST /auth/login ---------------------------------------------------------


@pytest.mark.django_db
def test_login_sets_an_http_only_cookie_and_keeps_the_token_out_of_the_body(
    client, manager_account, settings
):
    response = post_login(client, manager_account.email, MANAGER_PASSWORD)

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    token_cookie = response.cookies["token"]
    assert token_cookie.value not in response.content.decode()
    assert token_cookie["httponly"] is True
    assert token_cookie["samesite"] == "Lax"
    assert token_cookie["path"] == "/"
    assert not token_cookie["secure"]
    assert token_cookie["max-age"] == settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


@pytest.mark.django_db
def test_login_cookie_is_secure_when_enabled(client, manager_account, settings):
    settings.COOKIE_SECURE = True

    response = post_login(client, manager_account.email, MANAGER_PASSWORD)

    assert response.cookies["token"]["secure"] is True


@pytest.mark.django_db
def test_login_token_carries_the_claims_of_the_previous_backend(
    client, manager_account, settings
):
    response = post_login(client, manager_account.email, MANAGER_PASSWORD)

    claims = jwt.decode(
        response.cookies["token"].value, settings.SECRET_KEY, algorithms=[ALGORITHM]
    )
    assert claims["sub"] == str(manager_account.id_user)
    assert claims["role"] == "manager"
    assert "exp" in claims


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("email", "password"),
    [
        ("manager@example.com", "wrong password"),
        ("unknown@example.com", MANAGER_PASSWORD),
        ("manager@example.com", "a" * 100),
        ("unknown@example.com", "a" * 100),
        ("manager@example.com", " " + MANAGER_PASSWORD),
    ],
)
def test_login_failures_all_receive_the_same_401(client, manager_account, email, password):
    response = post_login(client, email, password)

    assert response.status_code == 401
    assert response.json() == INCORRECT_CREDENTIALS_BODY
    assert "token" not in response.cookies


@pytest.mark.django_db
def test_login_checks_a_hash_even_for_an_unknown_email(client, monkeypatch):
    # Sans ce calcul, un e-mail inconnu répondrait plus vite qu'un mauvais mot
    # de passe et révélerait quels e-mails ont un compte.
    verified_hashes = []
    real_verify_password = security.verify_password

    def spy_on_verify_password(plain_password: str, password_hash: str) -> bool:
        verified_hashes.append(password_hash)
        return real_verify_password(plain_password, password_hash)

    monkeypatch.setattr(security, "verify_password", spy_on_verify_password)

    post_login(client, "unknown@example.com", "any password")

    assert len(verified_hashes) == 1


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("form_fields", "missing_field"),
    [({"username": "manager@example.com"}, "password"), ({"password": "x"}, "username")],
)
def test_login_without_a_required_field_is_rejected_with_422(
    client, form_fields, missing_field
):
    response = client.post(
        "/auth/login", data=urlencode(form_fields), content_type=FORM_CONTENT_TYPE
    )

    assert response.status_code == 422
    assert missing_field in response.json()


@pytest.mark.django_db
def test_login_from_untrusted_origin_is_rejected(client, manager_account):
    response = post_login(
        client, manager_account.email, MANAGER_PASSWORD, HTTP_ORIGIN=UNTRUSTED_ORIGIN
    )

    assert response.status_code == 403
    assert "token" not in response.cookies


@pytest.mark.django_db
def test_login_attempts_are_limited_per_client_address(client, manager_account):
    for _ in range(LOGIN_ATTEMPTS_PER_MINUTE):
        assert post_login(client, manager_account.email, "wrong").status_code == 401

    blocked_response = post_login(client, manager_account.email, MANAGER_PASSWORD)

    assert blocked_response.status_code == 429
    assert "token" not in blocked_response.cookies


@pytest.mark.django_db
def test_forged_forwarded_header_does_not_bypass_the_login_limit(client, manager_account):
    for attempt_index in range(LOGIN_ATTEMPTS_PER_MINUTE):
        post_login(
            client,
            manager_account.email,
            "wrong",
            HTTP_X_FORWARDED_FOR=f"198.51.100.{attempt_index}",
        )

    blocked_response = post_login(
        client, manager_account.email, "wrong", HTTP_X_FORWARDED_FOR="198.51.100.200"
    )

    assert blocked_response.status_code == 429


@pytest.mark.django_db
def test_login_limit_is_tracked_per_client_address(client, manager_account):
    for _ in range(LOGIN_ATTEMPTS_PER_MINUTE):
        post_login(client, manager_account.email, "wrong", REMOTE_ADDR="203.0.113.10")

    other_client_response = post_login(
        client, manager_account.email, MANAGER_PASSWORD, REMOTE_ADDR="203.0.113.11"
    )

    assert other_client_response.status_code == 200


# --- GET /auth/me -------------------------------------------------------------


@pytest.mark.django_db
def test_me_returns_the_profile_without_the_password_hash(client, manager_account):
    log_in(client, manager_account)

    response = client.get("/auth/me")

    assert response.status_code == 200
    assert response.json() == {
        "id_user": manager_account.id_user,
        "name": "Awa Manager",
        "email": "manager@example.com",
        "role": "manager",
    }


@pytest.mark.django_db
def test_me_without_cookie_returns_401(client):
    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.json() == INVALID_CREDENTIALS_BODY


@pytest.mark.django_db
def test_me_with_garbage_cookie_returns_401(client):
    client.cookies["token"] = "not-a-token"

    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.json() == INVALID_CREDENTIALS_BODY


@pytest.mark.django_db
def test_me_with_expired_token_returns_401(client, manager_account, settings):
    settings.ACCESS_TOKEN_EXPIRE_MINUTES = -1
    client.cookies["token"] = create_access_token(manager_account)

    response = client.get("/auth/me")

    assert response.status_code == 401


@pytest.mark.django_db
def test_me_with_token_signed_by_another_key_returns_401(client, manager_account):
    client.cookies["token"] = jwt.encode(
        {"sub": str(manager_account.id_user), "role": "super_admin"},
        "another-secret-key",
        algorithm=ALGORITHM,
    )

    response = client.get("/auth/me")

    assert response.status_code == 401


@pytest.mark.django_db
def test_me_with_unsigned_token_returns_401(client, manager_account):
    unsigned_token = jwt.encode(
        {"sub": str(manager_account.id_user)}, "", algorithm=ALGORITHM
    )
    header, payload, _ = unsigned_token.split(".")
    client.cookies["token"] = f"{header}.{payload}."

    response = client.get("/auth/me")

    assert response.status_code == 401


@pytest.mark.django_db
def test_me_with_token_of_a_deleted_account_returns_401(client, manager_account):
    client.cookies["token"] = create_access_token(manager_account)
    manager_account.delete()

    response = client.get("/auth/me")

    assert response.status_code == 401


@pytest.mark.django_db
def test_me_ignores_a_token_sent_in_the_authorization_header(client, manager_account):
    token = create_access_token(manager_account)

    response = client.get("/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}")

    assert response.status_code == 401


# --- POST /auth/logout --------------------------------------------------------


@pytest.mark.django_db
def test_logout_expires_the_cookie(client, manager_account):
    log_in(client, manager_account)

    response = client.post("/auth/logout")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.cookies["token"].value == ""
    assert response.cookies["token"]["max-age"] == 0
    assert client.get("/auth/me").status_code == 401


@pytest.mark.django_db
def test_logout_from_untrusted_origin_is_rejected(client):
    response = client.post("/auth/logout", HTTP_ORIGIN=UNTRUSTED_ORIGIN)

    assert response.status_code == 403


# --- Les routes publiques restent publiques -----------------------------------


@pytest.mark.django_db
def test_public_routes_ignore_an_invalid_session_cookie(client, establishment):
    client.cookies["token"] = "not-a-token"

    assert client.get("/institutions").status_code == 200
    assert client.get(f"/institutions/{establishment.uuid}").status_code == 200
    assert client.get("/stats").status_code == 200
