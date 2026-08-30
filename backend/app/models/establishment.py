from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING
import uuid as uuid_lib

from sqlalchemy import DECIMAL, CheckConstraint, Column, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import EstablishmentStatus, MediaType

if TYPE_CHECKING:
    from app.models.reference import Exam, PaymentMethod, Program, StudyLevel, EstablishmentType, City, Sector, LinguisticSection
    from app.models.submission import Submission
    from app.models.user import User



class ProgramOffer(SQLModel, table=True):
    __tablename__ = "program_offer"

    id_establishment: int = Field(primary_key=True, foreign_key="establishment.id_establishment")
    id_program: int = Field(primary_key=True, foreign_key="program.id_program")

    establishment: Mapped["Establishment"] = Relationship(back_populates="program_offers")
    program: Mapped["Program"] = Relationship(back_populates="establishment_offers")


class SchoolFeePaymentMethod(SQLModel, table=True):
    __tablename__ = "school_fee_payment_method"

    id_fee: int = Field(primary_key=True, foreign_key="school_fee.id_fee")
    id_payment_method: int = Field(primary_key=True, foreign_key="payment_method.id_payment_method")

    fee: Mapped["SchoolFee"] = Relationship(back_populates="payment_methods")
    payment_method: Mapped["PaymentMethod"] = Relationship(back_populates="fees")


class UserEstablishment(SQLModel, table=True):
    __tablename__ = "user_establishment"

    id_user: int = Field(primary_key=True, foreign_key="user.id_user")
    id_establishment: int = Field(primary_key=True, foreign_key="establishment.id_establishment")

    user: Mapped["User"] = Relationship(back_populates="user_establishments")
    establishment: Mapped["Establishment"] = Relationship(back_populates="user_establishments")



class Establishment(SQLModel, table=True):
    __tablename__ = "establishment"

    id_establishment: int = Field(primary_key=True)
    # Identifiant public non devinable, exposé dans les URLs et l'API ;
    # l'entier auto-incrémenté reste un détail interne.
    uuid: str = Field(
        default_factory=lambda: str(uuid_lib.uuid4()),
        max_length=36,
        unique=True,
        index=True,
    )
    id_city: int = Field(foreign_key="city.id_city")
    id_type: int = Field(foreign_key="establishment_type.id_type")
    id_sector: int = Field(foreign_key="sector.id_sector")
    id_linguistic_section: int = Field(foreign_key="linguistic_section.id_linguistic_section")
    name: str = Field(max_length=255)
    description: str | None = Field(default=None)
    # Responsable de l'établissement (directeur / proviseur) : distinct du
    # compte du gestionnaire. Mis en avant dans la présentation documentaire.
    director_name: str | None = Field(default=None, max_length=120)
    director_title: str | None = Field(default=None, max_length=80)
    director_bio: str | None = Field(default=None)
    # Photo du responsable (directeur / proviseur) : distincte de la galerie de
    # l'établissement, illustration de la fiche Leadership.
    director_photo_url: str | None = Field(default=None, max_length=500)
    address: str | None = Field(default=None, max_length=255)
    # Coordonnées GPS optionnelles (géocodage de l'adresse + ville) ; une
    # école sans point précis est située via sa ville côté rendu.
    latitude: Decimal | None = Field(
        default=None, sa_column=Column(DECIMAL(9, 6), nullable=True)
    )
    longitude: Decimal | None = Field(
        default=None, sa_column=Column(DECIMAL(9, 6), nullable=True)
    )
    status: EstablishmentStatus
    phone: str | None = Field(default=None, max_length=20)
    contact_email: str | None = Field(default=None, max_length=255)
    website: str | None = Field(default=None, max_length=255)
    # Établissement mis en avant par l'équipe éditoriale : il remonte en tête
    # de la recherche publique et reçoit un badge « Recommended » côté UI.
    recommended: bool = Field(default=False)
    # Indicateurs de performance vus par le responsable (incrémentés côté
    # public, jamais exposés publiquement) : vues de la fiche et demandes
    # d'admission (clic sur l'e-mail du secrétariat).
    views_count: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default="0"))
    inquiries_count: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default="0"))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Reste à NULL tant que l'établissement n'a jamais été modifié.
    updated_at: datetime | None = Field(default=None)

    city: Mapped["City"] = Relationship(back_populates="establishments")
    type: Mapped["EstablishmentType"] = Relationship(back_populates="establishments")
    sector: Mapped["Sector"] = Relationship(back_populates="establishments")
    linguistic_section: Mapped["LinguisticSection"] = Relationship(back_populates="establishments")
    program_offers: Mapped[list["ProgramOffer"]] = Relationship(back_populates="establishment")
    user_establishments: Mapped[list["UserEstablishment"]] = Relationship(back_populates="establishment")
    fees: Mapped[list["SchoolFee"]] = Relationship(back_populates="establishment")
    services: Mapped[list["Service"]] = Relationship(back_populates="establishment")
    exam_results: Mapped[list["ExamResult"]] = Relationship(back_populates="establishment")
    media: Mapped[list["Media"]] = Relationship(back_populates="establishment")
    submissions: Mapped[list["Submission"]] = Relationship(back_populates="establishment")


