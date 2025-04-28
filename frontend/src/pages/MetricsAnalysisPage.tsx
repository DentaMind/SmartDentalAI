import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Select, DatePicker, Spin, Alert, Tag, Space, Button, Tooltip } from 'antd';
import { Line } from '@ant-design/plots';
import { ArrowUpOutlined, ArrowDownOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import metricsService from '../services/metricsService';
import { playAlertSound } from '../utils/sound';

const { RangePicker } = DatePicker;

interface MetricData {
  timestamp: string;
  value: number;
}

interface MetricDetails {
  name: string;
  description: string;
  unit: string;
  data: MetricData[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  };
  significantChanges: {
    timestamp: string;
    change: number;
    percentage: number;
  }[];
}

const MetricsAnalysisPage: React.FC = () => {
  const [metrics, setMetrics] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [metricDetails, setMetricDetails] = useState<MetricDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [correlations, setCorrelations] = useState<{ metric: string; correlation: number }[]>([]);
  const [showAnomalies, setShowAnomalies] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const availableMetrics = await metricsService.getAvailableMetrics();
        setMetrics(availableMetrics);
        if (availableMetrics.length > 0) {
          setSelectedMetric(availableMetrics[0]);
        }
      } catch (err) {
        setError('Failed to fetch available metrics');
      }
    };

    fetchMetrics();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedMetric) return;

      setLoading(true);
      setError(null);

      try {
        const [details, correlationData] = await Promise.all([
          metricsService.getMetricDetails(selectedMetric, dateRange[0], dateRange[1]),
          metricsService.getMetricCorrelations(selectedMetric)
        ]);

        setMetricDetails(details);
        setCorrelations(correlationData);

        // Check for critical changes and play alert sound if needed
        const criticalChanges = details.significantChanges.filter(change => Math.abs(change.percentage) > 15);
        if (criticalChanges.length > 0) {
          playAlertSound();
        }
      } catch (err) {
        setError('Failed to fetch metric data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMetric, dateRange]);

  const renderMetricChart = () => {
    if (!metricDetails) return null;

    const annotations = showAnomalies ? metricDetails.significantChanges.map(change => ({
      type: 'point',
      position: [change.timestamp, metricDetails.data.find(d => d.timestamp === change.timestamp)?.value || 0],
      style: {
        fill: change.change > 0 ? '#52c41a' : '#f5222d',
      },
    })) : [];

    const config = {
      data: metricDetails.data,
      xField: 'timestamp',
      yField: 'value',
      point: {
        size: 5,
        shape: 'diamond',
      },
      annotations,
      tooltip: {
        formatter: (datum: any) => {
          const change = metricDetails.significantChanges.find(c => c.timestamp === datum.timestamp);
          return {
            name: metricDetails.name,
            value: `${(datum.value * 100).toFixed(2)}%${change ? ` (${change.percentage > 0 ? '+' : ''}${change.percentage.toFixed(2)}%)` : ''}`
          };
        }
      }
    };

    return <Line {...config} />;
  };

  const renderStatistics = () => {
    if (!metricDetails) return null;

    const getStatusColor = (value: number, baseline: number) => {
      const deviation = Math.abs((value - baseline) / baseline);
      if (deviation > 0.15) return '#f5222d';
      if (deviation > 0.05) return '#faad14';
      return '#52c41a';
    };

    return (
      <Row gutter={16}>
        <Col span={6}>
          <Statistic 
            title="Mean" 
            value={metricDetails.statistics.mean} 
            precision={2} 
            suffix={metricDetails.unit}
            valueStyle={{ color: getStatusColor(metricDetails.statistics.mean, metricDetails.statistics.median) }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Median" 
            value={metricDetails.statistics.median} 
            precision={2} 
            suffix={metricDetails.unit}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Standard Deviation" 
            value={metricDetails.statistics.stdDev} 
            precision={2}
            valueStyle={{ color: metricDetails.statistics.stdDev > 0.1 ? '#f5222d' : '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Range" 
            value={`${metricDetails.statistics.min.toFixed(2)} - ${metricDetails.statistics.max.toFixed(2)}`} 
            suffix={metricDetails.unit}
          />
        </Col>
      </Row>
    );
  };

  const renderSignificantChanges = () => {
    if (!metricDetails) return null;

    const columns = [
      {
        title: 'Timestamp',
        dataIndex: 'timestamp',
        key: 'timestamp',
        render: (text: string) => new Date(text).toLocaleString(),
      },
      {
        title: 'Change',
        dataIndex: 'change',
        key: 'change',
        render: (value: number) => (
          <Space>
            {Math.abs(value) > 0.15 && (
              <Tooltip title="Critical change">
                <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
              </Tooltip>
            )}
            <span style={{ color: value > 0 ? '#52c41a' : '#f5222d' }}>
              {value > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(value * 100).toFixed(2)}%
            </span>
          </Space>
        ),
      },
      {
        title: 'Percentage',
        dataIndex: 'percentage',
        key: 'percentage',
        render: (value: number) => (
          <Tag color={Math.abs(value) > 15 ? 'red' : Math.abs(value) > 5 ? 'orange' : 'green'}>
            {value > 0 ? '+' : ''}{value.toFixed(2)}%
          </Tag>
        ),
      },
    ];

    return (
      <Table
        dataSource={metricDetails.significantChanges}
        columns={columns}
        rowKey="timestamp"
        pagination={{ pageSize: 5 }}
      />
    );
  };

  const renderCorrelations = () => {
    if (!correlations.length) return null;

    return (
      <Row gutter={[16, 16]}>
        {correlations.map(({ metric, correlation }) => (
          <Col span={8} key={metric}>
            <Card size="small">
              <Statistic
                title={`Correlation with ${metric}`}
                value={correlation}
                precision={2}
                valueStyle={{ color: Math.abs(correlation) > 0.7 ? '#52c41a' : '#8c8c8c' }}
                prefix={Math.abs(correlation) > 0.7 ? <InfoCircleOutlined /> : null}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div>
      <Card title="Metrics Analysis" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              value={selectedMetric}
              onChange={setSelectedMetric}
              placeholder="Select a metric"
            >
              {metrics.map(metric => (
                <Select.Option key={metric} value={metric}>
                  {metric}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([
                    dates[0]?.toISOString() || '',
                    dates[1]?.toISOString() || '',
                  ]);
                }
              }}
            />
          </Col>
          <Col span={4}>
            <Button
              type={showAnomalies ? 'primary' : 'default'}
              onClick={() => setShowAnomalies(!showAnomalies)}
              icon={<ExclamationCircleOutlined />}
            >
              Anomalies
            </Button>
          </Col>
        </Row>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card title="Trend Analysis" style={{ marginBottom: 16 }}>
              {renderMetricChart()}
            </Card>

            <Card title="Statistics" style={{ marginBottom: 16 }}>
              {renderStatistics()}
            </Card>

            <Card title="Correlations" style={{ marginBottom: 16 }}>
              {renderCorrelations()}
            </Card>

            <Card title="Significant Changes">
              {renderSignificantChanges()}
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default MetricsAnalysisPage; 