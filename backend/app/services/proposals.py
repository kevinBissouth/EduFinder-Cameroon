
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlmodel import Session, select

from app.models import (
    City,
    Establishment,
    EstablishmentStatus,
    EstablishmentType,
    Exam,
    LinguisticSection,
    Media,
    MediaType,
    PaymentMethod,
    Program,
    Sector,
    StudyLevel,
    Submission,
    SubmissionStatus,
    SubmissionType,
    User,
    UserEstablishment,
    UserRole,
)
from app.services.data_rules import get_exam_section_violation, get_exam_type_violation


class UnknownReferenceError(ValueError):
    """Un identifiant de table de référence n'existe pas -> 422 côté route."""


class DuplicatePendingSubmissionError(ValueError):
    """Une soumission pending entre en conflit avec la nouvelle -> 409."""


def _to_json_safe(value: Any) -> Any:
   
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, dict):
        return {key: _to_json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_to_json_safe(item) for item in value]
    return value


def get_establishment_by_uuid(session: Session, establishment_uuid: str) -> Establishment | None:
  
    if not establishment_uuid or len(establishment_uuid) != 36:
        return None
    return session.exec(
        select(Establishment).where(Establishment.uuid == establishment_uuid)
    ).first()


def get_owned_establishment_or_error(
    session: Session,
    current_user: User,
    establishment_uuid: str,
) -> Establishment:

    establishment = get_establishment_by_uuid(session, establishment_uuid)
    if establishment is None:
        raise LookupError(f"Establishment {establishment_uuid} not found")
    if current_user.role != UserRole.super_admin:
        ownership_link = session.exec(
            select(UserEstablishment).where(
                UserEstablishment.id_user == current_user.id_user,
                UserEstablishment.id_establishment == establishment.id_establishment,
            )
        ).first()
        if ownership_link is None:
            raise PermissionError("You do not manage this establishment")
    return establishment


def _ensure_references_exist(session: Session, payload: dict[str, Any]) -> None:

    single_checks = {
        "id_city": City,
        "id_type": EstablishmentType,
        "id_sector": Sector,
        "id_linguistic_section": LinguisticSection,
    }
    missing_labels: list[str] = []
    for field_name, reference_model in single_checks.items():
        reference_id = payload.get(field_name)
        if reference_id is not None and session.get(reference_model, reference_id) is None:
            missing_labels.append(f"{field_name}={reference_id}")

    level_ids = [fee["id_level"] for fee in (payload.get("fees") or [])]
    for level_id in set(level_ids):
        if session.get(StudyLevel, level_id) is None:
            missing_labels.append(f"id_level={level_id}")

    exam_ids = [entry["id_exam"] for entry in (payload.get("exam_results") or [])]
    for exam_id in set(exam_ids):
        if session.get(Exam, exam_id) is None:
            missing_labels.append(f"id_exam={exam_id}")

    payment_labels = {
        payment_label
        for fee in (payload.get("fees") or [])
        for payment_label in (fee.get("payment_methods") or [])
    }
    known_payment_labels: set = set(
        session.exec(select(PaymentMethod.label)).all()
    )
    for payment_label in sorted(payment_labels - known_payment_labels):
        missing_labels.append(f"payment_method={payment_label}")

    program_ids = payload.get("program_ids") or []
    for program_id in set(program_ids):
        if session.get(Program, program_id) is None:
            missing_labels.append(f"id_program={program_id}")

    if missing_labels:
        raise UnknownReferenceError(
            "Unknown reference id(s): " + ", ".join(missing_labels)
        )


def _raise_if_exam_results_incoherent(
    session: Session,
    exam_results: list[dict[str, Any]],
    *,
    type_label: str,
    section_label: str,
) -> None:
    # Cohérence examen / type / section (règle métier) : je refuse toute
    # proposition dont un résultat d'examen contredirait le type ou la section
    # linguistique de l'établissement. Un super admin ne doit pas pouvoir
    # valider une fiche incohérente.
    for entry in exam_results:
        exam_label = session.get(Exam, entry["id_exam"]).label
        reason = (
            get_exam_type_violation(exam_label, type_label)
            or get_exam_section_violation(exam_label, section_label)
        )
        if reason is not None:
            raise ValueError(f"Incoherent exam result: {reason}")


# Champs scalaires d'une fiche : un conflit se déclare si la même clé est
# modifiée par deux soumissions pending du même établissement.
SCALAR_FIELDS = {
    "name",
    "phone",
    "id_city",
    "id_type",
    "id_sector",
    "id_linguistic_section",
    "contact_email",
    "website",
    "address",
    "description",
    "director_name",
    "director_title",
    "director_bio",
}


