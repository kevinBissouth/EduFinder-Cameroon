"""create all tables

Revision ID: 6d52627d467d
Revises: 
Create Date: 2026-08-11 13:57:25.014492

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.models.enums import (
    DecisionStatus,
    EstablishmentStatus,
    MediaType,
    SubmissionStatus,
    SubmissionType,
    UserRole,
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
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_region'),
    sa.UniqueConstraint('name', name='uq_region_name')
    )
    op.create_table('establishment_type',
    sa.Column('id_type', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('label', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_type')
    )
    op.create_table('study_level',
    sa.Column('id_level', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('label', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_level')
    )
    op.create_table('program',
    sa.Column('id_program', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_program')
    )
    op.create_table('exam',
    sa.Column('id_exam', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('label', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_exam')
    )
    op.create_table('payment_method',
    sa.Column('id_payment_method', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('label', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id_payment_method')
    )
    op.create_table('city',
    sa.Column('id_city', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_region', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.ForeignKeyConstraint(['id_region'], ['region.id_region'], ),
    sa.PrimaryKeyConstraint('id_city'),
    sa.UniqueConstraint('name', 'id_region', name='uq_city_name_region')
    )
    op.create_table('user',
    sa.Column('id_user', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('role', sa.Enum(UserRole, name='userrole'), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id_user'),
    sa.UniqueConstraint('email')
    )
    op.create_table('establishment',
    sa.Column('id_establishment', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_city', sa.Integer(), nullable=False),
    sa.Column('id_type', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('address', sa.String(length=255), nullable=True),
    sa.Column('status', sa.Enum(EstablishmentStatus, name='establishmentstatus'), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('contact_email', sa.String(length=255), nullable=True),
    sa.Column('website', sa.String(length=255), nullable=True),
    sa.ForeignKeyConstraint(['id_city'], ['city.id_city'], ),
    sa.ForeignKeyConstraint(['id_type'], ['establishment_type.id_type'], ),
    sa.PrimaryKeyConstraint('id_establishment')
    )
    op.create_table('school_fee',
    sa.Column('id_fee', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_establishment', sa.Integer(), nullable=False),
    sa.Column('id_level', sa.Integer(), nullable=False),
    sa.Column('amount', sa.DECIMAL(precision=12, scale=2), nullable=False),
    sa.Column('school_year', sa.String(length=9), nullable=False),
    sa.ForeignKeyConstraint(['id_establishment'], ['establishment.id_establishment'], ),
    sa.ForeignKeyConstraint(['id_level'], ['study_level.id_level'], ),
    sa.PrimaryKeyConstraint('id_fee'),
    sa.UniqueConstraint('id_establishment', 'id_level', 'school_year', name='uq_fee_establishment_level_school_year')
    )
    op.create_table('service',
    sa.Column('id_service', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_establishment', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['id_establishment'], ['establishment.id_establishment'], ),
    sa.PrimaryKeyConstraint('id_service')
    )
    op.create_table('exam_result',
    sa.Column('id_result', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_establishment', sa.Integer(), nullable=False),
    sa.Column('id_exam', sa.Integer(), nullable=False),
    sa.Column('session', sa.String(length=20), nullable=False),
    sa.Column('pass_rate', sa.DECIMAL(precision=5, scale=2), nullable=False),
    sa.ForeignKeyConstraint(['id_establishment'], ['establishment.id_establishment'], ),
    sa.ForeignKeyConstraint(['id_exam'], ['exam.id_exam'], ),
    sa.PrimaryKeyConstraint('id_result'),
    sa.UniqueConstraint('id_establishment', 'id_exam', 'session', name='uq_exam_result_establishment_exam_session')
    )
    op.create_table('media',
    sa.Column('id_media', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_establishment', sa.Integer(), nullable=False),
    sa.Column('type', sa.Enum(MediaType, name='mediatype'), nullable=False),
    sa.Column('url', sa.String(length=500), nullable=False),
    sa.Column('caption', sa.String(length=255), nullable=True),
    sa.ForeignKeyConstraint(['id_establishment'], ['establishment.id_establishment'], ),
    sa.PrimaryKeyConstraint('id_media')
    )
    op.create_table('program_offer',
    sa.Column('id_establishment', sa.Integer(), autoincrement=False, nullable=False),
    sa.Column('id_program', sa.Integer(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['id_establishment'], ['establishment.id_establishment'], ),
    sa.ForeignKeyConstraint(['id_program'], ['program.id_program'], ),
    sa.PrimaryKeyConstraint('id_establishment', 'id_program')
    )
    op.create_table('school_fee_payment_method',
    sa.Column('id_fee', sa.Integer(), autoincrement=False, nullable=False),
    sa.Column('id_payment_method', sa.Integer(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['id_fee'], ['school_fee.id_fee'], ),
    sa.ForeignKeyConstraint(['id_payment_method'], ['payment_method.id_payment_method'], ),
    sa.PrimaryKeyConstraint('id_fee', 'id_payment_method')
    )
    op.create_table('user_establishment',
    sa.Column('id_user', sa.Integer(), autoincrement=False, nullable=False),
    sa.Column('id_establishment', sa.Integer(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['id_establishment'], ['establishment.id_establishment'], ),
    sa.ForeignKeyConstraint(['id_user'], ['user.id_user'], ),
    sa.PrimaryKeyConstraint('id_user', 'id_establishment')
    )
    op.create_table('submission',
    sa.Column('id_submission', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_user', sa.Integer(), nullable=False),
    sa.Column('id_establishment', sa.Integer(), nullable=False),
    sa.Column('submitted_at', sa.DateTime(), nullable=False),
    sa.Column('type', sa.Enum(SubmissionType, name='submissiontype'), nullable=False),
    sa.Column('status', sa.Enum(SubmissionStatus, name='submissionstatus'), nullable=False),
    sa.Column('content', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['id_establishment'], ['establishment.id_establishment'], ),
    sa.ForeignKeyConstraint(['id_user'], ['user.id_user'], ),
    sa.PrimaryKeyConstraint('id_submission')
    )
    op.create_table('validation_decision',
    sa.Column('id_decision', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('id_submission', sa.Integer(), nullable=False),
    sa.Column('id_user', sa.Integer(), nullable=False),
    sa.Column('decided_at', sa.DateTime(), nullable=False),
    sa.Column('status', sa.Enum(DecisionStatus, name='decisionstatus'), nullable=False),
    sa.Column('rejection_reason', sa.String(length=500), nullable=True),
    sa.ForeignKeyConstraint(['id_submission'], ['submission.id_submission'], ),
    sa.ForeignKeyConstraint(['id_user'], ['user.id_user'], ),
    sa.PrimaryKeyConstraint('id_decision')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('validation_decision')
    op.drop_table('submission')
    op.drop_table('user_establishment')
    op.drop_table('school_fee_payment_method')
    op.drop_table('program_offer')
    op.drop_table('media')
    op.drop_table('exam_result')
    op.drop_table('service')
    op.drop_table('school_fee')
    op.drop_table('establishment')
    op.drop_table('user')
    op.drop_table('city')
    op.drop_table('payment_method')
    op.drop_table('exam')
    op.drop_table('program')
    op.drop_table('study_level')
    op.drop_table('establishment_type')
    op.drop_table('region')
    # ### end Alembic commands ###