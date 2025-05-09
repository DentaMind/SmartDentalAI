"""add patient intake tables

Revision ID: f5e3d9a71b3c
Revises: fe9874a5c3b2  # Reference the previous migration
Create Date: 2025-05-20 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'f5e3d9a71b3c'
down_revision: Union[str, None] = 'fe9874a5c3b2'  # Reference the previous migration (encrypted patient fields)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create patient_intake_forms table
    op.create_table(
        'patient_intake_forms',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('personal_info', JSONB(), nullable=False),
        sa.Column('medical_history', JSONB(), nullable=True),
        sa.Column('dental_history', JSONB(), nullable=True),
        sa.Column('insurance_info', JSONB(), nullable=True),
        sa.Column('emergency_contact', JSONB(), nullable=True),
        sa.Column('consent', sa.Boolean(), default=False, nullable=False),
        sa.Column('is_completed', sa.Boolean(), default=False, nullable=False),
        sa.Column('completion_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.Column('submitted_ip', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create patient_intake_ai_suggestions table
    op.create_table(
        'patient_intake_ai_suggestions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('intake_form_id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('suggestions', JSONB(), nullable=False),
        sa.Column('ai_model_version', sa.String(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('reasoning', sa.Text(), nullable=True),
        sa.Column('fields_considered', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('feedback', JSONB(), nullable=True),  # Store provider feedback on suggestions
        sa.Column('applied_suggestions', JSONB(), nullable=True),  # Which suggestions were applied
        sa.ForeignKeyConstraint(['intake_form_id'], ['patient_intake_forms.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create patient_intake_versioning table to track changes
    op.create_table(
        'patient_intake_versioning',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('intake_form_id', sa.String(), nullable=False),
        sa.Column('version_num', sa.Integer(), nullable=False),
        sa.Column('form_data', JSONB(), nullable=False),  # Complete snapshot of form at this version
        sa.Column('changed_fields', JSONB(), nullable=True),  # Which fields changed from previous version
        sa.Column('changed_by', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['intake_form_id'], ['patient_intake_forms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index(op.f('ix_patient_intake_forms_patient_id'), 'patient_intake_forms', ['patient_id'], unique=False)
    op.create_index(op.f('ix_patient_intake_forms_created_at'), 'patient_intake_forms', ['created_at'], unique=False)
    op.create_index(op.f('ix_patient_intake_ai_suggestions_patient_id'), 'patient_intake_ai_suggestions', ['patient_id'], unique=False)
    op.create_index(op.f('ix_patient_intake_ai_suggestions_intake_form_id'), 'patient_intake_ai_suggestions', ['intake_form_id'], unique=False)
    op.create_index(op.f('ix_patient_intake_versioning_intake_form_id'), 'patient_intake_versioning', ['intake_form_id'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_patient_intake_versioning_intake_form_id'), table_name='patient_intake_versioning')
    op.drop_index(op.f('ix_patient_intake_ai_suggestions_intake_form_id'), table_name='patient_intake_ai_suggestions')
    op.drop_index(op.f('ix_patient_intake_ai_suggestions_patient_id'), table_name='patient_intake_ai_suggestions')
    op.drop_index(op.f('ix_patient_intake_forms_created_at'), table_name='patient_intake_forms')
    op.drop_index(op.f('ix_patient_intake_forms_patient_id'), table_name='patient_intake_forms')
    
    # Drop tables in reverse order
    op.drop_table('patient_intake_versioning')
    op.drop_table('patient_intake_ai_suggestions')
    op.drop_table('patient_intake_forms') 