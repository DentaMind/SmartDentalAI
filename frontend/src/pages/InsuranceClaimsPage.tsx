import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    DatePicker,
    Select,
    Input,
    Modal,
    Form,
    message,
    Statistic,
    Row,
    Col,
    Tabs,
    Badge
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    insuranceClaimsService,
    InsuranceClaim,
    ClaimStatus,
    ClaimType,
    ClaimStatusUpdate,
    ClaimAppeal
} from '../services/insuranceClaimsService';
import { Line } from '@ant-design/plots';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const InsuranceClaimsPage: React.FC = () => {
    const [claims, setClaims] = useState<InsuranceClaim[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
    const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
    const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'ALL'>('ALL');
    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'status' | 'appeal'>('status');
    const [form] = Form.useForm();
    const { clinicId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchClaims();
        if (clinicId) {
            const cleanup = insuranceClaimsService.connectWebSocket(
                clinicId,
                handleWebSocketEvent
            );
            return cleanup;
        }
    }, [clinicId]);

    const handleWebSocketEvent = (event: any) => {
        if (event.type === 'status_updated') {
            setClaims(prevClaims =>
                prevClaims.map(claim =>
                    claim.id === event.claim_id
                        ? { ...claim, status: event.status }
                        : claim
                )
            );
            message.success('Claim status updated');
        }
    };

    const fetchClaims = async () => {
        setLoading(true);
        try {
            let data: InsuranceClaim[] = [];
            if (dateRange[0] && dateRange[1]) {
                data = await insuranceClaimsService.getClaimsByDateRange(
                    dateRange[0],
                    dateRange[1]
                );
            } else {
                data = await insuranceClaimsService.getClaimsByStatus(
                    statusFilter as ClaimStatus
                );
            }
            setClaims(data);
        } catch (error) {
            message.error('Failed to fetch claims');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: ClaimStatus) => {
        const colors: Record<ClaimStatus, string> = {
            [ClaimStatus.DRAFT]: 'default',
            [ClaimStatus.SUBMITTED]: 'processing',
            [ClaimStatus.RECEIVED]: 'warning',
            [ClaimStatus.PROCESSING]: 'processing',
            [ClaimStatus.PAID]: 'success',
            [ClaimStatus.DENIED]: 'error',
            [ClaimStatus.APPEALED]: 'warning',
            [ClaimStatus.REJECTED]: 'error',
            [ClaimStatus.VOIDED]: 'default'
        };
        return colors[status];
    };

    const handleStatusUpdate = async (values: any) => {
        if (!selectedClaim) return;

        try {
            const update: ClaimStatusUpdate = {
                status: values.status,
                paid_amount: values.paid_amount,
                denial_reason: values.denial_reason
            };

            await insuranceClaimsService.updateClaimStatus(
                selectedClaim.id,
                update
            );
            message.success('Claim status updated successfully');
            setIsModalVisible(false);
            fetchClaims();
        } catch (error) {
            message.error('Failed to update claim status');
        }
    };

    const handleAppeal = async (values: any) => {
        if (!selectedClaim) return;

        try {
            const appeal: ClaimAppeal = {
                appeal_reason: values.appeal_reason,
                supporting_docs: values.supporting_docs
            };

            await insuranceClaimsService.appealClaim(selectedClaim.id, appeal);
            message.success('Claim appeal submitted successfully');
            setIsModalVisible(false);
            fetchClaims();
        } catch (error) {
            message.error('Failed to submit appeal');
        }
    };

    const columns = [
        {
            title: 'Claim ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => (
                <Button type="link" onClick={() => navigate(`/claims/${id}`)}>
                    {id}
                </Button>
            )
        },
        {
            title: 'Patient',
            dataIndex: 'patient_id',
            key: 'patient_id'
        },
        {
            title: 'Type',
            dataIndex: 'claim_type',
            key: 'claim_type'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: ClaimStatus) => (
                <Tag color={getStatusColor(status)}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (amount: number) => formatCurrency(amount)
        },
        {
            title: 'Submitted',
            dataIndex: 'submitted_date',
            key: 'submitted_date',
            render: (date: string) => date ? formatDate(date) : '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: InsuranceClaim) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            setSelectedClaim(record);
                            setModalType('status');
                            setIsModalVisible(true);
                        }}
                    >
                        Update Status
                    </Button>
                    {record.status === ClaimStatus.DENIED && (
                        <Button
                            onClick={() => {
                                setSelectedClaim(record);
                                setModalType('appeal');
                                setIsModalVisible(true);
                            }}
                        >
                            Appeal
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    const filteredClaims = claims.filter(claim => {
        const matchesSearch = claim.id.toLowerCase().includes(searchText.toLowerCase()) ||
            claim.patient_id.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = claims.reduce((acc, claim) => {
        acc[claim.status] = (acc[claim.status] || 0) + 1;
        return acc;
    }, {} as Record<ClaimStatus, number>);

    return (
        <div className="insurance-claims-page">
            <Card title="Insurance Claims Dashboard">
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Space>
                            <RangePicker
                                onChange={(dates) => {
                                    if (dates) {
                                        setDateRange([
                                            dates[0]?.format('YYYY-MM-DD') || '',
                                            dates[1]?.format('YYYY-MM-DD') || ''
                                        ]);
                                    }
                                }}
                            />
                            <Select
                                value={statusFilter}
                                onChange={setStatusFilter}
                                style={{ width: 200 }}
                            >
                                <Option value="ALL">All Statuses</Option>
                                {Object.values(ClaimStatus).map(status => (
                                    <Option key={status} value={status}>
                                        {status}
                                    </Option>
                                ))}
                            </Select>
                            <Input.Search
                                placeholder="Search claims..."
                                onSearch={setSearchText}
                                style={{ width: 200 }}
                            />
                            <Button type="primary" onClick={fetchClaims}>
                                Refresh
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <Col span={4} key={status}>
                            <Card>
                                <Statistic
                                    title={status}
                                    value={count}
                                    valueStyle={{ color: getStatusColor(status as ClaimStatus) }}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Tabs defaultActiveKey="1" style={{ marginTop: 16 }}>
                    <TabPane tab="Claims List" key="1">
                        <Table
                            columns={columns}
                            dataSource={filteredClaims}
                            loading={loading}
                            rowKey="id"
                        />
                    </TabPane>
                    <TabPane tab="Analytics" key="2">
                        <Line
                            data={claims.map(claim => ({
                                date: claim.submitted_date,
                                amount: claim.total_amount
                            }))}
                            xField="date"
                            yField="amount"
                            point={{ size: 5, shape: 'diamond' }}
                        />
                    </TabPane>
                </Tabs>
            </Card>

            <Modal
                title={modalType === 'status' ? 'Update Claim Status' : 'Appeal Claim'}
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                {modalType === 'status' ? (
                    <Form
                        form={form}
                        onFinish={handleStatusUpdate}
                        layout="vertical"
                    >
                        <Form.Item
                            name="status"
                            label="New Status"
                            rules={[{ required: true }]}
                        >
                            <Select>
                                {Object.values(ClaimStatus).map(status => (
                                    <Option key={status} value={status}>
                                        {status}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="paid_amount"
                            label="Paid Amount"
                            dependencies={['status']}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('status') === ClaimStatus.PAID ? (
                                    <Input type="number" />
                                ) : null
                            }
                        </Form.Item>
                        <Form.Item
                            name="denial_reason"
                            label="Denial Reason"
                            dependencies={['status']}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('status') === ClaimStatus.DENIED ? (
                                    <Input.TextArea />
                                ) : null
                            }
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Update Status
                            </Button>
                        </Form.Item>
                    </Form>
                ) : (
                    <Form
                        form={form}
                        onFinish={handleAppeal}
                        layout="vertical"
                    >
                        <Form.Item
                            name="appeal_reason"
                            label="Appeal Reason"
                            rules={[{ required: true }]}
                        >
                            <Input.TextArea />
                        </Form.Item>
                        <Form.Item
                            name="supporting_docs"
                            label="Supporting Documents"
                            rules={[{ required: true }]}
                        >
                            <Select mode="tags" placeholder="Add document references">
                                {/* This would be replaced with actual file upload functionality */}
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Submit Appeal
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    );
};

export default InsuranceClaimsPage; 