"""create clinical evidence tables

Revision ID: a4b791e0a5c3
Revises: 960bbb8fefac
Create Date: 2025-04-29 16:45:12.123456

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = 'a4b791e0a5c3'
down_revision = '960bbb8fefac'  # Reference the initial schema migration
branch_labels = None
depends_on = None


def upgrade():
    # Create enum types for evidence type and grade
    op.execute(
        """
        CREATE TYPE evidence_type AS ENUM (
            'guideline', 
            'systematic_review', 
            'clinical_trial', 
            'cohort_study', 
            'case_control', 
            'case_series', 
            'expert_opinion'
        );
        """
    )
    
    op.execute(
        """
        CREATE TYPE evidence_grade AS ENUM (
            'A', 
            'B', 
            'C', 
            'D'
        );
        """
    )
    
    # Create clinical evidence table
    op.create_table(
        'clinical_evidence',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('authors', sa.String(), nullable=True),
        sa.Column('publication', sa.String(), nullable=True),
        sa.Column('publication_date', sa.DateTime(), nullable=True),
        sa.Column('doi', sa.String(), nullable=True, index=True),
        sa.Column('url', sa.String(), nullable=True),
        sa.Column('evidence_type', sa.Enum('guideline', 'systematic_review', 'clinical_trial', 'cohort_study', 'case_control', 'case_series', 'expert_opinion', name='evidence_type'), nullable=False),
        sa.Column('evidence_grade', sa.Enum('A', 'B', 'C', 'D', name='evidence_grade'), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('recommendations', JSONB(), nullable=True),
        sa.Column('specialties', JSONB(), nullable=True),
        sa.Column('conditions', JSONB(), nullable=True),
        sa.Column('procedures', JSONB(), nullable=True),
        sa.Column('keywords', JSONB(), nullable=True),
        sa.Column('version', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, onupdate=sa.text('now()'))
    )
    
    # Create finding-evidence association table
    op.create_table(
        'finding_evidence_association',
        sa.Column('finding_type', sa.String(), nullable=False, index=True),
        sa.Column('evidence_id', UUID(as_uuid=True), sa.ForeignKey('clinical_evidence.id'), nullable=False),
        sa.Column('relevance_score', sa.Float(), nullable=True)
    )
    
    # Create treatment-evidence association table
    op.create_table(
        'treatment_evidence_association',
        sa.Column('procedure_code', sa.String(), nullable=False, index=True),
        sa.Column('evidence_id', UUID(as_uuid=True), sa.ForeignKey('clinical_evidence.id'), nullable=False),
        sa.Column('relevance_score', sa.Float(), nullable=True)
    )
    
    # Create indexes for efficient queries
    op.create_index(
        'ix_finding_evidence_compound', 
        'finding_evidence_association', 
        ['finding_type', 'evidence_id'], 
        unique=True
    )
    
    op.create_index(
        'ix_treatment_evidence_compound', 
        'treatment_evidence_association', 
        ['procedure_code', 'evidence_id'], 
        unique=True
    )


def downgrade():
    # Drop association tables
    op.drop_table('treatment_evidence_association')
    op.drop_table('finding_evidence_association')
    
    # Drop clinical evidence table
    op.drop_table('clinical_evidence')
    
    # Drop enum types
    op.execute('DROP TYPE evidence_grade;')
    op.execute('DROP TYPE evidence_type;') 