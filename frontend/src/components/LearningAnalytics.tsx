import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Button, Select, DatePicker, Spin, Alert, Modal, Statistic } from 'antd';
import { Line, Bar } from '@ant-design/charts';
import { DownloadOutlined, WarningOutlined, ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { telemetryService } from '../services/telemetryService';

const { Title, Text } = Typography;
const { Option } = Select;

const LearningAnalytics: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historical, anomalyData] = await Promise.all([
          telemetryService.getHistoricalAnalysis(timeRange),
          telemetryService.getAnomalies()
        ]);
        setHistoricalData(historical);
        setAnomalies(anomalyData);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleExport = async () => {
    try {
      const data = await telemetryService.exportMetrics();
      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `learning_metrics_${new Date().toISOString()}.json`;
        mimeType = 'application/json';
      } else {
        // Convert to CSV
        const metrics = data.metrics;
        const headers = Object.keys(metrics[0]).join(',');
        const rows = metrics.map(m => Object.values(m).join(',')).join('\n');
        content = `${headers}\n${rows}`;
        filename = `learning_metrics_${new Date().toISOString()}.csv`;
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting metrics:', err);
    }
  };

  const showMetricDetails = (metric: string) => {
    setSelectedMetric(metric);
    setIsModalVisible(true);
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (error || !historicalData || !anomalies) {
    return <Alert type="error" message={error || 'Failed to load analytics data'} />;
  }

  const anomalyColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric'
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `${(value * 100).toFixed(1)}%`
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={severity === 'high' ? 'red' : 'orange'}>
          {severity.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Reasons',
      dataIndex: 'reasons',
      key: 'reasons',
      render: (reasons: string[]) => (
        <div>
          {reasons.map((reason, i) => (
            <Tag key={i} color="blue">{reason}</Tag>
          ))}
        </div>
      )
    }
  ];

  const trendColumns = [
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric',
      render: (text: string) => (
        <Button type="link" onClick={() => showMetricDetails(text)}>
          {text}
        </Button>
      )
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => (
        <Tag color={trend === 'increasing' ? 'green' : trend === 'decreasing' ? 'red' : 'blue'}>
          {trend.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: string) => (
        <Tag color={confidence === 'high' ? 'green' : confidence === 'medium' ? 'orange' : 'red'}>
          {confidence.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'R²',
      dataIndex: 'r_squared',
      key: 'r_squared',
      render: (value: number) => value.toFixed(3)
    }
  ];

  const trendData = Object.entries(historicalData.trend_analysis).map(([metric, analysis]: [string, any]) => ({
    metric,
    trend: analysis.trend,
    confidence: analysis.confidence,
    r_squared: analysis.r_squared
  }));

  const dailyChartConfig = {
    data: historicalData.daily_averages,
    xField: 'date',
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
    point: {
      size: 3,
      shape: 'circle'
    }
  };

  const sampleGrowthConfig = {
    data: historicalData.daily_averages,
    xField: 'date',
    yField: 'sample_count',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => new Date(text).toLocaleDateString()
      }
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${parseInt(text).toLocaleString()} samples`
      }
    },
    point: {
      size: 3,
      shape: 'circle'
    }
  };

  const MetricDetailsModal = () => (
    <Modal
      title={`${selectedMetric} Details`}
      visible={isModalVisible}
      onCancel={() => setIsModalVisible(false)}
      footer={null}
      width={800}
    >
      {selectedMetric && historicalData && (
        <div>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic
                title="Current Value"
                value={historicalData.daily_averages[historicalData.daily_averages.length - 1][selectedMetric.toLowerCase()]}
                precision={2}
                suffix="%"
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Standard Deviation"
                value={historicalData.daily_averages[historicalData.daily_averages.length - 1].std_dev[selectedMetric.toLowerCase()]}
                precision={3}
              />
            </Col>
          </Row>
          
          <Row style={{ marginTop: 24 }}>
            <Col span={24}>
              <Title level={5}>Seasonality Analysis</Title>
              {historicalData.seasonality[selectedMetric.toLowerCase()].has_seasonality ? (
                <Alert
                  message="Seasonal Pattern Detected"
                  description={`Strength: ${(historicalData.seasonality[selectedMetric.toLowerCase()].strength * 100).toFixed(1)}%`}
                  type="info"
                  showIcon
                />
              ) : (
                <Alert
                  message="No Significant Seasonality"
                  type="info"
                  showIcon
                />
              )}
            </Col>
          </Row>

          <Row style={{ marginTop: 24 }}>
            <Col span={24}>
              <Title level={5}>Recent Anomalies</Title>
              <Table
                dataSource={anomalies.anomalies.filter((a: any) => a.metric === selectedMetric)}
                columns={anomalyColumns}
                pagination={false}
                size="small"
              />
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={4}>Learning Analytics</Title>
        </Col>
        <Col>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120, marginRight: 16 }}
          >
            <Option value={7}>Last 7 days</Option>
            <Option value={30}>Last 30 days</Option>
            <Option value={90}>Last 90 days</Option>
          </Select>
          <Select
            value={exportFormat}
            onChange={setExportFormat}
            style={{ width: 100, marginRight: 16 }}
          >
            <Option value="json">JSON</Option>
            <Option value="csv">CSV</Option>
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            Export Data
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Title level={5}>Daily Performance Trends</Title>
            <Line {...dailyChartConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24} lg={12}>
          <Card>
            <Title level={5}>Sample Growth</Title>
            <Bar {...sampleGrowthConfig} />
          </Card>
        </Col>
        <Col span={24} lg={12}>
          <Card>
            <Title level={5}>Trend Analysis</Title>
            <Table
              dataSource={trendData}
              columns={trendColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card>
            <Title level={5}>
              <WarningOutlined /> Detected Anomalies
            </Title>
            <Table
              dataSource={anomalies.anomalies}
              columns={anomalyColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <MetricDetailsModal />
    </div>
  );
};

export default LearningAnalytics; 