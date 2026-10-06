from app.services.tracking import (
    INQUIRY_EVENT,
    VIEW_EVENT,
    TrackingEventDeduplicator,
)

WINDOW_SECONDS = 60
CLIENT_ADDRESS = "203.0.113.10"
OTHER_CLIENT_ADDRESS = "203.0.113.11"
ESTABLISHMENT_UUID = "establishment-a"
OTHER_ESTABLISHMENT_UUID = "establishment-b"


class FakeClock:
    def __init__(self):
        self.current_time = 0.0

    def __call__(self) -> float:
        return self.current_time

    def advance(self, seconds: float) -> None:
        self.current_time += seconds


def build_deduplicator(clock: FakeClock, max_tracked_events: int = 100):
    return TrackingEventDeduplicator(
        window_seconds=WINDOW_SECONDS,
        max_tracked_events=max_tracked_events,
        clock=clock,
    )


def test_first_event_is_counted_and_repeat_is_ignored():
    deduplicator = build_deduplicator(FakeClock())

    assert deduplicator.should_count(CLIENT_ADDRESS, ESTABLISHMENT_UUID, VIEW_EVENT)
    assert not deduplicator.should_count(CLIENT_ADDRESS, ESTABLISHMENT_UUID, VIEW_EVENT)


def test_event_is_counted_again_once_window_has_elapsed():
    clock = FakeClock()
    deduplicator = build_deduplicator(clock)
    deduplicator.should_count(CLIENT_ADDRESS, ESTABLISHMENT_UUID, VIEW_EVENT)

    clock.advance(WINDOW_SECONDS - 1)
    assert not deduplicator.should_count(CLIENT_ADDRESS, ESTABLISHMENT_UUID, VIEW_EVENT)

    clock.advance(1)
    assert deduplicator.should_count(CLIENT_ADDRESS, ESTABLISHMENT_UUID, VIEW_EVENT)


def test_client_establishment_and_event_are_tracked_independently():
    deduplicator = build_deduplicator(FakeClock())
    deduplicator.should_count(CLIENT_ADDRESS, ESTABLISHMENT_UUID, VIEW_EVENT)

    assert deduplicator.should_count(OTHER_CLIENT_ADDRESS, ESTABLISHMENT_UUID, VIEW_EVENT)
    assert deduplicator.should_count(CLIENT_ADDRESS, OTHER_ESTABLISHMENT_UUID, VIEW_EVENT)
    assert deduplicator.should_count(CLIENT_ADDRESS, ESTABLISHMENT_UUID, INQUIRY_EVENT)


def test_full_registry_stops_counting_until_entries_expire():
    clock = FakeClock()
    deduplicator = build_deduplicator(clock, max_tracked_events=2)
    deduplicator.should_count("203.0.113.1", ESTABLISHMENT_UUID, VIEW_EVENT)
    deduplicator.should_count("203.0.113.2", ESTABLISHMENT_UUID, VIEW_EVENT)

    assert not deduplicator.should_count("203.0.113.3", ESTABLISHMENT_UUID, VIEW_EVENT)

    clock.advance(WINDOW_SECONDS)
    assert deduplicator.should_count("203.0.113.3", ESTABLISHMENT_UUID, VIEW_EVENT)


def test_track_view_counts_a_repeated_client_only_once(client, seed_ids):
    track_view_url = f"/institutions/{seed_ids['published_alpha_uuid']}/track-view"

    first_response = client.post(track_view_url)
    repeated_response = client.post(track_view_url)

    assert first_response.status_code == 200
    assert first_response.json() == {"views_count": 1}
    assert repeated_response.status_code == 200
    assert repeated_response.json() == {"views_count": 1}


def test_track_inquiry_counts_a_repeated_client_only_once(client, seed_ids):
    track_inquiry_url = f"/institutions/{seed_ids['published_alpha_uuid']}/track-inquiry"

    client.post(track_inquiry_url)
    repeated_response = client.post(track_inquiry_url)

    assert repeated_response.json() == {"inquiries_count": 1}


def test_view_and_inquiry_are_counted_separately(client, seed_ids):
    institution_url = f"/institutions/{seed_ids['published_alpha_uuid']}"

    view_response = client.post(f"{institution_url}/track-view")
    inquiry_response = client.post(f"{institution_url}/track-inquiry")

    assert view_response.json() == {"views_count": 1}
    assert inquiry_response.json() == {"inquiries_count": 1}


def test_tracking_rejects_unpublished_and_unknown_institutions(client, seed_ids):
    for hidden_uuid in (seed_ids["pending_uuid"], seed_ids["suspended_uuid"], "unknown-uuid"):
        assert client.post(f"/institutions/{hidden_uuid}/track-view").status_code == 404
        assert client.post(f"/institutions/{hidden_uuid}/track-inquiry").status_code == 404
