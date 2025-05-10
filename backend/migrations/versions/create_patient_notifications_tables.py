"""Create patient notifications tables

Revision ID: a4f2d7f9e8b2
Revises: c5f3a8d9e1b7
Create Date: 2023-06-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a4f2d7f9e8b2'
down_revision = 'c5f3a8d9e1b7'  # Updated to depend on the providers table migration
branch_labels = None
depends_on = None


def upgrade():
    # Create patient_notifications table
    op.create_table(
        'patient_notifications',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('priority', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('dismissed_at', sa.DateTime(), nullable=True),
        sa.Column('action_url', sa.String(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_notifications_id'), 'patient_notifications', ['id'], unique=False)
    op.create_index(op.f('ix_patient_notifications_patient_id'), 'patient_notifications', ['patient_id'], unique=False)
    op.create_index(op.f('ix_patient_notifications_type'), 'patient_notifications', ['type'], unique=False)
    
    # Create patient_notification_preferences table
    op.create_table(
        'patient_notification_preferences',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('notification_type', sa.String(), nullable=False),
        sa.Column('email_enabled', sa.Boolean(), default=True, nullable=False),
        sa.Column('sms_enabled', sa.Boolean(), default=True, nullable=False),
        sa.Column('in_app_enabled', sa.Boolean(), default=True, nullable=False),
        sa.Column('push_enabled', sa.Boolean(), default=True, nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_id', 'notification_type')
    )
    op.create_index(op.f('ix_patient_notification_preferences_id'), 'patient_notification_preferences', ['id'], unique=False)
    op.create_index(op.f('ix_patient_notification_preferences_patient_id'), 'patient_notification_preferences', ['patient_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_patient_notification_preferences_patient_id'), table_name='patient_notification_preferences')
    op.drop_index(op.f('ix_patient_notification_preferences_id'), table_name='patient_notification_preferences')
    op.drop_table('patient_notification_preferences')
    
    op.drop_index(op.f('ix_patient_notifications_type'), table_name='patient_notifications')
    op.drop_index(op.f('ix_patient_notifications_patient_id'), table_name='patient_notifications')
    op.drop_index(op.f('ix_patient_notifications_id'), table_name='patient_notifications')
    op.drop_table('patient_notifications') 