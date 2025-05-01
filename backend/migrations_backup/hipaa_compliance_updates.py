"""hipaa compliance updates

Revision ID: 6e5f4c3b2a19
Revises: 7d6e5f4c3b2a
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '6e5f4c3b2a19'
down_revision = '7d6e5f4c3b2a'
branch_labels = None
depends_on = None

def upgrade():
    # Add encryption key to environment variables
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
                CREATE EXTENSION pgcrypto;
            END IF;
        END $$;
    """)
    
    # Update communication_logs table
    op.add_column('communication_logs', sa.Column('audit_log', sa.JSON(), nullable=True))
    op.alter_column('communication_logs', 'subject', type_=sa.Text())
    op.alter_column('communication_logs', 'body', type_=sa.Text())
    op.alter_column('communication_logs', 'metadata', type_=sa.JSON())
    
    # Add indexes for performance
    op.create_index('idx_comm_log_patient', 'communication_logs', ['patient_id'])
    op.create_index('idx_comm_log_channel', 'communication_logs', ['channel'])
    op.create_index('idx_comm_log_status', 'communication_logs', ['status'])
    op.create_index('idx_comm_log_created', 'communication_logs', ['created_at'])
    
    # Update communication_preferences table
    op.add_column('communication_preferences', sa.Column('consent_history', sa.JSON(), nullable=True))
    op.add_column('communication_preferences', sa.Column('email_consent_date', sa.DateTime(timezone=True)))
    op.add_column('communication_preferences', sa.Column('sms_consent_date', sa.DateTime(timezone=True)))
    op.add_column('communication_preferences', sa.Column('voice_consent_date', sa.DateTime(timezone=True)))
    op.add_column('communication_preferences', sa.Column('urgent_calls_consent', sa.Boolean(), default=False))
    op.add_column('communication_preferences', sa.Column('urgent_calls_consent_date', sa.DateTime(timezone=True)))
    op.add_column('communication_preferences', sa.Column('sensitive_info_email', sa.Boolean(), default=False))
    
    # Update message_templates table
    op.add_column('message_templates', sa.Column('version', sa.Integer(), default=1))
    op.add_column('message_templates', sa.Column('version_history', sa.JSON(), nullable=True))
    op.alter_column('message_templates', 'subject', type_=sa.Text())
    
    # Update communication_analytics table
    op.add_column('communication_analytics', sa.Column('audit_log', sa.JSON(), nullable=True))
    op.alter_column('communication_analytics', 'average_response_time', type_=sa.Integer())
    
    # Create audit log table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Index('idx_audit_log_user', 'user_id'),
        sa.Index('idx_audit_log_entity', 'entity_type', 'entity_id'),
        sa.Index('idx_audit_log_created', 'created_at')
    )

def downgrade():
    # Remove audit log table
    op.drop_table('audit_logs')
    
    # Remove new columns from communication_analytics
    op.drop_column('communication_analytics', 'audit_log')
    
    # Remove new columns from message_templates
    op.drop_column('message_templates', 'version_history')
    op.drop_column('message_templates', 'version')
    
    # Remove new columns from communication_preferences
    op.drop_column('communication_preferences', 'sensitive_info_email')
    op.drop_column('communication_preferences', 'urgent_calls_consent_date')
    op.drop_column('communication_preferences', 'urgent_calls_consent')
    op.drop_column('communication_preferences', 'voice_consent_date')
    op.drop_column('communication_preferences', 'sms_consent_date')
    op.drop_column('communication_preferences', 'email_consent_date')
    op.drop_column('communication_preferences', 'consent_history')
    
    # Remove indexes from communication_logs
    op.drop_index('idx_comm_log_patient')
    op.drop_index('idx_comm_log_channel')
    op.drop_index('idx_comm_log_status')
    op.drop_index('idx_comm_log_created')
    
    # Remove new columns from communication_logs
    op.drop_column('communication_logs', 'audit_log') 