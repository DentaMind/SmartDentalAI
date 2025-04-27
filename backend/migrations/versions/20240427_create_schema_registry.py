"""create schema registry table

Revision ID: 20240427_03
Revises: 20240427_02
Create Date: 2024-04-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic
revision = '20240427_03'
down_revision = '20240427_02'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'schema_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('schema', JSON, nullable=False),
        sa.Column('schema_hash', sa.String(64), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_type', 'version', name='uq_schema_version'),
        sa.UniqueConstraint('event_type', 'schema_hash', name='uq_schema_hash')
    )
    
    # Create indexes
    op.create_index('idx_schema_event_type', 'schema_versions', ['event_type'])
    op.create_index('idx_schema_hash', 'schema_versions', ['schema_hash'])
    op.create_index('idx_schema_active', 'schema_versions', ['is_active'])

def downgrade() -> None:
    op.drop_table('schema_versions') 