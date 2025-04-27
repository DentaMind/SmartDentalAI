"""create learning events table

Revision ID: 20240427_01
Revises: previous_revision
Create Date: 2024-04-27 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic
revision = '20240427_01'
down_revision = 'previous_revision'  # Update this to your last migration
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'learning_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.String(36), nullable=False),
        sa.Column('type', sa.String(100), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('server_timestamp', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        # User context
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('session_id', sa.String(100), nullable=True),
        sa.Column('device_info', sa.String(500), nullable=True),
        
        # Event data
        sa.Column('payload', JSON, nullable=False),
        sa.Column('metadata', JSON, nullable=True),
        
        # Environment info
        sa.Column('environment', sa.String(20), nullable=False),
        sa.Column('version', sa.String(20), nullable=True),
        
        # Error tracking
        sa.Column('error_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_error', sa.String(500), nullable=True),
        
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    # Create indexes
    op.create_index('idx_event_type_timestamp', 'learning_events', ['type', 'timestamp'])
    op.create_index('idx_user_timestamp', 'learning_events', ['user_id', 'timestamp'])
    op.create_index('idx_session_timestamp', 'learning_events', ['session_id', 'timestamp'])
    op.create_index('idx_environment_timestamp', 'learning_events', ['environment', 'timestamp'])

def downgrade() -> None:
    op.drop_table('learning_events') 