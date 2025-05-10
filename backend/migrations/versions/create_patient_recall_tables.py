"""Create patient recall schedules tables

Revision ID: c7e9f1a02d53
Revises: c5f3a8d9e1b7  # Updated to depend on the providers table migration
Create Date: 2023-06-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c7e9f1a02d53'
down_revision = 'c5f3a8d9e1b7'  # Updated to depend on the providers table migration
branch_labels = None
depends_on = None


def upgrade():
    # Create patient_recall_schedules table
    op.create_table(
        'patient_recall_schedules',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('recall_type', sa.String(), nullable=False),
        sa.Column('due_date', sa.DateTime(), nullable=False),
        sa.Column('provider_id', sa.String(), nullable=True),
        sa.Column('recurrence_pattern', sa.String(), nullable=True),
        sa.Column('recurrence_interval', sa.Integer(), nullable=True),
        sa.Column('max_reminders', sa.Integer(), nullable=True),
        sa.Column('last_appointment_date', sa.DateTime(), nullable=True),
        sa.Column('last_reminded_date', sa.DateTime(), nullable=True),
        sa.Column('active', sa.Boolean(), default=True, nullable=False),
        sa.Column('reminder_sent', sa.Boolean(), default=False, nullable=False),
        sa.Column('reminder_count', sa.Integer(), default=0, nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index(op.f('ix_patient_recall_schedules_id'), 'patient_recall_schedules', ['id'], unique=False)
    op.create_index(op.f('ix_patient_recall_schedules_patient_id'), 'patient_recall_schedules', ['patient_id'], unique=False)
    op.create_index(op.f('ix_patient_recall_schedules_recall_type'), 'patient_recall_schedules', ['recall_type'], unique=False)
    op.create_index(op.f('ix_patient_recall_schedules_due_date'), 'patient_recall_schedules', ['due_date'], unique=False)
    op.create_index(op.f('ix_patient_recall_schedules_provider_id'), 'patient_recall_schedules', ['provider_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_patient_recall_schedules_provider_id'), table_name='patient_recall_schedules')
    op.drop_index(op.f('ix_patient_recall_schedules_due_date'), table_name='patient_recall_schedules')
    op.drop_index(op.f('ix_patient_recall_schedules_recall_type'), table_name='patient_recall_schedules')
    op.drop_index(op.f('ix_patient_recall_schedules_patient_id'), table_name='patient_recall_schedules')
    op.drop_index(op.f('ix_patient_recall_schedules_id'), table_name='patient_recall_schedules')
    op.drop_table('patient_recall_schedules') 