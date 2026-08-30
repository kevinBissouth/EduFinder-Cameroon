from typing import TYPE_CHECKING

from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.establishment import Establishment, ExamResult, ProgramOffer, SchoolFee, SchoolFeePaymentMethod


# Découpage administratif : une région regroupe plusieurs villes.
class Region(SQLModel, table=True):
    __tablename__ = "region"
    __table_args__ = (UniqueConstraint("name", name="uq_region_name"),)

    id_region: int = Field(primary_key=True)
    name: str = Field(max_length=100)

    cities: Mapped[list["City"]] = Relationship(back_populates="region")


# Type d'établissement : maternelle, primaire, secondaire, université…
class EstablishmentType(SQLModel, table=True):
    __tablename__ = "establishment_type"

    id_type: int = Field(primary_key=True)
    label: str = Field(max_length=100)

    establishments: Mapped[list["Establishment"]] = Relationship(back_populates="type")


# Ville rattachée à une région ; les établissements y sont localisés.
class City(SQLModel, table=True):
    __tablename__ = "city"
    __table_args__ = (UniqueConstraint("name", "id_region", name="uq_city_name_region"),)

    id_city: int = Field(primary_key=True)
    id_region: int = Field(foreign_key="region.id_region")
    name: str = Field(max_length=100)

    region: Mapped["Region"] = Relationship(back_populates="cities")
    establishments: Mapped[list["Establishment"]] = Relationship(back_populates="city")


# Niveau d'étude (Petite Section, CP, 6e, Licence 1…) rattaché à une étape ;
# les frais de scolarité se définissent par niveau.
class StudyLevel(SQLModel, table=True):
    __tablename__ = "study_level"
    __table_args__ = (
        UniqueConstraint("id_stage", "label", name="uq_study_level_stage_label"),
    )

    id_level: int = Field(primary_key=True)
    id_stage: int = Field(foreign_key="stage.id_stage")
    label: str = Field(max_length=100)

    stage: Mapped["Stage"] = Relationship(back_populates="study_levels")
    fees: Mapped[list["SchoolFee"]] = Relationship(back_populates="level")


# Étape de scolarité (maternelle, primaire, secondaire, supérieur) qui
# regroupe les niveaux d'étude.
class Stage(SQLModel, table=True):
    __tablename__ = "stage"
    __table_args__ = (UniqueConstraint("label", name="uq_stage_label"),)

    id_stage: int = Field(primary_key=True)
    label: str = Field(max_length=100)

    study_levels: Mapped[list["StudyLevel"]] = Relationship(back_populates="stage")


# Filière ou programme offert par un établissement (Informatique, Santé…).
class Program(SQLModel, table=True):
    __tablename__ = "program"
    # Sans unicité, deux lignes du même nom fragmenteraient le filtre par programme.
    __table_args__ = (UniqueConstraint("name", name="uq_program_name"),)

    id_program: int = Field(primary_key=True)
    name: str = Field(max_length=100)

    establishment_offers: Mapped[list["ProgramOffer"]] = Relationship(back_populates="program")


# Examen officiel (CEP, BEPC, Probatoire, Bac…).
class Exam(SQLModel, table=True):
    __tablename__ = "exam"

    id_exam: int = Field(primary_key=True)
    label: str = Field(max_length=100)

    exam_results: Mapped[list["ExamResult"]] = Relationship(back_populates="exam")


# Modalité de paiement des frais (1 tranche, 2 tranches, trimestriel…).
class PaymentMethod(SQLModel, table=True):
    __tablename__ = "payment_method"

    id_payment_method: int = Field(primary_key=True)
    label: str = Field(max_length=100)

    fees: Mapped[list["SchoolFeePaymentMethod"]] = Relationship(back_populates="payment_method")


# Secteur de l'établissement : public ou privé. Le regroupement public/privé
# repose sur cette colonne dédiée et jamais sur le texte du libellé : les
# libellés réels sont hétérogènes (« private », « privé »…).
class Sector(SQLModel, table=True):
    __tablename__ = "sector"

    id_sector: int = Field(primary_key=True)
    label: str = Field(max_length=100)
    is_public: bool = Field(default=False)

    establishments: Mapped[list["Establishment"]] = Relationship(back_populates="sector")


# Section linguistique de l'établissement : francophone, anglophone, bilingue.
class LinguisticSection(SQLModel, table=True):
    __tablename__ = "linguistic_section"

    id_linguistic_section: int = Field(primary_key=True)
    label: str = Field(max_length=100)

    establishments: Mapped[list["Establishment"]] = Relationship(back_populates="linguistic_section")