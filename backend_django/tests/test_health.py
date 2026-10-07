import pytest


@pytest.mark.django_db
def test_health_reports_database_connection(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


@pytest.mark.django_db
def test_route_with_trailing_slash_is_not_redirected(client):
    response = client.get("/health/")

    assert response.status_code == 404


@pytest.mark.django_db
def test_cors_headers_are_sent_to_allowed_origin_only(client, settings):
    allowed_origin = settings.CORS_ALLOWED_ORIGINS[0]

    allowed_response = client.get("/health", HTTP_ORIGIN=allowed_origin)
    untrusted_response = client.get("/health", HTTP_ORIGIN="https://evil.example")

    assert allowed_response["Access-Control-Allow-Origin"] == allowed_origin
    assert allowed_response["Access-Control-Allow-Credentials"] == "true"
    assert "Access-Control-Allow-Origin" not in untrusted_response
