import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Modal, Form, Input, Select, Tag, message, Typography, Timeline, Descriptions } from 'antd';
import { PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import preAuthService, { PreAuthRequest, PreAuthStatus, PreAuthRequestCreate, PreAuthRequestUpdate } from '../services/preAuthService';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const PreAuthorizationPage: React.FC = () => {
    const [requests, setRequests] = useState<PreAuthRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PreAuthRequest | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await preAuthService.getAllRequests();
            setRequests(data);
        } catch (error) {
            message.error('Failed to fetch pre-authorization requests');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (values: PreAuthRequestCreate) => {
        try {
            await preAuthService.createRequest(values);
            message.success('Pre-authorization request created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchRequests();
        } catch (error) {
            message.error('Failed to create pre-authorization request');
        }
    };

    const handleStatusUpdate = async (requestId: string, newStatus: PreAuthStatus, notes?: string) => {
        try {
            const update: PreAuthRequestUpdate = {
                status: newStatus,
                notes
            };
            await preAuthService.updateRequest(requestId, update);
            message.success('Status updated successfully');
            fetchRequests();
        } catch (error) {
            message.error('Failed to update status');
        }
    };

    const getStatusColor = (status: PreAuthStatus) => {
        switch (status) {
            case PreAuthStatus.PENDING:
                return 'warning';
            case PreAuthStatus.APPROVED:
                return 'success';
            case PreAuthStatus.DENIED:
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: PreAuthStatus) => {
        switch (status) {
            case PreAuthStatus.PENDING:
                return <ClockCircleOutlined />;
            case PreAuthStatus.APPROVED:
                return <CheckCircleOutlined />;
            case PreAuthStatus.DENIED:
                return <CloseCircleOutlined />;
            default:
                return null;
        }
    };

    const columns = [
        {
            title: 'Request ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Treatment Plan',
            dataIndex: 'treatment_plan_id',
            key: 'treatment_plan_id',
        },
        {
            title: 'Procedure Code',
            dataIndex: 'procedure_code',
            key: 'procedure_code',
        },
        {
            title: 'Insurance Provider',
            dataIndex: 'insurance_provider',
            key: 'insurance_provider',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: PreAuthStatus) => (
                <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Submitted Date',
            dataIndex: 'submitted_date',
            key: 'submitted_date',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: PreAuthRequest) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => setSelectedRequest(record)}
                    >
                        View Details
                    </Button>
                    {record.status === PreAuthStatus.PENDING && (
                        <>
                            <Button
                                type="primary"
                                onClick={() => handleStatusUpdate(record.id, PreAuthStatus.APPROVED)}
                            >
                                Approve
                            </Button>
                            <Button
                                danger
                                onClick={() => handleStatusUpdate(record.id, PreAuthStatus.DENIED)}
                            >
                                Deny
                            </Button>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    const renderTimeline = (request: PreAuthRequest) => (
        <Timeline>
            {request.history.map((event, index) => (
                <Timeline.Item
                    key={index}
                    color={getStatusColor(event.status)}
                    dot={getStatusIcon(event.status)}
                >
                    <p>{dayjs(event.date).format('YYYY-MM-DD HH:mm')}</p>
                    <p>Status: {event.status}</p>
                    {event.notes && <p>Notes: {event.notes}</p>}
                </Timeline.Item>
            ))}
        </Timeline>
    );

    return (
        <div>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={2}>Pre-Authorization Management</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                    >
                        Create Request
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={requests}
                    loading={loading}
                    rowKey="id"
                    expandable={{
                        expandedRowRender: (record) => (
                            <Card>
                                <Descriptions title="Request Details" bordered>
                                    <Descriptions.Item label="Treatment Plan ID">
                                        {record.treatment_plan_id}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Procedure Code">
                                        {record.procedure_code}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Insurance Provider">
                                        {record.insurance_provider}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Reference Number">
                                        {record.reference_number || 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Submitted Date">
                                        {dayjs(record.submitted_date).format('YYYY-MM-DD HH:mm')}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Response Date">
                                        {record.response_date ? dayjs(record.response_date).format('YYYY-MM-DD HH:mm') : 'N/A'}
                                    </Descriptions.Item>
                                </Descriptions>
                                <div style={{ marginTop: 24 }}>
                                    <Title level={4}>Status History</Title>
                                    {renderTimeline(record)}
                                </div>
                            </Card>
                        ),
                    }}
                />

                <Modal
                    title="Create Pre-Authorization Request"
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
                            name="treatment_plan_id"
                            label="Treatment Plan ID"
                            rules={[{ required: true, message: 'Please input treatment plan ID!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="procedure_code"
                            label="Procedure Code"
                            rules={[{ required: true, message: 'Please input procedure code!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="insurance_provider"
                            label="Insurance Provider"
                            rules={[{ required: true, message: 'Please select insurance provider!' }]}
                        >
                            <Select>
                                <Option value="Delta Dental">Delta Dental</Option>
                                <Option value="Cigna">Cigna</Option>
                                <Option value="Aetna">Aetna</Option>
                                <Option value="MetLife">MetLife</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="notes"
                            label="Notes"
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Create Request
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="Request Details"
                    open={!!selectedRequest}
                    onCancel={() => setSelectedRequest(null)}
                    footer={null}
                    width={800}
                >
                    {selectedRequest && (
                        <>
                            <Descriptions title="Request Details" bordered>
                                <Descriptions.Item label="Treatment Plan ID">
                                    {selectedRequest.treatment_plan_id}
                                </Descriptions.Item>
                                <Descriptions.Item label="Procedure Code">
                                    {selectedRequest.procedure_code}
                                </Descriptions.Item>
                                <Descriptions.Item label="Insurance Provider">
                                    {selectedRequest.insurance_provider}
                                </Descriptions.Item>
                                <Descriptions.Item label="Reference Number">
                                    {selectedRequest.reference_number || 'N/A'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Submitted Date">
                                    {dayjs(selectedRequest.submitted_date).format('YYYY-MM-DD HH:mm')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Response Date">
                                    {selectedRequest.response_date ? dayjs(selectedRequest.response_date).format('YYYY-MM-DD HH:mm') : 'N/A'}
                                </Descriptions.Item>
                            </Descriptions>
                            <div style={{ marginTop: 24 }}>
                                <Title level={4}>Status History</Title>
                                {renderTimeline(selectedRequest)}
                            </div>
                        </>
                    )}
                </Modal>
            </Card>
        </div>
    );
};

export default PreAuthorizationPage; 