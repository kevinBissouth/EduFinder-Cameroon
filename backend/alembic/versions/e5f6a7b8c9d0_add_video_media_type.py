"""add video media type

Révision ID: e5f6a7b8c9d0
Revises: d3e4f5a6b7c8
Create Date: 2026-08-31

La colonne media.type est un enum MySQL : j'ajoute la valeur 'video' pour
stocker les vidéos uploadées de l'établissement (galerie vidéo).
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d3e4f5a6b7c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE media MODIFY COLUMN type "
        "ENUM('image', 'pdf', 'video') NOT NULL"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE media MODIFY COLUMN type "
        "ENUM('image', 'pdf') NOT NULL"
    )
