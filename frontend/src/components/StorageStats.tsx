import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Alert, Spin, Table, Tag } from 'antd';
import { getStorageStats } from '../api/founder';
import { formatBytes } from '../utils/format';

const StorageStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStorageStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch storage stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStorageStatus = (percentage: number) => {
    if (percentage > 80) return 'exception';
    if (percentage > 60) return 'warning';
    return 'success';
  };

  const collectionColumns = [
    {
      title: 'Collection',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Document Count',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatBytes(size),
    },
  ];

  const collectionData = stats?.collections
    ? Object.entries(stats.collections).map(([name, data]: [string, any]) => ({
        name,
        count: data.count,
        size: data.size,
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
    <Card title="Storage Statistics">
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Storage"
              value={formatBytes(stats?.total_storage || 0)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Used Storage"
              value={formatBytes(stats?.used_storage || 0)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Storage Usage"
              value={stats?.storage_percentage || 0}
              suffix="%"
            />
            <Progress
              percent={stats?.storage_percentage || 0}
              status={getStorageStatus(stats?.storage_percentage || 0)}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Collections">
            <Table
              columns={collectionColumns}
              dataSource={collectionData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default StorageStats; 