import React, { useState, useEffect } from 'react';
import {
    Card,
    Descriptions,
    Button,
    Space,
    Tag,
    Timeline,
    Modal,
    Form,
    Input,
    message,
    Divider,
    Table,
    Typography
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import {
    insuranceClaimsService,
    InsuranceClaim,
    ClaimStatus,
    ClaimStatusUpdate,
    ClaimAppeal
} from '../services/insuranceClaimsService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const ClaimDetailsPage: React.FC = () => {
    const { claimId } = useParams<{ claimId: string }>();
    const [claim, setClaim] = useState<InsuranceClaim | null>(null);
    const [loading, setLoading] = useState(true);
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [isAppealModalVisible, setIsAppealModalVisible] = useState(false);
    const [statusForm] = Form.useForm();
    const [appealForm] = Form.useForm();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (claimId) {
            fetchClaim();
        }
    }, [claimId]);

    const fetchClaim = async () => {
        setLoading(true);
        try {
            const data = await insuranceClaimsService.getClaim(claimId!);
            setClaim(data);
        } catch (error) {
            message.error('Failed to fetch claim details');
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
        if (!claim) return;

        try {
            const update: ClaimStatusUpdate = {
                status: values.status,
                paid_amount: values.paid_amount,
                denial_reason: values.denial_reason
            };

            await insuranceClaimsService.updateClaimStatus(claim.id, update);
            message.success('Claim status updated successfully');
            setIsStatusModalVisible(false);
            fetchClaim();
        } catch (error) {
            message.error('Failed to update claim status');
        }
    };

    const handleAppeal = async (values: any) => {
        if (!claim) return;

        try {
            const appeal: ClaimAppeal = {
                appeal_reason: values.appeal_reason,
                supporting_docs: values.supporting_docs
            };

            await insuranceClaimsService.appealClaim(claim.id, appeal);
            message.success('Appeal submitted successfully');
            setIsAppealModalVisible(false);
            fetchClaim();
        } catch (error) {
            message.error('Failed to submit appeal');
        }
    };

    const procedureColumns = [
        {
            title: 'Procedure Code',
            dataIndex: 'procedure_code',
            key: 'procedure_code'
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description'
        },
        {
            title: 'Tooth',
            dataIndex: 'tooth_number',
            key: 'tooth_number',
            render: (tooth: string) => tooth || '-'
        },
        {
            title: 'Surface',
            dataIndex: 'surface',
            key: 'surface',
            render: (surface: string) => surface || '-'
        },
        {
            title: 'Fee',
            dataIndex: 'fee',
            key: 'fee',
            render: (fee: number) => formatCurrency(fee)
        },
        {
            title: 'Date of Service',
            dataIndex: 'date_of_service',
            key: 'date_of_service',
            render: (date: string) => formatDate(date)
        }
    ];

    if (!claim) {
        return <div>Loading...</div>;
    }

    return (
        <div className="claim-details-page">
            <Card
                title={
                    <Space>
                        <Title level={4}>Claim Details</Title>
                        <Tag color={getStatusColor(claim.status)}>
                            {claim.status}
                        </Tag>
                    </Space>
                }
                extra={
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => setIsStatusModalVisible(true)}
                        >
                            Update Status
                        </Button>
                        {claim.status === ClaimStatus.DENIED && (
                            <Button
                                type="primary"
                                danger
                                onClick={() => setIsAppealModalVisible(true)}
                            >
                                Appeal Claim
                            </Button>
                        )}
                    </Space>
                }
            >
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Claim ID">
                        {claim.id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Patient ID">
                        {claim.patient_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Treatment Plan ID">
                        {claim.treatment_plan_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Insurance Provider">
                        {claim.insurance_provider_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Claim Type">
                        {claim.claim_type}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Amount">
                        {formatCurrency(claim.total_amount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Submitted Date">
                        {claim.submitted_date ? formatDate(claim.submitted_date) : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Paid Amount">
                        {claim.paid_amount ? formatCurrency(claim.paid_amount) : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Paid Date">
                        {claim.paid_date ? formatDate(claim.paid_date) : '-'}
                    </Descriptions.Item>
                    {claim.denial_reason && (
                        <Descriptions.Item label="Denial Reason">
                            {claim.denial_reason}
                        </Descriptions.Item>
                    )}
                    {claim.appeal_date && (
                        <Descriptions.Item label="Appeal Date">
                            {formatDate(claim.appeal_date)}
                        </Descriptions.Item>
                    )}
                    {claim.appeal_status && (
                        <Descriptions.Item label="Appeal Status">
                            {claim.appeal_status}
                        </Descriptions.Item>
                    )}
                </Descriptions>

                <Divider orientation="left">Procedures</Divider>
                <Table
                    columns={procedureColumns}
                    dataSource={claim.procedures}
                    rowKey="procedure_code"
                    pagination={false}
                />

                <Divider orientation="left">Timeline</Divider>
                <Timeline>
                    <Timeline.Item color="green">
                        Created: {formatDate(claim.created_at)}
                    </Timeline.Item>
                    {claim.submitted_date && (
                        <Timeline.Item color="blue">
                            Submitted: {formatDate(claim.submitted_date)}
                        </Timeline.Item>
                    )}
                    {claim.received_date && (
                        <Timeline.Item color="blue">
                            Received: {formatDate(claim.received_date)}
                        </Timeline.Item>
                    )}
                    {claim.processed_date && (
                        <Timeline.Item color="blue">
                            Processed: {formatDate(claim.processed_date)}
                        </Timeline.Item>
                    )}
                    {claim.paid_date && (
                        <Timeline.Item color="green">
                            Paid: {formatDate(claim.paid_date)}
                        </Timeline.Item>
                    )}
                    {claim.appeal_date && (
                        <Timeline.Item color="orange">
                            Appealed: {formatDate(claim.appeal_date)}
                        </Timeline.Item>
                    )}
                </Timeline>

                {claim.notes && (
                    <>
                        <Divider orientation="left">Notes</Divider>
                        <Text>{claim.notes}</Text>
                    </>
                )}
            </Card>

            <Modal
                title="Update Claim Status"
                visible={isStatusModalVisible}
                onCancel={() => setIsStatusModalVisible(false)}
                footer={null}
            >
                <Form
                    form={statusForm}
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
                                <Select.Option key={status} value={status}>
                                    {status}
                                </Select.Option>
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
            </Modal>

            <Modal
                title="Appeal Claim"
                visible={isAppealModalVisible}
                onCancel={() => setIsAppealModalVisible(false)}
                footer={null}
            >
                <Form
                    form={appealForm}
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
            </Modal>
        </div>
    );
};

export default ClaimDetailsPage; 