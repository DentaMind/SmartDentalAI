import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Modal, Form, Input, Select, Tag, message, Typography, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, LockOutlined, UnlockOutlined, CheckCircleOutlined, CommentOutlined, HistoryOutlined } from '@ant-design/icons';
import treatmentService, { TreatmentPlan, TreatmentStatus, TreatmentPriority } from '../services/treatmentService';
import TreatmentPlanForm from '../components/treatment/TreatmentPlanForm';
import { Link, useNavigate } from 'react-router-dom';
import { GenerateClaimModal } from '../components/claims/GenerateClaimModal';
import { useClaims } from '../hooks/useClaims';
import claimsService from '../services/claimsService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

const { Title } = Typography;

interface TreatmentPlanWithClaim extends TreatmentPlan {
    claim_status?: string;
    claim_id?: string;
}

const TreatmentPlansPage: React.FC = () => {
    const [plans, setPlans] = useState<TreatmentPlanWithClaim[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [isGenerateClaimModalVisible, setIsGenerateClaimModalVisible] = useState(false);
    const { generateClaim } = useClaims();
    const { user } = useAuth();
    const { hasPermission } = usePermissions();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual patient ID
            const patientId = 'current-patient-id';
            const treatmentPlans = await treatmentService.getPatientTreatmentPlans(patientId);
            
            // Fetch claim status for each plan
            const plansWithClaims = await Promise.all(
                treatmentPlans.map(async (plan) => {
                    try {
                        const claim = await claimsService.getClaimByTreatmentPlan(plan.id);
                        return {
                            ...plan,
                            claim_status: claim?.status,
                            claim_id: claim?.id
                        };
                    } catch (error) {
                        return plan;
                    }
                })
            );
            
            setPlans(plansWithClaims);
        } catch (error) {
            message.error('Failed to fetch treatment plans');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (values: any) => {
        try {
            await treatmentService.createTreatmentPlan(values, user?.id || '');
            message.success('Treatment plan created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchPlans();
        } catch (error) {
            message.error('Failed to create treatment plan');
        }
    };

    const handleUpdate = async (values: any) => {
        if (!selectedPlan) return;
        try {
            await treatmentService.updateTreatmentPlan(selectedPlan.id, values);
            message.success('Treatment plan updated successfully');
            setModalVisible(false);
            setSelectedPlan(null);
            fetchPlans();
        } catch (error) {
            message.error('Failed to update treatment plan');
        }
    };

    const handleDelete = async (planId: string) => {
        try {
            await treatmentService.deleteTreatmentPlan(planId);
            message.success('Treatment plan deleted successfully');
            fetchPlans();
        } catch (error) {
            message.error('Failed to delete treatment plan');
        }
    };

    const handleApprove = async (planId: string) => {
        try {
            await treatmentService.approveTreatmentPlan(planId);
            message.success('Treatment plan approved successfully');
            fetchPlans();
        } catch (error) {
            message.error('Failed to approve treatment plan');
        }
    };

    const handleLock = async (planId: string) => {
        try {
            await treatmentService.lockTreatmentPlan(planId);
            message.success('Treatment plan locked successfully');
            fetchPlans();
        } catch (error) {
            message.error('Failed to lock treatment plan');
        }
    };

    const handleUnlock = async (planId: string) => {
        try {
            await treatmentService.unlockTreatmentPlan(planId);
            message.success('Treatment plan unlocked successfully');
            fetchPlans();
        } catch (error) {
            message.error('Failed to unlock treatment plan');
        }
    };

    const handleAddNote = async (planId: string) => {
        Modal.confirm({
            title: 'Add Note',
            content: (
                <Form>
                    <Form.Item name="note" rules={[{ required: true, message: 'Please enter a note' }]}>
                        <Input.TextArea rows={4} placeholder="Enter your note here" />
                    </Form.Item>
                </Form>
            ),
            onOk: async (close) => {
                const form = Modal.confirm().destroyAll()[0].props.content.props.form;
                try {
                    const values = await form.validateFields();
                    await treatmentService.addNote(planId, values.note);
                    message.success('Note added successfully');
                    fetchPlans();
                    close();
                } catch (error) {
                    message.error('Failed to add note');
                }
            }
        });
    };

    const getStatusColor = (status: TreatmentStatus) => {
        switch (status) {
            case TreatmentStatus.DRAFT:
                return 'default';
            case TreatmentStatus.PENDING_APPROVAL:
                return 'warning';
            case TreatmentStatus.APPROVED:
                return 'success';
            case TreatmentStatus.IN_PROGRESS:
                return 'processing';
            case TreatmentStatus.COMPLETED:
                return 'success';
            case TreatmentStatus.CANCELLED:
                return 'error';
            default:
                return 'default';
        }
    };

    const columns = [
        {
            title: 'Plan ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: TreatmentStatus) => (
                <Tag color={getStatusColor(status)}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Claim Status',
            dataIndex: 'claim_status',
            key: 'claim_status',
            render: (status: string, record: TreatmentPlanWithClaim) => (
                <Tooltip title={status ? `Claim ${status}` : 'No claim'}>
                    <Space>
                        {status && (
                            <Tag color={
                                status === 'submitted' ? 'blue' :
                                status === 'approved' ? 'green' :
                                status === 'denied' ? 'red' : 'default'
                            }>
                                {status}
                            </Tag>
                        )}
                        {record.claim_id && (
                            <Link to={`/claims/${record.claim_id}`}>
                                View Claim
                            </Link>
                        )}
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: TreatmentPlanWithClaim) => (
                <Space>
                    {hasPermission('edit_plan') && !record.is_locked && (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setSelectedPlan(record);
                                setModalVisible(true);
                            }}
                        />
                    )}
                    
                    {hasPermission('approve_plan') && record.status === 'draft' && (
                        <Popconfirm
                            title="Are you sure you want to approve this plan?"
                            onConfirm={() => handleApprove(record.id)}
                        >
                            <Button
                                type="text"
                                icon={<CheckCircleOutlined />}
                            />
                        </Popconfirm>
                    )}

                    {hasPermission('lock_plan') && (
                        <Button
                            type="text"
                            icon={record.is_locked ? <UnlockOutlined /> : <LockOutlined />}
                            onClick={() => record.is_locked ? handleUnlock(record.id) : handleLock(record.id)}
                        />
                    )}

                    {hasPermission('add_notes') && (
                        <Button
                            type="text"
                            icon={<CommentOutlined />}
                            onClick={() => handleAddNote(record.id)}
                        />
                    )}

                    {hasPermission('view_history') && (
                        <Button
                            type="text"
                            icon={<HistoryOutlined />}
                            onClick={() => navigate(`/treatment-plans/${record.id}/history`)}
                        />
                    )}

                    {hasPermission('submit_claim') && record.status === 'approved' && !record.claim_status && (
                        <Button
                            type="primary"
                            icon={<FileTextOutlined />}
                            onClick={() => {
                                setSelectedPlan(record);
                                setIsGenerateClaimModalVisible(true);
                            }}
                        >
                            Generate Claim
                        </Button>
                    )}

                    {hasPermission('delete_plan') && !record.is_locked && (
                        <Popconfirm
                            title="Are you sure you want to delete this plan?"
                            onConfirm={() => handleDelete(record.id)}
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const handleGenerateClaim = async (values: any) => {
        try {
            await generateClaim({
                treatment_plan_id: selectedPlan!.id,
                insurance_provider_id: values.insurance_provider_id,
                notes: values.notes,
            });
            message.success('Insurance claim generated successfully');
            setIsGenerateClaimModalVisible(false);
        } catch (error) {
            message.error('Failed to generate insurance claim');
        }
    };

    return (
        <div>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={2}>Treatment Plans</Title>
                    {hasPermission('create_plan') && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setModalVisible(true)}
                        >
                            Create Treatment Plan
                        </Button>
                    )}
                </div>

                <Table
                    columns={columns}
                    dataSource={plans}
                    loading={loading}
                    rowKey="id"
                />

                <Modal
                    title={selectedPlan ? 'Edit Treatment Plan' : 'Create Treatment Plan'}
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        setSelectedPlan(null);
                        form.resetFields();
                    }}
                    footer={null}
                    width={800}
                >
                    <TreatmentPlanForm
                        form={form}
                        initialValues={selectedPlan}
                        onSubmit={selectedPlan ? handleUpdate : handleCreate}
                    />
                </Modal>

                {selectedPlan && (
                    <GenerateClaimModal
                        visible={isGenerateClaimModalVisible}
                        onCancel={() => setIsGenerateClaimModalVisible(false)}
                        onOk={handleGenerateClaim}
                        treatmentPlan={selectedPlan}
                    />
                )}
            </Card>
        </div>
    );
};

export default TreatmentPlansPage; 