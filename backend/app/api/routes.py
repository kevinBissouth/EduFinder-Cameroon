import os
import uuid as uuid_lib
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, text
from sqlmodel import Session, select

from app.services.security import create_access_token, set_token_cookie, verify_password




from app.api.dependencies import (
    COOKIE_NAME,
    get_current_user,
    require_admin,
    require_manager_or_admin,
)
from app.db.session import get_db
from app.models import (
    City,
    Establishment,
    EstablishmentStatus,
    EstablishmentType,
    Exam,
    ExamResult,
    LinguisticSection,
    Media,
    MediaType,
    PaymentMethod,
    Program,
    ProgramOffer,
    Region,
    SchoolFee,
    Sector,
    Service,
    StudyLevel,
    Submission,
    SubmissionStatus,
    User,
)
from app.schemas.auth import AuthenticatedUser, TokenResponse
from app.schemas.institution import (
    FiltersMeta,
    InstitutionDetail,
    InstitutionFilters,
    InstitutionSummary,
    ManagerBenchmarks,
    ManagerEstablishmentDetail,
    PlatformStats,
    to_filters_meta,
    to_institution_detail,
    to_institution_summary,
    to_manager_establishment_detail,
)
from app.schemas.proposal import (
    AdminDecisionResponse,
    AdminSubmissionDetail,
    AdminSubmissionItem,
    CreationProposalInput,
    ManagerEstablishmentItem,
    ManagerSubmissionItem,
    ModificationProposalInput,
    ProposalCreatedResponse,
    RejectionInput,
)
from app.services.proposals import (
    DuplicatePendingSubmissionError,
    UnknownReferenceError,
    create_creation_proposal,
    create_modification_proposal,
    get_owned_establishment_or_error,
    list_manager_establishments,
    list_manager_submissions,
)
from app.services.validation import (
    SubmissionNotPendingError,
    approve_submission,
    list_submissions_by_status,
    reject_submission,
)

public_router = APIRouter()

EXAM_SEPARATOR = ":"

def parse_exam_requirement(raw_requirement: str) -> tuple[int, Decimal]:
    raw_exam_id, raw_pass_rate = raw_requirement.split(EXAM_SEPARATOR)
    minimum_rate = Decimal(raw_pass_rate)
    if minimum_rate > 100:
        raise HTTPException(
            status_code=422,
            detail=f"Pass rate must be <= 100 in '{raw_requirement}'",
        )
    return int(raw_exam_id), minimum_rate


def minimum_fee_subquery():
    return (
        select(
            SchoolFee.id_establishment,
            func.min(SchoolFee.amount).label("min_amount"),
        )
        .group_by(SchoolFee.id_establishment)
        .subquery()
    )


def collect_summary_extras(session: Session, establishment_ids: list[int]):
    if not establishment_ids:
        return {}, {}, {}

    fee_minimums = dict(
        session.exec(
            select(SchoolFee.id_establishment, func.min(SchoolFee.amount))
            .where(SchoolFee.id_establishment.in_(establishment_ids))
            .group_by(SchoolFee.id_establishment)
        ).all()
    )
    best_pass_rates = dict(
        session.exec(
            select(ExamResult.id_establishment, func.max(ExamResult.pass_rate))
            .where(ExamResult.id_establishment.in_(establishment_ids))
            .group_by(ExamResult.id_establishment)
        ).all()
    )

    cover_urls: dict[int, str] = {}
    image_media_rows = session.exec(
        select(Media)
        .where(
            Media.id_establishment.in_(establishment_ids),
            Media.type == MediaType.image,
        )
        .order_by(Media.id_media)
    ).all()
    for media_row in image_media_rows:
        cover_urls.setdefault(media_row.id_establishment, media_row.url)

    return fee_minimums, best_pass_rates, cover_urls


@public_router.get("/health")
def health(session: Session = Depends(get_db)):
    session.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@public_router.get("/institutions", response_model=list[InstitutionSummary])
