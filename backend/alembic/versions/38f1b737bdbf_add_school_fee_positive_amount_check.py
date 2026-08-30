"""add school fee positive amount check

Revision ID: 38f1b737bdbf
Revises: e8a3f1b6c9d4
Create Date: 2026-08-24 14:15:15.663780

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '38f1b737bdbf'
down_revision: Union[str, Sequence[str], None] = 'e8a3f1b6c9d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Un frais de scolarité négatif n'a aucun sens métier : la contrainte
    # protège la base quel que soit le chemin d'écriture (API, seed, SQL).
    op.create_check_constraint(
        "ck_school_fee_amount_positive",
        "school_fee",
        "amount >= 0",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_school_fee_amount_positive", "school_fee", type_="check")
