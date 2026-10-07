import time

import pytest

from edufinder.models import Establishment
from edufinder.services.tracking import DEDUPLICATION_WINDOW_SECONDS
from tests.constants import HIDDEN_STATUSES

CLIENT_ADDRESS = "203.0.113.10"
OTHER_CLIENT_ADDRESS = "203.0.113.11"
TRACKING_ROUTES = ["track-view", "track-inquiry"]


def post_event(client, establishment, route: str, client_address: str = CLIENT_ADDRESS):
    return client.post(
        f"/institutions/{establishment.uuid}/{route}", REMOTE_ADDR=client_address
    )


def read_counters(establishment) -> tuple[int, int]:
    stored_establishment = Establishment.objects.get(pk=establishment.pk)
    return stored_establishment.views_count, stored_establishment.inquiries_count


@pytest.mark.django_db
def test_view_and_inquiry_are_counted_separately(client, establishment):
    post_event(client, establishment, "track-view")
    assert read_counters(establishment) == (1, 0)

    post_event(client, establishment, "track-inquiry")
    assert read_counters(establishment) == (1, 1)


@pytest.mark.django_db
@pytest.mark.parametrize("route", TRACKING_ROUTES)
def test_tracking_answers_204_without_exposing_the_counter(client, establishment, route):
    response = post_event(client, establishment, route)

    assert response.status_code == 204
    assert response.content == b""


@pytest.mark.django_db
def test_repeated_client_is_counted_only_once(client, establishment):
    first_response = post_event(client, establishment, "track-view")
    repeated_response = post_event(client, establishment, "track-view")

    assert read_counters(establishment) == (1, 0)
    # Même réponse que l'événement soit compté ou ignoré.
    assert repeated_response.status_code == first_response.status_code


@pytest.mark.django_db
def test_distinct_clients_are_each_counted(client, establishment):
    post_event(client, establishment, "track-view", CLIENT_ADDRESS)
    post_event(client, establishment, "track-view", OTHER_CLIENT_ADDRESS)

    assert read_counters(establishment) == (2, 0)


@pytest.mark.django_db
def test_same_client_is_counted_on_each_establishment(client, create_establishment):
    first_establishment = create_establishment(name="First school")
    second_establishment = create_establishment(name="Second school")

    post_event(client, first_establishment, "track-view")
    post_event(client, second_establishment, "track-view")

    assert read_counters(first_establishment) == (1, 0)
    assert read_counters(second_establishment) == (1, 0)


@pytest.mark.django_db
def test_forged_forwarded_header_does_not_bypass_deduplication(client, establishment):
    for forged_address in ("198.51.100.1", "198.51.100.2", "198.51.100.3"):
        client.post(
            f"/institutions/{establishment.uuid}/track-view",
            REMOTE_ADDR=CLIENT_ADDRESS,
            HTTP_X_FORWARDED_FOR=forged_address,
        )

    assert read_counters(establishment) == (1, 0)


PROXY_ADDRESS = "10.0.0.1"


@pytest.mark.django_db
def test_behind_a_trusted_proxy_each_visitor_is_counted(client, establishment, settings):
    settings.TRUSTED_PROXY_COUNT = 1

    for visitor_address in (CLIENT_ADDRESS, OTHER_CLIENT_ADDRESS):
        client.post(
            f"/institutions/{establishment.uuid}/track-view",
            REMOTE_ADDR=PROXY_ADDRESS,
            HTTP_X_FORWARDED_FOR=visitor_address,
        )

    assert read_counters(establishment) == (2, 0)


@pytest.mark.django_db
def test_behind_a_trusted_proxy_a_forged_prefix_does_not_bypass_deduplication(
    client, establishment, settings
):
    settings.TRUSTED_PROXY_COUNT = 1

    for forged_address in ("198.51.100.1", "198.51.100.2", "198.51.100.3"):
        # Le client écrit ce qu'il veut en tête ; le serveur de confiance
        # ajoute à la fin l'adresse qu'il a réellement vue.
        client.post(
            f"/institutions/{establishment.uuid}/track-view",
            REMOTE_ADDR=PROXY_ADDRESS,
            HTTP_X_FORWARDED_FOR=f"{forged_address}, {CLIENT_ADDRESS}",
        )

    assert read_counters(establishment) == (1, 0)


@pytest.mark.django_db
def test_behind_a_trusted_proxy_a_missing_header_falls_back_to_the_connection(
    client, establishment, settings
):
    settings.TRUSTED_PROXY_COUNT = 1

    post_event(client, establishment, "track-view", CLIENT_ADDRESS)
    post_event(client, establishment, "track-view", OTHER_CLIENT_ADDRESS)

    assert read_counters(establishment) == (2, 0)


@pytest.mark.django_db
def test_client_is_counted_again_once_the_window_has_elapsed(
    client, establishment, monkeypatch
):
    post_event(client, establishment, "track-view")
    time_after_window = time.time() + DEDUPLICATION_WINDOW_SECONDS + 1
    monkeypatch.setattr(time, "time", lambda: time_after_window)

    post_event(client, establishment, "track-view")

    assert read_counters(establishment) == (2, 0)


@pytest.mark.django_db
def test_counter_is_incremented_from_its_stored_value(client, create_establishment):
    establishment = create_establishment(views_count=41)

    post_event(client, establishment, "track-view")

    assert read_counters(establishment) == (42, 0)


@pytest.mark.django_db
@pytest.mark.parametrize("route", TRACKING_ROUTES)
@pytest.mark.parametrize("hidden_status", HIDDEN_STATUSES)
def test_tracking_rejects_unpublished_institutions(
    client, create_establishment, route, hidden_status
):
    hidden_establishment = create_establishment(status=hidden_status)

    response = post_event(client, hidden_establishment, route)

    assert response.status_code == 404
    assert response.json() == {"detail": "Institution not found"}
    assert read_counters(hidden_establishment) == (0, 0)


@pytest.mark.django_db
@pytest.mark.parametrize("route", TRACKING_ROUTES)
def test_tracking_rejects_unknown_institutions(client, route):
    response = client.post(f"/institutions/unknown-uuid/{route}")

    assert response.status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize("route", TRACKING_ROUTES)
def test_tracking_routes_only_accept_post(client, establishment, route):
    response = client.get(f"/institutions/{establishment.uuid}/{route}")

    assert response.status_code == 405
    assert read_counters(establishment) == (0, 0)
