"""Ordre de la scolarité : les cycles, puis les classes dans chaque cycle.

La base ne porte pas d'ordre (les classes y sont rangées par libellé, donc
« SIL » après « CP » et « 1ère » avant « 2nde »). Les listes où l'on choisit
des classes doivent suivre le parcours de l'élève : je le décris ici, par
libellé, comme les règles de cohérence.
"""
from collections.abc import Iterable

from edufinder.models import StudyLevel

LEVEL_LABELS_BY_STAGE_LABEL = {
    "Maternelle": ("Petite Section", "Moyenne Section", "Grande Section"),
    "Nursery": ("Pre-Nursery", "Nursery 1", "Nursery 2"),
    "Primaire": ("SIL", "CP", "CE1", "CE2", "CM1", "CM2"),
    "Primary": ("Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"),
    "Collège": ("6e", "5e", "4e", "3e"),
    "Lycée": ("2nde", "1ère", "Terminale"),
    "Lower secondary": ("Form 1", "Form 2", "Form 3", "Form 4"),
    "Upper secondary": ("Form 5", "Lower Sixth", "Upper Sixth"),
    "Technical lower secondary": ("1ère année", "2e année", "3e année", "4e année"),
    "Technical upper secondary": ("2nde", "1ère", "Terminale"),
    "Higher": ("Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2"),
}
_STAGE_LABELS = tuple(LEVEL_LABELS_BY_STAGE_LABEL)


def _find_rank(label: str, ordered_labels: tuple[str, ...]) -> int:
    return ordered_labels.index(label) if label in ordered_labels else len(ordered_labels)


# Un cycle ou une classe hors de la liste passe après les autres, par ordre
# alphabétique : rien ne disparaît, l'ordre reste prévisible.
def _school_path_key(study_level: StudyLevel) -> tuple[int, str, int, str]:
    stage_label = study_level.stage.label
    known_level_labels = LEVEL_LABELS_BY_STAGE_LABEL.get(stage_label, ())
    return (
        _find_rank(stage_label, _STAGE_LABELS),
        stage_label,
        _find_rank(study_level.label, known_level_labels),
        study_level.label,
    )


def sort_by_school_path(study_levels: Iterable[StudyLevel]) -> list[StudyLevel]:
    return sorted(study_levels, key=_school_path_key)
