"""Valeurs de synthèse d'un établissement, calculées par la base : frais
minimum, meilleur taux de réussite et image de couverture.

La recherche publique et l'espace responsable lisent ces mêmes annotations,
pour que le même établissement affiche partout les mêmes chiffres.
"""
from django.db.models import Max, Min, OuterRef, QuerySet, Subquery

from edufinder.models import ExamResult, Media, MediaType, SchoolFee
from edufinder.services.data_rules import (
    exclude_results_contradicting_establishment_type,
)


def with_tuition_and_pass_rate(establishments: QuerySet) -> QuerySet:
    return establishments.annotate(
        min_tuition=Subquery(_minimum_fee_of_outer_establishment()),
        best_pass_rate=Subquery(_best_pass_rate_of_outer_establishment()),
    )


def with_cover_url(establishments: QuerySet) -> QuerySet:
    return establishments.annotate(
        cover_url=Subquery(_first_image_url_of_outer_establishment())
    )


def coherent_exam_results_of_outer_establishment() -> QuerySet:
    return exclude_results_contradicting_establishment_type(
        ExamResult.objects.filter(establishment=OuterRef("pk"))
    )


def _minimum_fee_of_outer_establishment() -> QuerySet:
    return (
        SchoolFee.objects.filter(establishment=OuterRef("pk"))
        .values("establishment")
        .annotate(minimum_amount=Min("amount"))
        .values("minimum_amount")
    )


def _best_pass_rate_of_outer_establishment() -> QuerySet:
    return (
        coherent_exam_results_of_outer_establishment()
        .values("establishment")
        .annotate(best_rate=Max("pass_rate"))
        .values("best_rate")
    )


# La couverture est la toute première image téléversée (plus petit id).
def _first_image_url_of_outer_establishment() -> QuerySet:
    return (
        Media.objects.filter(establishment=OuterRef("pk"), type=MediaType.IMAGE)
        .order_by("id_media")
        .values("url")[:1]
    )
