"""create scheduling tables

Revision ID: b4a3d2e1f0c9
Revises: c5b4a3d2e1f0
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b4a3d2e1f0c9'
down_revision = 'c5b4a3d2e1f0'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum types
    op.execute("""
        CREATE TYPE procedure_category AS ENUM (
            'preventive',
            'restorative',
            'endodontic',
            'periodontal',
            'orthodontic',
            'prosthodontic',
            'surgical',
            'other'
        )
    """)
    
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
    
    # Create procedures table
    op.create_table(
        'procedures',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('code', sa.String, unique=True, nullable=False),
        sa.Column('name', sa.String, nullable=False),
        sa.Column('description', sa.String),
        sa.Column('category', sa.Enum('preventive', 'restorative', 'endodontic', 'periodontal', 
                                    'orthodontic', 'prosthodontic', 'surgical', 'other',
                                    name='procedure_category'), nullable=False),
        sa.Column('default_duration_minutes', sa.Integer, nullable=False),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create provider_profiles table
    op.create_table(
        'provider_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('procedure_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('procedures.id'), nullable=False),
        sa.Column('duration_modifier', sa.Float, default=1.0),
        sa.Column('average_duration_minutes', sa.Integer),
        sa.Column('total_procedures', sa.Integer, default=0),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create appointments table
    op.create_table(
        'appointments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('procedure_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('procedures.id'), nullable=False),
        sa.Column('start_time', sa.DateTime, nullable=False),
        sa.Column('end_time', sa.DateTime, nullable=False),
        sa.Column('status', sa.Enum('scheduled', 'confirmed', 'in_progress', 'completed', 
                                  'cancelled', 'no_show', name='appointment_status'), 
                  default='scheduled'),
        sa.Column('is_side_booking', sa.Boolean, default=False),
        sa.Column('notes', sa.String),
        sa.Column('metadata', postgresql.JSON),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create cancellation_lists table
    op.create_table(
        'cancellation_lists',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('procedure_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('procedures.id'), nullable=False),
        sa.Column('preferred_days', postgresql.JSON),
        sa.Column('preferred_times', postgresql.JSON),
        sa.Column('earliest_date', sa.DateTime),
        sa.Column('latest_date', sa.DateTime),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create indexes
    op.create_index('idx_appointments_patient', 'appointments', ['patient_id'])
    op.create_index('idx_appointments_provider', 'appointments', ['provider_id'])
    op.create_index('idx_appointments_procedure', 'appointments', ['procedure_id'])
    op.create_index('idx_appointments_time', 'appointments', ['start_time', 'end_time'])
    op.create_index('idx_cancellation_lists_patient', 'cancellation_lists', ['patient_id'])
    op.create_index('idx_cancellation_lists_procedure', 'cancellation_lists', ['procedure_id'])

def downgrade():
    # Drop tables
    op.drop_table('cancellation_lists')
    op.drop_table('appointments')
    op.drop_table('provider_profiles')
    op.drop_table('procedures')
    
    # Drop enum types
    op.execute('DROP TYPE appointment_status')
    op.execute('DROP TYPE procedure_category') 