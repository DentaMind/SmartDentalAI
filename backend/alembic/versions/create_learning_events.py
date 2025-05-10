"""create learning events table

Revision ID: 1a2b3c4d5e6f
Revises: previous_revision_id
Create Date: 2024-04-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic
revision = '1a2b3c4d5e6f'
down_revision = 'previous_revision_id'  # Set to actual previous revision
branch_labels = None
depends_on = None

def upgrade():
    # Create learning_events table
    op.create_table(
        'learning_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('event_type', sa.String(255), nullable=False),
        sa.Column('user_id', sa.String(255), nullable=True),
        sa.Column('session_id', sa.String(255), nullable=False),
        sa.Column('metadata', JSON, nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(
        'ix_learning_events_timestamp',
        'learning_events',
        ['timestamp']
    )
    op.create_index(
        'ix_learning_events_event_type',
        'learning_events',
        ['event_type']
    )
    op.create_index(
        'ix_learning_events_user_id',
        'learning_events',
        ['user_id']
    )
    op.create_index(
        'ix_learning_events_session_id',
        'learning_events',
        ['session_id']
    )
    
    # Create partitions for time-based querying
    op.execute("""
        CREATE TABLE learning_events_y2024m04 PARTITION OF learning_events
        FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
        
        CREATE TABLE learning_events_y2024m05 PARTITION OF learning_events
        FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
        
        CREATE TABLE learning_events_y2024m06 PARTITION OF learning_events
        FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
    """)

def downgrade():
    # Drop partitioned tables first
    op.execute("""
        DROP TABLE IF EXISTS learning_events_y2024m04;
        DROP TABLE IF EXISTS learning_events_y2024m05;
        DROP TABLE IF EXISTS learning_events_y2024m06;
    """)
    
    # Drop indexes
    op.drop_index('ix_learning_events_timestamp')
    op.drop_index('ix_learning_events_event_type')
    op.drop_index('ix_learning_events_user_id')
    op.drop_index('ix_learning_events_session_id')
    
    # Drop main table
    op.drop_table('learning_events') 