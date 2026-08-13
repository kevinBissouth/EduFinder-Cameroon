from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Column
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import StatutDecision, StatutSoumission, TypeSoumission

if TYPE_CHECKING:
    from app.models.etablissement import Etablissement
    from app.models.utilisateur import Utilisateur


class Soumission(SQLModel, table=True):
    __tablename__ = "soumission"

    id_soumission: int = Field(primary_key=True)
    id_utilisateur: int = Field(foreign_key="utilisateur.id_utilisateur")
    id_etablissement: int = Field(foreign_key="etablissement.id_etablissement")
    date_soumission: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    type: TypeSoumission
    statut: StatutSoumission
    contenu: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))

    utilisateur: Mapped["Utilisateur"] = Relationship(back_populates="soumissions")
    etablissement: Mapped["Etablissement"] = Relationship(back_populates="soumissions")
    decision: Mapped["DecisionValidation"] = Relationship(back_populates="soumission")


class DecisionValidation(SQLModel, table=True):
    __tablename__ = "decision_validation"

    id_decision: int = Field(primary_key=True)
    id_soumission: int = Field(foreign_key="soumission.id_soumission")
    id_utilisateur: int = Field(foreign_key="utilisateur.id_utilisateur")
    date_decision: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    statut: StatutDecision
    raison_rejet: str | None = Field(default=None, max_length=500)

    soumission: Mapped["Soumission"] = Relationship(back_populates="decision")
    utilisateur: Mapped["Utilisateur"] = Relationship(back_populates="decisions")