import pytest

from edufinder.models import Establishment

UNTRUSTED_ORIGIN = "https://evil.example"


def post_track_view(client, establishment, **request_headers):
    return client.post(
        f"/institutions/{establishment.uuid}/track-view", **request_headers
    )


@pytest.mark.django_db
def test_mutating_request_from_untrusted_origin_is_rejected(client, establishment):
    response = post_track_view(client, establishment, HTTP_ORIGIN=UNTRUSTED_ORIGIN)

    assert response.status_code == 403
    assert Establishment.objects.get(pk=establishment.pk).views_count == 0


@pytest.mark.django_db
def test_mutating_request_from_allowed_frontend_origin_succeeds(
    client, establishment, settings
):
    response = post_track_view(
        client, establishment, HTTP_ORIGIN=settings.CORS_ALLOWED_ORIGINS[0]
    )

    assert response.status_code == 204


@pytest.mark.django_db
def test_mutating_request_from_api_own_origin_succeeds(client, establishment):
    response = post_track_view(client, establishment, HTTP_ORIGIN="http://testserver")

    assert response.status_code == 204


@pytest.mark.django_db
def test_mutating_request_without_origin_succeeds(client, establishment):
    response = post_track_view(client, establishment)

    assert response.status_code == 204


@pytest.mark.django_db
def test_own_host_with_another_scheme_is_rejected(client, establishment):
    response = post_track_view(client, establishment, HTTP_ORIGIN="https://testserver")

    assert response.status_code == 403


@pytest.mark.django_db
def test_safe_request_from_untrusted_origin_is_not_blocked(client):
    response = client.get("/institutions", HTTP_ORIGIN=UNTRUSTED_ORIGIN)

    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" not in response
