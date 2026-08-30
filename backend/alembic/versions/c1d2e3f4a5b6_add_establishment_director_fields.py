"""add establishment director fields

Revision ID: c1d2e3f4a5b6
Revises: f9c0d1e2a3b4
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "f9c0d1e2a3b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Responsable de l'établissement (directeur / proviseur), distinct du
    # compte du gestionnaire. Colonnes nulles : les fiches existantes gardent
    # leur présentation inchangée jusqu'à saisie.
    op.add_column(
        "establishment",
        sa.Column("director_name", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "establishment",
        sa.Column("director_title", sa.String(length=80), nullable=True),
    )
    op.add_column(
        "establishment",
        sa.Column("director_bio", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("establishment", "director_bio")
    op.drop_column("establishment", "director_title")
    op.drop_column("establishment", "director_name")
