"""Create patients table

Revision ID: b1e7c5a9d8f2
Revises: 
Create Date: 2025-05-07 23:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b1e7c5a9d8f2'
down_revision = None  # This is a base migration
branch_labels = None
depends_on = None


def upgrade():
    # Create patients table
    op.create_table(
        'patients',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', sa.String(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('state', sa.String(), nullable=True),
        sa.Column('zip_code', sa.String(), nullable=True),
        sa.Column('insurance_provider', sa.String(), nullable=True),
        sa.Column('insurance_id', sa.String(), nullable=True),
        sa.Column('medical_history', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patients_id'), 'patients', ['id'], unique=False)
    op.create_index(op.f('ix_patients_email'), 'patients', ['email'], unique=True)


def downgrade():
    op.drop_index(op.f('ix_patients_email'), table_name='patients')
    op.drop_index(op.f('ix_patients_id'), table_name='patients')
    op.drop_table('patients') 