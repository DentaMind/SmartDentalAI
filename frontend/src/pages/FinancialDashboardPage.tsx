import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Select, Typography, Tabs, Progress, Tag, Button, Space, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, CalendarOutlined } from '@ant-design/icons';
import { Line, Pie, Column } from '@ant-design/plots';
import dayjs from 'dayjs';
import financialService, { FinancialMetrics, RevenueDataPoint, AgingReportEntry, PaymentMethodDistribution } from '../services/financialService';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const FinancialDashboardPage: React.FC = () => {
    const [metrics, setMetrics] = useState<FinancialMetrics>({
        total_revenue: 0,
        total_outstanding: 0,
        collection_rate: 0,
        average_payment_time: 0,
        insurance_claims_pending: 0,
        insurance_claims_paid: 0
    });
    const [revenueTrend, setRevenueTrend] = useState<RevenueDataPoint[]>([]);
    const [agingReport, setAgingReport] = useState<AgingReportEntry[]>([]);
    const [paymentDistribution, setPaymentDistribution] = useState<PaymentMethodDistribution>({
        insurance: 0,
        cash: 0,
        credit_card: 0,
        check: 0
    });
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().startOf('month'),
        dayjs().endOf('month')
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFinancialData();
    }, [dateRange]);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);
            const [startDate, endDate] = dateRange;
            
            const [metricsData, trendData, agingData, distributionData] = await Promise.all([
                financialService.getFinancialMetrics(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')),
                financialService.getRevenueTrend(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')),
                financialService.getAgingReport(),
                financialService.getPaymentMethodDistribution()
            ]);

            setMetrics(metricsData);
            setRevenueTrend(trendData);
            setAgingReport(agingData);
            setPaymentDistribution(distributionData);
        } catch (error) {
            message.error('Failed to fetch financial data');
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderKeyMetrics = () => (
        <Row gutter={16}>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="Total Revenue"
                        value={metrics.total_revenue}
                        prefix="$"
                        precision={2}
                        valueStyle={{ color: '#3f8600' }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="Outstanding Balance"
                        value={metrics.total_outstanding}
                        prefix="$"
                        precision={2}
                        valueStyle={{ color: '#cf1322' }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="Collection Rate"
                        value={metrics.collection_rate}
                        suffix="%"
                        precision={1}
                        valueStyle={{ color: '#3f8600' }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="Avg. Payment Time"
                        value={metrics.average_payment_time}
                        suffix="days"
                        precision={0}
                    />
                </Card>
            </Col>
        </Row>
    );

    const renderInsuranceMetrics = () => (
        <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
                <Card title="Insurance Claims Status">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Progress
                                type="circle"
                                percent={Math.round((metrics.insurance_claims_paid / (metrics.insurance_claims_paid + metrics.insurance_claims_pending)) * 100)}
                                format={percent => `${percent}%`}
                            />
                        </Col>
                        <Col span={12}>
                            <div>
                                <Tag color="green">Paid: {metrics.insurance_claims_paid}</Tag>
                                <Tag color="orange">Pending: {metrics.insurance_claims_pending}</Tag>
                            </div>
                        </Col>
                    </Row>
                </Card>
            </Col>
            <Col span={12}>
                <Card title="Payment Methods Distribution">
                    <Pie
                        data={[
                            { type: 'Insurance', value: paymentDistribution.insurance },
                            { type: 'Cash', value: paymentDistribution.cash },
                            { type: 'Credit Card', value: paymentDistribution.credit_card },
                            { type: 'Check', value: paymentDistribution.check }
                        ]}
                        angleField="value"
                        colorField="type"
                        radius={0.8}
                        label={{
                            type: 'outer',
                            content: '{name} {percentage}'
                        }}
                    />
                </Card>
            </Col>
        </Row>
    );

    const renderRevenueTrend = () => (
        <Card title="Revenue Trend">
            <Line
                data={revenueTrend}
                xField="date"
                yField="revenue"
                point={{
                    size: 5,
                    shape: 'diamond'
                }}
                label={{
                    style: {
                        fill: '#aaa'
                    }
                }}
            />
        </Card>
    );

    const renderAgingReport = () => (
        <Card title="Aging Report">
            <Column
                data={agingReport}
                xField="period"
                yField="amount"
                label={{
                    position: 'middle',
                    style: {
                        fill: '#FFFFFF',
                        opacity: 0.6
                    }
                }}
            />
        </Card>
    );

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Title level={2}>Financial Dashboard</Title>
                <Space>
                    <RangePicker
                        value={dateRange}
                        onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                    />
                    <Select defaultValue="all" style={{ width: 200 }}>
                        <Option value="all">All Clinics</Option>
                        <Option value="clinic1">Clinic 1</Option>
                        <Option value="clinic2">Clinic 2</Option>
                    </Select>
                </Space>
            </div>

            {renderKeyMetrics()}
            {renderInsuranceMetrics()}

            <Tabs defaultActiveKey="1" style={{ marginTop: 16 }}>
                <TabPane tab={<span><LineChartOutlined /> Revenue Trend</span>} key="1">
                    {renderRevenueTrend()}
                </TabPane>
                <TabPane tab={<span><BarChartOutlined /> Aging Report</span>} key="2">
                    {renderAgingReport()}
                </TabPane>
            </Tabs>
        </div>
    );
};

export default FinancialDashboardPage; 