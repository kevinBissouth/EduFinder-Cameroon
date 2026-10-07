from datetime import timedelta

import pytest
from django.utils import timezone

from edufinder.models import (
    EstablishmentDailyActivity,
    User,
    UserEstablishment,
    UserRole,
)

CLIENT_ADDRESS = "203.0.113.10"
OTHER_CLIENT_ADDRESS = "203.0.113.11"
UNKNOWN_UUID = "00000000-0000-0000-0000-000000000000"
DEFAULT_PERIOD_IN_DAYS = 30
LONG_PERIOD_IN_DAYS = 90


@pytest.fixture(name="managed_establishment")
def managed_establishment_fixture(establishment, manager):
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    return establishment


def post_event(client, establishment, route: str, client_address: str = CLIENT_ADDRESS):
    return client.post(
        f"/institutions/{establishment.uuid}/{route}", REMOTE_ADDR=client_address
    )


def record_activity(establishment, days_ago: int, views: int = 0, inquiries: int = 0):
    return EstablishmentDailyActivity.objects.create(
        establishment=establishment,
        day=timezone.localdate() - timedelta(days=days_ago),
        views_count=views,
        inquiries_count=inquiries,
    )


def activity_url(establishment) -> str:
    return f"/my/establishments/{establishment.uuid}/activity"


# --- Collecte -----------------------------------------------------------------


@pytest.mark.django_db
def test_counted_events_feed_the_row_of_the_day(client, establishment):
    post_event(client, establishment, "track-view", CLIENT_ADDRESS)
    post_event(client, establishment, "track-view", OTHER_CLIENT_ADDRESS)
    post_event(client, establishment, "track-inquiry", CLIENT_ADDRESS)

    daily_activity = EstablishmentDailyActivity.objects.get()
    assert daily_activity.establishment == establishment
    assert daily_activity.day == timezone.localdate()
    assert (daily_activity.views_count, daily_activity.inquiries_count) == (2, 1)


@pytest.mark.django_db
def test_a_deduplicated_event_feeds_neither_the_total_nor_the_day(client, establishment):
    post_event(client, establishment, "track-view")
    post_event(client, establishment, "track-view")

    establishment.refresh_from_db()
    assert establishment.views_count == 1
    assert EstablishmentDailyActivity.objects.get().views_count == 1


@pytest.mark.django_db
def test_an_event_on_an_unpublished_establishment_records_no_day(
    client, create_establishment
):
    hidden_establishment = create_establishment(status="pending")

    response = post_event(client, hidden_establishment, "track-view")

    assert response.status_code == 404
    assert EstablishmentDailyActivity.objects.count() == 0


# --- Historique d'un établissement ---------------------------------------------


@pytest.mark.django_db
def test_activity_requires_authentication(client, establishment):
    assert client.get(activity_url(establishment)).status_code == 401
    assert client.get("/admin/activity").status_code == 401


@pytest.mark.django_db
def test_manager_cannot_read_the_activity_of_an_establishment_they_do_not_manage(
    client, log_in_as, establishment
):
    stranger = User.objects.create(
        name="Paul Other",
        email="other@example.com",
        password_hash="not-a-real-hash",
        role=UserRole.MANAGER,
    )
    record_activity(establishment, days_ago=0, views=7)
    log_in_as(stranger)

    response = client.get(activity_url(establishment))

    assert response.status_code == 403
    assert "days" not in response.json()


@pytest.mark.django_db
def test_activity_of_an_unknown_establishment_is_404(client, log_in_as, manager):
    log_in_as(manager)

    response = client.get(f"/my/establishments/{UNKNOWN_UUID}/activity")

    assert response.status_code == 404


