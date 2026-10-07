"""Lecture des soumissions, commune aux espaces responsable et administrateur."""
from django.db.models import F, QuerySet


# Soumissions prêtes à être listées, les plus récentes d'abord. Une soumission
# en attente n'a pas encore de décision : la jointure externe de l'annotation
# donne alors un motif vide.
def describe_submissions(submissions: QuerySet) -> QuerySet:
    return (
        submissions.select_related("establishment", "user")
        .annotate(rejection_reason=F("decision__rejection_reason"))
        .order_by("-submitted_at")
    )
