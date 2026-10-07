"""Décision du super administrateur sur une soumission.

Approuver applique le contenu proposé à la fiche ; refuser n'y touche pas.
Seule l'approbation d'une CRÉATION publie un établissement : approuver une
modification applique son contenu sans changer le statut, pour qu'une fiche
dont la création n'est pas encore validée (ou qui est suspendue) ne devienne
jamais publique par une approbation de routine.
"""
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.utils import timezone

from edufinder.models import (
    DecisionStatus,
    Establishment,
    EstablishmentStatus,
    ExamResult,
    Media,
    MediaType,
    PaymentMethod,
    ProgramOffer,
    SchoolFee,
    SchoolFeePaymentMethod,
    Service,
    Submission,
    SubmissionStatus,
    SubmissionType,
    User,
    ValidationDecision,
)
from edufinder.services.errors import ConflictError
from edufinder.services.media_files import delete_stored_file_if_unused
from edufinder.services.notifications import notify_submission_decided
from edufinder.services.proposals import (
    DIRECTOR_PHOTO_KEY,
    MEDIA_ADDITIONS_KEY,
    MEDIA_REMOVALS_KEY,
    UnknownReferenceError,
    ensure_references_exist,
)


class SubmissionAlreadyDecidedError(ConflictError):
    pass


class SubmissionNotApplicableError(ConflictError):
    pass


# Clé du contenu d'une soumission -> attribut de l'établissement. Seules ces
# clés peuvent modifier la fiche : le statut, la mise en avant et les
# compteurs n'y figurent pas.
_ESTABLISHMENT_ATTRIBUTE_BY_CONTENT_KEY = {
    "name": "name",
    "id_city": "city_id",
    "id_type": "type_id",
    "id_sector": "sector_id",
    "id_linguistic_section": "linguistic_section_id",
    "phone": "phone",
    "latitude": "latitude",
    "longitude": "longitude",
    "contact_email": "contact_email",
    "website": "website",
    "address": "address",
    "description": "description",
    "director_name": "director_name",
    "director_title": "director_title",
    "director_bio": "director_bio",
    DIRECTOR_PHOTO_KEY: "director_photo_url",
}
COVER_PHOTO_KEY = "cover_photo"
VIDEOS_KEY = "videos"


def approve_submission(submission: Submission, admin_user: User) -> Submission:
    approved_submission, replaced_file_urls = _approve_in_transaction(
        submission, admin_user
    )
    # Les fichiers ne sont supprimés qu'une fois la décision enregistrée : si
    # la transaction avait échoué, la fiche pointerait vers un fichier disparu.
    _delete_unused_files(replaced_file_urls)
    return approved_submission


def reject_submission(submission: Submission, admin_user: User, reason: str) -> Submission:
    rejected_submission = _reject_in_transaction(submission, admin_user, reason)
    _delete_unused_files(_list_abandoned_file_urls(rejected_submission))
    return rejected_submission


@transaction.atomic
def _approve_in_transaction(
    submission: Submission, admin_user: User
) -> tuple[Submission, set[str]]:
    locked_submission = _lock_pending_submission(submission)
    establishment = locked_submission.establishment
    _ensure_content_still_applicable(locked_submission.content)
    replaced_file_urls = _apply_content(establishment, locked_submission.content)
    _update_status_after_approval(establishment, locked_submission)
    _record_decision(locked_submission, admin_user, DecisionStatus.APPROVED, None)
    return locked_submission, replaced_file_urls


@transaction.atomic
def _reject_in_transaction(
    submission: Submission, admin_user: User, reason: str
) -> Submission:
    locked_submission = _lock_pending_submission(submission)
    establishment = locked_submission.establishment
    # Une création refusée laisse une fiche refusée (toujours invisible) ; une
    # modification refusée ne change rien à la fiche.
    if locked_submission.type == SubmissionType.CREATION:
        establishment.status = EstablishmentStatus.REJECTED
        establishment.save(update_fields=["status"])
    _record_decision(locked_submission, admin_user, DecisionStatus.REJECTED, reason)
    return locked_submission


# Une ville, une classe ou une modalité de paiement a pu être supprimée entre
# la proposition et la décision : je le vérifie avant d'écrire quoi que ce
# soit, pour refuser clairement plutôt que d'échouer en cours d'application.
def _ensure_content_still_applicable(content: dict[str, Any]) -> None:
    try:
        ensure_references_exist(content)
    except UnknownReferenceError as error:
        raise SubmissionNotApplicableError(
            f"Submission content can no longer be applied: {error}"
        ) from error


