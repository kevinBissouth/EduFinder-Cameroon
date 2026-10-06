"""Dédoublonnage en mémoire des événements publics de suivi (vues, demandes).

Les routes de suivi sont publiques et écrivent en base : sans garde-fou, une
simple boucle de requêtes gonflerait les compteurs d'un établissement. Je ne
compte donc qu'un événement par (client, établissement, type) et par fenêtre
de temps.

Limites assumées : le registre vit dans la mémoire du processus, il est donc
vidé à chaque redémarrage et n'est pas partagé entre plusieurs workers.
"""
import threading
import time
from collections.abc import Callable

DEDUPLICATION_WINDOW_SECONDS = 30 * 60
MAX_TRACKED_EVENTS = 10_000

VIEW_EVENT = "view"
INQUIRY_EVENT = "inquiry"

EventKey = tuple[str, str, str]


class TrackingEventDeduplicator:
    def __init__(
        self,
        window_seconds: float = DEDUPLICATION_WINDOW_SECONDS,
        max_tracked_events: int = MAX_TRACKED_EVENTS,
        clock: Callable[[], float] = time.monotonic,
    ):
        self._window_seconds = window_seconds
        self._max_tracked_events = max_tracked_events
        self._clock = clock
        self._expiry_by_event: dict[EventKey, float] = {}
        # Les routes synchrones tournent dans un pool de threads : sans verrou,
        # deux requêtes simultanées du même client seraient comptées deux fois.
        self._lock = threading.Lock()

    def should_count(
        self, client_address: str, establishment_uuid: str, event_name: str
    ) -> bool:
        """Indique si l'événement est nouveau, et le mémorise si c'est le cas."""
        event_key = (client_address, establishment_uuid, event_name)
        now = self._clock()
        with self._lock:
            expiry = self._expiry_by_event.get(event_key)
            if expiry is not None and expiry > now:
                return False
            if not self._has_room(now):
                return False
            self._expiry_by_event[event_key] = now + self._window_seconds
            return True

    def _has_room(self, now: float) -> bool:
        if len(self._expiry_by_event) < self._max_tracked_events:
            return True
        self._expiry_by_event = {
            event_key: expiry
            for event_key, expiry in self._expiry_by_event.items()
            if expiry > now
        }
        # Registre encore plein après la purge = afflux anormal de clients
        # distincts : je préfère ne plus compter plutôt que laisser la mémoire
        # grossir sans borne ou les compteurs se faire gonfler.
        return len(self._expiry_by_event) < self._max_tracked_events


_tracking_deduplicator = TrackingEventDeduplicator()


def get_tracking_deduplicator() -> TrackingEventDeduplicator:
    return _tracking_deduplicator
