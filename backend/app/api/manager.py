"""Espace responsable : gestion des établissements confiés, propositions de
création/modification, benchmark et fichiers média.

Toute route repose sur get_owned_establishment_or_error : un responsable ne
voit et ne modifie QUE les établissements liés dans user_establishment (403
sinon). La vérification est faite côté serveur, jamais côté client.
"""
import os
import uuid as uuid_lib
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select

from app.api.common import collect_summary_extras, proposal_error_status
from app.api.dependencies import require_manager_or_admin
from app.core.config import MEDIA_DIR
from app.db.session import get_db
from app.models import (
    Establishment,
    EstablishmentStatus,
    Media,
    MediaType,
    Submission,
    SubmissionStatus,
    User,
)
from app.schemas.institution import (
    ManagerBenchmarks,
    ManagerEstablishmentDetail,
    to_manager_establishment_detail,
)
from app.schemas.proposal import (
    CreationProposalInput,
    ManagerEstablishmentItem,
    ManagerSubmissionItem,
    ModificationProposalInput,
    ProposalCreatedResponse,
    UploadedFileResponse,
)
from app.services.proposals import (
    create_creation_proposal,
    create_modification_proposal,
    get_owned_establishment_or_error,
    list_manager_establishments,
    list_manager_submissions,
)

manager_router = APIRouter()


