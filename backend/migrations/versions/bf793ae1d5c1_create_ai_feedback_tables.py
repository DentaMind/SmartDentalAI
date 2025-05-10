"""create ai feedback tables

Revision ID: bf793ae1d5c1
Revises: a4b791e0a5c3
Create Date: 2025-05-01 09:12:21.456789

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = 'bf793ae1d5c1'
down_revision = 'a4b791e0a5c3'  # Reference the clinical evidence migration
branch_labels = None
depends_on = None


def upgrade():
    # Create enum type for feedback action
    op.execute(
        """
        CREATE TYPE feedback_action AS ENUM (
            'accepted',
            'rejected',
            'modified'
        );
        """
    )
    
    # Create treatment feedback table
    op.create_table(
        'treatment_feedback',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('treatment_suggestion_id', sa.String(), nullable=False, index=True),
        sa.Column('diagnosis_id', sa.String(), nullable=False, index=True),
        sa.Column('patient_id', sa.String(), nullable=False, index=True),
        sa.Column('provider_id', sa.String(), nullable=False, index=True),
        sa.Column('action', sa.Enum('accepted', 'rejected', 'modified', name='feedback_action'), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('relevance_score', sa.Float(), nullable=True),
        sa.Column('evidence_quality_rating', sa.Integer(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('modified_treatment', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, onupdate=sa.text('now()'))
    )
    
    # Create evidence feedback table
    op.create_table(
        'evidence_feedback',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('evidence_id', sa.String(), nullable=False, index=True),
        sa.Column('treatment_suggestion_id', sa.String(), nullable=False, index=True),
        sa.Column('provider_id', sa.String(), nullable=False, index=True),
        sa.Column('relevance_score', sa.Float(), nullable=False),
        sa.Column('accuracy', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, onupdate=sa.text('now()'))
    )
    
    # Create indexes for efficient querying
    op.create_index(
        'ix_treatment_feedback_provider_created',
        'treatment_feedback',
        ['provider_id', 'created_at'],
        unique=False
    )
    
    op.create_index(
        'ix_treatment_feedback_diagnosis_action',
        'treatment_feedback',
        ['diagnosis_id', 'action'],
        unique=False
    )
    
    op.create_index(
        'ix_evidence_feedback_evidence_id',
        'evidence_feedback',
        ['evidence_id'],
        unique=False
    )
    
    op.create_index(
        'ix_evidence_feedback_provider_created',
        'evidence_feedback',
        ['provider_id', 'created_at'],
        unique=False
    )


def downgrade():
    # Drop tables
    op.drop_table('evidence_feedback')
    op.drop_table('treatment_feedback')
    
    # Drop enum type
    op.execute('DROP TYPE feedback_action;') 