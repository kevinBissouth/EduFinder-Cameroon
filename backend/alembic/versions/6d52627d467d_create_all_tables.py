"""create all tables

Revision ID: 6d52627d467d
Revises: 
Create Date: 2026-08-11 13:57:25.014492

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.models.enums import (
    RoleUtilisateur,
    StatutDecision,
    StatutEtablissement,
    StatutSoumission,
    TypeMedia,
    TypeSoumission,
)


# revision identifiers, used by Alembic.
revision: str = '6d52627d467d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('region',
    sa.Column('id_region', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('nom', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_region'),
    sa.UniqueConstraint('nom', name='uq_region_nom')
    )
    op.create_table('type_etablissement',
    sa.Column('id_type', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('libelle', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_type')
    )
    op.create_table('niveau_etude',
    sa.Column('id_niveau', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('libelle', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_niveau')
    )
    op.create_table('filiere',
    sa.Column('id_filiere', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('nom', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_filiere')
    )
    op.create_table('examen',
    sa.Column('id_examen', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('libelle', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_examen')
    )
    op.create_table('modalite_paiement',
    sa.Column('id_modalite', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('libelle', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_modalite')
    )
    op.create_table('ville',
    sa.Column('id_ville', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_region', sa.Integer(), nullable=False),
    sa.Column('nom', sa.String(length=100), nullable=False),
    sa.ForeignKeyConstraint(['id_region'], ['region.id_region'], ),
    sa.PrimaryKeyConstraint('id_ville'),
    sa.UniqueConstraint('nom', 'id_region', name='uq_ville_nom_region')
    )
    op.create_table('utilisateur',
    sa.Column('id_utilisateur', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('nom', sa.String(length=255), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('mot_de_passe', sa.String(length=255), nullable=False),
    sa.Column('role', sa.Enum(RoleUtilisateur, name='roleutilisateur'), nullable=False),
    sa.Column('date_creation', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id_utilisateur'),
    sa.UniqueConstraint('email')
    )
    op.create_table('etablissement',
    sa.Column('id_etablissement', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_ville', sa.Integer(), nullable=False),
    sa.Column('id_type', sa.Integer(), nullable=False),
    sa.Column('nom', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('adresse', sa.String(length=255), nullable=True),
    sa.Column('statut', sa.Enum(StatutEtablissement, name='statutetablissement'), nullable=False),
    sa.Column('telephone', sa.String(length=20), nullable=True),
    sa.Column('email_contact', sa.String(length=255), nullable=True),
    sa.Column('site_web', sa.String(length=255), nullable=True),
    sa.ForeignKeyConstraint(['id_type'], ['type_etablissement.id_type'], ),
    sa.ForeignKeyConstraint(['id_ville'], ['ville.id_ville'], ),
    sa.PrimaryKeyConstraint('id_etablissement')
    )
    op.create_table('frais_scolarite',
    sa.Column('id_frais', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_etablissement', sa.Integer(), nullable=False),
    sa.Column('id_niveau', sa.Integer(), nullable=False),
    sa.Column('montant', sa.DECIMAL(precision=12, scale=2), nullable=False),
    sa.Column('annee_scolaire', sa.String(length=9), nullable=False),
    sa.ForeignKeyConstraint(['id_etablissement'], ['etablissement.id_etablissement'], ),
    sa.ForeignKeyConstraint(['id_niveau'], ['niveau_etude.id_niveau'], ),
    sa.PrimaryKeyConstraint('id_frais'),
    sa.UniqueConstraint('id_etablissement', 'id_niveau', 'annee_scolaire', name='uq_frais_etab_niveau_annee')
    )
    op.create_table('service',
    sa.Column('id_service', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_etablissement', sa.Integer(), nullable=False),
    sa.Column('nom', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['id_etablissement'], ['etablissement.id_etablissement'], ),
    sa.PrimaryKeyConstraint('id_service')
    )
    op.create_table('resultat_examen',
    sa.Column('id_resultat', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_etablissement', sa.Integer(), nullable=False),
    sa.Column('id_examen', sa.Integer(), nullable=False),
    sa.Column('session', sa.String(length=20), nullable=False),
    sa.Column('taux_reussite', sa.DECIMAL(precision=5, scale=2), nullable=False),
    sa.ForeignKeyConstraint(['id_etablissement'], ['etablissement.id_etablissement'], ),
    sa.ForeignKeyConstraint(['id_examen'], ['examen.id_examen'], ),
    sa.PrimaryKeyConstraint('id_resultat'),
    sa.UniqueConstraint('id_etablissement', 'id_examen', 'session', name='uq_resultat_etab_examen_session')
    )
    op.create_table('media',
    sa.Column('id_media', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_etablissement', sa.Integer(), nullable=False),
    sa.Column('type', sa.Enum(TypeMedia, name='typemedia'), nullable=False),
    sa.Column('url', sa.String(length=500), nullable=False),
    sa.Column('legende', sa.String(length=255), nullable=True),
    sa.ForeignKeyConstraint(['id_etablissement'], ['etablissement.id_etablissement'], ),
    sa.PrimaryKeyConstraint('id_media')
    )
    op.create_table('propose',
    sa.Column('id_etablissement', sa.Integer(), autoincrement=False, nullable=False),
    sa.Column('id_filiere', sa.Integer(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['id_etablissement'], ['etablissement.id_etablissement'], ),
    sa.ForeignKeyConstraint(['id_filiere'], ['filiere.id_filiere'], ),
    sa.PrimaryKeyConstraint('id_etablissement', 'id_filiere')
    )
    op.create_table('se_paie_par',
    sa.Column('id_frais', sa.Integer(), autoincrement=False, nullable=False),
    sa.Column('id_modalite', sa.Integer(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['id_frais'], ['frais_scolarite.id_frais'], ),
    sa.ForeignKeyConstraint(['id_modalite'], ['modalite_paiement.id_modalite'], ),
    sa.PrimaryKeyConstraint('id_frais', 'id_modalite')
    )
    op.create_table('gere',
    sa.Column('id_utilisateur', sa.Integer(), autoincrement=False, nullable=False),
    sa.Column('id_etablissement', sa.Integer(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['id_etablissement'], ['etablissement.id_etablissement'], ),
    sa.ForeignKeyConstraint(['id_utilisateur'], ['utilisateur.id_utilisateur'], ),
    sa.PrimaryKeyConstraint('id_utilisateur', 'id_etablissement')
    )
    op.create_table('soumission',
    sa.Column('id_soumission', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_utilisateur', sa.Integer(), nullable=False),
    sa.Column('id_etablissement', sa.Integer(), nullable=False),
    sa.Column('date_soumission', sa.DateTime(), nullable=False),
    sa.Column('type', sa.Enum(TypeSoumission, name='typesoumission'), nullable=False),
    sa.Column('statut', sa.Enum(StatutSoumission, name='statutsoumission'), nullable=False),
    sa.Column('contenu', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['id_etablissement'], ['etablissement.id_etablissement'], ),
    sa.ForeignKeyConstraint(['id_utilisateur'], ['utilisateur.id_utilisateur'], ),
    sa.PrimaryKeyConstraint('id_soumission')
    )
    op.create_table('decision_validation',
    sa.Column('id_decision', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_soumission', sa.Integer(), nullable=False),
    sa.Column('id_utilisateur', sa.Integer(), nullable=False),
    sa.Column('date_decision', sa.DateTime(), nullable=False),
    sa.Column('statut', sa.Enum(StatutDecision, name='statutdecision'), nullable=False),
    sa.Column('raison_rejet', sa.String(length=500), nullable=True),
    sa.ForeignKeyConstraint(['id_soumission'], ['soumission.id_soumission'], ),
    sa.ForeignKeyConstraint(['id_utilisateur'], ['utilisateur.id_utilisateur'], ),
    sa.PrimaryKeyConstraint('id_decision')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('decision_validation')
    op.drop_table('soumission')
    op.drop_table('gere')
    op.drop_table('se_paie_par')
    op.drop_table('propose')
    op.drop_table('media')
    op.drop_table('resultat_examen')
    op.drop_table('service')
    op.drop_table('frais_scolarite')
    op.drop_table('etablissement')
    op.drop_table('utilisateur')
    op.drop_table('ville')
    op.drop_table('modalite_paiement')
    op.drop_table('examen')
    op.drop_table('filiere')
    op.drop_table('niveau_etude')
    op.drop_table('type_etablissement')
    op.drop_table('region')
    # ### end Alembic commands ###