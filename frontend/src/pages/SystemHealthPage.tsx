import React, { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Spin, Alert, Grid, Progress, Line } from 'antd';
import { 
  DashboardOutlined, 
  DesktopOutlined, 
  DatabaseOutlined, 
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { telemetryService } from '../services/telemetryService';
import AlertSettings from '../components/AlertSettings';
import SilentLearningDashboard from '../components/SilentLearningDashboard';
import LearningAnalytics from '../components/LearningAnalytics';

const { Title } = Typography;
const { useBreakpoint } = Grid;

interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage_percent: number;
    core_count: number;
    frequency_mhz: number | null;
  };
  memory: {
    usage_percent: number;
    used_gb: number;
    total_gb: number;
  };
  disk: {
    usage_percent: number;
    used_gb: number;
    total_gb: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
  system: {
    os: string;
    os_version: string;
    python_version: string;
    hostname: string;
    uptime: string;
  };
}

interface LearningMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_samples: number;
  last_training_time: string | null;
  ingestion_rate: number;
  error_rate: number;
  retraining_cycles: any[];
  timestamp: string;
}

const SystemHealthPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const screens = useBreakpoint();

  useEffect(() => {
    audioRef.current = new Audio('/alert-sound.mp3');
  }, []);

  const fetchData = async () => {
    try {
      const [systemData, learningData] = await Promise.all([
        telemetryService.getSystemMetrics(),
        telemetryService.getLearningMetrics()
      ]);
      
      setMetrics(systemData);
      setLearningMetrics(learningData);
      
      const newAlerts = telemetryService.checkCriticalThresholds(systemData);
      setAlerts(newAlerts);
      
      if (newAlerts.length > 0 && audioRef.current) {
        audioRef.current.play().catch(err => console.error('Error playing alert sound:', err));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getColSpan = () => {
    if (screens.xl) return 6;
    if (screens.lg) return 8;
    if (screens.md) return 12;
    return 24;
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!metrics || !learningMetrics) {
    return <div>Error loading system metrics</div>;
  }

  const systemInfoColumns = [
    {
      title: 'Property',
      dataIndex: 'property',
      key: 'property',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
    },
  ];

  const systemInfoData = [
    { key: '1', property: 'Operating System', value: metrics.system.os },
    { key: '2', property: 'OS Version', value: metrics.system.os_version },
    { key: '3', property: 'Python Version', value: metrics.system.python_version },
    { key: '4', property: 'Hostname', value: metrics.system.hostname },
  ];

  const learningMetricsData = [
    {
      key: '1',
      metric: 'Accuracy',
      value: learningMetrics.accuracy,
      status: telemetryService.getMetricStatus(learningMetrics.accuracy, 0.9)
    },
    {
      key: '2',
      metric: 'Precision',
      value: learningMetrics.precision,
      status: telemetryService.getMetricStatus(learningMetrics.precision, 0.9)
    },
    {
      key: '3',
      metric: 'Recall',
      value: learningMetrics.recall,
      status: telemetryService.getMetricStatus(learningMetrics.recall, 0.9)
    },
    {
      key: '4',
      metric: 'F1 Score',
      value: learningMetrics.f1_score,
      status: telemetryService.getMetricStatus(learningMetrics.f1_score, 0.9)
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>System Health Dashboard</Title>
      <p>Last updated: {new Date(metrics.timestamp).toLocaleString()}</p>

      {alerts.length > 0 && (
        <Alert
          message="Critical Alerts"
          description={
            <ul>
              {alerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col span={getColSpan()}>
          <Card>
            <Statistic
              title="CPU Usage"
              value={metrics.cpu.usage_percent}
              suffix="%"
              prefix={<DesktopOutlined />}
              status={telemetryService.getMetricStatus(metrics.cpu.usage_percent, 80)}
            />
            <p>Core Count: {metrics.cpu.core_count}</p>
          </Card>
        </Col>
        <Col span={getColSpan()}>
          <Card>
            <Statistic
              title="Memory Usage"
              value={metrics.memory.usage_percent}
              suffix="%"
              prefix={<DashboardOutlined />}
              status={telemetryService.getMetricStatus(metrics.memory.usage_percent, 85)}
            />
            <p>{metrics.memory.used_gb.toFixed(2)} GB / {metrics.memory.total_gb.toFixed(2)} GB</p>
          </Card>
        </Col>
        <Col span={getColSpan()}>
          <Card>
            <Statistic
              title="Disk Usage"
              value={metrics.disk.usage_percent}
              suffix="%"
              prefix={<DatabaseOutlined />}
              status={telemetryService.getMetricStatus(metrics.disk.usage_percent, 90)}
            />
            <p>{metrics.disk.used_gb.toFixed(2)} GB / {metrics.disk.total_gb.toFixed(2)} GB</p>
          </Card>
        </Col>
        <Col span={getColSpan()}>
          <Card>
            <Statistic
              title="System Uptime"
              value={new Date(metrics.timestamp).toLocaleTimeString()}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24} lg={16}>
          <Card>
            <Title level={4}>System Information</Title>
            <Table
              columns={systemInfoColumns}
              dataSource={systemInfoData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={24} lg={8}>
          <AlertSettings />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Silent Learning Metrics">
            <SilentLearningDashboard />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Learning Analytics">
            <LearningAnalytics />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SystemHealthPage; 