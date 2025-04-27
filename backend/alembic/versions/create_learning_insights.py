"""create learning insights table

Revision ID: 2b3c4d5e6f7g
Revises: 1a2b3c4d5e6f
Create Date: 2024-04-10 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic
revision = '2b3c4d5e6f7g'
down_revision = '1a2b3c4d5e6f'  # Points to learning_events migration
branch_labels = None
depends_on = None

def upgrade():
    # Create learning_insights table
    op.create_table(
        'learning_insights',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('metrics', JSON, nullable=False),
        sa.Column('patterns', JSON, nullable=False),
        sa.Column('alerts', JSON, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date')
    )
    
    # Create indexes
    op.create_index(
        'ix_learning_insights_date',
        'learning_insights',
        ['date']
    )
    
    # Create partitions for time-based querying
    op.execute("""
        CREATE TABLE learning_insights_y2024q2 PARTITION OF learning_insights
        FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
        
        CREATE TABLE learning_insights_y2024q3 PARTITION OF learning_insights
        FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');
        
        CREATE TABLE learning_insights_y2024q4 PARTITION OF learning_insights
        FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
    """)

def downgrade():
    # Drop partitioned tables first
    op.execute("""
        DROP TABLE IF EXISTS learning_insights_y2024q2;
        DROP TABLE IF EXISTS learning_insights_y2024q3;
        DROP TABLE IF EXISTS learning_insights_y2024q4;
    """)
    
    # Drop indexes
    op.drop_index('ix_learning_insights_date')
    
    # Drop main table
    op.drop_table('learning_insights') 