# Je relis la soumission en la verrouillant : deux décisions envoyées en même
# temps ne peuvent pas être enregistrées toutes les deux.
def _lock_pending_submission(submission: Submission) -> Submission:
    locked_submission = (
        Submission.objects.select_for_update()
        .select_related("establishment")
        .get(pk=submission.pk)
    )
    if locked_submission.status != SubmissionStatus.PENDING:
        raise SubmissionAlreadyDecidedError(
            f"Submission {locked_submission.uuid} is already decided "
            f"(status={locked_submission.status})"
        )
    return locked_submission


def _update_status_after_approval(
    establishment: Establishment, submission: Submission
) -> None:
    updated_fields = ["updated_at"]
    establishment.updated_at = timezone.now()
    if submission.type == SubmissionType.CREATION:
        establishment.status = EstablishmentStatus.PUBLISHED
        updated_fields.append("status")
    establishment.save(update_fields=updated_fields)


def _record_decision(
    submission: Submission,
    admin_user: User,
    decision_status: DecisionStatus,
    rejection_reason: str | None,
) -> None:
    submission.status = decision_status
    submission.save(update_fields=["status"])
    ValidationDecision.objects.create(
        submission=submission,
        user=admin_user,
        status=decision_status,
        rejection_reason=rejection_reason,
    )
    notify_submission_decided(submission, rejection_reason)


# --- Application du contenu ---------------------------------------------------


# Une clé absente laisse la donnée inchangée. Renvoie les adresses des fichiers
# que cette approbation a retirés de la fiche.
def _apply_content(establishment: Establishment, content: dict[str, Any]) -> set[str]:
    replaced_file_urls = _apply_establishment_fields(establishment, content)
    _apply_fees(establishment, content.get("fees") or [])
    _apply_exam_results(establishment, content.get("exam_results") or [])
    if "services" in content:
        _replace_services(establishment, content["services"] or [])
    if "program_ids" in content:
        _replace_program_offers(establishment, content["program_ids"] or [])
    _add_media(establishment, _list_proposed_media(content))
    return replaced_file_urls | _remove_media(
        establishment, content.get(MEDIA_REMOVALS_KEY) or []
    )


def _apply_establishment_fields(
    establishment: Establishment, content: dict[str, Any]
) -> set[str]:
    previous_director_photo_url = establishment.director_photo_url
    for content_key, attribute_name in _ESTABLISHMENT_ATTRIBUTE_BY_CONTENT_KEY.items():
        if content.get(content_key) is not None:
            setattr(establishment, attribute_name, content[content_key])
    establishment.save()
    is_photo_replaced = (
        previous_director_photo_url is not None
        and previous_director_photo_url != establishment.director_photo_url
    )
    return {previous_director_photo_url} if is_photo_replaced else set()


# Incrémental, pas de remplacement : une proposition ne touche que les lignes
# (classe, année scolaire) qu'elle porte. Les frais des autres classes et des
# autres années restent intacts — la règle 4 du cahier des besoins impose de
# conserver l'historique des montants.
def _apply_fees(establishment: Establishment, proposed_fees: list[dict]) -> None:
    for proposed_fee in proposed_fees:
        school_fee, _ = SchoolFee.objects.update_or_create(
            establishment=establishment,
            level_id=proposed_fee["id_level"],
            school_year=proposed_fee["school_year"],
            defaults={"amount": Decimal(proposed_fee["amount"])},
        )
        # Modalités absentes (ou vides de sens : null) = inchangées.
        if proposed_fee.get("payment_methods") is not None:
            _replace_payment_methods(school_fee, proposed_fee["payment_methods"])


def _replace_payment_methods(school_fee: SchoolFee, payment_labels: list[str]) -> None:
    payment_methods_by_label = {
        payment_method.label: payment_method
        for payment_method in PaymentMethod.objects.filter(label__in=payment_labels)
    }
    SchoolFeePaymentMethod.objects.filter(fee=school_fee).delete()
    SchoolFeePaymentMethod.objects.bulk_create(
        SchoolFeePaymentMethod(
            fee=school_fee, payment_method=payment_methods_by_label[payment_label]
        )
        for payment_label in payment_labels
    )


# Incrémental aussi : une ligne (examen, session) envoyée est créée ou mise à
# jour, les autres résultats restent en place.
def _apply_exam_results(
    establishment: Establishment, proposed_exam_results: list[dict]
) -> None:
    for proposed_result in proposed_exam_results:
        ExamResult.objects.update_or_create(
            establishment=establishment,
            exam_id=proposed_result["id_exam"],
            session=proposed_result["session"],
            defaults={"pass_rate": Decimal(proposed_result["pass_rate"])},
        )


