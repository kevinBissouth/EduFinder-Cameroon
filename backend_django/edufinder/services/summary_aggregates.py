"""Valeurs de synthèse d'un établissement, calculées par la base : frais
minimum, meilleur taux de réussite, image de couverture et complétude de la
fiche.

La recherche publique et l'espace responsable lisent ces mêmes annotations,
pour que le même établissement affiche partout les mêmes chiffres.
"""
from django.db.models import (
    BooleanField,
    Case,
    Max,
    Min,
    OuterRef,
    Q,
    QuerySet,
    Subquery,
    Value,
    When,
)

from edufinder.models import ExamResult, Media, MediaType, SchoolFee
from edufinder.services.data_rules import (
    TYPES_WITH_OFFICIAL_EXAMS,
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


# Une fiche est complète quand elle publie une description, au moins un frais
# et une photo, plus des résultats d'examens si son type en présente. C'est un
# fait vérifiable, jamais un jugement : la plateforme ne dit pas qui est le
# meilleur. S'appuie sur les annotations des deux fonctions ci-dessus.
def with_profile_completeness(establishments: QuerySet) -> QuerySet:
    has_results_or_sits_no_exam = Q(best_pass_rate__isnull=False) | ~Q(
        type__label__in=sorted(TYPES_WITH_OFFICIAL_EXAMS)
    )
    is_complete = (
        Q(description__gt="")
        & Q(min_tuition__isnull=False)
        & Q(cover_url__isnull=False)
        & has_results_or_sits_no_exam
    )
    return establishments.annotate(
        is_profile_complete=Case(
            When(is_complete, then=Value(True)),
            default=Value(False),
            output_field=BooleanField(),
        )
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
