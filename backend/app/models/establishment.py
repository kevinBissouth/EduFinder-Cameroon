from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DECIMAL, Column, UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import EstablishmentStatus, MediaType

if TYPE_CHECKING:
    from app.models.reference import Exam, PaymentMethod, Program, StudyLevel, EstablishmentType, City
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
    id_city: int = Field(foreign_key="city.id_city")
    id_type: int = Field(foreign_key="establishment_type.id_type")
    name: str = Field(max_length=255)
    description: str | None = Field(default=None)
    address: str | None = Field(default=None, max_length=255)
    status: EstablishmentStatus
    phone: str | None = Field(default=None, max_length=20)
    contact_email: str | None = Field(default=None, max_length=255)
    website: str | None = Field(default=None, max_length=255)

    city: Mapped["City"] = Relationship(back_populates="establishments")
    type: Mapped["EstablishmentType"] = Relationship(back_populates="establishments")
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

    id_service: int = Field(primary_key=True)
    id_establishment: int = Field(foreign_key="establishment.id_establishment")
    name: str = Field(max_length=100)
    description: str | None = Field(default=None)

    establishment: Mapped["Establishment"] = Relationship(back_populates="services")


class ExamResult(SQLModel, table=True):
    __tablename__ = "exam_result"
    __table_args__ = (
        UniqueConstraint("id_establishment", "id_exam", "session", name="uq_exam_result_establishment_exam_session"),
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