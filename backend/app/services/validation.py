
from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Session, select

from app.models import (
    DecisionStatus,
    Establishment,
    EstablishmentStatus,
    PaymentMethod,
    ProgramOffer,
    SchoolFee,
    SchoolFeePaymentMethod,
    Service,
    Submission,
    SubmissionStatus,
    User,
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
    existing_names = {service.name.lower() for service in establishment.services}
    for service_name in service_names:
        if service_name.lower() in existing_names:
            continue
        session.add(Service(
            id_establishment=establishment.id_establishment,
            name=service_name,
        ))
        existing_names.add(service_name.lower())


def _apply_program_offers(session: Session, establishment: Establishment, program_ids: list) -> None:
    existing_program_ids = {
        offer.id_program for offer in establishment.program_offers
    }
    for program_id in program_ids:
        if program_id in existing_program_ids:
            continue
        session.add(ProgramOffer(
            id_establishment=establishment.id_establishment,
            id_program=program_id,
        ))


def _apply_exam_results(session: Session, establishment: Establishment, exam_results_payload: list) -> None:
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


def _apply_content_on_establishment(
    session: Session,
    submission: Submission,
) -> Establishment:
    establishment = session.get(Establishment, submission.id_establishment)
    content = submission.content
    _apply_scalar_fields(establishment, content)
    if content.get("fees"):
        _apply_fees(session, establishment, content["fees"])
    if content.get("services"):
        _apply_services(session, establishment, content["services"])
    if content.get("program_ids"):
        _apply_program_offers(session, establishment, content["program_ids"])
    if content.get("exam_results"):
        _apply_exam_results(session, establishment, content["exam_results"])
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
