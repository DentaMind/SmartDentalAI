"""
Create AI diagnostics metrics tables

Revision ID: a145bd7e9f23
Revises: 
Create Date: 2023-07-28 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a145bd7e9f23'
down_revision = None  # Update this when actual migration order is known
branch_labels = None
depends_on = None


def upgrade():
    # Create ai_diagnostic_metrics table
    op.create_table(
        'ai_diagnostic_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_name', sa.String(), nullable=False),
        sa.Column('model_version', sa.String(), nullable=False),
        sa.Column('request_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('patient_id', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('inference_time_ms', sa.Float(), nullable=True),
        sa.Column('preprocessing_time_ms', sa.Float(), nullable=True),
        sa.Column('postprocessing_time_ms', sa.Float(), nullable=True),
        sa.Column('total_processing_time_ms', sa.Float(), nullable=True),
        sa.Column('diagnostic_type', sa.String(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True, default=0),
        sa.Column('findings_count', sa.Integer(), nullable=True, default=0),
        sa.Column('cpu_utilization', sa.Float(), nullable=True),
        sa.Column('memory_usage_mb', sa.Float(), nullable=True),
        sa.Column('gpu_utilization', sa.Float(), nullable=True),
        sa.Column('clinician_agreement', sa.Boolean(), nullable=True),
        sa.Column('clinician_review_time_ms', sa.Float(), nullable=True),
        sa.Column('error_type', sa.String(), nullable=True),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('raw_metrics', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_diagnostic_metrics_id'), 'ai_diagnostic_metrics', ['id'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metrics_model_name'), 'ai_diagnostic_metrics', ['model_name'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metrics_model_version'), 'ai_diagnostic_metrics', ['model_version'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metrics_request_id'), 'ai_diagnostic_metrics', ['request_id'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metrics_user_id'), 'ai_diagnostic_metrics', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metrics_patient_id'), 'ai_diagnostic_metrics', ['patient_id'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metrics_timestamp'), 'ai_diagnostic_metrics', ['timestamp'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metrics_diagnostic_type'), 'ai_diagnostic_metrics', ['diagnostic_type'], unique=False)
    
    # Create ai_diagnostic_metric_aggregations table
    op.create_table(
        'ai_diagnostic_metric_aggregations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_name', sa.String(), nullable=True),
        sa.Column('model_version', sa.String(), nullable=True),
        sa.Column('period', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('request_count', sa.Integer(), nullable=True, default=0),
        sa.Column('avg_inference_time_ms', sa.Float(), nullable=True, default=0),
        sa.Column('min_inference_time_ms', sa.Float(), nullable=True, default=0),
        sa.Column('max_inference_time_ms', sa.Float(), nullable=True, default=0),
        sa.Column('p95_inference_time_ms', sa.Float(), nullable=True, default=0),
        sa.Column('avg_total_processing_time_ms', sa.Float(), nullable=True, default=0),
        sa.Column('avg_confidence_score', sa.Float(), nullable=True, default=0),
        sa.Column('avg_findings_count', sa.Float(), nullable=True, default=0),
        sa.Column('avg_cpu_utilization', sa.Float(), nullable=True, default=0),
        sa.Column('avg_memory_usage_mb', sa.Float(), nullable=True, default=0),
        sa.Column('avg_gpu_utilization', sa.Float(), nullable=True, default=0),
        sa.Column('clinician_agreement_rate', sa.Float(), nullable=True, default=0),
        sa.Column('error_rate', sa.Float(), nullable=True, default=0),
        sa.Column('error_count', sa.Integer(), nullable=True, default=0),
        sa.Column('aggregation_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_diagnostic_metric_aggregations_id'), 'ai_diagnostic_metric_aggregations', ['id'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metric_aggregations_model_name'), 'ai_diagnostic_metric_aggregations', ['model_name'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metric_aggregations_model_version'), 'ai_diagnostic_metric_aggregations', ['model_version'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metric_aggregations_period'), 'ai_diagnostic_metric_aggregations', ['period'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_metric_aggregations_timestamp'), 'ai_diagnostic_metric_aggregations', ['timestamp'], unique=False)
    
    # Create ai_diagnostic_geographic_metrics table
    op.create_table(
        'ai_diagnostic_geographic_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('model_name', sa.String(), nullable=True),
        sa.Column('model_version', sa.String(), nullable=True),
        sa.Column('region', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('request_count', sa.Integer(), nullable=True, default=0),
        sa.Column('avg_inference_time_ms', sa.Float(), nullable=True, default=0),
        sa.Column('avg_confidence_score', sa.Float(), nullable=True, default=0),
        sa.Column('error_rate', sa.Float(), nullable=True, default=0),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=True),
        sa.Column('metrics_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_diagnostic_geographic_metrics_id'), 'ai_diagnostic_geographic_metrics', ['id'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_geographic_metrics_model_name'), 'ai_diagnostic_geographic_metrics', ['model_name'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_geographic_metrics_region'), 'ai_diagnostic_geographic_metrics', ['region'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_geographic_metrics_country'), 'ai_diagnostic_geographic_metrics', ['country'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_geographic_metrics_timestamp'), 'ai_diagnostic_geographic_metrics', ['timestamp'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_geographic_metrics_clinic_id'), 'ai_diagnostic_geographic_metrics', ['clinic_id'], unique=False)
    
    # Create ai_diagnostic_anomaly_detections table
    op.create_table(
        'ai_diagnostic_anomaly_detections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('model_name', sa.String(), nullable=True),
        sa.Column('model_version', sa.String(), nullable=True),
        sa.Column('metric_name', sa.String(), nullable=True),
        sa.Column('expected_value', sa.Float(), nullable=True),
        sa.Column('actual_value', sa.Float(), nullable=True),
        sa.Column('deviation_percent', sa.Float(), nullable=True),
        sa.Column('is_anomaly', sa.Boolean(), nullable=True, default=False),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('context', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_diagnostic_anomaly_detections_id'), 'ai_diagnostic_anomaly_detections', ['id'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_anomaly_detections_model_name'), 'ai_diagnostic_anomaly_detections', ['model_name'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_anomaly_detections_metric_name'), 'ai_diagnostic_anomaly_detections', ['metric_name'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_anomaly_detections_timestamp'), 'ai_diagnostic_anomaly_detections', ['timestamp'], unique=False)
    
    # Create ai_diagnostic_clinical_correlations table
    op.create_table(
        'ai_diagnostic_clinical_correlations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('model_name', sa.String(), nullable=True),
        sa.Column('model_version', sa.String(), nullable=True),
        sa.Column('diagnostic_type', sa.String(), nullable=True),
        sa.Column('correlation_type', sa.String(), nullable=True),
        sa.Column('correlation_value', sa.Float(), nullable=True),
        sa.Column('sample_size', sa.Integer(), nullable=True),
        sa.Column('p_value', sa.Float(), nullable=True),
        sa.Column('confidence_interval', sa.String(), nullable=True),
        sa.Column('study_period_start', sa.DateTime(), nullable=True),
        sa.Column('study_period_end', sa.DateTime(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('correlation_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_diagnostic_clinical_correlations_id'), 'ai_diagnostic_clinical_correlations', ['id'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_clinical_correlations_model_name'), 'ai_diagnostic_clinical_correlations', ['model_name'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_clinical_correlations_model_version'), 'ai_diagnostic_clinical_correlations', ['model_version'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_clinical_correlations_diagnostic_type'), 'ai_diagnostic_clinical_correlations', ['diagnostic_type'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_clinical_correlations_correlation_type'), 'ai_diagnostic_clinical_correlations', ['correlation_type'], unique=False)
    op.create_index(op.f('ix_ai_diagnostic_clinical_correlations_timestamp'), 'ai_diagnostic_clinical_correlations', ['timestamp'], unique=False)


def downgrade():
    # Drop all tables in reverse order
    op.drop_table('ai_diagnostic_clinical_correlations')
    op.drop_table('ai_diagnostic_anomaly_detections')
    op.drop_table('ai_diagnostic_geographic_metrics')
    op.drop_table('ai_diagnostic_metric_aggregations')
    op.drop_table('ai_diagnostic_metrics') 