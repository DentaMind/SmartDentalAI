"""Add audit log and bulk match validation

Revision ID: e9f8d7c6b5a4
Revises: d8e7f6c5b4a3
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e9f8d7c6b5a4'
down_revision = 'd8e7f6c5b4a3'
branch_labels = None
depends_on = None

def upgrade():
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('details', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_type_entity_id'), 'audit_logs', ['entity_type', 'entity_id'], unique=False)

    # Add indexes to reconciliation_transactions for better bulk operation performance
    op.create_index(
        'ix_reconciliation_transactions_reconciliation_id_transaction_id',
        'reconciliation_transactions',
        ['reconciliation_id', 'transaction_id'],
        unique=True
    )

    # Add validation columns to finance_transactions
    op.add_column('finance_transactions', sa.Column('validation_status', sa.String(), nullable=True))
    op.add_column('finance_transactions', sa.Column('validation_errors', postgresql.JSONB(), nullable=True))

def downgrade():
    # Remove validation columns
    op.drop_column('finance_transactions', 'validation_errors')
    op.drop_column('finance_transactions', 'validation_status')

    # Remove indexes
    op.drop_index('ix_reconciliation_transactions_reconciliation_id_transaction_id')

    # Drop audit_logs table
    op.drop_index(op.f('ix_audit_logs_entity_type_entity_id'))
    op.drop_index(op.f('ix_audit_logs_user_id'))
    op.drop_index(op.f('ix_audit_logs_id'))
    op.drop_table('audit_logs') 