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

ALLOWED_LANGUAGE_FAMILIES_BY_SECTION = {
    "Francophone": {FRANCOPHONE_FAMILY},
    "Anglophone": {ANGLOPHONE_FAMILY},
    "Bilingual": {FRANCOPHONE_FAMILY, ANGLOPHONE_FAMILY},
}

# Cycles d'étude (les « stages » qui regroupent les classes) : quels types
# d'établissement les enseignent. Règle souple voulue pour la maternelle : une
# école primaire a très souvent la sienne, elle peut donc en publier les frais.
_NURSERY_TYPES = {"Nursery", "Primary"}
_PRIMARY_TYPES = {"Primary"}
_SECONDARY_TYPES = {"Secondary general", "Secondary technical"}
_HIGHER_TYPES = {"University", "Higher institute"}

STAGE_ALLOWED_TYPE_LABELS = {
    "Maternelle": _NURSERY_TYPES,
    "Nursery": _NURSERY_TYPES,
    "Primaire": _PRIMARY_TYPES,
    "Primary": _PRIMARY_TYPES,
    "Collège": _SECONDARY_TYPES,
    "Lycée": _SECONDARY_TYPES,
    "Lower secondary": _SECONDARY_TYPES,
    "Upper secondary": _SECONDARY_TYPES,
    "Higher": _HIGHER_TYPES,
}

# Le supérieur (« Higher ») est commun aux deux systèmes : il n'est dans
# aucune des deux familles, donc ouvert à toutes les sections.
FRANCOPHONE_STAGES = {"Maternelle", "Primaire", "Collège", "Lycée"}
ANGLOPHONE_STAGES = {"Nursery", "Primary", "Lower secondary", "Upper secondary"}


def get_exam_type_violation(exam_label: str, type_label: str) -> str | None:
    """Raison si ce couple examen/type est interdit, None s'il est cohérent."""
    return _get_type_violation(exam_label, type_label, EXAM_ALLOWED_TYPE_LABELS)


def get_exam_section_violation(exam_label: str, section_label: str) -> str | None:
    """Raison si la section linguistique ne peut pas présenter cet examen."""
    exam_family = _get_language_family(exam_label, FRANCOPHONE_EXAMS, ANGLOPHONE_EXAMS)
    if _is_family_allowed(exam_family, section_label):
        return None
    return f"'{exam_label}' is a {exam_family} exam (received section: '{section_label}')"


def get_stage_type_violation(stage_label: str, type_label: str) -> str | None:
    """Raison si ce type d'établissement n'enseigne pas ce cycle."""
    return _get_type_violation(stage_label, type_label, STAGE_ALLOWED_TYPE_LABELS)


def get_stage_section_violation(stage_label: str, section_label: str) -> str | None:
    """Raison si ce cycle appartient à l'autre système scolaire."""
    stage_family = _get_language_family(
        stage_label, FRANCOPHONE_STAGES, ANGLOPHONE_STAGES
    )
    if _is_family_allowed(stage_family, section_label):
        return None
    return (
        f"'{stage_label}' belongs to the {stage_family} system "
        f"(received section: '{section_label}')"
    )


# Un libellé absent de la cartographie relève d'une revue humaine : je ne le
# refuse pas automatiquement.
def _get_type_violation(
    label: str, type_label: str, allowed_type_labels_by_label: dict[str, set[str]]
) -> str | None:
    allowed_type_labels = allowed_type_labels_by_label.get(label)
    if allowed_type_labels is None or type_label in allowed_type_labels:
        return None
    return (
        f"'{label}' is reserved for the types: "
        f"{', '.join(sorted(allowed_type_labels))} (received: '{type_label}')"
    )


def _is_family_allowed(language_family: str | None, section_label: str) -> bool:
    allowed_families = ALLOWED_LANGUAGE_FAMILIES_BY_SECTION.get(section_label)
    # Section ou libellé hors cartographie : revue humaine, pas de refus automatique.
    if allowed_families is None or language_family is None:
        return True
    return language_family in allowed_families


def _get_language_family(
    label: str, francophone_labels: set[str], anglophone_labels: set[str]
) -> str | None:
    if label in francophone_labels:
        return FRANCOPHONE_FAMILY
    if label in anglophone_labels:
        return ANGLOPHONE_FAMILY
    return None


def _labels_by_family(
    francophone_labels: set[str], anglophone_labels: set[str]
) -> dict[str, str]:
    return {
        **dict.fromkeys(sorted(francophone_labels), FRANCOPHONE_FAMILY),
        **dict.fromkeys(sorted(anglophone_labels), ANGLOPHONE_FAMILY),
    }


def _sorted_lists(labels_by_key: dict[str, set[str]]) -> dict[str, list[str]]:
    return {key: sorted(labels) for key, labels in labels_by_key.items()}


# Les mêmes règles, sous une forme que le formulaire du responsable peut lire :
# il ne propose alors que les classes et les examens que le serveur acceptera.
def describe_coherence_rules() -> dict:
    return {
        "exam_allowed_types": _sorted_lists(EXAM_ALLOWED_TYPE_LABELS),
        "stage_allowed_types": _sorted_lists(STAGE_ALLOWED_TYPE_LABELS),
        "exam_families": _labels_by_family(FRANCOPHONE_EXAMS, ANGLOPHONE_EXAMS),
        "stage_families": _labels_by_family(FRANCOPHONE_STAGES, ANGLOPHONE_STAGES),
        "section_families": _sorted_lists(ALLOWED_LANGUAGE_FAMILIES_BY_SECTION),
    }
