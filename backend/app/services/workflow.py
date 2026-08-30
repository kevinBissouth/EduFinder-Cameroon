
from app.models import DecisionStatus, EstablishmentStatus, SubmissionStatus

ALLOWED_ESTABLISHMENT_TRANSITIONS: dict[EstablishmentStatus, set[EstablishmentStatus]] = {
    EstablishmentStatus.pending: {
        EstablishmentStatus.published,
        EstablishmentStatus.rejected,
    },
    # Approbation d'une modification sur une fiche déjà publiée : elle reste
    # publiée (pas de changement d'état, la règle d'or tient toujours).
    EstablishmentStatus.published: {
        EstablishmentStatus.suspended,
        EstablishmentStatus.published,
    },
    EstablishmentStatus.suspended: {EstablishmentStatus.published},
}

ALLOWED_SUBMISSION_TRANSITIONS: dict[SubmissionStatus, set[SubmissionStatus]] = {
    SubmissionStatus.pending: {
        SubmissionStatus.approved,
        SubmissionStatus.rejected,
    },
}


def can_transition(current_status, new_status) -> bool:
    
    if isinstance(new_status, DecisionStatus):
        allowed_statuses = ALLOWED_SUBMISSION_TRANSITIONS.get(current_status, set())
    else:
        allowed_statuses = (
            ALLOWED_SUBMISSION_TRANSITIONS.get(current_status, set())
            | ALLOWED_ESTABLISHMENT_TRANSITIONS.get(current_status, set())
        )
    return new_status in allowed_statuses


def ensure_transition(current_status, new_status) -> None:

    if not can_transition(current_status, new_status):
        raise ValueError(
            f"Transition not allowed: {current_status.value} -> {new_status.value}"
        )
