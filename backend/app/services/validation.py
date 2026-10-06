
from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Session, select

from app.models import (
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
    User,
    UserEstablishment,
    ValidationDecision,
)
from app.services.workflow import ensure_transition


class SubmissionNotPendingError(ValueError):
    """La soumission a déjà été décidée -> 409 côté route."""


def _get_pending_submission_or_error(session: Session, submission_uuid: str) -> Submission:
    submission = session.exec(
        select(Submission).where(Submission.uuid == submission_uuid)
    ).first()
    if submission is None:
        raise LookupError(f"Submission {submission_uuid} not found")
    try:
        ensure_transition(submission.status, SubmissionStatus.approved)
    except ValueError:
        raise SubmissionNotPendingError(
            f"Submission {submission_uuid} is already decided "
            f"(status={submission.status.value})"
        )
    return submission


def _apply_scalar_fields(establishment: Establishment, content: dict) -> None:
    scalar_fields = (
        "name",
        "id_city",
        "id_type",
        "id_sector",
        "id_linguistic_section",
        "phone",
        "latitude",
        "longitude",
        "contact_email",
        "website",
        "address",
        "description",
        "director_name",
        "director_title",
        "director_bio",
    )
    for field_name in scalar_fields:
        if content.get(field_name) is not None:
            setattr(establishment, field_name, content[field_name])

    # La proposition porte « director_photo », stocké côté modèle comme
    # director_photo_url : je fais la correspondance explicitement.
    if content.get("director_photo") is not None:
        establishment.director_photo_url = content["director_photo"]


def _replace_payment_methods(session: Session, school_fee: SchoolFee, payment_labels: list) -> None:
    # Je remplace par le jeu exact soumis : suppression des liens existants
    # puis recréation, pour que la validation reflète la proposition.
    existing_links = session.exec(
        select(SchoolFeePaymentMethod).where(
            SchoolFeePaymentMethod.id_fee == school_fee.id_fee
        )
    ).all()
    for existing_link in existing_links:
        session.delete(existing_link)

    if not payment_labels:
        return
    payment_methods_by_label: dict[str, PaymentMethod] = {
        payment_method.label: payment_method
        for payment_method in session.exec(select(PaymentMethod)).all()
    }
    for payment_label in payment_labels:
        session.add(SchoolFeePaymentMethod(
            id_fee=school_fee.id_fee,
            id_payment_method=payment_methods_by_label[payment_label].id_payment_method,
        ))


def _apply_fees(session: Session, establishment: Establishment, fees_payload: list) -> None:
    # Incrémental, pas de remplacement : une modification portée sur un prix de
    # classe ne touche que CETTE ligne (id_level, school_year). Toute ligne déjà
    # enregistrée et absente du payload reste intacte — on n'écrase jamais les
    # frais des autres classes/années. Supprimer volontairement un frais n'est
    # pas possible via le payload pour l'instant.
    for fee_entry in fees_payload:
        existing_fee = session.exec(
            select(SchoolFee).where(
                SchoolFee.id_establishment == establishment.id_establishment,
                SchoolFee.id_level == fee_entry["id_level"],
                SchoolFee.school_year == fee_entry["school_year"],
            )
        ).first()
        proposed_amount = Decimal(fee_entry["amount"])
        if existing_fee is None:
            school_fee = SchoolFee(
                id_establishment=establishment.id_establishment,
                id_level=fee_entry["id_level"],
                school_year=fee_entry["school_year"],
                amount=proposed_amount,
            )
            session.add(school_fee)
            # id_fee renseigné seulement après le flush : indispensable pour
            # relier les modalités de paiement par classe.
            session.flush()
        else:
            existing_fee.amount = proposed_amount
            school_fee = existing_fee

        if "payment_methods" in fee_entry:
            _replace_payment_methods(session, school_fee, fee_entry["payment_methods"])


