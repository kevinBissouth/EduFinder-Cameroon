"""add sector and linguistic_section tables

Revision ID: 7f635febed6b
Revises: 6d52627d467d
Create Date: 2026-08-19 15:09:33.202883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7f635febed6b'
down_revision: Union[str, Sequence[str], None] = '6d52627d467d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'linguistic_section',
        sa.Column('id_linguistic_section', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('label', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id_linguistic_section'),
    )
    op.create_table(
        'sector',
        sa.Column('id_sector', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('label', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id_sector'),
    )
    op.add_column('establishment', sa.Column('id_sector', sa.Integer(), nullable=False))
    op.add_column('establishment', sa.Column('id_linguistic_section', sa.Integer(), nullable=False))
    op.create_foreign_key('fk_establishment_sector', 'establishment', 'sector', ['id_sector'], ['id_sector'])
    op.create_foreign_key(
        'fk_establishment_linguistic_section',
        'establishment',
        'linguistic_section',
        ['id_linguistic_section'],
        ['id_linguistic_section'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_establishment_linguistic_section', 'establishment', type_='foreignkey')
    op.drop_constraint('fk_establishment_sector', 'establishment', type_='foreignkey')
    op.drop_column('establishment', 'id_linguistic_section')
    op.drop_column('establishment', 'id_sector')
    op.drop_table('sector')
    op.drop_table('linguistic_section')