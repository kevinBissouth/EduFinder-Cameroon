"""Propositions de création et de modification d'un établissement.

Une proposition ne modifie jamais la fiche : elle enregistre le contenu
demandé dans une soumission en attente, que le super administrateur
approuvera ou refusera (brouillon -> soumission -> validation -> publication).

Un responsable peut proposer autant de modifications qu'il veut, y compris sur
un élément déjà visé par une soumission en attente : aucune n'est bloquée,
c'est le super administrateur qui arbitre en les décidant une par une.
"""
from collections.abc import Iterable
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.db.models import Model

from edufinder.models import (
    City,
    Establishment,
    EstablishmentStatus,
    EstablishmentType,
    Exam,
    LinguisticSection,
    Media,
    PaymentMethod,
    Program,
    SchoolFee,
    Sector,
    StudyLevel,
    Submission,
    SubmissionStatus,
    SubmissionType,
    User,
    UserEstablishment,
)
from edufinder.services.data_rules import (
    get_exam_section_violation,
    get_exam_type_violation,
    get_school_year_violation,
    get_stage_section_violation,
    get_stage_type_violation,
)
from edufinder.services.head_titles import get_head_title_violation
from edufinder.services.media_files import StoredFile
from edufinder.services.notifications import notify_submission_received


class ProposalError(Exception):
    """Erreur métier d'une proposition, à présenter telle quelle au client."""


class UnknownReferenceError(ProposalError):
    pass


class IncoherentExamResultError(ProposalError):
    pass


class IncoherentFeeError(ProposalError):
    pass


class IncoherentHeadTitleError(ProposalError):
    pass


class EmptyModificationError(ProposalError):
    pass


# Clés du contenu d'une soumission qui portent sur la galerie : l'ajout d'un
# fichier déjà téléversé, et le retrait d'un média existant (par son id).
MEDIA_ADDITIONS_KEY = "media_additions"
MEDIA_REMOVALS_KEY = "media_removals"
DIRECTOR_PHOTO_KEY = "director_photo"

_SINGLE_REFERENCE_MODELS = {
    "id_city": City,
    "id_type": EstablishmentType,
    "id_sector": Sector,
    "id_linguistic_section": LinguisticSection,
}


@transaction.atomic
def create_creation_proposal(user: User, content: dict[str, Any]) -> Submission:
    ensure_references_exist(content)
    school_labels = {
        "type_label": EstablishmentType.objects.get(pk=content["id_type"]).label,
        "section_label": LinguisticSection.objects.get(
            pk=content["id_linguistic_section"]
        ).label,
    }
    _ensure_exam_results_coherent(content["exam_results"], **school_labels)
    _ensure_fees_coherent(content["fees"], **school_labels)
    _ensure_fees_in_open_school_years(content["fees"])
    _ensure_head_title_coherent(content["director_title"], school_labels["type_label"])
    # La fiche naît en attente, donc invisible du public, avec le strict
    # minimum : le reste du contenu ne sera appliqué qu'à l'approbation.
    establishment = Establishment.objects.create(
        name=content["name"],
        city_id=content["id_city"],
        type_id=content["id_type"],
        sector_id=content["id_sector"],
        linguistic_section_id=content["id_linguistic_section"],
        phone=content["phone"],
        status=EstablishmentStatus.PENDING,
    )
    UserEstablishment.objects.create(user=user, establishment=establishment)
    return _open_submission(user, establishment, SubmissionType.CREATION, content)


def create_modification_proposal(
    user: User, establishment: Establishment, changed_fields: dict[str, Any]
) -> Submission:
    if not changed_fields:
        raise EmptyModificationError("No changes provided")
    ensure_references_exist(changed_fields)
    _ensure_modification_coherent(establishment, changed_fields)
    _ensure_modified_head_title_coherent(establishment, changed_fields)
    return _open_submission(
        user, establishment, SubmissionType.MODIFICATION, changed_fields
    )


# Les trois propositions ci-dessous concernent les fichiers. Comme toute
# modification, elles ne touchent pas la fiche : le fichier est stocké, mais il
# n'apparaît sur la fiche publique qu'une fois la soumission approuvée.
def propose_media_addition(
    user: User, establishment: Establishment, stored_file: StoredFile, caption: str
) -> Submission:
    media_addition = {
        "url": stored_file.url,
        "type": stored_file.media_type.value,
        "caption": caption,
    }
    return _open_submission(
        user,
        establishment,
        SubmissionType.MODIFICATION,
        {MEDIA_ADDITIONS_KEY: [media_addition]},
    )


