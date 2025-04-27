"""create scheduler tables

Revision ID: 20240427_02
Revises: 20240427_01
Create Date: 2024-04-27 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON, ARRAY

# revision identifiers, used by Alembic
revision = '20240427_02'
down_revision = '20240427_01'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Provider Types enum
    op.execute("""
        CREATE TYPE provider_type AS ENUM (
            'dentist',
            'hygienist',
            'specialist',
            'virtual'
        )
    """)
    
    # Appointment Status enum
    op.execute("""
        CREATE TYPE appointment_status AS ENUM (
            'scheduled',
            'confirmed',
            'in_progress',
            'completed',
            'cancelled',
            'no_show'
        )
    """)

    # Providers table
    op.create_table(
        'providers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('provider_type'), nullable=False),
        sa.Column('specialties', ARRAY(sa.String(50)), nullable=True),
        sa.Column('default_appointment_duration', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('allow_double_booking', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('active_locations', ARRAY(sa.Integer()), nullable=False),
        sa.Column('calendar_color', sa.String(7), nullable=False),
        sa.Column('scheduling_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Provider Availability table
    op.create_table(
        'provider_availability',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),  # 0 = Sunday, 6 = Saturday
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('provider_id', 'location_id', 'day_of_week')
    )

    # Time Off table
    op.create_table(
        'provider_time_off',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('start_datetime', sa.DateTime(), nullable=False),
        sa.Column('end_datetime', sa.DateTime(), nullable=False),
        sa.Column('reason', sa.String(200), nullable=True),
        sa.Column('is_all_day', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ondelete='CASCADE'),
    )

    # Appointments table
    op.create_table(
        'appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.Column('operatory_id', sa.Integer(), nullable=True),
        sa.Column('start_datetime', sa.DateTime(), nullable=False),
        sa.Column('end_datetime', sa.DateTime(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('appointment_type', sa.String(50), nullable=False),
        sa.Column('status', sa.Enum('appointment_status'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('group_id', sa.String(36), nullable=True),  # For linked family appointments
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        # Additional fields for analytics
        sa.Column('cancellation_reason', sa.String(200), nullable=True),
        sa.Column('cancellation_datetime', sa.DateTime(), nullable=True),
        sa.Column('confirmation_datetime', sa.DateTime(), nullable=True),
        sa.Column('check_in_datetime', sa.DateTime(), nullable=True),
        sa.Column('completion_datetime', sa.DateTime(), nullable=True),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['operatory_id'], ['operatories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
    )

    # Appointment History table (for audit trail)
    op.create_table(
        'appointment_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('changes', JSON, nullable=False),
        sa.Column('performed_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['performed_by'], ['users.id'], ondelete='SET NULL'),
    )

    # Create indexes
    op.create_index('idx_provider_locations', 'providers', ['active_locations'])
    op.create_index('idx_provider_type', 'providers', ['type'])
    op.create_index('idx_appointment_datetime', 'appointments', ['start_datetime', 'end_datetime'])
    op.create_index('idx_appointment_provider', 'appointments', ['provider_id'])
    op.create_index('idx_appointment_location', 'appointments', ['location_id'])
    op.create_index('idx_appointment_status', 'appointments', ['status'])
    op.create_index('idx_appointment_group', 'appointments', ['group_id'])
    op.create_index('idx_timeoff_provider', 'provider_time_off', ['provider_id'])
    op.create_index('idx_timeoff_dates', 'provider_time_off', ['start_datetime', 'end_datetime'])
    op.create_index('idx_availability_provider', 'provider_availability', ['provider_id'])
    op.create_index('idx_appointment_history_appointment', 'appointment_history', ['appointment_id'])

def downgrade() -> None:
    op.drop_table('appointment_history')
    op.drop_table('appointments')
    op.drop_table('provider_time_off')
    op.drop_table('provider_availability')
    op.drop_table('providers')
    op.execute('DROP TYPE appointment_status')
    op.execute('DROP TYPE provider_type') 