def _apply_services(session: Session, establishment: Establishment, service_names: list) -> None:
    # Remplacement exact : les services soumis remplacent toute la liste, donc
    # un service existant absent du payload est supprimé.
    desired_names = [name.strip() for name in service_names]
    desired_lower = {name.lower() for name in desired_names}
    for existing_service in list(establishment.services):
        if existing_service.name.lower() not in desired_lower:
            session.delete(existing_service)
    present_names = {
        service.name.lower()
        for service in establishment.services
        if service.name.lower() in desired_lower
    }
    for name in desired_names:
        if name.lower() not in present_names:
            session.add(Service(
                id_establishment=establishment.id_establishment,
                name=name,
            ))
            present_names.add(name.lower())


def _apply_program_offers(session: Session, establishment: Establishment, program_ids: list) -> None:
    # Remplacement exact : seuls les programmes listés restent liés à
    # l'établissement après validation de la proposition.
    desired_program_ids = set(program_ids)
    for offer in list(establishment.program_offers):
        if offer.id_program not in desired_program_ids:
            session.delete(offer)
    existing_program_ids = {
        offer.id_program
        for offer in establishment.program_offers
        if offer.id_program in desired_program_ids
    }
    for program_id in desired_program_ids:
        if program_id not in existing_program_ids:
            session.add(ProgramOffer(
                id_establishment=establishment.id_establishment,
                id_program=program_id,
            ))


def _apply_exam_results(session: Session, establishment: Establishment, exam_results_payload: list) -> None:
    # Incrémental, pas de remplacement : une proposition ne porte que sur les
    # (id_exam, session) soumis. Les autres résultats déjà enregistrés restent
    # intacts, une ligne envoyée est créée ou mise à jour.
    for entry in exam_results_payload:
        existing_result = session.exec(
            select(ExamResult).where(
                ExamResult.id_establishment == establishment.id_establishment,
                ExamResult.id_exam == entry["id_exam"],
                ExamResult.session == entry["session"],
            )
        ).first()
        proposed_rate = Decimal(entry["pass_rate"])
        if existing_result is None:
            session.add(ExamResult(
                id_establishment=establishment.id_establishment,
                id_exam=entry["id_exam"],
                session=entry["session"],
                pass_rate=proposed_rate,
            ))
        else:
            existing_result.pass_rate = proposed_rate


def _apply_media(
    session: Session,
    establishment: Establishment,
    cover_photo: str | None,
    videos: list[str],
) -> None:
    """Matérialise les médias soumises en proposition (création) en lignes Media.

    Une URL déjà rattachée n'est pas dupliquée (idempotence). Couverture et
    vidéos proviennent d'uploads préalables : seules des URLs valides/stables
    arrivent ici via le contenu validé.
    """
    existing_urls = {media.url for media in establishment.media}
    cover_items = [(cover_photo, MediaType.image)] if cover_photo else []
    video_items = [(video_url, MediaType.video) for video_url in videos]
    for url, media_type in cover_items + video_items:
        if not url or url in existing_urls:
            continue
        establishment.media.append(Media(
            id_establishment=establishment.id_establishment,
            type=media_type,
            url=url,
        ))
        existing_urls.add(url)


def _apply_content_on_establishment(
    session: Session,
    submission: Submission,
) -> Establishment:
    establishment = session.get(Establishment, submission.id_establishment)
    content = submission.content
    _apply_scalar_fields(establishment, content)
    # Chaque clé présente (même une liste vide) force le remplacement exact :
    # l'absence de clé laisse la donnée inchangée, l'envoi d'une liste vide
    # demande la suppression complète de la catégorie.
    if "fees" in content:
        _apply_fees(session, establishment, content["fees"])
    if "services" in content:
        _apply_services(session, establishment, content["services"])
    if "program_ids" in content:
        _apply_program_offers(session, establishment, content["program_ids"])
    if "exam_results" in content:
        _apply_exam_results(session, establishment, content["exam_results"])
    _apply_media(
        session,
        establishment,
        content.get("cover_photo"),
        content.get("videos") or [],
    )
    return establishment


