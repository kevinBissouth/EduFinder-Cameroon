"""Règles de cohérence des données saisies pour un établissement."""
from django.db.models import Q, QuerySet

EXAM_ALLOWED_TYPE_LABELS = {
    "CEP": {"Primary"},
    "FSLC": {"Primary"},
    "BEPC": {"Secondary general", "Secondary technical"},
    "GCE O-Level": {"Secondary general", "Secondary technical"},
    "Probatoire": {"Secondary general", "Secondary technical"},
    "Baccalaureate": {"Secondary general", "Secondary technical"},
    "CAP": {"Secondary technical"},
    "BTS": {"Higher institute"},
    "GCE A-Level": {"Secondary general", "Secondary technical"},
}

# Types qui présentent au moins un examen officiel : eux seuls ont des
# résultats à publier. Une maternelle ou une université n'en a pas.
TYPES_WITH_OFFICIAL_EXAMS = frozenset().union(*EXAM_ALLOWED_TYPE_LABELS.values())


# Garde-fou : un résultat dont l'examen contredit le type de l'établissement
# (un CEP dans un lycée) ne doit jamais sortir de l'API publique. J'exprime la
# règle en SQL pour qu'elle s'applique partout de la même façon : fiche,
# meilleur taux du résumé et filtre de recherche par examen. Un examen absent
# de la cartographie relève d'une revue humaine, il n'est donc pas exclu.
def exclude_results_contradicting_establishment_type(exam_results: QuerySet) -> QuerySet:
    contradiction = Q()
    for exam_label, allowed_type_labels in EXAM_ALLOWED_TYPE_LABELS.items():
        contradiction |= Q(exam__label=exam_label) & ~Q(
            establishment__type__label__in=sorted(allowed_type_labels)
        )
    return exam_results.exclude(contradiction)


FRANCOPHONE_EXAMS = {"CEP", "BEPC", "Probatoire", "Baccalaureate", "CAP", "BTS"}
ANGLOPHONE_EXAMS = {"FSLC", "GCE O-Level", "GCE A-Level"}
FRANCOPHONE_FAMILY = "francophone"
ANGLOPHONE_FAMILY = "anglophone"

ALLOWED_EXAM_FAMILIES_BY_SECTION = {
    "Francophone": {FRANCOPHONE_FAMILY},
    "Anglophone": {ANGLOPHONE_FAMILY},
    "Bilingual": {FRANCOPHONE_FAMILY, ANGLOPHONE_FAMILY},
}


def get_exam_type_violation(exam_label: str, type_label: str) -> str | None:
    """Raison si ce couple examen/type est interdit, None s'il est cohérent."""
    allowed_type_labels = EXAM_ALLOWED_TYPE_LABELS.get(exam_label)
    if allowed_type_labels is None or type_label in allowed_type_labels:
        return None
    return (
        f"'{exam_label}' is reserved for the types: "
        f"{', '.join(sorted(allowed_type_labels))} (received: '{type_label}')"
    )


def get_exam_section_violation(exam_label: str, section_label: str) -> str | None:
    """Raison si la section linguistique ne peut pas présenter cet examen."""
    allowed_families = ALLOWED_EXAM_FAMILIES_BY_SECTION.get(section_label)
    exam_family = _get_exam_language_family(exam_label)
    # Section ou examen hors cartographie : revue humaine, pas de refus automatique.
    if allowed_families is None or exam_family is None:
        return None
    if exam_family in allowed_families:
        return None
    return f"'{exam_label}' is a {exam_family} exam (received section: '{section_label}')"


def _get_exam_language_family(exam_label: str) -> str | None:
    if exam_label in FRANCOPHONE_EXAMS:
        return FRANCOPHONE_FAMILY
    if exam_label in ANGLOPHONE_EXAMS:
        return ANGLOPHONE_FAMILY
    return None
