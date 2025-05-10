"""create communication tables

Revision ID: c5b4a3d2e1f0
Revises: f6c5b4a3d2e1
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c5b4a3d2e1f0'
down_revision = 'f6c5b4a3d2e1'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum types
    op.execute("CREATE TYPE communication_channel AS ENUM ('email', 'sms', 'voice')")
    op.execute("CREATE TYPE communication_intent AS ENUM ('book_appointment', 'cancel_appointment', 'request_availability', 'payment_request', 'payment_question', 'verify_coverage', 'insurance_question', 'lab_results', 'urgent', 'general')")
    op.execute("CREATE TYPE message_category AS ENUM ('appointment', 'payment', 'insurance', 'lab_results', 'general', 'urgent')")

    # Create communication_logs table
    op.create_table(
        'communication_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('channel', postgresql.ENUM('email', 'sms', 'voice', name='communication_channel'), nullable=False),
        sa.Column('message_type', postgresql.ENUM('appointment', 'payment', 'insurance', 'lab_results', 'general', 'urgent', name='message_category'), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('intent', postgresql.ENUM('book_appointment', 'cancel_appointment', 'request_availability', 'payment_request', 'payment_question', 'verify_coverage', 'insurance_question', 'lab_results', 'urgent', 'general', name='communication_intent'), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('response_received_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_communication_logs_id'), 'communication_logs', ['id'], unique=False)
    op.create_index(op.f('ix_communication_logs_patient_id'), 'communication_logs', ['patient_id'], unique=False)

    # Create communication_preferences table
    op.create_table(
        'communication_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('preferred_channel', postgresql.ENUM('email', 'sms', 'voice', name='communication_channel'), nullable=False),
        sa.Column('allow_sms', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('allow_voice', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('allow_email', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('allow_urgent_calls', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('allow_sensitive_emails', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('sms_consent_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('voice_consent_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('email_consent_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_id')
    )
    op.create_index(op.f('ix_communication_preferences_id'), 'communication_preferences', ['id'], unique=False)

    # Create message_templates table
    op.create_table(
        'message_templates',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('category', postgresql.ENUM('appointment', 'payment', 'insurance', 'lab_results', 'general', 'urgent', name='message_category'), nullable=True),
        sa.Column('intent', postgresql.ENUM('book_appointment', 'cancel_appointment', 'request_availability', 'payment_request', 'payment_question', 'verify_coverage', 'insurance_question', 'lab_results', 'urgent', 'general', name='communication_intent'), nullable=True),
        sa.Column('variables', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_message_templates_id'), 'message_templates', ['id'], unique=False)

    # Create communication_analytics table
    op.create_table(
        'communication_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('channel', postgresql.ENUM('email', 'sms', 'voice', name='communication_channel'), nullable=False),
        sa.Column('category', postgresql.ENUM('appointment', 'payment', 'insurance', 'lab_results', 'general', 'urgent', name='message_category'), nullable=False),
        sa.Column('intent', postgresql.ENUM('book_appointment', 'cancel_appointment', 'request_availability', 'payment_request', 'payment_question', 'verify_coverage', 'insurance_question', 'lab_results', 'urgent', 'general', name='communication_intent'), nullable=True),
        sa.Column('total_messages', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('successful_messages', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('failed_messages', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('average_response_time', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date', 'channel', 'category', 'intent', name='unique_analytics_entry')
    )
    op.create_index(op.f('ix_communication_analytics_id'), 'communication_analytics', ['id'], unique=False)

def downgrade():
    # Drop tables
    op.drop_table('communication_analytics')
    op.drop_table('message_templates')
    op.drop_table('communication_preferences')
    op.drop_table('communication_logs')

    # Drop enum types
    op.execute('DROP TYPE communication_channel')
    op.execute('DROP TYPE communication_intent')
    op.execute('DROP TYPE message_category') 