"""add request_id and retention fields to audit logs

Revision ID: 4d8e2f1c7b9a
Create Date: 2025-05-05 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4d8e2f1c7b9a'
branch_labels = None
depends_on = None


def upgrade():
    # Add request_id and retention_days to audit_logs table
    op.add_column('audit_logs', sa.Column('request_id', sa.String(36), nullable=True))
    op.add_column('audit_logs', sa.Column('retention_days', sa.Integer(), nullable=True))
    op.create_index('idx_audit_logs_request_id', 'audit_logs', ['request_id'])
    
    # Add request_id to diagnostic_logs table
    op.add_column('diagnostic_logs', sa.Column('request_id', sa.String(36), nullable=True))
    op.create_index('idx_diagnostic_logs_request_id', 'diagnostic_logs', ['request_id'])
    
    # Add request_id to treatment_logs table
    op.add_column('treatment_logs', sa.Column('request_id', sa.String(36), nullable=True))
    op.create_index('idx_treatment_logs_request_id', 'treatment_logs', ['request_id'])
    
    # Add request_id to feedback_logs table
    op.add_column('feedback_logs', sa.Column('request_id', sa.String(36), nullable=True))
    op.create_index('idx_feedback_logs_request_id', 'feedback_logs', ['request_id'])


def downgrade():
    # Remove request_id and retention_days from audit_logs table
    op.drop_index('idx_audit_logs_request_id', table_name='audit_logs')
    op.drop_column('audit_logs', 'request_id')
    op.drop_column('audit_logs', 'retention_days')
    
    # Remove request_id from diagnostic_logs table
    op.drop_index('idx_diagnostic_logs_request_id', table_name='diagnostic_logs')
    op.drop_column('diagnostic_logs', 'request_id')
    
    # Remove request_id from treatment_logs table
    op.drop_index('idx_treatment_logs_request_id', table_name='treatment_logs')
    op.drop_column('treatment_logs', 'request_id')
    
    # Remove request_id from feedback_logs table
    op.drop_index('idx_feedback_logs_request_id', table_name='feedback_logs')
    op.drop_column('feedback_logs', 'request_id') 