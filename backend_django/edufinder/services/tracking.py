"""Suivi public des fiches : vues et demandes d'admission.

Les routes de suivi sont publiques et écrivent en base : sans garde-fou, une
simple boucle de requêtes gonflerait les compteurs d'un établissement. Je ne
compte donc qu'un événement par (client, établissement, type) et par fenêtre
de temps.

Limite assumée : avec le cache par défaut (mémoire du processus), le registre
est vidé à chaque redémarrage et n'est pas partagé entre plusieurs workers.
Brancher un cache partagé dans les réglages lève cette limite sans toucher à
ce module.
"""
from enum import Enum

from django.core.cache import cache
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from edufinder.models import Establishment, EstablishmentDailyActivity

DEDUPLICATION_WINDOW_SECONDS = 30 * 60


class TrackedEvent(Enum):
    VIEW = "view"
    INQUIRY = "inquiry"


_COUNTER_FIELD_BY_EVENT = {
    TrackedEvent.VIEW: "views_count",
    TrackedEvent.INQUIRY: "inquiries_count",
}


def count_event_once(
    establishment: Establishment, client_address: str, tracked_event: TrackedEvent
) -> None:
    # cache.add n'écrit que si la clé est absente, de façon atomique : deux
    # requêtes simultanées du même client ne peuvent pas passer toutes les deux.
    is_new_event = cache.add(
        _build_event_key(establishment, client_address, tracked_event),
        True,
        timeout=DEDUPLICATION_WINDOW_SECONDS,
    )
    if not is_new_event:
        return
    _increment_counters(establishment, _COUNTER_FIELD_BY_EVENT[tracked_event])


# Le total et la ligne du jour avancent ensemble ou pas du tout : la courbe
# du responsable ne doit jamais s'écarter du total affiché à côté.
@transaction.atomic
def _increment_counters(establishment: Establishment, counter_field: str) -> None:
    # L'incrément se fait en base (UPDATE ... SET compteur = compteur + 1) :
    # lire puis réécrire la valeur en Python perdrait des événements quand deux
    # clients distincts arrivent en même temps.
    increment = {counter_field: F(counter_field) + 1}
    Establishment.objects.filter(pk=establishment.pk).update(**increment)
    # Le jour est celui du fuseau du serveur (UTC), le même pour tous.
    daily_activity, _ = EstablishmentDailyActivity.objects.get_or_create(
        establishment=establishment, day=timezone.localdate()
    )
    EstablishmentDailyActivity.objects.filter(pk=daily_activity.pk).update(**increment)


# La clé utilise l'UUID relu en base, jamais celui de l'URL : aucun texte
# arbitraire venu du client n'entre dans une clé de cache.
def _build_event_key(
    establishment: Establishment, client_address: str, tracked_event: TrackedEvent
) -> str:
    return f"tracking:{tracked_event.value}:{establishment.uuid}:{client_address}"
