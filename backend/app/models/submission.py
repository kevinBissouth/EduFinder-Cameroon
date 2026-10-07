from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any
import uuid as uuid_lib

from sqlalchemy import JSON, Column, UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import (
    DecisionStatus,
    EstablishmentStatus,
    SubmissionStatus,
    SubmissionType,
)

if TYPE_CHECKING:
    from app.models.establishment import Establishment
    from app.models.user import User


# Demande de création ou modification d'un établissement, soumise par un
# manager et en attente de décision. Le contenu complet des changements est
# stocké en JSON dans `content`.
class Submission(SQLModel, table=True):
    __tablename__ = "submission"

    id_submission: int = Field(primary_key=True)
    # Identifiant public de la soumission : l'admin et le responsable
    # manipulent cet UUID, jamais la clé interne.
    uuid: str = Field(
        default_factory=lambda: str(uuid_lib.uuid4()),
        max_length=36,
        unique=True,
        index=True,
    )
    id_user: int = Field(foreign_key="user.id_user")
    id_establishment: int = Field(foreign_key="establishment.id_establishment")
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    type: SubmissionType
    status: SubmissionStatus
    # Une soumission création/modification sans contenu n'a aucun sens : le
    # payload JSON est obligatoire, y compris en base (pas seulement côté API).
    content: dict[str, Any] = Field(sa_column=Column(JSON, nullable=False))

    user: Mapped["User"] = Relationship(back_populates="submissions")
    establishment: Mapped["Establishment"] = Relationship(back_populates="submissions")
    decision: Mapped["ValidationDecision"] = Relationship(back_populates="submission")


# Décision (approbation ou refus avec motif) portée par un super_admin sur
# une soumission.
class ValidationDecision(SQLModel, table=True):
    __tablename__ = "validation_decision"
    # Relation 1-pour-1 avec submission : cette unicité interdit deux décisions
    # pour la même soumission (une révision = une nouvelle soumission).
    __table_args__ = (
        UniqueConstraint("id_submission", name="uq_validation_decision_submission"),
    )

    id_decision: int = Field(primary_key=True)
    id_submission: int = Field(foreign_key="submission.id_submission")
    id_user: int = Field(foreign_key="user.id_user")
    decided_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: DecisionStatus
    rejection_reason: str | None = Field(default=None, max_length=500)

    submission: Mapped["Submission"] = Relationship(back_populates="decision")
    user: Mapped["User"] = Relationship(back_populates="decisions")


# Historique des changements de statut décidés directement par un super_admin
# (suspension, réactivation). Ces actions ne passent par aucune soumission,
# donc validation_decision ne peut pas les porter : je les trace ici pour
# savoir qui a fait quoi, quand et pourquoi.
class EstablishmentStatusChange(SQLModel, table=True):
    __tablename__ = "establishment_status_change"

    id_status_change: int = Field(primary_key=True)
    id_establishment: int = Field(foreign_key="establishment.id_establishment")
    id_user: int = Field(foreign_key="user.id_user")
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    previous_status: EstablishmentStatus
    new_status: EstablishmentStatus
    # Obligatoire pour une suspension (exigé par le schéma d'entrée), absent
    # pour une réactivation.
    reason: str | None = Field(default=None, max_length=500)
