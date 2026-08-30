"""add establishment coordinates

Revision ID: a3f71a145503
Revises: 38f1b737bdbf
Create Date: 2026-08-24

Coordonnées GPS optionnelles par établissement : nullable, car une école
sans point précis héritera visuellement de sa ville (géocodage différé).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a3f71a145503'
down_revision: Union[str, Sequence[str], None] = '38f1b737bdbf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('establishment', sa.Column('latitude', sa.DECIMAL(9, 6), nullable=True))
    op.add_column('establishment', sa.Column('longitude', sa.DECIMAL(9, 6), nullable=True))


def downgrade() -> None:
    op.drop_column('establishment', 'longitude')
    op.drop_column('establishment', 'latitude')
