"""Add request_id and retention fields to audit logs

Revision ID: 5a046ac452ec
Revises: 78f0293b823d
Create Date: 2025-05-07 22:13:28.833458

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a046ac452ec'
down_revision: Union[str, None] = '78f0293b823d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
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


def downgrade() -> None:
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
