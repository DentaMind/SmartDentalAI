"""create alerts table

Revision ID: 20240427_04
Revises: 20240427_03
Create Date: 2024-04-27 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic
revision = '20240427_04'
down_revision = '20240427_03'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create enum types
    op.execute("""
        CREATE TYPE alert_type AS ENUM (
            'schema_validation',
            'learning_pattern',
            'system_health'
        )
    """)
    
    op.execute("""
        CREATE TYPE alert_severity AS ENUM (
            'info',
            'warning',
            'critical'
        )
    """)
    
    op.execute("""
        CREATE TYPE alert_status AS ENUM (
            'active',
            'resolved',
            'acknowledged'
        )
    """)
    
    # Create alerts table
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('schema_validation', 'learning_pattern', 'system_health',
                                 name='alert_type'), nullable=False),
        sa.Column('severity', sa.Enum('info', 'warning', 'critical',
                                    name='alert_severity'), nullable=False),
        sa.Column('status', sa.Enum('active', 'resolved', 'acknowledged',
                                  name='alert_status'), nullable=False,
                                  server_default='active'),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('metadata', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_alerts_type', 'alerts', ['type'])
    op.create_index('idx_alerts_status', 'alerts', ['status'])
    op.create_index('idx_alerts_severity', 'alerts', ['severity'])
    op.create_index('idx_alerts_created_at', 'alerts', ['created_at'])

def downgrade() -> None:
    op.drop_table('alerts')
    op.execute('DROP TYPE alert_type')
    op.execute('DROP TYPE alert_severity')
    op.execute('DROP TYPE alert_status') 