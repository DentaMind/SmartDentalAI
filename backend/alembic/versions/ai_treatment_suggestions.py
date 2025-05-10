"""add ai treatment suggestions tables

Revision ID: 6a17c4b5d923
Revises: 
Create Date: 2023-06-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '6a17c4b5d923'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create enum types first
    suggestion_status = sa.Enum('pending', 'accepted', 'modified', 'rejected', name='suggestionstatus')
    confidence_level = sa.Enum('low', 'medium', 'high', 'very_high', name='confidencelevel')
    ai_suggestion_source = sa.Enum('xray', 'clinical_notes', 'patient_history', 'perio_chart', 'multimodal', name='aisuggestionsource')
    
    # Create the tables
    op.create_table(
        'ai_treatment_suggestions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('patient_id', sa.String(), nullable=False, index=True),
        sa.Column('diagnosis_id', sa.String(), sa.ForeignKey("image_diagnosis.id"), index=True),
        sa.Column('finding_id', sa.String(), nullable=True, index=True),
        
        # Suggestion details
        sa.Column('procedure_code', sa.String()),
        sa.Column('procedure_name', sa.String(), nullable=False),
        sa.Column('procedure_description', sa.Text()),
        sa.Column('tooth_number', sa.String()),
        sa.Column('surface', sa.String()),
        
        # AI metadata
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('confidence_level', confidence_level, default='medium'),
        sa.Column('reasoning', sa.Text(), nullable=False),
        sa.Column('alternatives', postgresql.JSON()),
        sa.Column('source', ai_suggestion_source, default='xray'),
        sa.Column('model_version', sa.String()),
        
        # Clinical relevance
        sa.Column('priority', sa.Enum('low', 'medium', 'high', 'urgent', name='prioritylevel'), default='medium'),
        sa.Column('urgency_days', sa.Integer()),
        sa.Column('clinical_benefits', sa.Text()),
        sa.Column('potential_complications', sa.Text()),
        sa.Column('evidence_citations', postgresql.JSON()),
        
        # Status tracking
        sa.Column('status', suggestion_status, default='pending'),
        sa.Column('clinician_notes', sa.Text()),
        sa.Column('modified_procedure', sa.String()),
        sa.Column('rejection_reason', sa.Text()),
        sa.Column('clinical_override_reason', sa.Text()),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('reviewed_at', sa.DateTime(timezone=True)),
        sa.Column('reviewed_by', sa.String())
    )
    
    op.create_table(
        'ai_treatment_suggestion_groups',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('patient_id', sa.String(), nullable=False, index=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('condition_category', sa.String()),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', 'urgent', name='prioritylevel'), default='medium'),
        sa.Column('suggestions', postgresql.JSON()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Create indexes for performance
    op.create_index('ix_ai_treatment_suggestions_confidence', 'ai_treatment_suggestions', ['confidence'])
    op.create_index('ix_ai_treatment_suggestions_status', 'ai_treatment_suggestions', ['status'])
    op.create_index('ix_ai_treatment_suggestions_tooth_number', 'ai_treatment_suggestions', ['tooth_number'])
    op.create_index('ix_ai_treatment_suggestion_groups_condition_category', 'ai_treatment_suggestion_groups', ['condition_category'])


def downgrade():
    # Drop tables
    op.drop_table('ai_treatment_suggestion_groups')
    op.drop_table('ai_treatment_suggestions')
    
    # Drop enum types
    op.execute('DROP TYPE suggestionstatus')
    op.execute('DROP TYPE confidencelevel')
    op.execute('DROP TYPE aisuggestionsource')
    # Note: prioritylevel may be used by other tables, so don't drop it 