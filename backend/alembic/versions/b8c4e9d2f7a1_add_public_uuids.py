"""add public uuid columns

Revision ID: b8c4e9d2f7a1
Revises: a3f71a145503
Create Date: 2026-08-25

Identifiants publics non devinables : chaque établissement et chaque
soumission reçoit un UUID exposé dans les URLs et réponses API, tandis que
les entiers auto-incrémentés restent en interne (clés étrangères, perf).
Backfill ligne par ligne en Python pour rester portable (MySQL comme SQLite).
"""
import uuid as uuid_lib
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b8c4e9d2f7a1'
down_revision: Union[str, Sequence[str], None] = 'a3f71a145503'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _backfill_uuids(table_name: str, primary_key_column: str) -> None:
    connection = op.get_bind()
    rows = connection.execute(
        sa.text(f"SELECT {primary_key_column} FROM {table_name}")
    ).fetchall()
    for (row_id,) in rows:
        connection.execute(
            sa.text(f"UPDATE {table_name} SET uuid = :new_uuid WHERE {primary_key_column} = :row_id"),
            {"new_uuid": str(uuid_lib.uuid4()), "row_id": row_id},
        )


def upgrade() -> None:
    op.add_column('establishment', sa.Column('uuid', sa.CHAR(36), nullable=True))
    op.add_column('submission', sa.Column('uuid', sa.CHAR(36), nullable=True))

    _backfill_uuids('establishment', 'id_establishment')
    _backfill_uuids('submission', 'id_submission')

    op.create_unique_constraint('uq_establishment_uuid', 'establishment', ['uuid'])
    op.create_unique_constraint('uq_submission_uuid', 'submission', ['uuid'])
    op.alter_column('establishment', 'uuid', existing_type=sa.CHAR(36), nullable=False)
    op.alter_column('submission', 'uuid', existing_type=sa.CHAR(36), nullable=False)


def downgrade() -> None:
    op.alter_column('submission', 'uuid', existing_type=sa.CHAR(36), nullable=True)
    op.alter_column('establishment', 'uuid', existing_type=sa.CHAR(36), nullable=True)
    op.drop_constraint('uq_submission_uuid', 'submission', type_='unique')
    op.drop_constraint('uq_establishment_uuid', 'establishment', type_='unique')
    op.drop_column('submission', 'uuid')
    op.drop_column('establishment', 'uuid')
