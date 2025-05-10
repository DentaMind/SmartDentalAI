"""Create providers table

Revision ID: c5f3a8d9e1b7
Revises: b1e7c5a9d8f2
Create Date: 2025-05-07 23:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c5f3a8d9e1b7'
down_revision = 'b1e7c5a9d8f2'  # Dependent on the patients table migration
branch_labels = None
depends_on = None


def upgrade():
    # Create providers table
    op.create_table(
        'providers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('specialty', sa.String(), nullable=True),
        sa.Column('license_number', sa.String(), nullable=True),
        sa.Column('npi_number', sa.String(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_providers_id'), 'providers', ['id'], unique=False)
    op.create_index(op.f('ix_providers_email'), 'providers', ['email'], unique=True)


def downgrade():
    op.drop_index(op.f('ix_providers_email'), table_name='providers')
    op.drop_index(op.f('ix_providers_id'), table_name='providers')
    op.drop_table('providers') 