"""add director photo url

Revision ID: d3e4f5a6b7c8
Revises: c1d2e3f4a5b6
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import Column, String

revision: str = "d3e4f5a6b7c8"
down_revision: str | None = "c1d2e3f4a5b6"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> Sequence:
    # Photo du responsable de l'établissement, distincte de la galerie.
    op.add_column(
        "establishment",
        Column("director_photo_url", String(length=500), nullable=True),
    )


def downgrade() -> Sequence:
    op.drop_column("establishment", "director_photo_url")