class SchoolFee(SQLModel, table=True):
    __tablename__ = "school_fee"
    __table_args__ = (
        UniqueConstraint("id_establishment", "id_level", "school_year", name="uq_fee_establishment_level_school_year"),
        CheckConstraint("amount >= 0", name="ck_school_fee_amount_positive"),
    )

    id_fee: int = Field(primary_key=True)
    id_establishment: int = Field(foreign_key="establishment.id_establishment")
    id_level: int = Field(foreign_key="study_level.id_level")
    amount: Decimal = Field(sa_column=Column(DECIMAL(12, 2), nullable=False))
    school_year: str = Field(max_length=9)

    establishment: Mapped["Establishment"] = Relationship(back_populates="fees")
    level: Mapped["StudyLevel"] = Relationship(back_populates="fees")
    payment_methods: Mapped[list["SchoolFeePaymentMethod"]] = Relationship(back_populates="fee")

class Service(SQLModel, table=True):
    __tablename__ = "service"
    # Un même service ne peut pas apparaître deux fois chez un établissement ;
    # la collation MySQL rend l'unicité insensible à la casse.
    __table_args__ = (
        UniqueConstraint("id_establishment", "name", name="uq_service_establishment_name"),
    )

    id_service: int = Field(primary_key=True)
    id_establishment: int = Field(foreign_key="establishment.id_establishment")
    name: str = Field(max_length=100)
    description: str | None = Field(default=None)

    establishment: Mapped["Establishment"] = Relationship(back_populates="services")



class ExamResult(SQLModel, table=True):
    __tablename__ = "exam_result"
    __table_args__ = (
        UniqueConstraint("id_establishment", "id_exam", "session", name="uq_exam_result_establishment_exam_session"),
        # La validation Pydantic ne protège pas les inserts SQL bruts : la plage
        # est aussi garantie en base.
        CheckConstraint("pass_rate >= 0 AND pass_rate <= 100", name="ck_exam_result_pass_rate_range"),
    )

    id_result: int = Field(primary_key=True)
    id_establishment: int = Field(foreign_key="establishment.id_establishment")
    id_exam: int = Field(foreign_key="exam.id_exam")
    session: str = Field(max_length=20)
    pass_rate: Decimal = Field(sa_column=Column(DECIMAL(5, 2), nullable=False))

    establishment: Mapped["Establishment"] = Relationship(back_populates="exam_results")
    exam: Mapped["Exam"] = Relationship(back_populates="exam_results")


class Media(SQLModel, table=True):
    __tablename__ = "media"

    id_media: int = Field(primary_key=True)
    id_establishment: int = Field(foreign_key="establishment.id_establishment")
    type: MediaType
    url: str = Field(max_length=500)
    caption: str | None = Field(default=None)

    establishment: Mapped["Establishment"] = Relationship(back_populates="media")