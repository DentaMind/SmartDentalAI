import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Select, Button, Spin, Alert, Modal, Statistic, Table, Tag, DatePicker } from 'antd';
import { Line, Bar, Scatter } from '@ant-design/charts';
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { telemetryService } from '../services/telemetryService';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface MetricDetails {
  metric: string;
  time_range: {
    start: string;
    end: string;
  };
  granularity: string;
  statistics: {
    mean: number;
    std: number;
    min: number;
    max: number;
    percentiles: {
      '25': number;
      '50': number;
      '75': number;
    };
  };
  significant_changes: Array<{
    timestamp: string;
    value: number;
    change: number;
    percent_change: number;
  }>;
  correlations: Record<string, number>;
  data_points: Array<{
    timestamp: string;
    value: number;
    training_samples: number;
  }>;
}

interface CorrelationDetails {
  metrics: string[];
  correlation: number;
  rolling_correlation: Array<{
    timestamp: string;
    value: number;
  }>;
}

const MetricDrillDown: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<string>('accuracy');
  const [metricDetails, setMetricDetails] = useState<MetricDetails | null>(null);
  const [correlationDetails, setCorrelationDetails] = useState<CorrelationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<[Date, Date] | null>(null);
  const [granularity, setGranularity] = useState<string>('hour');
  const [showCorrelation, setShowCorrelation] = useState(false);
  const [correlationMetric, setCorrelationMetric] = useState<string>('precision');

  const metrics = ['accuracy', 'precision', 'recall', 'f1_score'];

  useEffect(() => {
    fetchMetricDetails();
  }, [selectedMetric, timeRange, granularity]);

  useEffect(() => {
    if (showCorrelation) {
      fetchCorrelationDetails();
    }
  }, [showCorrelation, selectedMetric, correlationMetric, timeRange]);

  const fetchMetricDetails = async () => {
    try {
      setLoading(true);
      const details = await telemetryService.getMetricDetails(
        selectedMetric,
        timeRange?.[0],
        timeRange?.[1],
        granularity
      );
      setMetricDetails(details);
    } catch (err) {
      setError('Failed to fetch metric details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrelationDetails = async () => {
    try {
      setLoading(true);
      const details = await telemetryService.getMetricCorrelation(
        selectedMetric,
        correlationMetric,
        timeRange?.[0],
        timeRange?.[1]
      );
      setCorrelationDetails(details);
    } catch (err) {
      setError('Failed to fetch correlation details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const significantChangesColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `${(value * 100).toFixed(1)}%`
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      render: (change: number) => (
        <Text type={change > 0 ? 'success' : 'danger'}>
          {change > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {Math.abs(change * 100).toFixed(1)}%
        </Text>
      )
    }
  ];

  if (loading && !metricDetails) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  const metricChartConfig = {
    data: metricDetails?.data_points || [],
    xField: 'timestamp',
    yField: 'value',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => new Date(text).toLocaleString()
      }
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${(parseFloat(text) * 100).toFixed(0)}%`
      }
    },
    point: {
      size: 3,
      shape: 'circle'
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: selectedMetric,
          value: `${(datum.value * 100).toFixed(1)}%`
        };
      }
    }
  };

  const correlationChartConfig = {
    data: correlationDetails?.rolling_correlation || [],
    xField: 'timestamp',
    yField: 'value',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => new Date(text).toLocaleString()
      }
    },
    yAxis: {
      label: {
        formatter: (text: string) => parseFloat(text).toFixed(2)
      }
    },
    point: {
      size: 3,
      shape: 'circle'
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: 'Correlation',
          value: datum.value.toFixed(2)
        };
      }
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={4}>Metric Analysis</Title>
        </Col>
        <Col>
          <Select
            value={selectedMetric}
            onChange={setSelectedMetric}
            style={{ width: 120, marginRight: 16 }}
          >
            {metrics.map(metric => (
              <Option key={metric} value={metric}>
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </Option>
            ))}
          </Select>
          <RangePicker
            showTime
            onChange={(dates) => setTimeRange(dates as [Date, Date])}
            style={{ marginRight: 16 }}
          />
          <Select
            value={granularity}
            onChange={setGranularity}
            style={{ width: 100 }}
          >
            <Option value="minute">Minute</Option>
            <Option value="hour">Hour</Option>
            <Option value="day">Day</Option>
          </Select>
        </Col>
      </Row>

      {metricDetails && (
        <>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <Title level={5}>Performance Trend</Title>
                <Line {...metricChartConfig} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col span={24} lg={12}>
              <Card>
                <Title level={5}>Statistics</Title>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="Mean"
                      value={metricDetails.statistics.mean}
                      precision={3}
                      suffix="%"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Standard Deviation"
                      value={metricDetails.statistics.std}
                      precision={3}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Range"
                      value={`${(metricDetails.statistics.min * 100).toFixed(1)}% - ${(metricDetails.statistics.max * 100).toFixed(1)}%`}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24} lg={12}>
              <Card>
                <Title level={5}>Correlations</Title>
                <Row gutter={[16, 16]}>
                  {Object.entries(metricDetails.correlations).map(([metric, value]) => (
                    <Col span={12} key={metric}>
                      <Statistic
                        title={metric.charAt(0).toUpperCase() + metric.slice(1)}
                        value={value}
                        precision={3}
                      />
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col span={24}>
              <Card>
                <Title level={5}>Significant Changes</Title>
                <Table
                  dataSource={metricDetails.significant_changes}
                  columns={significantChangesColumns}
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
                  Correlation Analysis
                  <Button
                    type="link"
                    icon={<LinkOutlined />}
                    onClick={() => setShowCorrelation(!showCorrelation)}
                    style={{ marginLeft: 16 }}
                  >
                    {showCorrelation ? 'Hide' : 'Show'}
                  </Button>
                </Title>
                {showCorrelation && (
                  <>
                    <Select
                      value={correlationMetric}
                      onChange={setCorrelationMetric}
                      style={{ width: 120, marginBottom: 16 }}
                    >
                      {metrics
                        .filter(m => m !== selectedMetric)
                        .map(metric => (
                          <Option key={metric} value={metric}>
                            {metric.charAt(0).toUpperCase() + metric.slice(1)}
                          </Option>
                        ))}
                    </Select>
                    {correlationDetails && (
                      <>
                        <Statistic
                          title="Overall Correlation"
                          value={correlationDetails.correlation}
                          precision={3}
                        />
                        <Line {...correlationChartConfig} />
                      </>
                    )}
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default MetricDrillDown; 