def list_institutions(filters: Annotated[InstitutionFilters, Query()], session: Session = Depends(get_db)):
    published_establishments_stmt = select(Establishment).where(
        Establishment.status == EstablishmentStatus.published
    )
    if filters.city_id is not None:
        published_establishments_stmt = published_establishments_stmt.where(Establishment.id_city == filters.city_id)
        
    if filters.type_id is not None:
        published_establishments_stmt = published_establishments_stmt.where(Establishment.id_type == filters.type_id)

    if filters.linguistic_section_id is not None:
        published_establishments_stmt = published_establishments_stmt.where(Establishment.id_linguistic_section == filters.linguistic_section_id)

    if filters.sector_id is not None:
        selected_sector = session.get(Sector, filters.sector_id)
        if selected_sector is None:
            matched_ids = [filters.sector_id]
        else:
            same_group_stmt = select(Sector.id_sector).where(
                Sector.is_public == selected_sector.is_public
            )
            matched_ids = session.exec(same_group_stmt).all()
        published_establishments_stmt = published_establishments_stmt.where(Establishment.id_sector.in_(matched_ids))

    if filters.region_id is not None:
        published_establishments_stmt = published_establishments_stmt.join(City).where(City.id_region == filters.region_id)

    if filters.program_id is not None:
        published_establishments_stmt = published_establishments_stmt.join(ProgramOffer).where(ProgramOffer.id_program == filters.program_id)

    if filters.search_term:
        published_establishments_stmt = published_establishments_stmt.where(Establishment.name.contains(filters.search_term))

    if filters.min_fee is not None or filters.max_fee is not None:
        fee_floor_subq = minimum_fee_subquery()
        published_establishments_stmt = published_establishments_stmt.join(fee_floor_subq,Establishment.id_establishment == fee_floor_subq.c.id_establishment,)

        if filters.min_fee is not None:
            published_establishments_stmt = published_establishments_stmt.where(fee_floor_subq.c.min_amount >= filters.min_fee)

        if filters.max_fee is not None:
            published_establishments_stmt = published_establishments_stmt.where(fee_floor_subq.c.min_amount <= filters.max_fee)

    for service_name in filters.service_names:
        published_establishments_stmt = published_establishments_stmt.where(
            select(Service.id_service).where(Service.id_establishment == Establishment.id_establishment,func.lower(Service.name) == service_name.lower(),).exists())
        
    for exam_id, minimum_rate in [parse_exam_requirement(requirement) for requirement in filters.exam_requirements]:
        published_establishments_stmt = published_establishments_stmt.where(select(ExamResult.id_result)
            .where(
                ExamResult.id_establishment == Establishment.id_establishment,
                ExamResult.id_exam == exam_id,
                ExamResult.pass_rate >= minimum_rate,
            )
            .exists()
        )

    published_establishments_stmt = published_establishments_stmt.order_by(
        Establishment.recommended.desc(), Establishment.id_establishment
    )
    establishments = session.exec(published_establishments_stmt).all()
    fee_minimums, best_pass_rates, cover_urls = collect_summary_extras(
        session, [item.id_establishment for item in establishments]
    )
    return [
        to_institution_summary(
            item,
            min_tuition=fee_minimums.get(item.id_establishment),
            best_pass_rate=best_pass_rates.get(item.id_establishment),
            cover_url=cover_urls.get(item.id_establishment),
        )
        for item in establishments
    ]



@public_router.get("/stats", response_model=PlatformStats)
def get_platform_stats(session: Session = Depends(get_db)):
    published_condition = Establishment.status == EstablishmentStatus.published

    institution_count = session.exec(
        select(func.count()).select_from(Establishment).where(published_condition)
    ).one()
    city_count = session.exec(
        select(func.count(func.distinct(Establishment.id_city))).where(published_condition)
    ).one()
 
    fee_plan_count = session.exec(
        select(func.count())
        .select_from(SchoolFee)
        .join(Establishment, SchoolFee.id_establishment == Establishment.id_establishment)
        .where(published_condition)
    ).one()
    exam_result_count = session.exec(
        select(func.count())
        .select_from(ExamResult)
        .join(Establishment, ExamResult.id_establishment == Establishment.id_establishment)
        .where(published_condition)
    ).one()

    return PlatformStats(
        institutions=institution_count,
        cities=city_count,
        fee_plans=fee_plan_count,
        exam_results=exam_result_count,
    )


