import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Alert, Spin, Table } from 'antd';
import { getLearningMetrics } from '../api/founder';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LearningMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getLearningMetrics();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch learning metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getIngestionStatus = (rate: number) => {
    if (rate < 50) return 'exception';
    if (rate < 80) return 'warning';
    return 'success';
  };

  const modelMetricsColumns = [
    {
      title: 'Metric',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `${(value * 100).toFixed(2)}%`,
    },
  ];

  const modelMetricsData = metrics?.model_metrics
    ? Object.entries(metrics.model_metrics).map(([name, value]: [string, number]) => ({
        name,
        value,
        key: name,
      }))
    : [];

  if (loading) {
    return (
      <Card>
        <Spin size="large" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert message="Error" description={error} type="error" showIcon />
      </Card>
    );
  }

  return (
    <Card title="Learning Metrics">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Processed"
              value={metrics?.total_processed || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Successful Ingestions"
              value={metrics?.successful_ingestions || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Failed Ingestions"
              value={metrics?.failed_ingestions || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ingestion Rate"
              value={metrics?.ingestion_rate || 0}
              suffix="%"
            />
            <Progress
              percent={metrics?.ingestion_rate || 0}
              status={getIngestionStatus(metrics?.ingestion_rate || 0)}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Model Performance">
            <Table
              columns={modelMetricsColumns}
              dataSource={modelMetricsData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card>
            <Statistic
              title="Last Learning Cycle"
              value={new Date(metrics?.last_learning_cycle).toLocaleString()}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default LearningMetrics; 