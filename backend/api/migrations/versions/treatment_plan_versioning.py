"""Treatment plan versioning and audit system

Revision ID: 2023ea8a7c21
Revises: 
Create Date: 2023-05-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2023ea8a7c21'
down_revision = None  # Update this to the previous migration ID in your system
branch_labels = None
depends_on = None


def upgrade():
    # Create treatment_plan_versions table
    op.create_table(
        'treatment_plan_versions',
        sa.Column('treatment_plan_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('data', postgresql.JSON(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['treatment_plan_id'], ['treatment_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('treatment_plan_id', 'version')
    )
    
    # Create treatment_plan_audit table
    op.create_table(
        'treatment_plan_audit',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('treatment_plan_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('action_by', sa.String(), nullable=False),
        sa.Column('action_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('details', postgresql.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['treatment_plan_id'], ['treatment_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add new columns to treatment_plans
    op.add_column('treatment_plans', sa.Column('current_version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('treatment_plans', sa.Column('created_by', sa.String(), nullable=True))
    op.add_column('treatment_plans', sa.Column('last_modified_by', sa.String(), nullable=True))
    op.add_column('treatment_plans', sa.Column('consent_signed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('treatment_plans', sa.Column('consent_signed_by', sa.String(), nullable=True))
    op.add_column('treatment_plans', sa.Column('consent_signed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('treatment_plans', sa.Column('ai_assisted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('treatment_plans', sa.Column('ai_model_version', sa.String(), nullable=True))
    op.add_column('treatment_plans', sa.Column('ai_confidence_score', sa.Float(), nullable=True))
    
    # Add new columns to treatment_procedures
    op.add_column('treatment_procedures', sa.Column('phase', sa.String(), nullable=False, server_default='phase_1'))
    op.add_column('treatment_procedures', sa.Column('fee', sa.Float(), nullable=False, server_default='0'))
    op.add_column('treatment_procedures', sa.Column('surfaces', postgresql.ARRAY(sa.String()), nullable=True))
    op.add_column('treatment_procedures', sa.Column('quadrant', sa.String(), nullable=True))
    op.add_column('treatment_procedures', sa.Column('arch', sa.String(), nullable=True))
    op.add_column('treatment_procedures', sa.Column('preauth_required', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('treatment_procedures', sa.Column('preauth_status', sa.String(), nullable=True))
    op.add_column('treatment_procedures', sa.Column('preauth_date', sa.DateTime(timezone=True), nullable=True))
    
    # Create indices
    op.create_index('ix_treatment_plan_audit_treatment_plan_id', 'treatment_plan_audit', ['treatment_plan_id'], unique=False)
    op.create_index('ix_treatment_plan_audit_action_at', 'treatment_plan_audit', ['action_at'], unique=False)
    op.create_index('ix_treatment_plan_versions_treatment_plan_id', 'treatment_plan_versions', ['treatment_plan_id'], unique=False)
    
    # Update existing data (set created_by to prevent NULL constraint violations)
    op.execute("UPDATE treatment_plans SET created_by = 'system_migration' WHERE created_by IS NULL")
    
    # Make created_by NOT NULL
    op.alter_column('treatment_plans', 'created_by', nullable=False)


def downgrade():
    # Drop treatment_plan_versions and treatment_plan_audit tables
    op.drop_table('treatment_plan_versions')
    op.drop_table('treatment_plan_audit')
    
    # Remove columns from treatment_plans
    op.drop_column('treatment_plans', 'current_version')
    op.drop_column('treatment_plans', 'created_by')
    op.drop_column('treatment_plans', 'last_modified_by')
    op.drop_column('treatment_plans', 'consent_signed')
    op.drop_column('treatment_plans', 'consent_signed_by')
    op.drop_column('treatment_plans', 'consent_signed_at')
    op.drop_column('treatment_plans', 'ai_assisted')
    op.drop_column('treatment_plans', 'ai_model_version')
    op.drop_column('treatment_plans', 'ai_confidence_score')
    
    # Remove columns from treatment_procedures
    op.drop_column('treatment_procedures', 'phase')
    op.drop_column('treatment_procedures', 'fee')
    op.drop_column('treatment_procedures', 'surfaces')
    op.drop_column('treatment_procedures', 'quadrant')
    op.drop_column('treatment_procedures', 'arch')
    op.drop_column('treatment_procedures', 'preauth_required')
    op.drop_column('treatment_procedures', 'preauth_status')
    op.drop_column('treatment_procedures', 'preauth_date') 