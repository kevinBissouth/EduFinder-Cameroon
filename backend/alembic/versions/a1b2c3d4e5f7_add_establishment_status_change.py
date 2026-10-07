"""add establishment status change

Révision ID: a1b2c3d4e5f7
Revises: e5f6a7b8c9d0
Create Date: 2026-10-06

Historique des suspensions et réactivations décidées par un super admin.
Ces actions ne passent par aucune soumission, donc validation_decision ne
peut pas les porter : je crée une table dédiée (qui, quand, ancien et nouveau
statut, motif).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Valeurs figées dans la migration plutôt qu'importées de l'enum Python : une
# migration doit rester rejouable même si l'enum évolue plus tard.
ESTABLISHMENT_STATUSES = ("pending", "published", "rejected", "suspended")


def upgrade() -> None:
    op.create_table(
        "establishment_status_change",
        sa.Column("id_status_change", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id_establishment", sa.Integer(), nullable=False),
        sa.Column("id_user", sa.Integer(), nullable=False),
        sa.Column("changed_at", sa.DateTime(), nullable=False),
        sa.Column("previous_status", sa.Enum(*ESTABLISHMENT_STATUSES), nullable=False),
        sa.Column("new_status", sa.Enum(*ESTABLISHMENT_STATUSES), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["id_establishment"], ["establishment.id_establishment"]),
        sa.ForeignKeyConstraint(["id_user"], ["user.id_user"]),
        sa.PrimaryKeyConstraint("id_status_change"),
    )


def downgrade() -> None:
    op.drop_table("establishment_status_change")
