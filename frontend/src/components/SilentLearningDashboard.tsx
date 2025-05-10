import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Progress, Spin, Alert } from 'antd';
import { Line } from '@ant-design/charts';
import { telemetryService } from '../services/telemetryService';

const { Title, Text } = Typography;

interface LearningTrends {
  timestamp: string;
  trends: {
    accuracy: number[];
    precision: number[];
    recall: number[];
    f1_score: number[];
  };
  dataset_growth: Array<{
    timestamp: string;
    total_samples: number;
    new_samples: number;
    data_quality: number;
  }>;
  retraining_history: Array<{
    timestamp: string;
    status: string;
    accuracy: number;
    duration: number;
    trigger: string;
  }>;
  ingestion_health: {
    total_ingested: number;
    success_rate: number;
    avg_processing_time: number;
    anomalies: any[];
  };
}

const SilentLearningDashboard: React.FC = () => {
  const [trends, setTrends] = useState<LearningTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await telemetryService.getLearningTrends();
        setTrends(data);
      } catch (err) {
        setError('Failed to fetch learning trends');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error || !trends) {
    return <Alert type="error" message={error || 'Failed to load learning trends'} />;
  }

  const trendData = trends.trends.accuracy.map((value, index) => ({
    timestamp: new Date(Date.now() - (trends.trends.accuracy.length - index - 1) * 86400000).toISOString(),
    accuracy: value,
    precision: trends.trends.precision[index],
    recall: trends.trends.recall[index],
    f1_score: trends.trends.f1_score[index]
  }));

  const trendConfig = {
    data: trendData,
    xField: 'timestamp',
    yField: ['accuracy', 'precision', 'recall', 'f1_score'],
    seriesField: 'metric',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => new Date(text).toLocaleDateString()
      }
    },
    yAxis: {
      min: 0,
      max: 1,
      label: {
        formatter: (text: string) => `${(parseFloat(text) * 100).toFixed(0)}%`
      }
    },
    legend: {
      position: 'top'
    },
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000
      }
    }
  };

  const datasetGrowthColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: 'Total Samples',
      dataIndex: 'total_samples',
      key: 'total_samples'
    },
    {
      title: 'New Samples',
      dataIndex: 'new_samples',
      key: 'new_samples'
    },
    {
      title: 'Data Quality',
      dataIndex: 'data_quality',
      key: 'data_quality',
      render: (value: number) => (
        <Progress percent={value * 100} size="small" status={value < 0.9 ? 'exception' : 'success'} />
      )
    }
  ];

  const retrainingColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => (
        <Text type={text === 'success' ? 'success' : 'danger'}>{text}</Text>
      )
    },
    {
      title: 'Accuracy',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (value: number) => `${(value * 100).toFixed(1)}%`
    },
    {
      title: 'Duration (s)',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: 'Trigger',
      dataIndex: 'trigger',
      key: 'trigger'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Title level={4}>Model Performance Trends</Title>
            <Line {...trendConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24} lg={12}>
          <Card>
            <Title level={4}>Dataset Growth</Title>
            <Table
              dataSource={trends.dataset_growth}
              columns={datasetGrowthColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={24} lg={12}>
          <Card>
            <Title level={4}>Retraining History</Title>
            <Table
              dataSource={trends.retraining_history}
              columns={retrainingColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card>
            <Title level={4}>Ingestion Health</Title>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card size="small">
                  <Title level={5}>Total Ingested</Title>
                  <Text>{trends.ingestion_health.total_ingested}</Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Title level={5}>Success Rate</Title>
                  <Progress
                    percent={trends.ingestion_health.success_rate * 100}
                    status={trends.ingestion_health.success_rate < 0.95 ? 'exception' : 'success'}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Title level={5}>Avg Processing Time</Title>
                  <Text>{trends.ingestion_health.avg_processing_time.toFixed(2)}s</Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Title level={5}>Anomalies</Title>
                  <Text type="danger">{trends.ingestion_health.anomalies.length}</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SilentLearningDashboard; 