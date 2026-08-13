from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.establishment import UserEstablishment
    from app.models.submission import Submission, ValidationDecision


class User(SQLModel, table=True):
    __tablename__ = "user"

    id_user: int = Field(primary_key=True)
    name: str = Field(max_length=255)
    email: str = Field(max_length=255, unique=True)
    password_hash: str = Field(max_length=255)
    role: UserRole
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user_establishments: Mapped[list["UserEstablishment"]] = Relationship(back_populates="user")
    submissions: Mapped[list["Submission"]] = Relationship(back_populates="user")
    decisions: Mapped[list["ValidationDecision"]] = Relationship(back_populates="user")