# Remplacement exact : la liste soumise devient la liste de l'établissement.
# La comparaison ignore la casse, comme la contrainte d'unicité en base.
def _replace_services(establishment: Establishment, service_names: list[str]) -> None:
    wanted_names_by_lowered_name = {
        service_name.strip().lower(): service_name.strip()
        for service_name in service_names
    }
    existing_lowered_names = set()
    for existing_service in Service.objects.filter(establishment=establishment):
        lowered_name = existing_service.name.lower()
        if lowered_name not in wanted_names_by_lowered_name:
            existing_service.delete()
            continue
        existing_lowered_names.add(lowered_name)
    Service.objects.bulk_create(
        Service(establishment=establishment, name=wanted_name)
        for lowered_name, wanted_name in wanted_names_by_lowered_name.items()
        if lowered_name not in existing_lowered_names
    )


def _replace_program_offers(establishment: Establishment, program_ids: list[int]) -> None:
    wanted_program_ids = set(program_ids)
    existing_offers = ProgramOffer.objects.filter(establishment=establishment)
    existing_offers.exclude(program__in=wanted_program_ids).delete()
    offered_program_ids = set(existing_offers.values_list("program", flat=True))
    ProgramOffer.objects.bulk_create(
        ProgramOffer(establishment=establishment, program_id=program_id)
        for program_id in sorted(wanted_program_ids - offered_program_ids)
    )


# --- Médias -------------------------------------------------------------------


# Une création porte une couverture et des vidéos ; une proposition de galerie
# porte des ajouts explicites. Je les ramène à une seule forme.
def _list_proposed_media(content: dict[str, Any]) -> list[dict[str, Any]]:
    cover_photo_url = content.get(COVER_PHOTO_KEY)
    cover_media = (
        [{"url": cover_photo_url, "type": MediaType.IMAGE.value}]
        if cover_photo_url
        else []
    )
    video_media = [
        {"url": video_url, "type": MediaType.VIDEO.value}
        for video_url in content.get(VIDEOS_KEY) or []
    ]
    return cover_media + video_media + (content.get(MEDIA_ADDITIONS_KEY) or [])


def _add_media(establishment: Establishment, proposed_media: list[dict[str, Any]]) -> None:
    attached_urls = set(
        Media.objects.filter(establishment=establishment).values_list("url", flat=True)
    )
    for media_description in proposed_media:
        # Une adresse déjà rattachée n'est pas dupliquée.
        if media_description["url"] in attached_urls:
            continue
        Media.objects.create(
            establishment=establishment,
            type=media_description["type"],
            url=media_description["url"],
            caption=media_description.get("caption"),
        )
        attached_urls.add(media_description["url"])


# Le filtre sur l'établissement est une seconde barrière : même si un contenu
# citait l'id d'un média d'un autre établissement, il ne serait pas supprimé.
def _remove_media(establishment: Establishment, media_ids: list[int]) -> set[str]:
    removed_media = Media.objects.filter(establishment=establishment, pk__in=media_ids)
    removed_file_urls = set(removed_media.values_list("url", flat=True))
    removed_media.delete()
    return removed_file_urls


# --- Fichiers devenus inutiles ------------------------------------------------


def _delete_unused_files(file_urls: set[str]) -> None:
    for file_url in file_urls:
        delete_stored_file_if_unused(file_url)


# Fichiers téléversés pour une soumission refusée. Je garde ceux qu'une autre
# soumission encore en attente du même établissement propose aussi.
def _list_abandoned_file_urls(rejected_submission: Submission) -> set[str]:
    still_proposed_urls: set[str] = set()
    for pending_content in Submission.objects.filter(
        establishment=rejected_submission.establishment,
        status=SubmissionStatus.PENDING,
    ).values_list("content", flat=True):
        still_proposed_urls |= _list_file_urls(pending_content)
    return _list_file_urls(rejected_submission.content) - still_proposed_urls


def _list_file_urls(content: dict[str, Any]) -> set[str]:
    proposed_media_urls = {
        media_description["url"] for media_description in _list_proposed_media(content)
    }
    director_photo_url = content.get(DIRECTOR_PHOTO_KEY)
    if director_photo_url:
        proposed_media_urls.add(director_photo_url)
    return proposed_media_urls
