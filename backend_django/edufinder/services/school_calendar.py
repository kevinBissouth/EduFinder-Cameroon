"""Calendrier scolaire : quelles années scolaires acceptent encore des frais.

Un responsable publie les frais de l'année en cours et prépare ceux de la
suivante. Une année passée est de l'historique : elle se lit, elle ne se
complète plus.
"""
from datetime import date

from django.utils import timezone

# Au Cameroun l'année scolaire va de septembre à août.
SCHOOL_YEAR_START_MONTH = 9
OPEN_SCHOOL_YEAR_COUNT = 2


# Lecture isolée de la date du jour : les tests la remplacent pour ne pas
# dépendre du jour où ils tournent.
def read_today() -> date:
    return timezone.localdate()


def find_school_year(day: date) -> str:
    start_year = day.year if day.month >= SCHOOL_YEAR_START_MONTH else day.year - 1
    return format_school_year(start_year)


def format_school_year(start_year: int) -> str:
    return f"{start_year}-{start_year + 1}"


# L'année en cours puis la suivante, dans cet ordre.
def list_open_school_years() -> list[str]:
    current_start_year = int(find_school_year(read_today()).split("-")[0])
    return [
        format_school_year(current_start_year + offset)
        for offset in range(OPEN_SCHOOL_YEAR_COUNT)
    ]