def propose_media_removal(user: User, media: Media) -> Submission:
    return _open_submission(
        user,
        media.establishment,
        SubmissionType.MODIFICATION,
        {MEDIA_REMOVALS_KEY: [media.id_media]},
    )


def propose_director_photo(
    user: User, establishment: Establishment, stored_file: StoredFile
) -> Submission:
    return _open_submission(
        user,
        establishment,
        SubmissionType.MODIFICATION,
        {DIRECTOR_PHOTO_KEY: stored_file.url},
    )


# La soumission et les notifications des super administrateurs sont écrites
# ensemble : jamais l'une sans les autres.
@transaction.atomic
def _open_submission(
    user: User,
    establishment: Establishment,
    submission_type: SubmissionType,
    content: dict[str, Any],
) -> Submission:
    submission = Submission.objects.create(
        user=user,
        establishment=establishment,
        type=submission_type,
        status=SubmissionStatus.PENDING,
        content=_to_json_safe(content),
    )
    notify_submission_received(submission)
    return submission


# Les montants et les taux sont des Decimal, que JSON ne sait pas écrire : je
# les stocke en texte pour ne perdre aucune décimale.
def _to_json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, dict):
        return {key: _to_json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_to_json_safe(item) for item in value]
    return value


# --- Références ---------------------------------------------------------------


def ensure_references_exist(content: dict[str, Any]) -> None:
    fees = content.get("fees") or []
    exam_results = content.get("exam_results") or []
    missing_references = [
        *_missing_single_references(content),
        *_missing_ids("id_level", StudyLevel, (fee["id_level"] for fee in fees)),
        *_missing_ids("id_exam", Exam, (result["id_exam"] for result in exam_results)),
        *_missing_payment_methods(fees),
        *_missing_ids("id_program", Program, content.get("program_ids") or []),
    ]
    if missing_references:
        raise UnknownReferenceError(
            "Unknown reference id(s): " + ", ".join(missing_references)
        )


def _missing_single_references(content: dict[str, Any]) -> list[str]:
    missing_references: list[str] = []
    for field_name, reference_model in _SINGLE_REFERENCE_MODELS.items():
        requested_id = content.get(field_name)
        if requested_id is not None:
            missing_references += _missing_ids(field_name, reference_model, [requested_id])
    return missing_references


def _missing_ids(
    field_name: str, reference_model: type[Model], requested_ids: Iterable[int]
) -> list[str]:
    requested_id_set = set(requested_ids)
    known_ids = set(
        reference_model.objects.filter(pk__in=requested_id_set).values_list(
            "pk", flat=True
        )
    )
    return [
        f"{field_name}={missing_id}" for missing_id in sorted(requested_id_set - known_ids)
    ]


def _missing_payment_methods(fees: list[dict[str, Any]]) -> list[str]:
    requested_labels = {
        payment_label
        for fee in fees
        for payment_label in fee.get("payment_methods") or []
    }
    known_labels = set(
        PaymentMethod.objects.filter(label__in=requested_labels).values_list(
            "label", flat=True
        )
    )
    return [
        f"payment_method={missing_label}"
        for missing_label in sorted(requested_labels - known_labels)
    ]


# --- Cohérence avec le type et la section ------------------------------------


# Je refuse toute proposition dont un résultat d'examen contredirait le type
# ou la section linguistique de l'établissement : un super administrateur ne
# doit pas pouvoir valider une fiche incohérente.
def _ensure_exam_results_coherent(
    exam_results: list[dict[str, Any]], *, type_label: str, section_label: str
) -> None:
    exam_labels = dict(
        Exam.objects.filter(
            pk__in={result["id_exam"] for result in exam_results}
        ).values_list("pk", "label")
    )
    for exam_result in exam_results:
        exam_label = exam_labels[exam_result["id_exam"]]
        violation = get_exam_type_violation(
            exam_label, type_label
        ) or get_exam_section_violation(exam_label, section_label, type_label)
        if violation is not None:
            raise IncoherentExamResultError(f"Incoherent exam result: {violation}")