def _content_keys(content: dict[str, Any]) -> set[str]:
    """Clés réellement portées par un contenu de soumission (hors valeurs nulles)."""
    return {
        key
        for key, value in content.items()
        if value is not None and value != [] and value != {}
    }


def _find_fee_overlaps(pending_contents: list[dict[str, Any]], new_content: dict[str, Any]) -> set[tuple[int, str]]:
    """Couples (id_level, school_year) déjà en attente et aussi modifiés ici."""

    def fee_keys(content: dict[str, Any]) -> set[tuple[int, str]]:
        return {(int(fee["id_level"]), fee["school_year"]) for fee in (content.get("fees") or [])}

    new_keys = fee_keys(new_content)
    overlaps: set[tuple[int, str]] = set()
    for pending in pending_contents:
        overlaps |= fee_keys(pending) & new_keys
    return overlaps


def _find_exam_overlaps(pending_contents: list[dict[str, Any]], new_content: dict[str, Any]) -> set[tuple[int, str]]:
    """Couples (id_exam, session) déjà en attente et aussi modifiés ici."""

    def exam_keys(content: dict[str, Any]) -> set[tuple[int, str]]:
        return {(int(exam["id_exam"]), exam["session"]) for exam in (content.get("exam_results") or [])}

    new_keys = exam_keys(new_content)
    overlaps: set[tuple[int, str]] = set()
    for pending in pending_contents:
        overlaps |= exam_keys(pending) & new_keys
    return overlaps


def _find_category_overlaps(pending_contents: list[dict[str, Any]], new_content: dict[str, Any]) -> set[str]:
    """Catégories « liste entière » déjà touchées par une soumission pending."""
    overlaps: set[str] = set()
    for category in ("services", "program_ids"):
        new_present = new_content.get(category) not in (None, [])
        if not new_present:
            continue
        if any(pending.get(category) not in (None, []) for pending in pending_contents):
            overlaps.add(category)
    return overlaps


def _find_conflicts(
    pending_contents: list[dict[str, Any]],
    new_content: dict[str, Any],
) -> tuple[set[str], set[tuple[int, str]], set[tuple[int, str]], set[str]]:
    """Éléments en conflit entre une nouvelle soumission et les pending du même
    établissement. Laisse passer une autre classe/année : seul l'élément précis
    déjà en attente est bloqué, les autres catégories restent soumissibles."""

    new_scalar_keys = _content_keys(new_content) & SCALAR_FIELDS
    overlapping_scalars: set[str] = set()
    for pending in pending_contents:
        overlapping_scalars |= new_scalar_keys & _content_keys(pending)

    return (
        overlapping_scalars,
        _find_fee_overlaps(pending_contents, new_content),
        _find_exam_overlaps(pending_contents, new_content),
        _find_category_overlaps(pending_contents, new_content),
    )


def _raise_if_submission_conflicts(session: Session, establishment_internal_id: int, new_content: dict[str, Any]) -> None:
    pending_contents = [
        submission.content
        for submission in session.exec(
            select(Submission).where(
                Submission.id_establishment == establishment_internal_id,
                Submission.status == SubmissionStatus.pending,
            )
        ).all()
    ]
    if not pending_contents:
        return

    scalars, fee_overlaps, exam_overlaps, categories = _find_conflicts(
        pending_contents, new_content
    )

    descriptions: list[str] = []
    descriptions += sorted(scalars)
    for level_id, school_year in sorted(fee_overlaps):
        level_label = session.get(StudyLevel, level_id).label
        descriptions.append(f"fee: {level_label} ({school_year})")
    for exam_id, exam_session in sorted(exam_overlaps):
        exam_label = session.get(Exam, exam_id).label
        descriptions.append(f"exam result: {exam_label} ({exam_session})")
    descriptions += sorted(categories)

    if descriptions:
        raise DuplicatePendingSubmissionError(
            "Another submission is already pending for the same element(s): "
            + ", ".join(descriptions)
        )


