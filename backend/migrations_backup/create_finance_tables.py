"""create finance tables

Revision ID: d8e7f6c5b4a3
Revises: fc8eb100f7ac
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd8e7f6c5b4a3'
down_revision = 'fc8eb100f7ac'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum types
    op.execute("CREATE TYPE transaction_type AS ENUM ('expense', 'income')")
    op.execute("CREATE TYPE expense_category AS ENUM ('lab', 'supplies', 'software', 'rent', 'utilities', 'payroll', 'insurance', 'marketing', 'maintenance', 'other')")
    op.execute("CREATE TYPE income_category AS ENUM ('insurance', 'patient', 'refund', 'adjustment', 'other')")
    op.execute("CREATE TYPE payment_method AS ENUM ('cash', 'check', 'credit_card', 'ach', 'stripe', 'other')")
    op.execute("CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'rejected', 'reconciled')")

    # Create vendors table
    op.create_table(
        'vendors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('category', postgresql.ENUM('lab', 'supplies', 'software', 'rent', 'utilities', 'payroll', 'insurance', 'marketing', 'maintenance', 'other', name='expense_category'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Create finance_transactions table
    op.create_table(
        'finance_transactions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('transaction_type', postgresql.ENUM('expense', 'income', name='transaction_type'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('category', postgresql.ENUM('lab', 'supplies', 'software', 'rent', 'utilities', 'payroll', 'insurance', 'marketing', 'maintenance', 'other', 'insurance', 'patient', 'refund', 'adjustment', name='expense_category,income_category'), nullable=False),
        sa.Column('payment_method', postgresql.ENUM('cash', 'check', 'credit_card', 'ach', 'stripe', 'other', name='payment_method'), nullable=True),
        sa.Column('status', postgresql.ENUM('pending', 'approved', 'rejected', 'reconciled', name='transaction_status'), server_default='pending'),
        sa.Column('vendor_id', sa.String(), nullable=True),
        sa.Column('patient_id', sa.String(), nullable=True),
        sa.Column('insurance_claim_id', sa.String(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('approved_by', sa.String(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['insurance_claim_id'], ['insurance_claims.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create vendor_category_maps table
    op.create_table(
        'vendor_category_maps',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('vendor_name', sa.String(), nullable=False),
        sa.Column('vendor_email', sa.String(), nullable=True),
        sa.Column('category', postgresql.ENUM('lab', 'supplies', 'software', 'rent', 'utilities', 'payroll', 'insurance', 'marketing', 'maintenance', 'other', name='expense_category'), nullable=False),
        sa.Column('confidence_score', sa.Float(), server_default='1.0'),
        sa.Column('is_auto_mapped', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Create finance_reconciliations table
    op.create_table(
        'finance_reconciliations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('total_income', sa.Float(), server_default='0.0'),
        sa.Column('total_expenses', sa.Float(), server_default='0.0'),
        sa.Column('net_profit', sa.Float(), server_default='0.0'),
        sa.Column('status', postgresql.ENUM('pending', 'approved', 'rejected', 'reconciled', name='transaction_status'), server_default='pending'),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('approved_by', sa.String(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_finance_transactions_date', 'finance_transactions', ['date'])
    op.create_index('idx_finance_transactions_type', 'finance_transactions', ['transaction_type'])
    op.create_index('idx_finance_transactions_category', 'finance_transactions', ['category'])
    op.create_index('idx_finance_transactions_status', 'finance_transactions', ['status'])
    op.create_index('idx_vendor_category_maps_vendor', 'vendor_category_maps', ['vendor_name', 'vendor_email'])
    op.create_index('idx_finance_reconciliations_dates', 'finance_reconciliations', ['start_date', 'end_date'])

def downgrade():
    # Drop indexes
    op.drop_index('idx_finance_reconciliations_dates')
    op.drop_index('idx_vendor_category_maps_vendor')
    op.drop_index('idx_finance_transactions_status')
    op.drop_index('idx_finance_transactions_category')
    op.drop_index('idx_finance_transactions_type')
    op.drop_index('idx_finance_transactions_date')

    # Drop tables
    op.drop_table('finance_reconciliations')
    op.drop_table('vendor_category_maps')
    op.drop_table('finance_transactions')
    op.drop_table('vendors')

    # Drop enum types
    op.execute("DROP TYPE transaction_status")
    op.execute("DROP TYPE payment_method")
    op.execute("DROP TYPE income_category")
    op.execute("DROP TYPE expense_category")
    op.execute("DROP TYPE transaction_type") 