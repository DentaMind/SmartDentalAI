"""Add insurance tables

Revision ID: a3b7f82c4d21
Revises: ai_feedback_tables
Create Date: 2023-06-18 14:25:16.837294

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a3b7f82c4d21'
down_revision = 'ai_feedback_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create insurance_companies table
    op.create_table('insurance_companies',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('payor_id', sa.String(), nullable=True),
        sa.Column('supports_electronic_claims', sa.Boolean(), nullable=True),
        sa.Column('supports_electronic_attachments', sa.Boolean(), nullable=True),
        sa.Column('supports_realtime_eligibility', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_insurance_companies_name'), 'insurance_companies', ['name'], unique=False)

    # Create plan type enum
    op.execute("""
        CREATE TYPE plan_type AS ENUM (
            'ppo', 'hmo', 'premier', 'capitation', 'discount', 
            'savings', 'indemnity', 'medicaid', 'medicare'
        )
    """)

    # Create insurance_policies table
    op.create_table('insurance_policies',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('subscriber_id', sa.String(), nullable=False),
        sa.Column('policy_number', sa.String(), nullable=False),
        sa.Column('group_number', sa.String(), nullable=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('company_name', sa.String(), nullable=False),
        sa.Column('plan_type', sa.Enum('ppo', 'hmo', 'premier', 'capitation', 'discount', 'savings', 'indemnity', 'medicaid', 'medicare', name='plan_type'), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('effective_date', sa.Date(), nullable=True),
        sa.Column('expiration_date', sa.Date(), nullable=True),
        sa.Column('subscriber_name', sa.String(), nullable=True),
        sa.Column('subscriber_dob', sa.Date(), nullable=True),
        sa.Column('relationship_to_subscriber', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['insurance_companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_insurance_policies_patient_id'), 'insurance_policies', ['patient_id'], unique=False)

    # Create benefit_summaries table
    op.create_table('benefit_summaries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('policy_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('annual_maximum', sa.Float(), nullable=True),
        sa.Column('remaining_benefit', sa.Float(), nullable=True),
        sa.Column('deductible', sa.Float(), nullable=True),
        sa.Column('deductible_met', sa.Float(), nullable=True),
        sa.Column('family_deductible', sa.Float(), nullable=True),
        sa.Column('family_deductible_met', sa.Float(), nullable=True),
        sa.Column('preventive_coverage', sa.Integer(), nullable=True),
        sa.Column('basic_coverage', sa.Integer(), nullable=True),
        sa.Column('major_coverage', sa.Integer(), nullable=True),
        sa.Column('ortho_coverage', sa.Integer(), nullable=True),
        sa.Column('ortho_lifetime_maximum', sa.Float(), nullable=True),
        sa.Column('ortho_remaining_benefit', sa.Float(), nullable=True),
        sa.Column('waiting_periods', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('exclusions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('frequency_limitations', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('benefit_period', sa.String(), nullable=True),
        sa.Column('benefit_period_start', sa.Date(), nullable=True),
        sa.Column('benefit_period_end', sa.Date(), nullable=True),
        sa.Column('last_verification_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['policy_id'], ['insurance_policies.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('policy_id')
    )

    # Create verification_requests table
    op.create_table('verification_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('policy_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('request_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('request_type', sa.String(), nullable=False),
        sa.Column('procedure_code', sa.String(), nullable=True),
        sa.Column('tooth_number', sa.String(), nullable=True),
        sa.Column('surfaces', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('treatment_plan_id', sa.String(), nullable=True),
        sa.Column('request_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('response_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['policy_id'], ['insurance_policies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_verification_requests_patient_id'), 'verification_requests', ['patient_id'], unique=False)

    # Create verification_responses table
    op.create_table('verification_responses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('verification_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('response_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('coverage_percentage', sa.Integer(), nullable=True),
        sa.Column('patient_pays_percentage', sa.Integer(), nullable=True),
        sa.Column('deductible_applies', sa.Boolean(), nullable=True),
        sa.Column('waiting_period_applies', sa.Boolean(), nullable=True),
        sa.Column('waiting_period_end', sa.String(), nullable=True),
        sa.Column('annual_max_applied', sa.Boolean(), nullable=True),
        sa.Column('max_remaining', sa.Float(), nullable=True),
        sa.Column('frequency_limitation', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['verification_id'], ['verification_requests.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('verification_id')
    )

    # Add insurance-related columns to treatment_plans table
    op.add_column('treatment_plans', sa.Column('medical_alerts', sa.ARRAY(sa.String()), nullable=True))
    op.add_column('treatment_plans', sa.Column('total_fee', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('treatment_plans', sa.Column('insurance_verified', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('treatment_plans', sa.Column('insurance_portion', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('treatment_plans', sa.Column('patient_portion', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('treatment_plans', sa.Column('insurance_notes', sa.Text(), nullable=True))
    op.add_column('treatment_plans', sa.Column('financial_options', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    # Add insurance-related columns to treatment_procedures table
    op.add_column('treatment_procedures', sa.Column('insurance_coverage', sa.Integer(), nullable=True))
    op.add_column('treatment_procedures', sa.Column('insurance_coverage_note', sa.String(), nullable=True))


def downgrade():
    # Remove insurance-related columns from treatment_procedures table
    op.drop_column('treatment_procedures', 'insurance_coverage_note')
    op.drop_column('treatment_procedures', 'insurance_coverage')
    
    # Remove insurance-related columns from treatment_plans table
    op.drop_column('treatment_plans', 'financial_options')
    op.drop_column('treatment_plans', 'insurance_notes')
    op.drop_column('treatment_plans', 'patient_portion')
    op.drop_column('treatment_plans', 'insurance_portion')
    op.drop_column('treatment_plans', 'insurance_verified')
    op.drop_column('treatment_plans', 'total_fee')
    op.drop_column('treatment_plans', 'medical_alerts')
    
    # Drop verification_responses table
    op.drop_table('verification_responses')
    
    # Drop verification_requests table
    op.drop_index(op.f('ix_verification_requests_patient_id'), table_name='verification_requests')
    op.drop_table('verification_requests')
    
    # Drop benefit_summaries table
    op.drop_table('benefit_summaries')
    
    # Drop insurance_policies table
    op.drop_index(op.f('ix_insurance_policies_patient_id'), table_name='insurance_policies')
    op.drop_table('insurance_policies')
    
    # Drop plan_type enum
    op.execute('DROP TYPE plan_type')
    
    # Drop insurance_companies table
    op.drop_index(op.f('ix_insurance_companies_name'), table_name='insurance_companies')
    op.drop_table('insurance_companies') 