@manager_router.post(
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
        raise HTTPException(
            status_code=proposal_error_status(error), detail=str(error)
        )
    return ProposalCreatedResponse(
        establishment_uuid=establishment.uuid,
        submission_uuid=submission.uuid,
        establishment_status=establishment.status.value,
        submission_status=submission.status.value,
    )


@manager_router.get("/my/establishments", response_model=list[ManagerEstablishmentItem])
def list_my_establishments(
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return [
        ManagerEstablishmentItem(**item)
        for item in list_manager_establishments(session, current_user)
    ]


@manager_router.post(
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
        raise HTTPException(
            status_code=proposal_error_status(error), detail=str(error)
        )
    return ProposalCreatedResponse(
        establishment_uuid=establishment.uuid,
        submission_uuid=submission.uuid,
        establishment_status=establishment.status.value,
        submission_status=submission.status.value,
    )


@manager_router.get("/my/submissions", response_model=list[ManagerSubmissionItem])
def list_my_submissions(
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return [
        ManagerSubmissionItem(**item)
        for item in list_manager_submissions(session, current_user)
    ]


@manager_router.get(
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


@manager_router.get(
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


# --- Fichiers média ----------------------------------------------------------


# Limites et types acceptés : je vérifie le contenu réel (magic bytes), pas
# seulement l'extension déposée par le client qui est triviale à contrefaire.
MAX_MEDIA_BYTES = 5 * 1024 * 1024
# Les vidéos sont plus lourdes : plafond distinct, toujours borné côté serveur.
MAX_VIDEO_BYTES = 100 * 1024 * 1024


def _detect_media_type(raw_content: bytes) -> tuple[str, MediaType] | None:
    """Déduit (extension, type de média) des octets réels du fichier uploadé.

    Les premières signatures sont vérifiées en priorité ; le WEBP demande une
    vérification supplémentaire (en-tête RIFF ... WEBP) pour ne pas confondre
    avec d'autres conteneurs RIFF. Les vidéos MP4/WebM sont reconnues par
    leur signature (ftyp / EBML) avant tout traitement.
    """
    if raw_content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png", MediaType.image
    if raw_content.startswith(b"\xff\xd8\xff"):
        return ".jpg", MediaType.image
    if (
        raw_content.startswith(b"RIFF")
        and len(raw_content) >= 12
        and raw_content[8:12] == b"WEBP"
    ):
        return ".webp", MediaType.image
    if raw_content.startswith(b"%PDF"):
        return ".pdf", MediaType.pdf
    if raw_content.startswith(b"\x00\x00\x00\x18ftyp"):
        return ".mp4", MediaType.video
    if raw_content.startswith(b"\x1a\x45\xdf\xa3"):
        return ".webm", MediaType.video
    return None


def _save_uploaded_file(content: bytes) -> str:
    """Écrit le fichier uploadé sur disque et renvoie l'URL publique."""
    stored_name = f"{uuid_lib.uuid4().hex}{_detect_media_type(content)[0]}"
    with open(os.path.join(MEDIA_DIR, stored_name), "wb") as out:
        out.write(content)
    return f"/media/{stored_name}"


@manager_router.post(
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
        establishment = get_owned_establishment_or_error(
            session, current_user, establishment_uuid
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    detected = _detect_media_type(content)
    if detected is None:
        raise HTTPException(
            status_code=400, detail="Unsupported file type (allowed: jpg, png, webp, mp4, webm)"
        )
    _, media_type = detected
    size_limit = MAX_VIDEO_BYTES if media_type == MediaType.video else MAX_MEDIA_BYTES
    if len(content) > size_limit:
        raise HTTPException(
            status_code=400,
            detail=(
                "File too large (100 MB max for videos, 5 MB otherwise)"
            ),
        )

    media = Media(
        id_establishment=establishment.id_establishment,
        type=media_type,
        url=_save_uploaded_file(content),
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
    return to_manager_establishment_detail(
        establishment, has_pending_submission=pending is not None
    )


@manager_router.delete("/my/establishments/{establishment_uuid}/media/{media_id}")
def delete_establishment_media(
    establishment_uuid: str,
    media_id: int,
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
    media = session.get(Media, media_id)
    if media is None or media.id_establishment != establishment.id_establishment:
        raise HTTPException(status_code=404, detail="Media not found")

    # Le chemin est borné au dossier média : j'extraie uniquement le nom de
    # fichier et je rejette toute tentative de sortie (.., slash).
    file_name = os.path.basename(media.url)
    file_path = os.path.join(MEDIA_DIR, file_name)
    # Je vérifie que la cible résout bien dans MEDIA_DIR (rejet si traversal).
    if os.path.abspath(file_path).startswith(os.path.abspath(MEDIA_DIR) + os.sep):
        if os.path.exists(file_path):
            os.remove(file_path)
    session.delete(media)
    session.commit()
    return {"deleted": media_id}


@manager_router.post("/my/uploads/media", response_model=UploadedFileResponse)
def upload_media_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_manager_or_admin),
):
    """Upload d'un média détaché (écran de création) : stocke le fichier et
    renvoie son URL, sans créer de ligne Media — c'est la validation de la
    proposition qui matérialisera la relation à l'établissement.
    """
    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    detected = _detect_media_type(content)
    if detected is None:
        raise HTTPException(
            status_code=400, detail="Unsupported file type (allowed: jpg, png, webp, mp4, webm)"
        )
    _, media_type = detected
    size_limit = MAX_VIDEO_BYTES if media_type == MediaType.video else MAX_MEDIA_BYTES
    if len(content) > size_limit:
        raise HTTPException(
            status_code=400,
            detail=(
                "File too large (100 MB max for videos, 5 MB otherwise)"
            ),
        )
    return UploadedFileResponse(url=_save_uploaded_file(content))


@manager_router.put(
    "/my/establishments/{establishment_uuid}/director-photo",
    response_model=ManagerEstablishmentDetail,
)
def update_director_photo(
    establishment_uuid: str,
    file: UploadFile = File(...),
    session: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    """Remplace la photo du directeur : écriture directe sur la fiche (comme
    pour les médias de la galerie, gérée par le responsable sans validation
    administrateur).
    """
    try:
        establishment = get_owned_establishment_or_error(
            session, current_user, establishment_uuid
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > MAX_MEDIA_BYTES:
        raise HTTPException(status_code=400, detail="File too large (5 MB max)")

    detected = _detect_media_type(content)
    if detected is None or detected[1] != MediaType.image:
        raise HTTPException(
            status_code=400, detail="Unsupported file type (allowed: jpg, png, webp)"
        )

    establishment.director_photo_url = _save_uploaded_file(content)
    session.add(establishment)
    session.commit()
    pending = session.exec(
        select(Submission).where(
            Submission.id_establishment == establishment.id_establishment,
            Submission.status == SubmissionStatus.pending,
        )
    ).first()
    return to_manager_establishment_detail(
        establishment, has_pending_submission=pending is not None
    )
