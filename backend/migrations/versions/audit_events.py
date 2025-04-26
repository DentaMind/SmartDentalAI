"""Add audit events table

Revision ID: audit_events
Revises: consent_fields
Create Date: 2024-04-25 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'audit_events'
down_revision: Union[str, None] = 'consent_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create audit events table
    op.create_table('audit_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),  # Store as string instead of enum
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=True),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_events'))
    )

    # Create index on timestamp for efficient querying
    op.create_index(op.f('ix_audit_events_timestamp'), 'audit_events', ['timestamp'], unique=False)
    
    # Create index on resource lookup
    op.create_index(
        op.f('ix_audit_events_resource'),
        'audit_events',
        ['resource_type', 'resource_id'],
        unique=False
    )

def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_audit_events_timestamp'), table_name='audit_events')
    op.drop_index(op.f('ix_audit_events_resource'), table_name='audit_events')
    
    # Drop table
    op.drop_table('audit_events') 