from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Column
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import DecisionStatus, SubmissionStatus, SubmissionType

if TYPE_CHECKING:
    from app.models.establishment import Establishment
    from app.models.user import User


class Submission(SQLModel, table=True):
    __tablename__ = "submission"

    id_submission: int = Field(primary_key=True)
    id_user: int = Field(foreign_key="user.id_user")
    id_establishment: int = Field(foreign_key="establishment.id_establishment")
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    type: SubmissionType
    status: SubmissionStatus
    content: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))

    user: Mapped["User"] = Relationship(back_populates="submissions")
    establishment: Mapped["Establishment"] = Relationship(back_populates="submissions")
    decision: Mapped["ValidationDecision"] = Relationship(back_populates="submission")


class ValidationDecision(SQLModel, table=True):
    __tablename__ = "validation_decision"

    id_decision: int = Field(primary_key=True)
    id_submission: int = Field(foreign_key="submission.id_submission")
    id_user: int = Field(foreign_key="user.id_user")
    decided_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: DecisionStatus
    rejection_reason: str | None = Field(default=None, max_length=500)

    submission: Mapped["Submission"] = Relationship(back_populates="decision")
    user: Mapped["User"] = Relationship(back_populates="decisions")