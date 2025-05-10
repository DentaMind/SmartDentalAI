"""Create audit logs table

Revision ID: 784c2fe5a92b
Revises: previous_revision_id_here
Create Date: 2023-07-10 09:23:56.789012

This migration creates the audit_logs table for tracking API access
with HIPAA-compliant audit trails.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '784c2fe5a92b'
down_revision = None  # Replace with actual previous revision when integrating
branch_labels = None
depends_on = None


def upgrade():
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('correlation_id', sa.String(length=36), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('user_id', sa.String(length=50), nullable=False),
        sa.Column('user_role', sa.String(length=50), nullable=False),
        sa.Column('ip_address', sa.String(length=50), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('path', sa.String(length=255), nullable=False),
        sa.Column('query_params', sa.JSON(), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('duration_ms', sa.Integer(), nullable=False),
        sa.Column('request_body', sa.JSON(), nullable=True),
        sa.Column('response_data', sa.JSON(), nullable=True),
        sa.Column('patient_id', sa.String(length=50), nullable=True),
        sa.Column('is_phi_access', sa.Boolean(), nullable=False, default=False),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('referrer', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create required indexes
    op.create_index(op.f('ix_audit_logs_correlation_id'), 'audit_logs', ['correlation_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_ip_address'), 'audit_logs', ['ip_address'], unique=False)
    op.create_index(op.f('ix_audit_logs_path'), 'audit_logs', ['path'], unique=False)
    op.create_index(op.f('ix_audit_logs_status_code'), 'audit_logs', ['status_code'], unique=False)
    op.create_index(op.f('ix_audit_logs_patient_id'), 'audit_logs', ['patient_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_is_phi_access'), 'audit_logs', ['is_phi_access'], unique=False)
    
    # Create compound indexes for common queries
    op.create_index('ix_audit_is_phi_patient', 'audit_logs', ['is_phi_access', 'patient_id'], unique=False)
    op.create_index('ix_audit_status_ip', 'audit_logs', ['status_code', 'ip_address'], unique=False)
    op.create_index('ix_audit_user_timestamp', 'audit_logs', ['user_id', 'timestamp'], unique=False)
    op.create_index('ix_audit_path_duration', 'audit_logs', ['path', 'duration_ms'], unique=False)
    
    # Add partitioning for high-volume audit logs (optional, for PostgreSQL)
    # This creates partitions by month to improve query performance
    # Only uncomment if using PostgreSQL and want partitioning
    """
    op.execute('''
    CREATE TABLE audit_logs_y2023m07 PARTITION OF audit_logs
    FOR VALUES FROM ('2023-07-01') TO ('2023-08-01');
    
    CREATE TABLE audit_logs_y2023m08 PARTITION OF audit_logs
    FOR VALUES FROM ('2023-08-01') TO ('2023-09-01');
    
    CREATE TABLE audit_logs_default PARTITION OF audit_logs
    DEFAULT;
    ''')
    """


def downgrade():
    # Drop indexes
    op.drop_index('ix_audit_path_duration', table_name='audit_logs')
    op.drop_index('ix_audit_user_timestamp', table_name='audit_logs')
    op.drop_index('ix_audit_status_ip', table_name='audit_logs')
    op.drop_index('ix_audit_is_phi_patient', table_name='audit_logs')
    
    op.drop_index(op.f('ix_audit_logs_is_phi_access'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_patient_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_status_code'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_path'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_ip_address'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_timestamp'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_correlation_id'), table_name='audit_logs')
    
    # Drop partitions if they were created (uncomment if partitioning was used)
    """
    op.execute('''
    DROP TABLE audit_logs_y2023m07;
    DROP TABLE audit_logs_y2023m08;
    DROP TABLE audit_logs_default;
    ''')
    """
    
    # Drop the main table
    op.drop_table('audit_logs') 