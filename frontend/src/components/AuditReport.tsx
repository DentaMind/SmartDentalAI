import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Select, Button, Spin, Alert, Timeline, Tag } from 'antd';
import { DownloadOutlined, HistoryOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { telemetryService } from '../services/telemetryService';

const { Title, Text } = Typography;
const { Option } = Select;

interface AuditReport {
  timestamp: string;
  time_range: number;
  report: string;
}

interface HistoricalReport {
  timestamp: string;
  report: string;
}

const AuditReport: React.FC = () => {
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null);
  const [historicalReports, setHistoricalReports] = useState<HistoricalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(1);
  const [showHistory, setShowHistory] = useState(false);

  const fetchCurrentReport = async () => {
    try {
      setLoading(true);
      const report = await telemetryService.getAuditReport(timeRange);
      setCurrentReport(report);
    } catch (err) {
      setError('Failed to fetch audit report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalReports = async () => {
    try {
      setLoading(true);
      const history = await telemetryService.getAuditReportHistory(7);
      setHistoricalReports(history.reports);
    } catch (err) {
      setError('Failed to fetch historical reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentReport();
    const interval = setInterval(fetchCurrentReport, 3600000); // Refresh every hour
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleExport = async () => {
    if (!currentReport) return;
    
    const content = `# System Health Audit Report\n\n${currentReport.report}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_report_${new Date().toISOString()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !currentReport) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={4}>System Health Audit Report</Title>
        </Col>
        <Col>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120, marginRight: 16 }}
          >
            <Option value={1}>Last 24 hours</Option>
            <Option value={7}>Last 7 days</Option>
            <Option value={30}>Last 30 days</Option>
          </Select>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchCurrentReport}
            style={{ marginRight: 16 }}
          >
            Refresh
          </Button>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            style={{ marginRight: 16 }}
          >
            Export
          </Button>
          <Button
            type={showHistory ? 'primary' : 'default'}
            icon={<HistoryOutlined />}
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) {
                fetchHistoricalReports();
              }
            }}
          >
            History
          </Button>
        </Col>
      </Row>

      {showHistory ? (
        <Timeline>
          {historicalReports.map((report, index) => (
            <Timeline.Item key={index}>
              <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                  <Col>
                    <Text strong>
                      {new Date(report.timestamp).toLocaleString()}
                    </Text>
                  </Col>
                </Row>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <ReactMarkdown>{report.report}</ReactMarkdown>
                </div>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        <Card>
          {currentReport && (
            <>
              <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Col>
                  <Text type="secondary">
                    Generated: {new Date(currentReport.timestamp).toLocaleString()}
                  </Text>
                </Col>
                <Col>
                  <Tag color="blue">
                    {timeRange === 1 ? '24 Hours' : `${timeRange} Days`}
                  </Tag>
                </Col>
              </Row>
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <ReactMarkdown>{currentReport.report}</ReactMarkdown>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default AuditReport; 