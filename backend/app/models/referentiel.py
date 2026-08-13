from typing import TYPE_CHECKING

from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.etablissement import Etablissement, FraisScolarite, Propose, ResultatExamen, SePaiePar


class Region(SQLModel, table=True):
    __tablename__ = "region"

    id_region: int = Field(primary_key=True)
    nom: str = Field(max_length=100)

    villes: Mapped[list["Ville"]] = Relationship(back_populates="region")


class TypeEtablissement(SQLModel, table=True):
    __tablename__ = "type_etablissement"

    id_type: int = Field(primary_key=True)
    libelle: str = Field(max_length=100)

    etablissements: Mapped[list["Etablissement"]] = Relationship(back_populates="type")


class Ville(SQLModel, table=True):
    __tablename__ = "ville"
    __table_args__ = (UniqueConstraint("nom", "id_region", name="uq_ville_nom_region"),)

    id_ville: int = Field(primary_key=True)
    id_region: int = Field(foreign_key="region.id_region")
    nom: str = Field(max_length=100)

    region: Mapped["Region"] = Relationship(back_populates="villes")
    etablissements: Mapped[list["Etablissement"]] = Relationship(back_populates="ville")


class NiveauEtude(SQLModel, table=True):
    __tablename__ = "niveau_etude"

    id_niveau: int = Field(primary_key=True)
    libelle: str = Field(max_length=100)

    frais: Mapped[list["FraisScolarite"]] = Relationship(back_populates="niveau")


class Filiere(SQLModel, table=True):
    __tablename__ = "filiere"

    id_filiere: int = Field(primary_key=True)
    nom: str = Field(max_length=100)

    etablissements_proposes: Mapped[list["Propose"]] = Relationship(back_populates="filiere")


class Examen(SQLModel, table=True):
    __tablename__ = "examen"

    id_examen: int = Field(primary_key=True)
    libelle: str = Field(max_length=100)

    resultats: Mapped[list["ResultatExamen"]] = Relationship(back_populates="examen")


class ModalitePaiement(SQLModel, table=True):
    __tablename__ = "modalite_paiement"

    id_modalite: int = Field(primary_key=True)
    libelle: str = Field(max_length=100)

    frais_par_modalites: Mapped[list["SePaiePar"]] = Relationship(back_populates="modalite")