"""Add educational content and tracking tables

Revision ID: a24f8cbd3b7c
Revises: 9723ba4d1e32
Create Date: 2023-06-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a24f8cbd3b7c'
down_revision = 'f4e2d9a71b2c'  # Updated to match existing migration
branch_labels = None
depends_on = None


def upgrade():
    # Create the enum types first
    op.execute("CREATE TYPE content_type AS ENUM ('article', 'video', 'pdf', 'infographic', 'link')")
    op.execute("CREATE TYPE content_category AS ENUM ('general', 'oral_hygiene', 'periodontal', 'restorative', 'endodontic', 'surgical', 'preventive', 'orthodontic', 'pediatric', 'nutrition', 'smoking_cessation', 'diabetes')")
    
    # Create educational_content table
    op.create_table('educational_content',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('content_type', sa.Enum('article', 'video', 'pdf', 'infographic', 'link', name='content_type'), nullable=False),
        sa.Column('category', sa.Enum('general', 'oral_hygiene', 'periodontal', 'restorative', 'endodontic', 'surgical', 'preventive', 'orthodontic', 'pediatric', 'nutrition', 'smoking_cessation', 'diabetes', name='content_category'), nullable=False),
        sa.Column('content_url', sa.String(length=512), nullable=True),
        sa.Column('content_text', sa.Text(), nullable=True),
        sa.Column('thumbnail_url', sa.String(length=512), nullable=True),
        sa.Column('duration', sa.String(length=50), nullable=True),
        sa.Column('author', sa.String(length=100), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=True, default=0),
        sa.Column('is_featured', sa.Boolean(), nullable=True, default=False),
        sa.Column('tags', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=True, default=0),
        sa.Column('completion_rate', sa.Integer(), nullable=True, default=0),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create content_risk_factors table
    op.create_table('content_risk_factors',
        sa.Column('content_id', sa.String(), nullable=False),
        sa.Column('risk_factor', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['content_id'], ['educational_content.id'], ),
        sa.PrimaryKeyConstraint('content_id', 'risk_factor')
    )
    
    # Create content_engagement table
    op.create_table('content_engagement',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('content_id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=True),
        sa.Column('staff_id', sa.String(), nullable=True),
        sa.Column('view_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('view_duration_seconds', sa.Integer(), nullable=True, default=0),
        sa.Column('completion_percentage', sa.Integer(), nullable=True, default=0),
        sa.Column('completed', sa.Boolean(), nullable=True, default=False),
        sa.Column('device_type', sa.String(length=50), nullable=True),
        sa.Column('browser', sa.String(length=100), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=True),
        sa.Column('bookmarked', sa.Boolean(), nullable=True, default=False),
        sa.Column('shared', sa.Boolean(), nullable=True, default=False),
        sa.Column('feedback_rating', sa.Integer(), nullable=True),
        sa.Column('feedback_comment', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['content_id'], ['educational_content.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['staff_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_content_engagement_content_id'), 'content_engagement', ['content_id'], unique=False)
    op.create_index(op.f('ix_content_engagement_patient_id'), 'content_engagement', ['patient_id'], unique=False)
    op.create_index(op.f('ix_content_engagement_staff_id'), 'content_engagement', ['staff_id'], unique=False)
    
    # Create patient_saved_content table
    op.create_table('patient_saved_content',
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('content_id', sa.String(), nullable=False),
        sa.Column('saved_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['content_id'], ['educational_content.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('patient_id', 'content_id')
    )


def downgrade():
    # Drop tables in reverse order of creation
    op.drop_table('patient_saved_content')
    op.drop_index(op.f('ix_content_engagement_staff_id'), table_name='content_engagement')
    op.drop_index(op.f('ix_content_engagement_patient_id'), table_name='content_engagement')
    op.drop_index(op.f('ix_content_engagement_content_id'), table_name='content_engagement')
    op.drop_table('content_engagement')
    op.drop_table('content_risk_factors')
    op.drop_table('educational_content')
    
    # Drop enum types
    op.execute("DROP TYPE content_category")
    op.execute("DROP TYPE content_type") 