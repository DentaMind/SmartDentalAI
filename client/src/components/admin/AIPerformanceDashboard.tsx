import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Space, Statistic, Row, Col, Tag } from 'antd';
import { CheckCircleOutlined, WarningOutlined, SyncOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface ProviderStats {
  providerId: number;
  providerName: string;
  totalOverrides: number;
  approvedOverrides: number;
  rejectedOverrides: number;
  accuracy: number;
  overrideTypes: Record<string, number>;
}

interface ModelVersion {
  version: string;
  timestamp: Date;
  trainingData: {
    feedbackIds: number[];
    metrics: {
      accuracy: number;
      precision: number;
      recall: number;
    };
  };
  deployedAt?: Date;
  deployedBy?: number;
  status: 'training' | 'ready' | 'deployed' | 'archived';
}

export const AIPerformanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch provider statistics
        const statsResponse = await axios.get('/api/ai-training/metrics');
        const { byDoctor, byType } = statsResponse.data;

        // Fetch model versions
        const versionsResponse = await axios.get('/api/ai-model/versions');
        setModelVersions(versionsResponse.data.versions);
        setCurrentVersion(versionsResponse.data.currentVersion);

        // Transform provider stats
        const stats = Object.entries(byDoctor).map(([providerId, count]) => ({
          providerId: parseInt(providerId),
          providerName: `Provider ${providerId}`, // TODO: Fetch actual provider names
          totalOverrides: count as number,
          approvedOverrides: 0, // TODO: Calculate from actual data
          rejectedOverrides: 0, // TODO: Calculate from actual data
          accuracy: 0, // TODO: Calculate from actual data
          overrideTypes: byType,
        }));

        setProviderStats(stats);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      title: 'Provider',
      dataIndex: 'providerName',
      key: 'providerName',
    },
    {
      title: 'Total Overrides',
      dataIndex: 'totalOverrides',
      key: 'totalOverrides',
      sorter: (a: ProviderStats, b: ProviderStats) => a.totalOverrides - b.totalOverrides,
    },
    {
      title: 'Approved',
      dataIndex: 'approvedOverrides',
      key: 'approvedOverrides',
      render: (approved: number) => (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          {approved}
        </Tag>
      ),
    },
    {
      title: 'Rejected',
      dataIndex: 'rejectedOverrides',
      key: 'rejectedOverrides',
      render: (rejected: number) => (
        <Tag color="error" icon={<WarningOutlined />}>
          {rejected}
        </Tag>
      ),
    },
    {
      title: 'Accuracy',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (accuracy: number) => `${(accuracy * 100).toFixed(1)}%`,
      sorter: (a: ProviderStats, b: ProviderStats) => a.accuracy - b.accuracy,
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={3}>AI Performance Dashboard</Title>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Current Model Version"
              value={currentVersion}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Providers"
              value={providerStats.length}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Overrides"
              value={providerStats.reduce((sum, stat) => sum + stat.totalOverrides, 0)}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Accuracy"
              value={providerStats.reduce((sum, stat) => sum + stat.accuracy, 0) / providerStats.length}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Card title="Provider Performance">
        <Table
          dataSource={providerStats}
          columns={columns}
          loading={loading}
          rowKey="providerId"
        />
      </Card>

      <Card title="Model Version History">
        <Table
          dataSource={modelVersions}
          columns={[
            {
              title: 'Version',
              dataIndex: 'version',
              key: 'version',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={
                  status === 'deployed' ? 'success' :
                  status === 'ready' ? 'processing' :
                  status === 'training' ? 'warning' :
                  'default'
                }>
                  {status.toUpperCase()}
                </Tag>
              ),
            },
            {
              title: 'Training Data Points',
              dataIndex: ['trainingData', 'feedbackIds', 'length'],
              key: 'dataPoints',
            },
            {
              title: 'Accuracy',
              dataIndex: ['trainingData', 'metrics', 'accuracy'],
              key: 'accuracy',
              render: (accuracy: number) => `${(accuracy * 100).toFixed(1)}%`,
            },
            {
              title: 'Deployed At',
              dataIndex: 'deployedAt',
              key: 'deployedAt',
              render: (date: Date) => date ? new Date(date).toLocaleString() : '-',
            },
          ]}
          loading={loading}
          rowKey="version"
        />
      </Card>
    </Space>
  );
}; 