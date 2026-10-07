
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

EstablishmentName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=2, max_length=255),
]

SchoolYear = Annotated[str, StringConstraints(pattern=r"^\d{4}-\d{4}$")]
ServiceNameInput = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=100),
]

PaymentMethodLabel = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=100),
]

ExamSession = Annotated[str, StringConstraints(pattern=r"^\d{4}$")]


class ExamResultInput(BaseModel):
    id_exam: int
    session: ExamSession
    pass_rate: Decimal = Field(ge=0, le=100, description="Pass rate in %")


class UploadedFileResponse(BaseModel):
    url: str


class SchoolFeeInput(BaseModel):
    id_level: int
    amount: Decimal = Field(gt=0, description="Annual fee in FCFA")
    school_year: SchoolYear
    # Modalités de paiement (labels, ex. « 2 tranches ») : absentes = inchangées
    # pour une modification, pratiques pour créer un frais avec ses plans.
    payment_methods: list[PaymentMethodLabel] | None = Field(default=None, max_length=10)


class CreationProposalInput(BaseModel):

    name: EstablishmentName
    id_city: int
    id_type: int
    id_sector: int
    id_linguistic_section: int
    phone: Annotated[str | None, StringConstraints(max_length=20)] = None
    # Coordonnées géographiques : nécessaires à la carte du profil (aucune
    # géolocalisation automatique côté serveur, le responsable les saisit).
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    contact_email: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=255)] = None
    website: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=255)] = None
    address: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=255)] = None
    description: str | None = None
    director_name: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=120)] = None
    director_title: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=80)] = None
    director_bio: str | None = None
    fees: list[SchoolFeeInput] = Field(default_factory=list, max_length=20)
    services: list[ServiceNameInput] = Field(default_factory=list, max_length=15)
    program_ids: list[int] = Field(default_factory=list, max_length=15)
    exam_results: list[ExamResultInput] = Field(default_factory=list, max_length=30)
    # Médias soumis lors de la création : photo de couverture (une) et vidéos
    # (URLs d'upload). Elles sont créées en lignes Media à la validation.
    cover_photo: str | None = Field(default=None, max_length=500)
    videos: list[str] = Field(default_factory=list, max_length=10)
    # Photo du directeur soumise à la création (URL d'upload, appliquée à
    # l'approbation, comme la couverture).
    director_photo: str | None = Field(default=None, max_length=500)


class ModificationProposalInput(BaseModel):

    name: EstablishmentName | None = None
    id_city: int | None = None
    id_type: int | None = None
    id_sector: int | None = None
    id_linguistic_section: int | None = None
    phone: Annotated[str | None, StringConstraints(max_length=20)] = None
    contact_email: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=255)] = None
    website: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=255)] = None
    address: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=255)] = None
    description: str | None = None
    director_name: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=120)] = None
    director_title: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=80)] = None
    director_bio: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    fees: list[SchoolFeeInput] | None = Field(default=None, max_length=20)
    services: list[ServiceNameInput] | None = Field(default=None, max_length=15)
    program_ids: list[int] | None = Field(default=None, max_length=15)
    exam_results: list[ExamResultInput] | None = Field(default=None, max_length=30)
    # Modification de la photo du directeur via une proposition (URL d'upload,
    # appliquée à l'approbation).
    director_photo: str | None = None


class ProposalCreatedResponse(BaseModel):
    establishment_uuid: str
    submission_uuid: str
    establishment_status: str
    submission_status: str


class ManagerEstablishmentItem(BaseModel):

    establishment_uuid: str
    name: str
    establishment_status: str
    has_pending_submission: bool
    cover_url: str | None = None
    city: str | None = None
    type: str | None = None
    sector: str | None = None
    published_year: str | None = None


class ManagerSubmissionItem(BaseModel):
    submission_uuid: str
    establishment_uuid: str
    establishment_name: str
    submission_type: str
    submission_status: str
    submitted_at: datetime
    rejection_reason: str | None = None
    # Le contenu exact des changements proposés : sert à afficher au manager
    # ce qu'il a soumis (détail des modifications) dans la fiche de soumission.
    content: dict = Field(default_factory=dict)


# Motif saisi par le super admin : obligatoire et non vide pour un refus comme
# pour une suspension, car le responsable doit pouvoir comprendre la décision.
DecisionReason = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=3, max_length=500),
]


class RejectionInput(BaseModel):
    reason: DecisionReason


class SuspensionInput(BaseModel):
    reason: DecisionReason


class AdminSubmissionItem(BaseModel):
    submission_uuid: str
    establishment_uuid: str
    establishment_name: str
    proposer_name: str
    submission_type: str
    submission_status: str
    submitted_at: datetime
    rejection_reason: str | None = None


class AdminSubmissionDetail(AdminSubmissionItem):
    content: dict


class AdminDecisionResponse(BaseModel):
    submission_uuid: str
    submission_status: str
    establishment_status: str


class AdminEstablishmentItem(BaseModel):
    # Vue super-admin de tous les établissements : un établissement peut être
    # géré par plusieurs responsables, d'où une liste de propriétaires.
    establishment_uuid: str
    name: str
    establishment_status: str
    city: str | None = None
    type: str | None = None
    sector: str | None = None
    owners: list[str] = Field(default_factory=list)
    # Renseigné uniquement pour un établissement actuellement suspendu.
    suspension_reason: str | None = None


class AdminEstablishmentStatusResponse(BaseModel):
    establishment_uuid: str
    establishment_status: str