def approve_submission(session: Session, admin_user: User, submission_uuid: str) -> tuple[Submission, Establishment]:
    submission = _get_pending_submission_or_error(session, submission_uuid)
    establishment = _apply_content_on_establishment(session, submission)


    ensure_transition(establishment.status, EstablishmentStatus.published)
    establishment.status = EstablishmentStatus.published
    submission.status = SubmissionStatus.approved
    session.add(_build_decision(submission, admin_user, "approved", None))
    session.commit()
    session.refresh(submission)
    session.refresh(establishment)
    return submission, establishment


def reject_submission(
    session: Session,
    admin_user: User,
    submission_uuid: str,
    reason: str,
) -> tuple[Submission, Establishment]:
    submission = _get_pending_submission_or_error(session, submission_uuid)
    submission.status = SubmissionStatus.rejected
    establishment = session.get(Establishment, submission.id_establishment)
    if submission.type.value == "creation":
        ensure_transition(establishment.status, EstablishmentStatus.rejected)
        establishment.status = EstablishmentStatus.rejected
    session.add(_build_decision(submission, admin_user, "rejected", reason))
    session.commit()
    session.refresh(submission)
    session.refresh(establishment)
    return submission, establishment


def _build_decision(
    submission: Submission,
    admin_user: User,
    decision_value: str,
    reason: str | None,
) -> ValidationDecision:
    return ValidationDecision(
        id_submission=submission.id_submission,
        id_user=admin_user.id_user,
        status=DecisionStatus(decision_value),
        rejection_reason=reason,
        decided_at=datetime.now(timezone.utc),
    )


def list_submissions_by_status(session: Session, status_value: str | None) -> list[dict]:
    """Vue administrateur des soumissions, plus récentes d'abord."""
    statement = select(Submission).order_by(Submission.submitted_at.desc())
    if status_value is not None:
        statement = statement.where(Submission.status == SubmissionStatus(status_value))
    items: list[dict] = []
    for submission in session.exec(statement).all():
        items.append({
            "submission_uuid": submission.uuid,
            "establishment_uuid": submission.establishment.uuid,
            "establishment_name": submission.establishment.name,
            "proposer_name": submission.user.name,
            "submission_type": submission.type.value,
            "submission_status": submission.status.value,
            "submitted_at": submission.submitted_at,
            "rejection_reason": (
                submission.decision.rejection_reason if submission.decision else None
            ),
        })
    return items


def list_all_establishments_with_owners(session: Session) -> list[dict]:
    """Vue super-admin : tous les établissements et leurs responsables.

    Un établissement peut être géré par plusieurs comptes (user_establishment),
    je remonte donc une liste de noms de propriétaires par établissement.
    """
    establishments = session.exec(
        select(Establishment).order_by(Establishment.name)
    ).all()
    establishment_ids = [
        establishment.id_establishment for establishment in establishments
    ]

    owners_by_establishment: dict[int, list[str]] = {}
    if establishment_ids:
        ownership_rows = session.exec(
            select(UserEstablishment)
            .where(UserEstablishment.id_establishment.in_(establishment_ids))
        ).all()
        for ownership_row in ownership_rows:
            user = session.get(User, ownership_row.id_user)
            if user is None:
                continue
            owners_by_establishment.setdefault(
                ownership_row.id_establishment, []
            ).append(user.name)

    return [
        {
            "establishment_uuid": establishment.uuid,
            "name": establishment.name,
            "establishment_status": establishment.status.value,
            "city": establishment.city.name,
            "type": establishment.type.label,
            "sector": establishment.sector.label,
            "owners": owners_by_establishment.get(
                establishment.id_establishment, []
            ),
        }
        for establishment in establishments
    ]