@public_router.get("/filters-meta", response_model=FiltersMeta)
def get_filters_meta(session: Session = Depends(get_db)):
    regions = session.exec(select(Region).order_by(Region.name)).all()
    sectors = session.exec(select(Sector).order_by(Sector.label)).all()
    exams = session.exec(select(Exam).order_by(Exam.label)).all()
    cities = session.exec(select(City).order_by(City.id_city)).all()
    types = session.exec(select(EstablishmentType).order_by(EstablishmentType.id_type)).all()
    languages = session.exec(select(LinguisticSection).order_by(LinguisticSection.id_linguistic_section)).all()
  
    levels = session.exec(
        select(StudyLevel)
        .order_by(StudyLevel.id_stage, StudyLevel.label)
    ).all()
    programs = session.exec(select(Program).order_by(Program.name)).all()
    payment_methods = session.exec(select(PaymentMethod).order_by(PaymentMethod.label)).all()
    published_services_stmt = (
        select(Service.name)
        .join(Establishment)
        .where(Establishment.status == EstablishmentStatus.published)
        .distinct()
    )
    distinct_services = session.exec(published_services_stmt).all()

    unique_services: list[str] = []
    seen_service_names: set = set()
    for service_name in distinct_services:
        lowered_service_name = service_name.lower()
        if lowered_service_name in seen_service_names:
            continue
        seen_service_names.add(lowered_service_name)
        unique_services.append(service_name)


    featured_type_ids = list(
        session.exec(
            select(Establishment.id_type)
            .where(Establishment.status == EstablishmentStatus.published)
            .group_by(Establishment.id_type)
            .order_by(func.count(Establishment.id_establishment).desc())
            .limit(4)
        ).all()
    )

    return to_filters_meta(
        regions,
        sectors,
        exams,
        unique_services,
        cities,
        types,
        languages,
        levels,
        programs,
        payment_methods=payment_methods,
        featured_type_ids=featured_type_ids,
    )



@public_router.get("/institutions/{institution_uuid}", response_model=InstitutionDetail)
def get_institution(institution_uuid: str, session: Session = Depends(get_db)):
    
    establishment = session.exec(
        select(Establishment).where(
            Establishment.uuid == institution_uuid,
            Establishment.status == EstablishmentStatus.published,
        )
    ).first()
    if establishment is None:
        raise HTTPException(status_code=404, detail="Institution not found")

    return to_institution_detail(establishment)


@public_router.post("/institutions/{institution_uuid}/track-view")
def track_institution_view(institution_uuid: str, session: Session = Depends(get_db)):
    establishment = session.exec(
        select(Establishment).where(
            Establishment.uuid == institution_uuid,
            Establishment.status == EstablishmentStatus.published,
        )
    ).first()
    if establishment is None:
        raise HTTPException(status_code=404, detail="Institution not found")
    establishment.views_count = (establishment.views_count or 0) + 1
    session.add(establishment)
    session.commit()
    return {"views_count": establishment.views_count}


@public_router.post("/institutions/{institution_uuid}/track-inquiry")
def track_institution_inquiry(institution_uuid: str, session: Session = Depends(get_db)):
    establishment = session.exec(
        select(Establishment).where(
            Establishment.uuid == institution_uuid,
            Establishment.status == EstablishmentStatus.published,
        )
    ).first()
    if establishment is None:
        raise HTTPException(status_code=404, detail="Institution not found")
    establishment.inquiries_count = (establishment.inquiries_count or 0) + 1
    session.add(establishment)
    session.commit()
    return {"inquiries_count": establishment.inquiries_count}


