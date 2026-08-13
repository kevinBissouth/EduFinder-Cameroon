from typing import TYPE_CHECKING

from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.establishment import Establishment, ExamResult, ProgramOffer, SchoolFee, SchoolFeePaymentMethod


class Region(SQLModel, table=True):
    __tablename__ = "region"

    id_region: int = Field(primary_key=True)
    name: str = Field(max_length=100)

    cities: Mapped[list["City"]] = Relationship(back_populates="region")


class EstablishmentType(SQLModel, table=True):
    __tablename__ = "establishment_type"

    id_type: int = Field(primary_key=True)
    label: str = Field(max_length=100)

    establishments: Mapped[list["Establishment"]] = Relationship(back_populates="type")


class City(SQLModel, table=True):
    __tablename__ = "city"
    __table_args__ = (UniqueConstraint("name", "id_region", name="uq_city_name_region"),)

    id_city: int = Field(primary_key=True)
    id_region: int = Field(foreign_key="region.id_region")
    name: str = Field(max_length=100)

    region: Mapped["Region"] = Relationship(back_populates="cities")
    establishments: Mapped[list["Establishment"]] = Relationship(back_populates="city")


class StudyLevel(SQLModel, table=True):
    __tablename__ = "study_level"

    id_level: int = Field(primary_key=True)
    label: str = Field(max_length=100)

    fees: Mapped[list["SchoolFee"]] = Relationship(back_populates="level")


class Program(SQLModel, table=True):
    __tablename__ = "program"

    id_program: int = Field(primary_key=True)
    name: str = Field(max_length=100)

    establishment_offers: Mapped[list["ProgramOffer"]] = Relationship(back_populates="program")


class Exam(SQLModel, table=True):
    __tablename__ = "exam"

    id_exam: int = Field(primary_key=True)
    label: str = Field(max_length=100)

    exam_results: Mapped[list["ExamResult"]] = Relationship(back_populates="exam")


class PaymentMethod(SQLModel, table=True):
    __tablename__ = "payment_method"

    id_payment_method: int = Field(primary_key=True)
    label: str = Field(max_length=100)

    fees: Mapped[list["SchoolFeePaymentMethod"]] = Relationship(back_populates="payment_method")