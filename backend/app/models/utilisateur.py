from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import RoleUtilisateur

if TYPE_CHECKING:
    from app.models.etablissement import Gere
    from app.models.soumission import DecisionValidation, Soumission


class Utilisateur(SQLModel, table=True):
    __tablename__ = "utilisateur"

    id_utilisateur: int = Field(primary_key=True)
    nom: str = Field(max_length=255)
    email: str = Field(max_length=255, unique=True)
    mot_de_passe: str = Field(max_length=255)
    role: RoleUtilisateur
    date_creation: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    geres: Mapped[list["Gere"]] = Relationship(back_populates="utilisateur")
    soumissions: Mapped[list["Soumission"]] = Relationship(back_populates="utilisateur")
    decisions: Mapped[list["DecisionValidation"]] = Relationship(back_populates="utilisateur")