# Même garde-fou pour les frais : pas de 4e dans une école primaire, pas de
# CM1 dans une école anglophone. C'est le cycle de la classe qui porte la règle.
def _ensure_fees_coherent(
    fees: list[dict[str, Any]], *, type_label: str, section_label: str
) -> None:
    stage_labels = dict(
        StudyLevel.objects.filter(
            pk__in={fee["id_level"] for fee in fees}
        ).values_list("pk", "stage__label")
    )
    for fee in fees:
        stage_label = stage_labels[fee["id_level"]]
        violation = get_stage_type_violation(
            stage_label, type_label
        ) or get_stage_section_violation(stage_label, section_label)
        if violation is not None:
            raise IncoherentFeeError(f"Incoherent fee: {violation}")


# Une année scolaire passée ne reçoit plus de nouveaux frais : un responsable
# publie l'année en cours et prépare la suivante, le reste est de l'historique.
def _ensure_fees_in_open_school_years(fees: list[dict[str, Any]]) -> None:
    for fee in fees:
        violation = get_school_year_violation(fee["school_year"])
        if violation is not None:
            raise IncoherentFeeError(f"Incoherent fee: {violation}")


# Corriger le montant d'une ligne déjà publiée reste permis, même pour une
# année passée : seules les lignes nouvelles pour l'établissement sont
# soumises au calendrier.
def _fees_on_new_lines(
    establishment: Establishment, fees: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    published_lines = set(
        SchoolFee.objects.filter(establishment=establishment).values_list(
            "level_id", "school_year"
        )
    )
    return [
        fee for fee in fees if (fee["id_level"], fee["school_year"]) not in published_lines
    ]


def _ensure_modification_coherent(
    establishment: Establishment, changed_fields: dict[str, Any]
) -> None:
    exam_results = changed_fields.get("exam_results") or []
    fees = changed_fields.get("fees") or []
    if not exam_results and not fees:
        return
    _ensure_fees_in_open_school_years(_fees_on_new_lines(establishment, fees))
    # Si la proposition change aussi le type ou la section, c'est la nouvelle
    # valeur qui compte : c'est elle que l'approbation appliquera.
    school_labels = {
        "type_label": _resolve_label(
            EstablishmentType, changed_fields.get("id_type"), establishment.type
        ),
        "section_label": _resolve_label(
            LinguisticSection,
            changed_fields.get("id_linguistic_section"),
            establishment.linguistic_section,
        ),
    }
    _ensure_exam_results_coherent(exam_results, **school_labels)
    _ensure_fees_coherent(_fees_on_new_levels(establishment, fees), **school_labels)


# La règle des cycles est arrivée après les données : une classe déjà publiée
# sur la fiche reste modifiable même si elle la contredit (un complexe scolaire
# typé « secondaire » qui affiche son primaire). Seules les classes nouvelles
# pour l'établissement sont contrôlées.
def _fees_on_new_levels(
    establishment: Establishment, fees: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    published_level_ids = set(
        SchoolFee.objects.filter(establishment=establishment).values_list(
            "level_id", flat=True
        )
    )
    return [fee for fee in fees if fee["id_level"] not in published_level_ids]


# Le titre du chef d'établissement se choisit parmi ceux du type d'école : un
# titre libre rendrait les fiches impossibles à comparer d'un coup d'œil.
def _ensure_head_title_coherent(head_title: str | None, type_label: str) -> None:
    if not head_title:
        return
    violation = get_head_title_violation(head_title, type_label)
    if violation is not None:
        raise IncoherentHeadTitleError(f"Incoherent head title: {violation}")


# Un titre déjà publié reste accepté tel quel, même hors liste (« Founding
# Director ») : la liste est arrivée après les fiches, et l'assistant renvoie
# le titre actuel avec le reste.
def _ensure_modified_head_title_coherent(
    establishment: Establishment, changed_fields: dict[str, Any]
) -> None:
    head_title = changed_fields.get("director_title")
    if head_title == establishment.director_title:
        return
    type_label = _resolve_label(
        EstablishmentType, changed_fields.get("id_type"), establishment.type
    )
    _ensure_head_title_coherent(head_title, type_label)


def _resolve_label(
    reference_model: type[Model], proposed_id: int | None, current_reference: Model
) -> str:
    if proposed_id is None:
        return current_reference.label
    return reference_model.objects.get(pk=proposed_id).label
