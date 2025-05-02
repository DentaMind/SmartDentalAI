"""Add AI feedback tables

Revision ID: 7e0d45c14a82
Revises: 2a1fcdef7981
Create Date: 2024-04-28 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7e0d45c14a82'
down_revision = '2a1fcdef7981'  # Update this to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create enum types first
    op.execute(
        "CREATE TYPE feedbackpriority AS ENUM ('low', 'medium', 'high')"
    )
    op.execute(
        "CREATE TYPE correctiontype AS ENUM ('false_positive', 'wrong_location', 'wrong_classification', 'wrong_severity', 'other')"
    )
    
    # Create ai_feedback table
    op.create_table(
        'ai_feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('finding_id', sa.String(), nullable=False, index=True),
        sa.Column('provider_id', sa.String(), nullable=False, index=True),
        sa.Column('patient_id', sa.String(), nullable=False, index=True),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('correction_type', sa.Enum('false_positive', 'wrong_location', 'wrong_classification', 'wrong_severity', 'other', name='correctiontype'), nullable=True),
        sa.Column('correction_details', sa.Text(), nullable=True),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', name='feedbackpriority'), nullable=False, server_default='medium'),
        sa.Column('model_version', sa.String(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create ai_model_metrics table
    op.create_table(
        'ai_model_metrics',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_version', sa.String(), nullable=False, index=True),
        sa.Column('model_type', sa.String(), nullable=False),
        sa.Column('accuracy', sa.Float(), nullable=False),
        sa.Column('precision', sa.Float(), nullable=True),
        sa.Column('recall', sa.Float(), nullable=True),
        sa.Column('f1_score', sa.Float(), nullable=True),
        sa.Column('false_positives', sa.Integer(), nullable=True),
        sa.Column('false_negatives', sa.Integer(), nullable=True),
        sa.Column('confusion_matrix', postgresql.JSONB(), nullable=True),
        sa.Column('total_samples', sa.Integer(), nullable=False),
        sa.Column('training_duration', sa.Float(), nullable=True),
        sa.Column('last_trained', sa.DateTime(timezone=True), nullable=False),
        sa.Column('trained_by', sa.String(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create ai_training_jobs table
    op.create_table(
        'ai_training_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_version', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='queued'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('triggered_by', sa.String(), nullable=True),
        sa.Column('feedback_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('parameters', postgresql.JSONB(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('metrics_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['metrics_id'], ['ai_model_metrics.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for common queries
    op.create_index('ix_ai_feedback_created_at', 'ai_feedback', ['created_at'])
    op.create_index('ix_ai_model_metrics_last_trained', 'ai_model_metrics', ['last_trained'])
    op.create_index('ix_ai_training_jobs_status', 'ai_training_jobs', ['status'])


def downgrade():
    # Drop tables
    op.drop_table('ai_training_jobs')
    op.drop_table('ai_model_metrics')
    op.drop_table('ai_feedback')
    
    # Drop enum types
    op.execute("DROP TYPE feedbackpriority")
    op.execute("DROP TYPE correctiontype") 