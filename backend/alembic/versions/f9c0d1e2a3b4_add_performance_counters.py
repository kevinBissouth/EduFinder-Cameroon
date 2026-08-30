"""add performance counters (views / inquiries)

Revision ID: f9c0d1e2a3b4
Revises: b8c4e9d2f7a1
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f9c0d1e2a3b4"
down_revision: Union[str, Sequence[str], None] = "b8c4e9d2f7a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Compteurs de performance vus par le responsable ; défaut 0 pour ne pas
    # écraser les fiches existantes.
    op.add_column(
        "establishment",
        sa.Column("views_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "establishment",
        sa.Column("inquiries_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("establishment", "inquiries_count")
    op.drop_column("establishment", "views_count")
