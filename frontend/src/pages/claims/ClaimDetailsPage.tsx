import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Card, 
    Descriptions, 
    Button, 
    Space, 
    Table, 
    Tag, 
    message,
    Spin,
    Modal,
    Form,
    Input,
    InputNumber,
    DatePicker
} from 'antd';
import { claimsService } from '../../services/claimsService';
import { InsuranceClaim, ClaimStatus, ClaimProcedure } from '../../types/claims';

const { TextArea } = Input;

const ClaimDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [claim, setClaim] = useState<InsuranceClaim | null>(null);
    const [isAppealModalVisible, setIsAppealModalVisible] = useState(false);
    const [appealForm] = Form.useForm();

    useEffect(() => {
        if (id) {
            fetchClaim(id);
        }
    }, [id]);

    const fetchClaim = async (claimId: string) => {
        try {
            setLoading(true);
            const data = await claimsService.getClaim(claimId);
            setClaim(data);
        } catch (error) {
            message.error('Failed to fetch claim details');
        } finally {
            setLoading(false);
        }
    };

    const handleAppeal = async (values: any) => {
        if (!claim) return;

        try {
            setLoading(true);
            await claimsService.appealClaim(claim.id, {
                reason: values.reason,
                additionalInfo: values.additionalInfo
            });
            message.success('Claim appeal submitted successfully');
            setIsAppealModalVisible(false);
            fetchClaim(claim.id);
        } catch (error) {
            message.error('Failed to submit appeal');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: ClaimStatus) => {
        switch (status) {
            case ClaimStatus.SUBMITTED:
                return 'blue';
            case ClaimStatus.PAID:
                return 'green';
            case ClaimStatus.DENIED:
                return 'red';
            case ClaimStatus.APPEALED:
                return 'orange';
            default:
                return 'default';
        }
    };

    const procedureColumns = [
        {
            title: 'Procedure Code',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `$${amount.toFixed(2)}`,
        },
    ];

    if (!claim) {
        return <Spin size="large" />;
    }

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Card 
                title="Claim Details" 
                extra={
                    <Space>
                        {claim.status === ClaimStatus.DENIED && (
                            <Button 
                                type="primary" 
                                onClick={() => setIsAppealModalVisible(true)}
                            >
                                Appeal Claim
                            </Button>
                        )}
                        <Button onClick={() => navigate('/claims')}>
                            Back to List
                        </Button>
                    </Space>
                }
            >
                <Spin spinning={loading}>
                    <Descriptions bordered>
                        <Descriptions.Item label="Claim Number">
                            {claim.claimNumber}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={getStatusColor(claim.status)}>
                                {claim.status}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Patient">
                            {claim.patientName}
                        </Descriptions.Item>
                        <Descriptions.Item label="Submission Date">
                            {new Date(claim.submissionDate).toLocaleDateString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Amount">
                            ${claim.totalAmount.toFixed(2)}
                        </Descriptions.Item>
                        {claim.paymentDate && (
                            <Descriptions.Item label="Payment Date">
                                {new Date(claim.paymentDate).toLocaleDateString()}
                            </Descriptions.Item>
                        )}
                        {claim.paymentAmount && (
                            <Descriptions.Item label="Payment Amount">
                                ${claim.paymentAmount.toFixed(2)}
                            </Descriptions.Item>
                        )}
                        {claim.denialReason && (
                            <Descriptions.Item label="Denial Reason">
                                {claim.denialReason}
                            </Descriptions.Item>
                        )}
                    </Descriptions>

                    <Card title="Procedures" style={{ marginTop: 16 }}>
                        <Table
                            dataSource={claim.procedures}
                            columns={procedureColumns}
                            rowKey="code"
                            pagination={false}
                        />
                    </Card>
                </Spin>
            </Card>

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
                        name="reason"
                        label="Appeal Reason"
                        rules={[{ required: true, message: 'Please enter the appeal reason' }]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item
                        name="additionalInfo"
                        label="Additional Information"
                    >
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Submit Appeal
                            </Button>
                            <Button onClick={() => setIsAppealModalVisible(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
};

export default ClaimDetailsPage; 