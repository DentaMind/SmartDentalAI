import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Modal, Form, Input, InputNumber, Select, Tag, message, Typography, DatePicker, Timeline, Descriptions, Progress, Statistic, Row, Col, Tabs, Divider } from 'antd';
import { PlusOutlined, DollarOutlined, BarChartOutlined, FileTextOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import balanceService, { PatientBalance, BalanceEntry, BalanceEntryCreate } from '../services/balanceService';
import dayjs from 'dayjs';
import { Line } from '@ant-design/plots';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface PatientBalancePageProps {
    patientId: string;
}

const PatientBalancePage: React.FC<PatientBalancePageProps> = ({ patientId }) => {
    const [balance, setBalance] = useState<PatientBalance | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<BalanceEntry | null>(null);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');

    useEffect(() => {
        fetchBalance();
    }, [patientId]);

    const fetchBalance = async () => {
        try {
            setLoading(true);
            const data = await balanceService.getPatientBalance(patientId);
            setBalance(data);
        } catch (error) {
            message.error('Failed to fetch patient balance');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (values: any) => {
        try {
            const transaction: BalanceEntryCreate = {
                amount: values.amount,
                type: values.type,
                reference_id: values.reference_id,
                description: values.description
            };

            if (values.type === 'charge') {
                await balanceService.addCharge(patientId, transaction);
            } else if (values.type === 'payment') {
                await balanceService.addPayment(patientId, transaction);
            } else if (values.type === 'insurance') {
                await balanceService.addInsuranceEstimate(patientId, transaction);
            }

            message.success('Transaction added successfully');
            setModalVisible(false);
            form.resetFields();
            fetchBalance();
        } catch (error) {
            message.error('Failed to add transaction');
        }
    };

    const handleUpdateStatus = async (entryId: string, newStatus: string) => {
        try {
            await balanceService.updateEntryStatus(patientId, entryId, { status: newStatus });
            message.success('Status updated successfully');
            fetchBalance();
        } catch (error) {
            message.error('Failed to update status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'charge':
                return 'red';
            case 'payment':
                return 'green';
            case 'insurance':
                return 'blue';
            case 'adjustment':
                return 'orange';
            default:
                return 'default';
        }
    };

    const renderBalanceOverview = () => (
        <Row gutter={16}>
            <Col span={8}>
                <Card>
                    <Statistic
                        title="Current Balance"
                        value={balance?.current_balance}
                        prefix="$"
                        precision={2}
                        valueStyle={{ color: balance?.current_balance && balance.current_balance < 0 ? '#3f8600' : '#cf1322' }}
                    />
                </Card>
            </Col>
            <Col span={8}>
                <Card>
                    <Statistic
                        title="Pending Charges"
                        value={balance?.pending_charges}
                        prefix="$"
                        precision={2}
                        valueStyle={{ color: '#cf1322' }}
                    />
                </Card>
            </Col>
            <Col span={8}>
                <Card>
                    <Statistic
                        title="Pending Payments"
                        value={balance?.pending_payments}
                        prefix="$"
                        precision={2}
                        valueStyle={{ color: '#3f8600' }}
                    />
                </Card>
            </Col>
        </Row>
    );

    const renderTransactionHistory = () => (
        <Table
            columns={[
                {
                    title: 'Date',
                    dataIndex: 'date',
                    key: 'date',
                    render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
                },
                {
                    title: 'Type',
                    dataIndex: 'type',
                    key: 'type',
                    render: (type: string) => (
                        <Tag color={getTypeColor(type)}>
                            {type.toUpperCase()}
                        </Tag>
                    ),
                },
                {
                    title: 'Amount',
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (amount: number) => (
                        <span style={{ color: amount < 0 ? '#3f8600' : '#cf1322' }}>
                            {amount < 0 ? '-' : '+'}${Math.abs(amount).toFixed(2)}
                        </span>
                    ),
                },
                {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description',
                },
                {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string, record: BalanceEntry) => (
                        <Select
                            value={status}
                            onChange={(value) => handleUpdateStatus(record.id, value)}
                            style={{ width: 120 }}
                        >
                            <Option value="pending">Pending</Option>
                            <Option value="completed">Completed</Option>
                            <Option value="cancelled">Cancelled</Option>
                        </Select>
                    ),
                },
            ]}
            dataSource={balance?.entries}
            rowKey="id"
            pagination={false}
        />
    );

    const renderBalanceTrend = () => {
        if (!balance?.entries) return null;

        const data = balance.entries
            .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
            .map((entry, index) => {
                const amount = entry.type === 'charge' ? entry.amount : -entry.amount;
                return {
                    date: dayjs(entry.date).format('YYYY-MM-DD'),
                    amount: amount,
                    type: entry.type,
                };
            });

        return (
            <Line
                data={data}
                xField="date"
                yField="amount"
                seriesField="type"
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

    return (
        <div>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={2}>Patient Balance</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                    >
                        Add Transaction
                    </Button>
                </div>

                {renderBalanceOverview()}

                <Divider />

                <Tabs defaultActiveKey="1" onChange={setActiveTab}>
                    <TabPane tab={<span><FileTextOutlined /> Transaction History</span>} key="1">
                        {renderTransactionHistory()}
                    </TabPane>
                    <TabPane tab={<span><BarChartOutlined /> Balance Trend</span>} key="2">
                        {renderBalanceTrend()}
                    </TabPane>
                </Tabs>

                <Modal
                    title="Add Transaction"
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
                        onFinish={handleAddTransaction}
                    >
                        <Form.Item
                            name="type"
                            label="Transaction Type"
                            rules={[{ required: true, message: 'Please select transaction type!' }]}
                        >
                            <Select>
                                <Option value="charge">Charge</Option>
                                <Option value="payment">Payment</Option>
                                <Option value="insurance">Insurance Estimate</Option>
                                <Option value="adjustment">Adjustment</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="amount"
                            label="Amount"
                            rules={[{ required: true, message: 'Please input amount!' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                prefix="$"
                                step={0.01}
                            />
                        </Form.Item>

                        <Form.Item
                            name="reference_id"
                            label="Reference ID"
                            rules={[{ required: true, message: 'Please input reference ID!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Description"
                            rules={[{ required: true, message: 'Please input description!' }]}
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Add Transaction
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default PatientBalancePage; 