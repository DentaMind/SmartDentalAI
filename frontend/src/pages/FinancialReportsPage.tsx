import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Button, Tag, Alert, Spin, message, Tabs, Select, Modal, Form, Input } from 'antd';
import { Line, Pie, Column } from '@ant-design/charts';
import { financialService } from '../services/financialService';
import { FinancialReport, ClinicPerformance, FinancialAlert, AnalyticsPrediction, AnomalyDetection, TrendAnalysis } from '../services/financialService';
import { DownloadOutlined, ReloadOutlined, BellOutlined, ScheduleOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

const FinancialReportsPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment]>([
        moment().subtract(30, 'days'),
        moment()
    ]);
    const [report, setReport] = useState<FinancialReport | null>(null);
    const [clinicPerformance, setClinicPerformance] = useState<ClinicPerformance[]>([]);
    const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
    const [predictions, setPredictions] = useState<AnalyticsPrediction[]>([]);
    const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
    const [trends, setTrends] = useState<TrendAnalysis | null>(null);
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
    const [form] = Form.useForm();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                reportData,
                performanceData,
                alertsData,
                predictionsData,
                anomaliesData,
                trendsData
            ] = await Promise.all([
                financialService.generateFinancialReport(
                    dateRange[0].format('YYYY-MM-DD'),
                    dateRange[1].format('YYYY-MM-DD')
                ),
                financialService.getClinicPerformance(
                    dateRange[0].format('YYYY-MM-DD'),
                    dateRange[1].format('YYYY-MM-DD')
                ),
                financialService.getFinancialAlerts(),
                financialService.getRevenuePredictions(
                    dateRange[0].format('YYYY-MM-DD'),
                    dateRange[1].format('YYYY-MM-DD')
                ),
                financialService.detectAnomalies(
                    dateRange[0].format('YYYY-MM-DD'),
                    dateRange[1].format('YYYY-MM-DD')
                ),
                financialService.analyzeTrends(
                    dateRange[0].format('YYYY-MM-DD'),
                    dateRange[1].format('YYYY-MM-DD'),
                    'revenue'
                )
            ]);

            setReport(reportData);
            setClinicPerformance(performanceData);
            setAlerts(alertsData);
            setPredictions(predictionsData);
            setAnomalies(anomaliesData);
            setTrends(trendsData);
        } catch (error) {
            message.error('Failed to fetch financial data');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
        const clinicId = localStorage.getItem('clinicId');
        if (clinicId) {
            financialService.connectWebSocket(clinicId, (alert) => {
                setAlerts(prev => [...prev, alert]);
                message.warning(alert.message);
            });
        }

        return () => {
            financialService.disconnectWebSocket();
        };
    }, [fetchData]);

    const handleExport = async () => {
        try {
            await financialService.exportReport(
                dateRange[0].format('YYYY-MM-DD'),
                dateRange[1].format('YYYY-MM-DD'),
                exportFormat
            );
            message.success('Report exported successfully');
        } catch (error) {
            message.error('Failed to export report');
        }
    };

    const handleScheduleReport = async (values: any) => {
        try {
            await financialService.scheduleReport(
                dateRange[0].format('YYYY-MM-DD'),
                dateRange[1].format('YYYY-MM-DD'),
                exportFormat,
                values.frequency,
                values.email
            );
            message.success('Report scheduled successfully');
            setScheduleModalVisible(false);
        } catch (error) {
            message.error('Failed to schedule report');
        }
    };

    const revenueConfig = {
        data: report?.revenue_trend || [],
        xField: 'date',
        yField: 'amount',
        point: {
            size: 5,
            shape: 'diamond',
        },
        label: {
            style: {
                fill: '#aaa',
            },
        },
    };

    const paymentConfig = {
        data: Object.entries(report?.payment_distribution || {}).map(([type, value]) => ({
            type,
            value,
        })),
        angleField: 'value',
        colorField: 'type',
        radius: 0.8,
        label: {
            type: 'outer',
            content: '{name} {percentage}',
        },
    };

    const clinicColumns = [
        {
            title: 'Clinic',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Revenue',
            dataIndex: 'revenue',
            key: 'revenue',
            render: (value: number) => `$${value.toLocaleString()}`,
        },
        {
            title: 'Collection Rate',
            dataIndex: 'collection_rate',
            key: 'collection_rate',
            render: (value: number) => `${(value * 100).toFixed(2)}%`,
        },
        {
            title: 'Patients',
            dataIndex: 'patient_count',
            key: 'patient_count',
        },
        {
            title: 'Avg. Ticket',
            dataIndex: 'average_ticket',
            key: 'average_ticket',
            render: (value: number) => `$${value.toLocaleString()}`,
        },
    ];

    const agingColumns = [
        {
            title: 'Age Range',
            dataIndex: 'age_range',
            key: 'age_range',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (value: number) => `$${value.toLocaleString()}`,
        },
        {
            title: 'Percentage',
            dataIndex: 'percentage',
            key: 'percentage',
            render: (value: number) => `${(value * 100).toFixed(2)}%`,
        },
    ];

    const predictionConfig = {
        data: predictions,
        xField: 'date',
        yField: 'predicted_revenue',
        seriesField: 'type',
        yAxis: {
            label: {
                formatter: (v: string) => `$${Number(v).toLocaleString()}`
            }
        },
        point: {
            size: 5,
            shape: 'diamond',
        },
        label: {
            style: {
                fill: '#aaa',
            },
        },
    };

    return (
        <div className="financial-reports-page">
            <Card
                title="Financial Reports"
                extra={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <RangePicker
                            value={dateRange}
                            onChange={(dates) => setDateRange(dates as [moment.Moment, moment.Moment])}
                        />
                        <Select
                            value={exportFormat}
                            onChange={setExportFormat}
                            style={{ width: 120 }}
                        >
                            <Option value="csv">CSV</Option>
                            <Option value="pdf">PDF</Option>
                            <Option value="excel">Excel</Option>
                        </Select>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchData}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                            loading={loading}
                        >
                            Export
                        </Button>
                        <Button
                            icon={<ScheduleOutlined />}
                            onClick={() => setScheduleModalVisible(true)}
                        >
                            Schedule
                        </Button>
                    </div>
                }
            >
                <Spin spinning={loading}>
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Overview" key="1">
                            {alerts.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    {alerts.map((alert, index) => (
                                        <Alert
                                            key={index}
                                            message={alert.message}
                                            description={alert.details.description}
                                            type={alert.severity === 'high' ? 'error' : 'warning'}
                                            showIcon
                                            style={{ marginBottom: '8px' }}
                                        />
                                    ))}
                                </div>
                            )}

                            {report && (
                                <>
                                    <Row gutter={16} style={{ marginBottom: '24px' }}>
                                        <Col span={6}>
                                            <Card>
                                                <Statistic
                                                    title="Total Revenue"
                                                    value={report.summary.total_revenue}
                                                    prefix="$"
                                                />
                                            </Card>
                                        </Col>
                                        <Col span={6}>
                                            <Card>
                                                <Statistic
                                                    title="Total Collections"
                                                    value={report.summary.total_collections}
                                                    prefix="$"
                                                />
                                            </Card>
                                        </Col>
                                        <Col span={6}>
                                            <Card>
                                                <Statistic
                                                    title="Collection Rate"
                                                    value={report.summary.collection_rate * 100}
                                                    suffix="%"
                                                />
                                            </Card>
                                        </Col>
                                        <Col span={6}>
                                            <Card>
                                                <Statistic
                                                    title="Average Ticket"
                                                    value={report.summary.average_ticket}
                                                    prefix="$"
                                                />
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row gutter={16} style={{ marginBottom: '24px' }}>
                                        <Col span={12}>
                                            <Card title="Revenue Trend & Predictions">
                                                <Line {...revenueConfig} />
                                                <Line {...predictionConfig} />
                                            </Card>
                                        </Col>
                                        <Col span={12}>
                                            <Card title="Payment Distribution">
                                                <Pie {...paymentConfig} />
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row gutter={16} style={{ marginBottom: '24px' }}>
                                        <Col span={12}>
                                            <Card title="Aging Report">
                                                <Table
                                                    dataSource={report.aging_report}
                                                    columns={agingColumns}
                                                    pagination={false}
                                                />
                                            </Card>
                                        </Col>
                                        <Col span={12}>
                                            <Card title="Clinic Performance">
                                                <Table
                                                    dataSource={clinicPerformance}
                                                    columns={clinicColumns}
                                                    pagination={false}
                                                />
                                            </Card>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </TabPane>

                        <TabPane tab="Analytics" key="2">
                            {anomalies.length > 0 && (
                                <Card title="Anomaly Detection" style={{ marginBottom: '24px' }}>
                                    <Table
                                        dataSource={anomalies}
                                        columns={[
                                            {
                                                title: 'Date',
                                                dataIndex: 'date',
                                                key: 'date',
                                            },
                                            {
                                                title: 'Metric',
                                                dataIndex: 'metric',
                                                key: 'metric',
                                            },
                                            {
                                                title: 'Value',
                                                dataIndex: 'value',
                                                key: 'value',
                                                render: (value: number) => `$${value.toLocaleString()}`,
                                            },
                                            {
                                                title: 'Deviation',
                                                dataIndex: 'deviation',
                                                key: 'deviation',
                                                render: (value: number) => `${value.toFixed(2)}%`,
                                            },
                                            {
                                                title: 'Severity',
                                                dataIndex: 'severity',
                                                key: 'severity',
                                                render: (value: string) => (
                                                    <Tag color={
                                                        value === 'high' ? 'red' :
                                                        value === 'medium' ? 'orange' : 'green'
                                                    }>
                                                        {value.toUpperCase()}
                                                    </Tag>
                                                ),
                                            },
                                        ]}
                                    />
                                </Card>
                            )}

                            {trends && (
                                <Card title="Trend Analysis">
                                    <Statistic
                                        title="Current Trend"
                                        value={trends.trend}
                                        suffix={
                                            <Tag color={
                                                trends.trend === 'increasing' ? 'green' :
                                                trends.trend === 'decreasing' ? 'red' : 'blue'
                                            }>
                                                {trends.rate_of_change.toFixed(2)}%
                                            </Tag>
                                        }
                                    />
                                    <p>Significance: {trends.significance.toFixed(2)}</p>
                                </Card>
                            )}
                        </TabPane>
                    </Tabs>
                </Spin>
            </Card>

            <Modal
                title="Schedule Report"
                visible={scheduleModalVisible}
                onCancel={() => setScheduleModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    onFinish={handleScheduleReport}
                    layout="vertical"
                >
                    <Form.Item
                        name="frequency"
                        label="Frequency"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Option value="daily">Daily</Option>
                            <Option value="weekly">Weekly</Option>
                            <Option value="monthly">Monthly</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Schedule
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default FinancialReportsPage; 