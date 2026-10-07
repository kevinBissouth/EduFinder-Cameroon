"""Espace super-administrateur : décision des soumissions, suspension et
réactivation des établissements.

Uniquement accessible au rôle super_admin (require_admin), contrôlé côté
serveur. Les décisions (approbation / refus) modifient l'état de la soumission
mais aussi celui de l'établissement selon les règles de workflow.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models import Submission, SubmissionStatus, User
from app.schemas.proposal import (
    AdminDecisionResponse,
    AdminEstablishmentItem,
    AdminEstablishmentStatusResponse,
    AdminSubmissionDetail,
    AdminSubmissionItem,
    RejectionInput,
    SuspensionInput,
)
from app.services.suspension import (
    EstablishmentNotFoundError,
    reactivate_establishment,
    suspend_establishment,
)
from app.services.validation import (
    SubmissionNotPendingError,
    approve_submission,
    list_all_establishments_with_owners,
    list_submissions_by_status,
    reject_submission,
)

admin_router = APIRouter()


def _to_admin_decision_response(submission, establishment) -> AdminDecisionResponse:
    return AdminDecisionResponse(
        submission_uuid=submission.uuid,
        submission_status=submission.status.value,
        establishment_status=establishment.status.value,
    )


@admin_router.get("/admin/submissions", response_model=list[AdminSubmissionItem])
def list_submissions_for_admin(
    status: str | None = Query(default="pending", description="pending | approved | rejected"),
    session: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if status is not None and status not in SubmissionStatus._value2member_map_:
        raise HTTPException(status_code=422, detail=f"Unknown status '{status}'")
    return [
        AdminSubmissionItem(**item)
        for item in list_submissions_by_status(session, status)
    ]


@admin_router.get("/admin/establishments", response_model=list[AdminEstablishmentItem])
def list_establishments_for_admin(
    session: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return [
        AdminEstablishmentItem(**item)
        for item in list_all_establishments_with_owners(session)
    ]


def _to_establishment_status_response(establishment) -> AdminEstablishmentStatusResponse:
    return AdminEstablishmentStatusResponse(
        establishment_uuid=establishment.uuid,
        establishment_status=establishment.status.value,
    )


@admin_router.post(
    "/admin/establishments/{establishment_uuid}/suspend",
    response_model=AdminEstablishmentStatusResponse,
)
def suspend_establishment_endpoint(
    establishment_uuid: str,
    suspension_input: SuspensionInput,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        establishment = suspend_establishment(
            session, current_user, establishment_uuid, suspension_input.reason
        )
    except EstablishmentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ValueError as error:
        # Seule une fiche publiée peut être suspendue : tout autre état de
        # départ est un conflit d'état.
        raise HTTPException(status_code=409, detail=str(error))
    return _to_establishment_status_response(establishment)


@admin_router.post(
    "/admin/establishments/{establishment_uuid}/reactivate",
    response_model=AdminEstablishmentStatusResponse,
)
def reactivate_establishment_endpoint(
    establishment_uuid: str,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        establishment = reactivate_establishment(
            session, current_user, establishment_uuid
        )
    except EstablishmentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))
    return _to_establishment_status_response(establishment)


@admin_router.get("/admin/submissions/{submission_uuid}", response_model=AdminSubmissionDetail)
def get_submission_detail(
    submission_uuid: str,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    submission = session.exec(
        select(Submission).where(Submission.uuid == submission_uuid)
    ).first()
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return AdminSubmissionDetail(
        submission_uuid=submission.uuid,
        establishment_uuid=submission.establishment.uuid,
        establishment_name=submission.establishment.name,
        proposer_name=submission.user.name,
        submission_type=submission.type.value,
        submission_status=submission.status.value,
        submitted_at=submission.submitted_at,
        rejection_reason=(
            submission.decision.rejection_reason if submission.decision else None
        ),
        content=submission.content,
    )


@admin_router.post(
    "/admin/submissions/{submission_uuid}/approve",
    response_model=AdminDecisionResponse,
)
def approve_submission_endpoint(
    submission_uuid: str,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        submission, establishment = approve_submission(
            session, current_user, submission_uuid
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except (SubmissionNotPendingError, ValueError) as error:
        # Une soumission déjà décidée ou un état incohérent = conflit d'état.
        raise HTTPException(status_code=409, detail=str(error))
    return _to_admin_decision_response(submission, establishment)


@admin_router.post(
    "/admin/submissions/{submission_uuid}/reject",
    response_model=AdminDecisionResponse,
)
def reject_submission_endpoint(
    submission_uuid: str,
    rejection_input: RejectionInput,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        submission, establishment = reject_submission(
            session, current_user, submission_uuid, rejection_input.reason
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except SubmissionNotPendingError as error:
        raise HTTPException(status_code=409, detail=str(error))
    return _to_admin_decision_response(submission, establishment)
