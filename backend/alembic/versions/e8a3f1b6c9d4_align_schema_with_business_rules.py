"""Align schema with business rules

- sector.is_public : le regroupement public/prive ne doit plus dependre du texte du libelle
- unicites manquantes : validation_decision.id_submission, service (etablissement, nom),
  program.name, study_level (etape, libelle)
- establishment.created_at / updated_at : tracabilite de l'entite centrale
- submission.content passe en NOT NULL (aucune valeur NULL existante verifiee avant)
- exam_result.pass_rate contraint en [0 ; 100] en base

revision: e8a3f1b6c9d4
down_revision: d7e8f9a0b1c2
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = "e8a3f1b6c9d4"
down_revision: Union[str, Sequence[str], None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajout avec defaut serveur pour retroremplir les lignes existantes,
    # puis suppression du defaut : les valeurs par défaut restent cote Python.
    op.add_column(
        "sector",
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    # Retroremplissage : seul le secteur dont le libelle normalise vaut 'public'
    # est marque public ('private' et 'prive' deviennent prives).
    op.execute("UPDATE sector SET is_public = (LOWER(TRIM(label)) = 'public')")
    op.alter_column("sector", "is_public", existing_type=sa.Boolean(), server_default=None)

    op.add_column(
        "establishment",
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.add_column("establishment", sa.Column("updated_at", sa.DateTime(), nullable=True))
    op.alter_column(
        "establishment", "created_at", existing_type=sa.DateTime(), server_default=None
    )

    op.alter_column("submission", "content", existing_type=mysql.JSON(), nullable=False)

    op.create_unique_constraint(
        "uq_validation_decision_submission", "validation_decision", ["id_submission"]
    )
    op.create_unique_constraint(
        "uq_service_establishment_name", "service", ["id_establishment", "name"]
    )
    op.create_unique_constraint("uq_program_name", "program", ["name"])
    op.create_unique_constraint(
        "uq_study_level_stage_label", "study_level", ["id_stage", "label"]
    )
    op.create_check_constraint(
        "ck_exam_result_pass_rate_range", "exam_result", "pass_rate >= 0 AND pass_rate <= 100"
    )


def downgrade() -> None:
    op.drop_constraint("ck_exam_result_pass_rate_range", "exam_result", type_="check")
    op.drop_constraint("uq_study_level_stage_label", "study_level", type_="unique")
    op.drop_constraint("uq_program_name", "program", type_="unique")
    op.drop_constraint("uq_service_establishment_name", "service", type_="unique")
    op.drop_constraint("uq_validation_decision_submission", "validation_decision", type_="unique")

    op.alter_column("submission", "content", existing_type=mysql.JSON(), nullable=True)

    op.drop_column("establishment", "updated_at")
    op.drop_column("establishment", "created_at")
    op.drop_column("sector", "is_public")
