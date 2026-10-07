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
