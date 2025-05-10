"""add patient recall tables

Revision ID: f4e2d9a71b2c
Revises: a4b791e0a5c3
Create Date: 2025-05-15 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'f4e2d9a71b2c'
down_revision: Union[str, None] = 'a4b791e0a5c3'  # Reference the previous migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create recall type enum
    op.execute(
        """
        CREATE TYPE recall_type AS ENUM (
            'hygiene',
            'perio_maintenance',
            'restorative_followup',
            'patient_reactivation',
            'other'
        );
        """
    )
    
    # Create recall frequency enum
    op.execute(
        """
        CREATE TYPE recall_frequency AS ENUM (
            '1',
            '3',
            '4',
            '6',
            '12',
            'custom'
        );
        """
    )
    
    # Create recall status enum
    op.execute(
        """
        CREATE TYPE recall_status AS ENUM (
            'active',
            'paused',
            'completed',
            'cancelled'
        );
        """
    )
    
    # Create patient recall schedules table
    op.create_table(
        'patient_recall_schedules',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('recall_type', sa.Enum('hygiene', 'perio_maintenance', 'restorative_followup', 'patient_reactivation', 'other', name='recall_type'), nullable=False),
        sa.Column('frequency', sa.Enum('1', '3', '4', '6', '12', 'custom', name='recall_frequency'), nullable=False),
        sa.Column('custom_days', sa.Integer(), nullable=True),
        sa.Column('provider_id', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('active', 'paused', 'completed', 'cancelled', name='recall_status'), nullable=False),
        sa.Column('last_appointment_date', sa.DateTime(), nullable=True),
        sa.Column('next_due_date', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('reminder_days_before', JSONB(), nullable=True),
        sa.Column('max_reminders', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create recall reminder history table
    op.create_table(
        'recall_reminder_history',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('recall_schedule_id', sa.String(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('notification_id', sa.String(), nullable=True),
        sa.Column('days_before_due', sa.Integer(), nullable=False),
        sa.Column('sent_by', sa.String(), nullable=True),
        sa.Column('delivery_channel', sa.String(), nullable=False),
        sa.Column('metadata', JSONB(), nullable=True),
        sa.ForeignKeyConstraint(['recall_schedule_id'], ['patient_recall_schedules.id'], ),
        sa.ForeignKeyConstraint(['sent_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for better performance
    op.create_index(op.f('ix_patient_recall_schedules_patient_id'), 'patient_recall_schedules', ['patient_id'], unique=False)
    op.create_index(op.f('ix_patient_recall_schedules_next_due_date'), 'patient_recall_schedules', ['next_due_date'], unique=False)
    op.create_index(op.f('ix_patient_recall_schedules_recall_type'), 'patient_recall_schedules', ['recall_type'], unique=False)
    op.create_index(op.f('ix_patient_recall_schedules_status'), 'patient_recall_schedules', ['status'], unique=False)
    op.create_index(op.f('ix_recall_reminder_history_recall_schedule_id'), 'recall_reminder_history', ['recall_schedule_id'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_recall_reminder_history_recall_schedule_id'), table_name='recall_reminder_history')
    op.drop_index(op.f('ix_patient_recall_schedules_status'), table_name='patient_recall_schedules')
    op.drop_index(op.f('ix_patient_recall_schedules_recall_type'), table_name='patient_recall_schedules')
    op.drop_index(op.f('ix_patient_recall_schedules_next_due_date'), table_name='patient_recall_schedules') 
    op.drop_index(op.f('ix_patient_recall_schedules_patient_id'), table_name='patient_recall_schedules')
    
    # Drop tables
    op.drop_table('recall_reminder_history')
    op.drop_table('patient_recall_schedules')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS recall_status;')
    op.execute('DROP TYPE IF EXISTS recall_frequency;')
    op.execute('DROP TYPE IF EXISTS recall_type;') 