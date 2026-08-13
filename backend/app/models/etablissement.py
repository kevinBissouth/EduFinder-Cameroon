from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DECIMAL, Column, UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import StatutEtablissement, TypeMedia

if TYPE_CHECKING:
    from app.models.referentiel import Examen, Filiere, ModalitePaiement, NiveauEtude, TypeEtablissement, Ville
    from app.models.soumission import Soumission
    from app.models.utilisateur import Utilisateur


class Propose(SQLModel, table=True):
    __tablename__ = "propose"

    id_etablissement: int = Field(primary_key=True, foreign_key="etablissement.id_etablissement")
    id_filiere: int = Field(primary_key=True, foreign_key="filiere.id_filiere")

    etablissement: Mapped["Etablissement"] = Relationship(back_populates="proposes")
    filiere: Mapped["Filiere"] = Relationship(back_populates="etablissements_proposes")


class SePaiePar(SQLModel, table=True):
    __tablename__ = "se_paie_par"

    id_frais: int = Field(primary_key=True, foreign_key="frais_scolarite.id_frais")
    id_modalite: int = Field(primary_key=True, foreign_key="modalite_paiement.id_modalite")

    frais: Mapped["FraisScolarite"] = Relationship(back_populates="se_paie_pars")
    modalite: Mapped["ModalitePaiement"] = Relationship(back_populates="frais_par_modalites")


class Gere(SQLModel, table=True):
    __tablename__ = "gere"

    id_utilisateur: int = Field(primary_key=True, foreign_key="utilisateur.id_utilisateur")
    id_etablissement: int = Field(primary_key=True, foreign_key="etablissement.id_etablissement")

    utilisateur: Mapped["Utilisateur"] = Relationship(back_populates="geres")
    etablissement: Mapped["Etablissement"] = Relationship(back_populates="geres")


class Etablissement(SQLModel, table=True):
    __tablename__ = "etablissement"

    id_etablissement: int = Field(primary_key=True)
    id_ville: int = Field(foreign_key="ville.id_ville")
    id_type: int = Field(foreign_key="type_etablissement.id_type")
    nom: str = Field(max_length=255)
    description: str | None = Field(default=None)
    adresse: str | None = Field(default=None, max_length=255)
    statut: StatutEtablissement
    telephone: str | None = Field(default=None, max_length=20)
    email_contact: str | None = Field(default=None, max_length=255)
    site_web: str | None = Field(default=None, max_length=255)

    ville: Mapped["Ville"] = Relationship(back_populates="etablissements")
    type: Mapped["TypeEtablissement"] = Relationship(back_populates="etablissements")
    proposes: Mapped[list["Propose"]] = Relationship(back_populates="etablissement")
    geres: Mapped[list["Gere"]] = Relationship(back_populates="etablissement")
    frais: Mapped[list["FraisScolarite"]] = Relationship(back_populates="etablissement")
    services: Mapped[list["Service"]] = Relationship(back_populates="etablissement")
    resultats: Mapped[list["ResultatExamen"]] = Relationship(back_populates="etablissement")
    medias: Mapped[list["Media"]] = Relationship(back_populates="etablissement")
    soumissions: Mapped[list["Soumission"]] = Relationship(back_populates="etablissement")


class FraisScolarite(SQLModel, table=True):
    __tablename__ = "frais_scolarite"
    __table_args__ = (
        UniqueConstraint("id_etablissement", "id_niveau", "annee_scolaire", name="uq_frais_etab_niveau_annee"),
    )

    id_frais: int = Field(primary_key=True)
    id_etablissement: int = Field(foreign_key="etablissement.id_etablissement")
    id_niveau: int = Field(foreign_key="niveau_etude.id_niveau")
    montant: Decimal = Field(sa_column=Column(DECIMAL(12, 2), nullable=False))
    annee_scolaire: str = Field(max_length=9)

    etablissement: Mapped["Etablissement"] = Relationship(back_populates="frais")
    niveau: Mapped["NiveauEtude"] = Relationship(back_populates="frais")
    se_paie_pars: Mapped[list["SePaiePar"]] = Relationship(back_populates="frais")


class Service(SQLModel, table=True):
    __tablename__ = "service"

    id_service: int = Field(primary_key=True)
    id_etablissement: int = Field(foreign_key="etablissement.id_etablissement")
    nom: str = Field(max_length=100)
    description: str | None = Field(default=None)

    etablissement: Mapped["Etablissement"] = Relationship(back_populates="services")


class ResultatExamen(SQLModel, table=True):
    __tablename__ = "resultat_examen"
    __table_args__ = (
        UniqueConstraint("id_etablissement", "id_examen", "session", name="uq_resultat_etab_examen_session"),
    )

    id_resultat: int = Field(primary_key=True)
    id_etablissement: int = Field(foreign_key="etablissement.id_etablissement")
    id_examen: int = Field(foreign_key="examen.id_examen")
    session: str = Field(max_length=20)
    taux_reussite: Decimal = Field(sa_column=Column(DECIMAL(5, 2), nullable=False))

    etablissement: Mapped["Etablissement"] = Relationship(back_populates="resultats")
    examen: Mapped["Examen"] = Relationship(back_populates="resultats")


class Media(SQLModel, table=True):
    __tablename__ = "media"

    id_media: int = Field(primary_key=True)
    id_etablissement: int = Field(foreign_key="etablissement.id_etablissement")
    type: TypeMedia
    url: str = Field(max_length=500)
    legende: str | None = Field(default=None)

    etablissement: Mapped["Etablissement"] = Relationship(back_populates="medias")