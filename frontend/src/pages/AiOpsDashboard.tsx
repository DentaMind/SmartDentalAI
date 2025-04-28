import React, { useEffect, useState } from 'react';
import { Layout, Card, Table, Tag, Button, Space, Typography, Alert, Spin } from 'antd';
import { Line } from '@ant-design/plots';
import { aiOpsService } from '../services/aiOpsService';
import type { TuningRecommendation, RootCauseAnalysis } from '../services/aiOpsService';

const { Title, Text } = Typography;

const AiOpsDashboard: React.FC = () => {
  const [tuningHistory, setTuningHistory] = useState<TuningRecommendation[]>([]);
  const [rootCauseHistory, setRootCauseHistory] = useState<RootCauseAnalysis[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tuning, rootCause, health] = await Promise.all([
        aiOpsService.getTuningHistory(),
        aiOpsService.getRootCauseHistory(),
        aiOpsService.getSystemHealth()
      ]);
      setTuningHistory(tuning);
      setRootCauseHistory(rootCause);
      setSystemHealth(health);
      setError(null);
    } catch (err) {
      setError('Failed to fetch AI Ops data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAnalysis = async () => {
    try {
      setLoading(true);
      const analysis = await aiOpsService.triggerManualAnalysis();
      setRootCauseHistory(prev => [analysis, ...prev]);
    } catch (err) {
      setError('Failed to trigger manual analysis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tuningColumns = [
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric',
    },
    {
      title: 'Current Value',
      dataIndex: 'current_value',
      key: 'current_value',
      render: (value: number) => value.toFixed(3),
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (value: number) => (
        <Tag color={value < 0 ? 'red' : 'green'}>
          {value.toFixed(3)}
        </Tag>
      ),
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence_score',
      key: 'confidence_score',
      render: (value: number) => (
        <Tag color={value > 0.8 ? 'green' : value > 0.5 ? 'orange' : 'red'}>
          {(value * 100).toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
  ];

  const rootCauseColumns = [
    {
      title: 'Primary Metric',
      dataIndex: ['anomaly_cluster', 'primary_metric'],
      key: 'primary_metric',
    },
    {
      title: 'Value',
      dataIndex: ['anomaly_cluster', 'primary_value'],
      key: 'primary_value',
      render: (value: number) => value.toFixed(3),
    },
    {
      title: 'Confidence',
      dataIndex: ['analysis', 'confidence'],
      key: 'confidence',
      render: (value: number) => (
        <Tag color={value > 0.8 ? 'green' : value > 0.5 ? 'orange' : 'red'}>
          {(value * 100).toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
  ];

  if (loading && !tuningHistory.length) {
    return (
      <Layout style={{ padding: '24px' }}>
        <Spin size="large" />
      </Layout>
    );
  }

  return (
    <Layout style={{ padding: '24px' }}>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Title level={4}>System Health</Title>
              <Button type="primary" onClick={handleManualAnalysis}>
                Trigger Analysis
              </Button>
            </Space>
            {systemHealth && (
              <Space direction="vertical" size="small">
                <Text>CPU Usage: {systemHealth.system.cpu.usage_percent}%</Text>
                <Text>Memory Usage: {systemHealth.system.memory.usage_percent}%</Text>
                <Text>Event Error Rate: {systemHealth.events.error_rate}%</Text>
              </Space>
            )}
          </Space>
        </Card>

        <Card title="Tuning History">
          <Table
            dataSource={tuningHistory}
            columns={tuningColumns}
            rowKey="timestamp"
            pagination={{ pageSize: 5 }}
          />
        </Card>

        <Card title="Root Cause Analysis">
          <Table
            dataSource={rootCauseHistory}
            columns={rootCauseColumns}
            rowKey="timestamp"
            pagination={{ pageSize: 5 }}
            expandable={{
              expandedRowRender: (record) => (
                <Space direction="vertical">
                  <Text strong>Analysis:</Text>
                  <Text>{record.analysis.explanation}</Text>
                  <Text strong>Related Anomalies:</Text>
                  {record.anomaly_cluster.related_anomalies.map((anomaly, index) => (
                    <Text key={index}>
                      {anomaly.metric}: {anomaly.value.toFixed(3)} at {anomaly.timestamp}
                    </Text>
                  ))}
                </Space>
              ),
            }}
          />
        </Card>
      </Space>
    </Layout>
  );
};

export default AiOpsDashboard; 