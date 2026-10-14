"""Titre du chef d'établissement selon le type d'école.

Un lycée a un proviseur, une école primaire un directeur, une université un
recteur : le formulaire pré-remplit ce titre et ne propose que ceux du type.
Chaque titre a une clé (ce qui est enregistré sur la fiche) et un libellé par
langue, servi avec les autres listes de référence : le visiteur le lit dans sa
langue sans que l'école ait à le traduire.

Une faculté n'est pas un type d'établissement à part : quand elle a sa propre
fiche, c'est une fiche de type université, dirigée par un doyen.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class HeadTitle:
    key: str
    label_fr: str
    label_en: str


_HEADMASTER = HeadTitle("Headmaster", "Directeur", "Headmaster")
_HEADMISTRESS = HeadTitle("Headmistress", "Directrice", "Headmistress")
_PROVISEUR = HeadTitle("Proviseur", "Proviseur", "Principal")
_PRINCIPAL = HeadTitle("Principal", "Principal", "Principal")
_PRINCIPALE = HeadTitle("Principale", "Principale", "Principal")
_DIRECTOR = HeadTitle("Director", "Directeur", "Director")
_DIRECTRICE = HeadTitle("Directrice", "Directrice", "Director")
_RECTOR = HeadTitle("Rector", "Recteur", "Rector")
_DEAN = HeadTitle("Dean", "Doyen", "Dean")

# Le premier titre d'un type est celui que le formulaire pré-remplit.
HEAD_TITLES_BY_TYPE_LABEL = {
    "Nursery": (_HEADMASTER, _HEADMISTRESS),
    "Primary": (_HEADMASTER, _HEADMISTRESS),
    "Secondary general": (_PROVISEUR, _PRINCIPAL, _PRINCIPALE),
    "Secondary technical": (_PROVISEUR,),
    "Higher institute": (_DIRECTOR, _DIRECTRICE),
    "University": (_RECTOR, _DEAN),
}


def get_head_title_violation(head_title: str, type_label: str) -> str | None:
    """Raison si ce titre n'est pas un de ceux du type, None s'il convient."""
    allowed_titles = HEAD_TITLES_BY_TYPE_LABEL.get(type_label)
    # Type hors cartographie : revue humaine, pas de refus automatique.
    if allowed_titles is None:
        return None
    allowed_keys = [allowed_title.key for allowed_title in allowed_titles]
    if head_title in allowed_keys:
        return None
    return (
        f"'{head_title}' is not a head title of the type '{type_label}' "
        f"(allowed: {', '.join(allowed_keys)})"
    )


# Les clés proposées pour chaque type, dans l'ordre : c'est ce que lit le
# formulaire du responsable.
def describe_head_titles() -> dict[str, list[str]]:
    return {
        type_label: [head_title.key for head_title in head_titles]
        for type_label, head_titles in HEAD_TITLES_BY_TYPE_LABEL.items()
    }


# Même forme que les autres listes de référence : clé -> libellé par langue.
def collect_head_title_labels() -> dict[str, dict[str, str]]:
    return {
        head_title.key: {"fr": head_title.label_fr, "en": head_title.label_en}
        for head_titles in HEAD_TITLES_BY_TYPE_LABEL.values()
        for head_title in head_titles
    }
