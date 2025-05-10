"""Create WebSocket metrics tables

Revision ID: 1a2b3c4d5e6f
Revises: previous_revision
Create Date: 2023-05-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = 'previous_revision'  # Replace with actual previous revision
branch_labels = None
depends_on = None


def upgrade():
    # Create websocket_client_metrics table
    op.create_table(
        'websocket_client_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('connection_state', sa.String(), nullable=True),
        sa.Column('total_connections', sa.Integer(), nullable=True, default=0),
        sa.Column('connection_drops', sa.Integer(), nullable=True, default=0),
        sa.Column('reconnection_attempts', sa.Integer(), nullable=True, default=0),
        sa.Column('successful_reconnections', sa.Integer(), nullable=True, default=0),
        sa.Column('messages_sent', sa.Integer(), nullable=True, default=0),
        sa.Column('messages_received', sa.Integer(), nullable=True, default=0),
        sa.Column('messages_queued', sa.Integer(), nullable=True, default=0),
        sa.Column('message_errors', sa.Integer(), nullable=True, default=0),
        sa.Column('last_message_latency', sa.Float(), nullable=True, default=0),
        sa.Column('avg_message_latency', sa.Float(), nullable=True, default=0),
        sa.Column('total_connected_time', sa.Integer(), nullable=True, default=0),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('network_type', sa.String(), nullable=True),
        sa.Column('effective_type', sa.String(), nullable=True),
        sa.Column('round_trip_time', sa.Float(), nullable=True),
        sa.Column('downlink', sa.Float(), nullable=True),
        sa.Column('last_error_type', sa.String(), nullable=True),
        sa.Column('last_error_message', sa.String(), nullable=True),
        sa.Column('last_error_timestamp', sa.Integer(), nullable=True),
        sa.Column('raw_metrics', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_websocket_client_metrics_client_id'), 'websocket_client_metrics', ['client_id'], unique=False)
    op.create_index(op.f('ix_websocket_client_metrics_user_id'), 'websocket_client_metrics', ['user_id'], unique=False)
    op.create_index(op.f('ix_websocket_client_metrics_timestamp'), 'websocket_client_metrics', ['timestamp'], unique=False)
    op.create_index(op.f('ix_websocket_client_metrics_id'), 'websocket_client_metrics', ['id'], unique=False)
    
    # Create websocket_metric_aggregations table
    op.create_table(
        'websocket_metric_aggregations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('period', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('client_count', sa.Integer(), nullable=True, default=0),
        sa.Column('avg_connection_drops', sa.Float(), nullable=True, default=0),
        sa.Column('avg_reconnection_attempts', sa.Float(), nullable=True, default=0),
        sa.Column('avg_successful_reconnections', sa.Float(), nullable=True, default=0),
        sa.Column('total_messages_sent', sa.Integer(), nullable=True, default=0),
        sa.Column('total_messages_received', sa.Integer(), nullable=True, default=0),
        sa.Column('total_message_errors', sa.Integer(), nullable=True, default=0),
        sa.Column('avg_message_latency', sa.Float(), nullable=True, default=0),
        sa.Column('min_message_latency', sa.Float(), nullable=True, default=0),
        sa.Column('max_message_latency', sa.Float(), nullable=True, default=0),
        sa.Column('p95_message_latency', sa.Float(), nullable=True, default=0),
        sa.Column('region', sa.String(), nullable=True),
        sa.Column('aggregation_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_websocket_metric_aggregations_period'), 'websocket_metric_aggregations', ['period'], unique=False)
    op.create_index(op.f('ix_websocket_metric_aggregations_timestamp'), 'websocket_metric_aggregations', ['timestamp'], unique=False)
    op.create_index(op.f('ix_websocket_metric_aggregations_region'), 'websocket_metric_aggregations', ['region'], unique=False)
    op.create_index(op.f('ix_websocket_metric_aggregations_id'), 'websocket_metric_aggregations', ['id'], unique=False)
    
    # Create websocket_geographic_metrics table
    op.create_table(
        'websocket_geographic_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('region', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('client_count', sa.Integer(), nullable=True, default=0),
        sa.Column('avg_message_latency', sa.Float(), nullable=True, default=0),
        sa.Column('connection_success_rate', sa.Float(), nullable=True, default=0),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('isp', sa.String(), nullable=True),
        sa.Column('metrics_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_websocket_geographic_metrics_region'), 'websocket_geographic_metrics', ['region'], unique=False)
    op.create_index(op.f('ix_websocket_geographic_metrics_country'), 'websocket_geographic_metrics', ['country'], unique=False)
    op.create_index(op.f('ix_websocket_geographic_metrics_timestamp'), 'websocket_geographic_metrics', ['timestamp'], unique=False)
    op.create_index(op.f('ix_websocket_geographic_metrics_id'), 'websocket_geographic_metrics', ['id'], unique=False)
    
    # Create websocket_anomaly_detections table
    op.create_table(
        'websocket_anomaly_detections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('metric_name', sa.String(), nullable=True),
        sa.Column('expected_value', sa.Float(), nullable=True),
        sa.Column('actual_value', sa.Float(), nullable=True),
        sa.Column('deviation_percent', sa.Float(), nullable=True),
        sa.Column('is_anomaly', sa.Boolean(), nullable=True, default=False),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('context', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_websocket_anomaly_detections_metric_name'), 'websocket_anomaly_detections', ['metric_name'], unique=False)
    op.create_index(op.f('ix_websocket_anomaly_detections_timestamp'), 'websocket_anomaly_detections', ['timestamp'], unique=False)
    op.create_index(op.f('ix_websocket_anomaly_detections_id'), 'websocket_anomaly_detections', ['id'], unique=False)


def downgrade():
    op.drop_table('websocket_anomaly_detections')
    op.drop_table('websocket_geographic_metrics')
    op.drop_table('websocket_metric_aggregations')
    op.drop_table('websocket_client_metrics') 