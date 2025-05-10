import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Modal, Form, Input, InputNumber, Select, Tag, message, Typography, DatePicker, Timeline, Descriptions, Progress, Statistic, Row, Col, Tabs } from 'antd';
import { PlusOutlined, DollarOutlined, BarChartOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import paymentService, { PaymentPlan, PaymentStatus, PaymentMethod, PaymentPlanCreate, PaymentCreate } from '../services/paymentService';
import dayjs from 'dayjs';
import { Line } from '@ant-design/plots';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PaymentPlansPage: React.FC = () => {
    const [plans, setPlans] = useState<PaymentPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
    const [form] = Form.useForm();
    const [paymentForm] = Form.useForm();
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await paymentService.getAllPaymentPlans();
            setPlans(data);
        } catch (error) {
            message.error('Failed to fetch payment plans');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (values: any) => {
        try {
            await paymentService.createPaymentPlan({
                ...values,
                start_date: values.start_date.format('YYYY-MM-DD'),
            });
            message.success('Payment plan created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchPlans();
        } catch (error) {
            message.error('Failed to create payment plan');
        }
    };

    const handleAddPayment = async (values: any) => {
        if (!selectedPlan) return;
        try {
            await paymentService.addPayment({
                payment_plan_id: selectedPlan.id,
                ...values,
            });
            message.success('Payment added successfully');
            setPaymentModalVisible(false);
            paymentForm.resetFields();
            fetchPlans();
        } catch (error) {
            message.error('Failed to add payment');
        }
    };

    const getStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.PENDING:
                return 'default';
            case PaymentStatus.PARTIALLY_PAID:
                return 'warning';
            case PaymentStatus.PAID:
                return 'success';
            case PaymentStatus.OVERDUE:
                return 'error';
            case PaymentStatus.CANCELLED:
                return 'error';
            default:
                return 'default';
        }
    };

    const getPaymentMethodColor = (method: PaymentMethod) => {
        switch (method) {
            case PaymentMethod.CASH:
                return 'green';
            case PaymentMethod.CREDIT_CARD:
                return 'blue';
            case PaymentMethod.CHECK:
                return 'purple';
            case PaymentMethod.INSURANCE:
                return 'cyan';
            case PaymentMethod.FINANCING:
                return 'orange';
            default:
                return 'default';
        }
    };

    const calculatePaymentProgress = (plan: PaymentPlan) => {
        const totalPaid = plan.payments.reduce((sum, payment) => sum + payment.amount, 0);
        return (totalPaid / plan.total_amount) * 100;
    };

    const columns = [
        {
            title: 'Plan ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Treatment Plan',
            dataIndex: 'treatment_plan_id',
            key: 'treatment_plan_id',
        },
        {
            title: 'Total Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (amount: number) => `$${amount.toFixed(2)}`,
        },
        {
            title: 'Remaining Balance',
            dataIndex: 'remaining_balance',
            key: 'remaining_balance',
            render: (amount: number) => `$${amount.toFixed(2)}`,
        },
        {
            title: 'Monthly Payment',
            dataIndex: 'monthly_payment',
            key: 'monthly_payment',
            render: (amount: number) => `$${amount.toFixed(2)}`,
        },
        {
            title: 'Progress',
            key: 'progress',
            render: (_: any, record: PaymentPlan) => (
                <Progress percent={calculatePaymentProgress(record)} size="small" />
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: PaymentStatus) => (
                <Tag color={getStatusColor(status)}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: PaymentPlan) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            setSelectedPlan(record);
                            setPaymentModalVisible(true);
                        }}
                    >
                        Add Payment
                    </Button>
                    <Button
                        type="link"
                        onClick={() => {
                            setSelectedPlan(record);
                            setDetailsModalVisible(true);
                        }}
                    >
                        View Details
                    </Button>
                </Space>
            ),
        },
    ];

    const paymentColumns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `$${amount.toFixed(2)}`,
        },
        {
            title: 'Method',
            dataIndex: 'method',
            key: 'method',
            render: (method: PaymentMethod) => (
                <Tag color={getPaymentMethodColor(method)}>
                    {method}
                </Tag>
            ),
        },
        {
            title: 'Reference',
            dataIndex: 'reference',
            key: 'reference',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: PaymentStatus) => (
                <Tag color={getStatusColor(status)}>
                    {status}
                </Tag>
            ),
        },
    ];

    const renderPaymentHistory = (plan: PaymentPlan) => (
        <Table
            columns={paymentColumns}
            dataSource={plan.payments}
            rowKey="id"
            pagination={false}
        />
    );

    const renderPaymentTrends = (plan: PaymentPlan) => {
        const data = plan.payments.map(payment => ({
            date: dayjs(payment.date).format('YYYY-MM-DD'),
            amount: payment.amount,
        }));

        return (
            <Line
                data={data}
                xField="date"
                yField="amount"
                point={{
                    size: 5,
                    shape: 'diamond',
                }}
                label={{
                    style: {
                        fill: '#aaa',
                    },
                }}
            />
        );
    };

    const renderPaymentDetails = (plan: PaymentPlan) => (
        <Descriptions bordered column={2}>
            <Descriptions.Item label="Plan ID">{plan.id}</Descriptions.Item>
            <Descriptions.Item label="Patient ID">{plan.patient_id}</Descriptions.Item>
            <Descriptions.Item label="Treatment Plan ID">{plan.treatment_plan_id}</Descriptions.Item>
            <Descriptions.Item label="Status">
                <Tag color={getStatusColor(plan.status)}>{plan.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount">${plan.total_amount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Remaining Balance">${plan.remaining_balance.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Monthly Payment">${plan.monthly_payment.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Start Date">{dayjs(plan.start_date).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="End Date">{dayjs(plan.end_date).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="Notes" span={2}>{plan.notes || 'No notes'}</Descriptions.Item>
        </Descriptions>
    );

    const renderPaymentTimeline = (plan: PaymentPlan) => (
        <Timeline>
            {plan.payments.map(payment => (
                <Timeline.Item
                    key={payment.id}
                    color={payment.status === PaymentStatus.PAID ? 'green' : 'red'}
                >
                    <p>${payment.amount.toFixed(2)} - {dayjs(payment.date).format('YYYY-MM-DD')}</p>
                    <p>Method: <Tag color={getPaymentMethodColor(payment.method)}>{payment.method}</Tag></p>
                    <p>Reference: {payment.reference}</p>
                    {payment.notes && <p>Notes: {payment.notes}</p>}
                </Timeline.Item>
            ))}
        </Timeline>
    );

    return (
        <div>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={2}>Payment Plans</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                    >
                        Create Payment Plan
                    </Button>
                </div>

                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Total Outstanding"
                                value={plans.reduce((sum, plan) => sum + plan.remaining_balance, 0)}
                                prefix="$"
                                precision={2}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Monthly Payments Due"
                                value={plans.reduce((sum, plan) => sum + (plan.status === PaymentStatus.PENDING ? plan.monthly_payment : 0), 0)}
                                prefix="$"
                                precision={2}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Overdue Amount"
                                value={plans.reduce((sum, plan) => sum + (plan.status === PaymentStatus.OVERDUE ? plan.remaining_balance : 0), 0)}
                                prefix="$"
                                precision={2}
                            />
                        </Card>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={plans}
                    loading={loading}
                    rowKey="id"
                    expandable={{
                        expandedRowRender: (record) => (
                            <Tabs defaultActiveKey="1">
                                <TabPane tab={<span><FileTextOutlined /> Payment History</span>} key="1">
                                    {renderPaymentHistory(record)}
                                </TabPane>
                                <TabPane tab={<span><BarChartOutlined /> Payment Trends</span>} key="2">
                                    {renderPaymentTrends(record)}
                                </TabPane>
                            </Tabs>
                        ),
                    }}
                />

                <Modal
                    title="Create Payment Plan"
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        form.resetFields();
                    }}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleCreate}
                    >
                        <Form.Item
                            name="patient_id"
                            label="Patient ID"
                            rules={[{ required: true, message: 'Please input patient ID!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="treatment_plan_id"
                            label="Treatment Plan ID"
                            rules={[{ required: true, message: 'Please input treatment plan ID!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="total_amount"
                            label="Total Amount"
                            rules={[{ required: true, message: 'Please input total amount!' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                prefix="$"
                                step={0.01}
                            />
                        </Form.Item>

                        <Form.Item
                            name="monthly_payment"
                            label="Monthly Payment"
                            rules={[{ required: true, message: 'Please input monthly payment!' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                prefix="$"
                                step={0.01}
                            />
                        </Form.Item>

                        <Form.Item
                            name="start_date"
                            label="Start Date"
                            rules={[{ required: true, message: 'Please select start date!' }]}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="notes"
                            label="Notes"
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Create Payment Plan
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="Add Payment"
                    open={paymentModalVisible}
                    onCancel={() => {
                        setPaymentModalVisible(false);
                        paymentForm.resetFields();
                    }}
                    footer={null}
                    width={400}
                >
                    <Form
                        form={paymentForm}
                        layout="vertical"
                        onFinish={handleAddPayment}
                    >
                        <Form.Item
                            name="amount"
                            label="Amount"
                            rules={[{ required: true, message: 'Please input payment amount!' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                prefix="$"
                                step={0.01}
                            />
                        </Form.Item>

                        <Form.Item
                            name="method"
                            label="Payment Method"
                            rules={[{ required: true, message: 'Please select payment method!' }]}
                        >
                            <Select>
                                {Object.values(PaymentMethod).map(method => (
                                    <Option key={method} value={method}>
                                        {method}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="reference"
                            label="Reference"
                            rules={[{ required: true, message: 'Please input reference!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="notes"
                            label="Notes"
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Add Payment
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="Payment Plan Details"
                    open={detailsModalVisible}
                    onCancel={() => {
                        setDetailsModalVisible(false);
                        setSelectedPlan(null);
                    }}
                    footer={null}
                    width={800}
                >
                    {selectedPlan && (
                        <Tabs defaultActiveKey="1">
                            <TabPane tab="Details" key="1">
                                {renderPaymentDetails(selectedPlan)}
                            </TabPane>
                            <TabPane tab="Payment Timeline" key="2">
                                {renderPaymentTimeline(selectedPlan)}
                            </TabPane>
                            <TabPane tab="Payment History" key="3">
                                {renderPaymentHistory(selectedPlan)}
                            </TabPane>
                            <TabPane tab="Payment Trends" key="4">
                                {renderPaymentTrends(selectedPlan)}
                            </TabPane>
                        </Tabs>
                    )}
                </Modal>
            </Card>
        </div>
    );
};

export default PaymentPlansPage; 