def create_creation_proposal(
    session: Session,
    current_user: User,
    proposal_input,
) -> tuple[Establishment, Submission]:

    content_payload = proposal_input.model_dump()
    _ensure_references_exist(session, content_payload)

    # Validation de cohérence examen / type / section pour les propositions
    # de création : on résout les labels depuis les ids du payload.
    if content_payload.get("exam_results"):
        type_label = session.get(
            EstablishmentType, content_payload["id_type"]
        ).label
        section_label = session.get(
            LinguisticSection, content_payload["id_linguistic_section"]
        ).label
        _raise_if_exam_results_incoherent(
            session, content_payload["exam_results"],
            type_label=type_label,
            section_label=section_label,
        )

    new_establishment = Establishment(
        name=proposal_input.name,
        id_city=proposal_input.id_city,
        id_type=proposal_input.id_type,
        id_sector=proposal_input.id_sector,
        id_linguistic_section=proposal_input.id_linguistic_section,
        phone=proposal_input.phone,
        status=EstablishmentStatus.pending,
    )
    session.add(new_establishment)
    session.flush()

    session.add(UserEstablishment(
        id_user=current_user.id_user,
        id_establishment=new_establishment.id_establishment,
    ))
    submission = Submission(
        id_user=current_user.id_user,
        id_establishment=new_establishment.id_establishment,
        type=SubmissionType.creation,
        status=SubmissionStatus.pending,
        content=_to_json_safe(content_payload),
        submitted_at=datetime.now(timezone.utc),
    )
    session.add(submission)
    session.commit()
    session.refresh(new_establishment)
    session.refresh(submission)
    return new_establishment, submission


def create_modification_proposal(
    session: Session,
    current_user: User,
    establishment: Establishment,
    modification_input,
) -> Submission:

    changed_fields = modification_input.model_dump(exclude_unset=True, exclude_none=True)
    if not changed_fields:
        raise ValueError("No changes provided")
    _ensure_references_exist(session, changed_fields)

    # Validation de cohérence examen / type / section pour les modifications.
    # On regarde d'abord si les champs type/section ont été modifiés dans la proposition.
    type_label = (
        session.get(
            EstablishmentType, changed_fields["id_type"]
        ).label
        if changed_fields.get("id_type") is not None
        else establishment.type.label
    )
    section_label = (
        session.get(
            LinguisticSection, changed_fields["id_linguistic_section"]
        ).label
        if changed_fields.get("id_linguistic_section") is not None
        else establishment.linguistic_section.label
    )
    if changed_fields.get("exam_results"):
        _raise_if_exam_results_incoherent(
            session, changed_fields["exam_results"],
            type_label=type_label,
            section_label=section_label,
        )

    _raise_if_submission_conflicts(session, establishment.id_establishment, changed_fields)

    submission = Submission(
        id_user=current_user.id_user,
        id_establishment=establishment.id_establishment,
        type=SubmissionType.modification,
        status=SubmissionStatus.pending,
        content=_to_json_safe(changed_fields),
        submitted_at=datetime.now(timezone.utc),
    )
    session.add(submission)
    session.commit()
    session.refresh(submission)
    return submission


def list_manager_establishments(session: Session, current_user: User) -> list[dict]:

    pending_establishment_ids = set(session.exec(
        select(Submission.id_establishment).where(
            Submission.status == SubmissionStatus.pending
        )
    ).all())

    managed = session.exec(
        select(Establishment)
        .join(UserEstablishment, Establishment.id_establishment == UserEstablishment.id_establishment)
        .where(UserEstablishment.id_user == current_user.id_user)
        .order_by(Establishment.name)
    ).all()


    cover_urls: dict[int, str] = {}
    image_media_rows = session.exec(
        select(Media)
        .where(
            Media.id_establishment.in_([establishment.id_establishment for establishment in managed]),
            Media.type == MediaType.image,
        )
        .order_by(Media.id_media)
    ).all()
    for media_row in image_media_rows:
        cover_urls.setdefault(media_row.id_establishment, media_row.url)

    return [
        {
            "establishment_uuid": establishment.uuid,
            "name": establishment.name,
            "establishment_status": establishment.status.value,
            "has_pending_submission": (
                establishment.id_establishment in pending_establishment_ids
            ),
            "cover_url": cover_urls.get(establishment.id_establishment),
            "city": establishment.city.name,
            "type": establishment.type.label,
            "sector": establishment.sector.label,
            # Année de publication = dernière année scolaire avec des frais
            # renseignés (null tant que la fiche n'est pas publiée).
            "published_year": (
                max((fee.school_year for fee in establishment.fees), default=None)
                if establishment.status == EstablishmentStatus.published
                else None
            ),
        }
        for establishment in managed
    ]


def list_manager_submissions(session: Session, current_user: User) -> list[dict]:
   
    submissions = session.exec(
        select(Submission)
        .where(Submission.id_user == current_user.id_user)
        .order_by(Submission.submitted_at.desc())
    ).all()
    items: list[dict] = []
    for submission in submissions:
        decision = submission.decision
        items.append({
            "submission_uuid": submission.uuid,
            "establishment_uuid": submission.establishment.uuid,
            "establishment_name": submission.establishment.name,
            "submission_type": submission.type.value,
            "submission_status": submission.status.value,
            "submitted_at": submission.submitted_at,
            "rejection_reason": decision.rejection_reason if decision else None,
            "content": submission.content,
        })
    return items
