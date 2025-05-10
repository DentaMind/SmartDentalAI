"""create office tables

Revision ID: e7f6c5b4a3d2
Revises: fc8eb100f7ac
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e7f6c5b4a3d2'
down_revision = 'fc8eb100f7ac'
branch_labels = None
depends_on = None

def upgrade():
    # Create office_settings table
    op.create_table(
        'office_settings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('office_name', sa.String(), nullable=False),
        sa.Column('office_email', sa.String(), nullable=False),
        sa.Column('office_phone', sa.String(), nullable=False),
        sa.Column('address', sa.String(), nullable=False),
        sa.Column('city', sa.String(), nullable=False),
        sa.Column('state', sa.String(), nullable=False),
        sa.Column('zip_code', sa.String(), nullable=False),
        sa.Column('timezone', sa.String(), nullable=False, server_default='America/New_York'),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('sms_sender_id', sa.String(), nullable=True),
        sa.Column('email_signature', sa.String(), nullable=True),
        sa.Column('business_hours', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('settings_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create employee_timeclock table
    op.create_table(
        'employee_timeclock',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('employee_id', sa.String(), nullable=False),
        sa.Column('clock_in_time', sa.DateTime(), nullable=False),
        sa.Column('clock_out_time', sa.DateTime(), nullable=True),
        sa.Column('breaks_taken', sa.Integer(), server_default='0'),
        sa.Column('total_hours', sa.Float(), nullable=True),
        sa.Column('is_manual_adjustment', sa.Boolean(), server_default='false'),
        sa.Column('adjustment_reason', sa.String(), nullable=True),
        sa.Column('adjustment_by', sa.String(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['adjustment_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create timeclock_breaks table
    op.create_table(
        'timeclock_breaks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('timeclock_id', sa.String(), nullable=False),
        sa.Column('break_start', sa.DateTime(), nullable=False),
        sa.Column('break_end', sa.DateTime(), nullable=True),
        sa.Column('break_type', sa.String(), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['timeclock_id'], ['employee_timeclock.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_employee_timeclock_employee', 'employee_timeclock', ['employee_id'])
    op.create_index('idx_employee_timeclock_dates', 'employee_timeclock', ['clock_in_time', 'clock_out_time'])
    op.create_index('idx_timeclock_breaks_timeclock', 'timeclock_breaks', ['timeclock_id'])
    op.create_index('idx_timeclock_breaks_dates', 'timeclock_breaks', ['break_start', 'break_end'])

def downgrade():
    # Drop indexes
    op.drop_index('idx_timeclock_breaks_dates', table_name='timeclock_breaks')
    op.drop_index('idx_timeclock_breaks_timeclock', table_name='timeclock_breaks')
    op.drop_index('idx_employee_timeclock_dates', table_name='employee_timeclock')
    op.drop_index('idx_employee_timeclock_employee', table_name='employee_timeclock')

    # Drop tables
    op.drop_table('timeclock_breaks')
    op.drop_table('employee_timeclock')
    op.drop_table('office_settings') 