@pytest.mark.django_db
def test_activity_has_one_point_per_day_and_fills_quiet_days_with_zeros(
    client, log_in_as, manager, managed_establishment
):
    record_activity(managed_establishment, days_ago=0, views=4, inquiries=1)
    record_activity(managed_establishment, days_ago=2, views=3)
    log_in_as(manager)

    body = client.get(activity_url(managed_establishment)).json()

    today = timezone.localdate()
    assert len(body["days"]) == DEFAULT_PERIOD_IN_DAYS
    assert body["days"][0]["day"] == str(today - timedelta(days=DEFAULT_PERIOD_IN_DAYS - 1))
    assert body["days"][-3:] == [
        {"day": str(today - timedelta(days=2)), "views": 3, "inquiries": 0},
        {"day": str(today - timedelta(days=1)), "views": 0, "inquiries": 0},
        {"day": str(today), "views": 4, "inquiries": 1},
    ]
    assert body["collected_since"] == str(today - timedelta(days=2))


@pytest.mark.django_db
def test_activity_period_can_be_extended_and_keeps_older_days_out_by_default(
    client, log_in_as, manager, managed_establishment
):
    record_activity(managed_establishment, days_ago=45, views=9)
    log_in_as(manager)

    default_body = client.get(activity_url(managed_establishment)).json()
    long_body = client.get(activity_url(managed_establishment), {"days": LONG_PERIOD_IN_DAYS}).json()

    assert sum(day["views"] for day in default_body["days"]) == 0
    assert len(long_body["days"]) == LONG_PERIOD_IN_DAYS
    assert sum(day["views"] for day in long_body["days"]) == 9
    # La collecte a commencé avant la période par défaut : l'interface peut
    # dire « aucune visite sur 30 jours » plutôt que « pas encore de données ».
    assert default_body["collected_since"] == str(
        timezone.localdate() - timedelta(days=45)
    )


@pytest.mark.django_db
def test_activity_without_any_record_says_collection_has_not_started(
    client, log_in_as, manager, managed_establishment
):
    log_in_as(manager)

    body = client.get(activity_url(managed_establishment)).json()

    assert body["collected_since"] is None
    assert all(day == {"day": day["day"], "views": 0, "inquiries": 0} for day in body["days"])


@pytest.mark.django_db
@pytest.mark.parametrize("invalid_period", ["7", "365", "abc", "-30"])
def test_unsupported_period_is_rejected(
    client, log_in_as, manager, managed_establishment, invalid_period
):
    log_in_as(manager)

    response = client.get(activity_url(managed_establishment), {"days": invalid_period})

    assert response.status_code == 422


@pytest.mark.django_db
def test_activity_does_not_include_other_establishments(
    client, log_in_as, manager, managed_establishment, create_establishment
):
    record_activity(create_establishment(name="Other school"), days_ago=0, views=50)
    record_activity(managed_establishment, days_ago=0, views=2)
    log_in_as(manager)

    body = client.get(activity_url(managed_establishment)).json()

    assert body["days"][-1]["views"] == 2


# --- Historique de la plateforme ------------------------------------------------


@pytest.mark.django_db
def test_manager_cannot_read_the_platform_activity(client, log_in_as, manager):
    log_in_as(manager)

    response = client.get("/admin/activity")

    assert response.status_code == 403


@pytest.mark.django_db
def test_platform_activity_sums_every_establishment_per_day(
    client, log_in_as, super_admin, establishment, create_establishment
):
    other_establishment = create_establishment(name="Other school")
    record_activity(establishment, days_ago=0, views=2, inquiries=1)
    record_activity(other_establishment, days_ago=0, views=5)
    record_activity(other_establishment, days_ago=1, views=3, inquiries=2)
    log_in_as(super_admin)

    body = client.get("/admin/activity").json()

    today = timezone.localdate()
    assert body["days"][-2:] == [
        {"day": str(today - timedelta(days=1)), "views": 3, "inquiries": 2},
        {"day": str(today), "views": 7, "inquiries": 1},
    ]
    assert body["collected_since"] == str(today - timedelta(days=1))


@pytest.mark.django_db
def test_platform_activity_query_count_does_not_grow_with_the_data(
    client, log_in_as, super_admin, create_establishment, django_assert_max_num_queries
):
    for school_index in range(4):
        record_activity(create_establishment(name=f"School {school_index}"), 0, views=1)
    log_in_as(super_admin)

    # 1 compte + 1 somme par jour + 1 premier jour de collecte.
    with django_assert_max_num_queries(3):
        client.get("/admin/activity")
