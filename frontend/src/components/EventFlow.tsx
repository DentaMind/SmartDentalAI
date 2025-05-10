import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Alert, Spin, Table, Tag } from 'antd';
import { getEventStats } from '../api/founder';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EventFlow: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getEventStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch event stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getErrorRateColor = (rate: number) => {
    if (rate > 5) return 'red';
    if (rate > 2) return 'orange';
    return 'green';
  };

  const eventTypeColumns = [
    {
      title: 'Event Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
    },
  ];

  const eventTypeData = stats?.event_types
    ? Object.entries(stats.event_types).map(([type, count]) => ({
        type,
        count,
        key: type,
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
    <Card title="Event Flow">
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Events"
              value={stats?.total_events || 0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Events Last Hour"
              value={stats?.events_last_hour || 0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Error Rate"
              value={stats?.error_rate || 0}
              suffix="%"
              valueStyle={{ color: getErrorRateColor(stats?.error_rate || 0) }}
            />
            <Progress
              percent={stats?.error_rate || 0}
              status={stats?.error_rate > 5 ? 'exception' : stats?.error_rate > 2 ? 'warning' : 'success'}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Event Types">
            <Table
              columns={eventTypeColumns}
              dataSource={eventTypeData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Processing Time">
            <Statistic
              title="Average Processing Time"
              value={stats?.avg_processing_time || 0}
              suffix="ms"
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default EventFlow; 