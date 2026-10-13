"""Le calendrier scolaire : l'année d'un jour donné et les années ouvertes."""
from datetime import date

import pytest

from edufinder.services import school_calendar
from edufinder.services.school_calendar import find_school_year, list_open_school_years


@pytest.mark.parametrize(
    ("day", "expected_school_year"),
    [
        (date(2026, 9, 1), "2026-2027"),
        (date(2026, 12, 31), "2026-2027"),
        (date(2027, 1, 1), "2026-2027"),
        (date(2027, 8, 31), "2026-2027"),
        (date(2026, 8, 31), "2025-2026"),
    ],
)
def test_the_school_year_runs_from_september_to_august(day, expected_school_year):
    assert find_school_year(day) == expected_school_year


def test_the_open_years_are_the_current_one_and_the_next(monkeypatch):
    monkeypatch.setattr(school_calendar, "read_today", lambda: date(2026, 10, 13))

    assert list_open_school_years() == ["2026-2027", "2027-2028"]
