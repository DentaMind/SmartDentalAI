"""Add prescription tables

Revision ID: b452f91c3d22
Revises: a3b7f82c4d21
Create Date: 2023-06-19 15:30:22.563941

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b452f91c3d22'
down_revision = 'a3b7f82c4d21'
branch_labels = None
depends_on = None


def upgrade():
    # Create prescription status enum
    op.execute("""
        CREATE TYPE prescription_status AS ENUM (
            'pending', 'approved', 'sent', 'filled', 'declined', 'cancelled'
        )
    """)
    
    # Create prescriptions table
    op.create_table('prescriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('provider_id', sa.String(), nullable=False),
        sa.Column('treatment_plan_id', sa.String(), nullable=True),
        sa.Column('prescription_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.Enum('pending', 'approved', 'sent', 'filled', 'declined', 'cancelled', name='prescription_status'), nullable=False, server_default='pending'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('approved_by', sa.String(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('filled_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prescriptions_patient_id'), 'prescriptions', ['patient_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_treatment_plan_id'), 'prescriptions', ['treatment_plan_id'], unique=False)
    
    # Create prescription_items table
    op.create_table('prescription_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('prescription_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('medication_name', sa.String(), nullable=False),
        sa.Column('dosage', sa.String(), nullable=False),
        sa.Column('form', sa.String(), nullable=False, server_default='tablet'),
        sa.Column('route', sa.String(), nullable=False, server_default='oral'),
        sa.Column('frequency', sa.String(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('days_supply', sa.Integer(), nullable=True),
        sa.Column('refills', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('dispense_as_written', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Drop prescription_items table
    op.drop_table('prescription_items')
    
    # Drop prescriptions table
    op.drop_index(op.f('ix_prescriptions_treatment_plan_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_patient_id'), table_name='prescriptions')
    op.drop_table('prescriptions')
    
    # Drop prescription status enum
    op.execute('DROP TYPE prescription_status') 