"""Tests des règles pures de transition du workflow de publication."""
import pytest

from app.models import (
    DecisionStatus,
    EstablishmentStatus,
    SubmissionStatus,
)
from app.services.workflow import can_transition, ensure_transition


@pytest.mark.parametrize(
    "current_status,new_status",
    [
        # Le chemin central du programme : attente -> publié.
        (EstablishmentStatus.pending, EstablishmentStatus.published),
        (EstablishmentStatus.pending, EstablishmentStatus.rejected),
        (EstablishmentStatus.published, EstablishmentStatus.suspended),
        (EstablishmentStatus.suspended, EstablishmentStatus.published),
        (SubmissionStatus.pending, SubmissionStatus.approved),
        (SubmissionStatus.pending, SubmissionStatus.rejected),
    ],
)
def test_allowed_transitions(current_status, new_status):
    assert can_transition(current_status, new_status) is True
    ensure_transition(current_status, new_status)  # ne doit pas lever


@pytest.mark.parametrize(
    "current_status,new_status",
    [
        # Jamais de publication directe depuis un rejet ou une suspension
        # sans repasser par l'administrateur.
        (EstablishmentStatus.rejected, EstablishmentStatus.published),
        (EstablishmentStatus.pending, EstablishmentStatus.pending),
        (SubmissionStatus.approved, SubmissionStatus.pending),
        (SubmissionStatus.rejected, SubmissionStatus.approved),
    ],
)
def test_forbidden_transitions(current_status, new_status):
    assert can_transition(current_status, new_status) is False
    with pytest.raises(ValueError):
        ensure_transition(current_status, new_status)