# --- Authentification --------------------------------------------------------


@public_router.post("/auth/login", response_model=TokenResponse)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    session: Session = Depends(get_db),
):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(user.id_user, user.role.value)
    set_token_cookie(response, token)
    return TokenResponse(access_token=token)


@public_router.post("/auth/logout")
def logout(response: Response):
    # Le cookie httpOnly ne peut pas être effacé côté client : le navigateur
    # doit recevoir l'ordre d'expiration directement du serveur.
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"status": "ok"}


@public_router.get("/auth/me", response_model=AuthenticatedUser)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]):
    return AuthenticatedUser(
        id_user=current_user.id_user,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value,
    )

# --- Espace responsable ------------------------------------------------------


def _proposal_error_status(error: ValueError) -> int:
    if isinstance(error, UnknownReferenceError):
        return 422
    if isinstance(error, DuplicatePendingSubmissionError):
        return 409
    return 422


@public_router.post(
    "/establishments/proposals",
    response_model=ProposalCreatedResponse,
    status_code=201,
)
def submit_creation_proposal(
    proposal_input: CreationProposalInput,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    try:
        establishment, submission = create_creation_proposal(
            session, current_user, proposal_input
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=_proposal_error_status(error), detail=str(error))
    return ProposalCreatedResponse(
        establishment_uuid=establishment.uuid,
        submission_uuid=submission.uuid,
        establishment_status=establishment.status.value,
        submission_status=submission.status.value,
    )


@public_router.get("/my/establishments", response_model=list[ManagerEstablishmentItem])
def list_my_establishments(
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return [
        ManagerEstablishmentItem(**item)
        for item in list_manager_establishments(session, current_user)
    ]


@public_router.post(
    "/my/establishments/{establishment_uuid}/modification-proposals",
    response_model=ProposalCreatedResponse,
    status_code=201,
)
def submit_modification_proposal(
    establishment_uuid: str,
    modification_input: ModificationProposalInput,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    try:
        establishment = get_owned_establishment_or_error(
            session, current_user, establishment_uuid
        )
        submission = create_modification_proposal(
            session, current_user, establishment, modification_input
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=_proposal_error_status(error), detail=str(error))
    return ProposalCreatedResponse(
        establishment_uuid=establishment.uuid,
        submission_uuid=submission.uuid,
        establishment_status=establishment.status.value,
        submission_status=submission.status.value,
    )


@public_router.get("/my/submissions", response_model=list[ManagerSubmissionItem])
def list_my_submissions(
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return [
        ManagerSubmissionItem(**item)
        for item in list_manager_submissions(session, current_user)
    ]


@public_router.get(
    "/my/establishments/{establishment_uuid}",
    response_model=ManagerEstablishmentDetail,
)
def get_my_establishment_detail(
    establishment_uuid: str,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
   
    try:
        establishment = get_owned_establishment_or_error(
            session, current_user, establishment_uuid
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    pending = session.exec(
        select(Submission).where(
            Submission.id_establishment == establishment.id_establishment,
            Submission.status == SubmissionStatus.pending,
        )
    ).first()
    return to_manager_establishment_detail(
        establishment, has_pending_submission=pending is not None
    )


@public_router.get(
    "/my/establishments/{establishment_uuid}/benchmarks",
    response_model=ManagerBenchmarks,
)
def get_my_establishment_benchmarks(
    establishment_uuid: str,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
 
    try:
        establishment = get_owned_establishment_or_error(
            session, current_user, establishment_uuid
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))

    published = session.exec(
        select(Establishment).where(Establishment.status == EstablishmentStatus.published)
    ).all()
    if not published:
        return ManagerBenchmarks()

    published_ids = [entity.id_establishment for entity in published]
    fee_minimums, best_pass_rates, _ = collect_summary_extras(session, published_ids)

    your_min = (
        float(fee_minimums[establishment.id_establishment])
        if establishment.id_establishment in fee_minimums
        else None
    )
    your_pass = (
        float(best_pass_rates[establishment.id_establishment])
        if establishment.id_establishment in best_pass_rates
        else None
    )

    same_type_ids = [
        entity.id_establishment
        for entity in published
        if entity.id_type == establishment.id_type
    ]
    same_min = [
        float(fee_minimums[entity_id])
        for entity_id in same_type_ids
        if fee_minimums.get(entity_id) is not None
    ]
    same_pass = [
        float(best_pass_rates[entity_id])
        for entity_id in same_type_ids
        if best_pass_rates.get(entity_id) is not None
    ]
    avg_min = round(sum(same_min) / len(same_min)) if same_min else None
    avg_pass = round(sum(same_pass) / len(same_pass), 1) if same_pass else None

    return ManagerBenchmarks(
        your_min_tuition=your_min,
        avg_min_tuition_same_type=avg_min,
        same_type_sample_size=len(same_type_ids),
        your_best_pass_rate=your_pass,
        avg_best_pass_rate_same_type=avg_pass,
        pass_rate_sample_size=len(same_pass),
    )


from app.core.config import MEDIA_DIR

ALLOWED_MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
MAX_MEDIA_BYTES = 5 * 1024 * 1024


@public_router.post(
    "/my/establishments/{establishment_uuid}/media",
    response_model=ManagerEstablishmentDetail,
)
def upload_establishment_media(
    establishment_uuid: str,
    file: UploadFile = File(...),
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    try:
        establishment = get_owned_establishment_or_error(session, current_user, establishment_uuid)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_MEDIA_EXT:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    content = file.file.read()
    if len(content) > MAX_MEDIA_BYTES:
        raise HTTPException(status_code=400, detail="File too large (5 MB max)")
    media_type = MediaType.pdf if ext == ".pdf" else MediaType.image
    stored_name = f"{uuid_lib.uuid4().hex}{ext}"
    with open(os.path.join(MEDIA_DIR, stored_name), "wb") as out:
        out.write(content)
    media = Media(
        id_establishment=establishment.id_establishment,
        type=media_type,
        url=f"/media/{stored_name}",
        caption=file.filename or None,
    )
    session.add(media)
    session.commit()
    pending = session.exec(
        select(Submission).where(
            Submission.id_establishment == establishment.id_establishment,
            Submission.status == SubmissionStatus.pending,
        )
    ).first()
    return to_manager_establishment_detail(establishment, has_pending_submission=pending is not None)


@public_router.delete("/my/establishments/{establishment_uuid}/media/{media_id}")
def delete_establishment_media(
    establishment_uuid: str,
    media_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    try:
        establishment = get_owned_establishment_or_error(session, current_user, establishment_uuid)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    media = session.get(Media, media_id)
    if media is None or media.id_establishment != establishment.id_establishment:
        raise HTTPException(status_code=404, detail="Media not found")
    file_name = media.url.rsplit("/", 1)[-1]
    file_path = os.path.join(MEDIA_DIR, file_name)
    if os.path.exists(file_path):
        os.remove(file_path)
    session.delete(media)
    session.commit()
    return {"deleted": media_id}


# --- Espace administrateur ---------------------------------------------------


def _to_admin_decision_response(submission, establishment) -> AdminDecisionResponse:
    return AdminDecisionResponse(
        submission_uuid=submission.uuid,
        submission_status=submission.status.value,
        establishment_status=establishment.status.value,
    )


@public_router.get("/admin/submissions", response_model=list[AdminSubmissionItem])
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


@public_router.get("/admin/submissions/{submission_uuid}", response_model=AdminSubmissionDetail)
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


@public_router.post(
    "/admin/submissions/{submission_uuid}/approve",
    response_model=AdminDecisionResponse,
)
def approve_submission_endpoint(
    submission_uuid: str,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        submission, establishment = approve_submission(session, current_user, submission_uuid)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except SubmissionNotPendingError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except ValueError as error:
        
        raise HTTPException(status_code=409, detail=str(error))
    return _to_admin_decision_response(submission, establishment)


@public_router.post(
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
