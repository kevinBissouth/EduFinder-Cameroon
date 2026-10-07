"""Historique des visites et des demandes de contact, jour par jour.

Les lignes n'existent que pour les jours où un événement a été compté : la
série renvoyée comble les jours sans événement par des zéros, pour que le
graphique ait un point par jour.
"""
from datetime import date, timedelta

from django.db.models import Min, QuerySet, Sum
from django.utils import timezone

from edufinder.models import Establishment, EstablishmentDailyActivity

ALLOWED_PERIODS_IN_DAYS = (30, 90)
DEFAULT_PERIOD_IN_DAYS = 30


def build_establishment_activity(establishment: Establishment, period_in_days: int) -> dict:
    return _build_activity(
        EstablishmentDailyActivity.objects.filter(establishment=establishment),
        period_in_days,
    )


def build_platform_activity(period_in_days: int) -> dict:
    return _build_activity(EstablishmentDailyActivity.objects.all(), period_in_days)


def _build_activity(daily_activities: QuerySet, period_in_days: int) -> dict:
    last_day = timezone.localdate()
    first_day = last_day - timedelta(days=period_in_days - 1)
    totals_by_day = _sum_by_day(daily_activities.filter(day__range=(first_day, last_day)))
    return {
        # Premier jour jamais enregistré, hors période comprise : sans lui,
        # l'interface ne peut pas distinguer « aucune visite » de « collecte
        # pas encore commencée ».
        "collected_since": daily_activities.aggregate(first_day=Min("day"))["first_day"],
        "days": [
            _build_day(first_day + timedelta(days=offset), totals_by_day)
            for offset in range(period_in_days)
        ],
    }


def _sum_by_day(daily_activities: QuerySet) -> dict[date, dict]:
    totals = daily_activities.values("day").annotate(
        views=Sum("views_count"), inquiries=Sum("inquiries_count")
    )
    return {total["day"]: total for total in totals}


def _build_day(day: date, totals_by_day: dict[date, dict]) -> dict:
    totals = totals_by_day.get(day, {})
    return {
        "day": day,
        "views": totals.get("views", 0),
        "inquiries": totals.get("inquiries", 0),
    }
