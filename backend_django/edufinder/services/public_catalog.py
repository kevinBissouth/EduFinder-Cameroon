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
    Stage,
    StudyLevel,
)

from edufinder.services.data_rules import EXAM_ALLOWED_TYPE_LABELS

FEATURED_TYPE_COUNT = 4


def collect_platform_stats() -> dict:
    published_establishments = Establishment.objects.published()
    return {
        "institutions": published_establishments.count(),
        "cities": published_establishments.values("city").distinct().count(),
        # Régions réellement couvertes, pas les dix régions de référence.
        "regions": published_establishments.values("city__region").distinct().count(),
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
        # Quels types d'établissement présentent quel examen : la comparaison
        # s'en sert pour dire « sans objet » plutôt que « non communiqué »
        # quand un examen ne concerne pas un établissement.
        "exam_allowed_types": {
            exam_label: sorted(allowed_type_labels)
            for exam_label, allowed_type_labels in EXAM_ALLOWED_TYPE_LABELS.items()
        },
    }


# Listes dont les valeurs s'affichent dans la langue du visiteur : le nom sous
# lequel le frontend les demande, le modèle, et la colonne qui porte la clé.
TRANSLATED_REFERENCES = (
    ("regions", Region, "name"),
    ("types", EstablishmentType, "label"),
    ("sections", LinguisticSection, "label"),
    ("sectors", Sector, "label"),
    ("exams", Exam, "label"),
    ("stages", Stage, "label"),
    ("programs", Program, "name"),
    ("payment_methods", PaymentMethod, "label"),
)


def collect_reference_labels() -> dict:
    return {
        reference_kind: _map_labels_by_key(reference_model, key_column)
        for reference_kind, reference_model, key_column in TRANSLATED_REFERENCES
    }


# Une valeur pas encore traduite s'affiche avec sa clé plutôt qu'avec un vide.
def _map_labels_by_key(reference_model, key_column: str) -> dict:
    return {
        key: {"fr": label_fr or key, "en": label_en or key}
        for key, label_fr, label_en in reference_model.objects.values_list(
            key_column, "label_fr", "label_en"
        )
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
