"""add stage table and link study_level to it

Revision ID: c2a1b3d4e5f6
Revises: 7f635febed6b
Create Date: 2026-08-19 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c2a1b3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '7f635febed6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'stage',
        sa.Column('id_stage', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('label', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id_stage'),
        sa.UniqueConstraint('label', name='uq_stage_label'),
    )
    op.add_column('study_level', sa.Column('id_stage', sa.Integer(), nullable=False))
    op.create_foreign_key('fk_study_level_stage', 'study_level', 'stage', ['id_stage'], ['id_stage'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_study_level_stage', 'study_level', type_='foreignkey')
    op.drop_column('study_level', 'id_stage')
    op.drop_table('stage')