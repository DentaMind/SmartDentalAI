import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Alert, Spin } from 'antd';
import { getSystemHealth } from '../api/founder';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';

const SystemMetrics: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await getSystemHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch system health');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (health?.status) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'degraded':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'unhealthy':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return null;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

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
    <Card title="System Health">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Alert
            message={`System Status: ${health?.status.toUpperCase()}`}
            type={health?.status === 'healthy' ? 'success' : health?.status === 'degraded' ? 'warning' : 'error'}
            icon={getStatusIcon()}
            showIcon
          />
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Uptime"
              value={formatUptime(health?.uptime || 0)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Memory Usage"
              value={health?.memory_usage || 0}
              suffix="%"
            />
            <Progress
              percent={health?.memory_usage || 0}
              status={health?.memory_usage > 80 ? 'exception' : health?.memory_usage > 60 ? 'warning' : 'success'}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="CPU Usage"
              value={health?.cpu_usage || 0}
              suffix="%"
            />
            <Progress
              percent={health?.cpu_usage || 0}
              status={health?.cpu_usage > 80 ? 'exception' : health?.cpu_usage > 60 ? 'warning' : 'success'}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Connections"
              value={health?.active_connections || 0}
            />
          </Card>
        </Col>
        <Col span={16}>
          <Card>
            <Statistic
              title="Last Health Check"
              value={new Date(health?.last_health_check).toLocaleString()}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default SystemMetrics; 