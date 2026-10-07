"""Données publiques transverses : compteurs de la plateforme et listes de
référence qui alimentent les filtres de recherche."""
from collections.abc import Iterable

from django.db.models import Count

from edufinder.models import (
    City,
    Establishment,
    EstablishmentType,
    Exam,
    ExamResult,
    LinguisticSection,
    PaymentMethod,
    Program,
    Region,
    SchoolFee,
    Sector,
    Service,
    StudyLevel,
)

FEATURED_TYPE_COUNT = 4


def collect_platform_stats() -> dict:
    published_establishments = Establishment.objects.published()
    return {
        "institutions": published_establishments.count(),
        "cities": published_establishments.values("city").distinct().count(),
        "fee_plans": SchoolFee.objects.filter(
            establishment__in=published_establishments
        ).count(),
        "exam_results": ExamResult.objects.filter(
            establishment__in=published_establishments
        ).count(),
    }


def collect_filters_meta() -> dict:
    return {
        "regions": Region.objects.order_by("name"),
        "sectors": Sector.objects.order_by("label"),
        "exams": Exam.objects.order_by("label"),
        "services": _list_published_service_names(),
        "cities": City.objects.order_by("id_city"),
        "types": EstablishmentType.objects.order_by("id_type"),
        "languages": LinguisticSection.objects.order_by("id_linguistic_section"),
        "levels": StudyLevel.objects.select_related("stage").order_by("stage", "label"),
        "programs": Program.objects.order_by("name"),
        "payment_methods": PaymentMethod.objects.order_by("label").values_list(
            "label", flat=True
        ),
        "featured_type_ids": _list_featured_type_ids(),
    }


def _list_published_service_names() -> list[str]:
    service_names = (
        Service.objects.filter(establishment__in=Establishment.objects.published())
        .values_list("name", flat=True)
        .distinct()
    )
    return _deduplicate_ignoring_case(service_names)


# La collation MySQL est déjà insensible à la casse, mais je garantis le
# dédoublonnage côté Python aussi : SQLite (tests) distingue « Cantine » de
# « cantine ».
def _deduplicate_ignoring_case(names: Iterable[str]) -> list[str]:
    unique_names_by_lowered_name: dict[str, str] = {}
    for name in names:
        unique_names_by_lowered_name.setdefault(name.lower(), name)
    return list(unique_names_by_lowered_name.values())


# Types les plus représentés parmi les établissements publiés : ils sont mis
# en avant comme raccourcis sur la page d'accueil.
def _list_featured_type_ids() -> list[int]:
    return list(
        Establishment.objects.published()
        .values("type")
        .annotate(establishment_count=Count("pk"))
        .order_by("-establishment_count")
        .values_list("type", flat=True)[:FEATURED_TYPE_COUNT]
    )
