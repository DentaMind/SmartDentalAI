import React, { useState, useEffect } from 'react';
import { Card, Tag, Typography, Space, Divider, Button, Badge, Table, message, Form, Input, DatePicker, Tooltip, Tabs, Switch, Modal } from 'antd';
import { EditOutlined, CheckCircleOutlined, LockOutlined, UnlockOutlined, CommentOutlined, HistoryOutlined, BellOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { TreatmentPlan, TreatmentStatus } from '../../services/treatmentService';
import ActivityLog from './ActivityLog';
import ProposedEditsModal from './ProposedEditsModal';
import ProposedEditsTimeline from './ProposedEditsTimeline';
import FinancialOverrideRequest from './FinancialOverrideRequest';
import { usePermissions } from '../../hooks/usePermissions';
import { useParams, useNavigate } from 'react-router-dom';
import { treatmentService } from '../../services/treatmentService';
import { useAuth } from '../../contexts/AuthContext';
import LockedFieldsAlert from './LockedFieldsAlert';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TreatmentPlanDetailsProps {
    plan: TreatmentPlan;
    onEdit: () => void;
    onApprove: () => void;
    onLock: () => void;
    onUnlock: () => void;
    onAddNote: () => void;
    onProposeEdits: (edits: any) => void;
}

const TreatmentPlanDetails: React.FC<TreatmentPlanDetailsProps> = ({
    plan,
    onEdit,
    onApprove,
    onLock,
    onUnlock,
    onAddNote,
    onProposeEdits,
}) => {
    const { hasPermission } = usePermissions();
    const [showProposedEdits, setShowProposedEdits] = useState(false);
    const [lockedFields, setLockedFields] = useState<string[]>([]);
    const [insuranceClaimId, setInsuranceClaimId] = useState<string>();
    const { planId } = useParams();
    const navigate = useNavigate();
    const [proposedEdits, setProposedEdits] = useState<ProposedEdit[]>([]);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        newEdits: true,
        editApprovals: true,
        financialChanges: true,
    });

    useEffect(() => {
        const fetchLockedFields = async () => {
            try {
                const plan = await treatmentService.getTreatmentPlan(planId);
                setLockedFields(plan.locked_fields || []);
                setInsuranceClaimId(plan.insurance_claim_id);
            } catch (error) {
                console.error('Error fetching locked fields:', error);
            }
        };

        const fetchProposedEdits = async () => {
            try {
                const edits = await treatmentService.getProposedEdits(plan.id);
                setProposedEdits(edits);
            } catch (error) {
                console.error('Error fetching proposed edits:', error);
            }
        };

        const fetchNotificationSettings = async () => {
            try {
                const settings = await treatmentService.getNotificationSettings(plan.id);
                setEmailNotifications(settings.email_enabled);
                setNotificationSettings(settings.preferences);
            } catch (error) {
                console.error('Error fetching notification settings:', error);
            }
        };

        if (planId) {
            fetchLockedFields();
            fetchProposedEdits();
            fetchNotificationSettings();
        }
    }, [planId]);

    const isFieldLocked = (field: string) => lockedFields.includes(field);

    const renderLockedField = (field: string, value: any) => (
        <Tooltip title="This field is locked and cannot be modified">
            <Space>
                <LockOutlined style={{ color: '#ff4d4f' }} />
                <Text>{value}</Text>
            </Space>
        </Tooltip>
    );

    const getStatusColor = (status: TreatmentStatus) => {
        switch (status) {
            case TreatmentStatus.DRAFT:
                return 'warning';
            case TreatmentStatus.PENDING_APPROVAL:
                return 'processing';
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

    const getStatusText = (status: TreatmentStatus) => {
        switch (status) {
            case TreatmentStatus.DRAFT:
                return 'Draft';
            case TreatmentStatus.PENDING_APPROVAL:
                return 'Pending Approval';
            case TreatmentStatus.APPROVED:
                return 'Finalized';
            case TreatmentStatus.IN_PROGRESS:
                return 'In Progress';
            case TreatmentStatus.COMPLETED:
                return 'Completed';
            case TreatmentStatus.CANCELLED:
                return 'Cancelled';
            default:
                return status;
        }
    };

    const handleNotificationToggle = async (key: string, value: boolean) => {
        try {
            const newSettings = { ...notificationSettings, [key]: value };
            await treatmentService.updateNotificationSettings(plan.id, {
                email_enabled: emailNotifications,
                preferences: newSettings,
            });
            setNotificationSettings(newSettings);
            message.success('Notification settings updated');
        } catch (error) {
            message.error('Failed to update notification settings');
            console.error('Error updating notification settings:', error);
        }
    };

    const handleEmailToggle = async (checked: boolean) => {
        try {
            await treatmentService.updateNotificationSettings(plan.id, {
                email_enabled: checked,
                preferences: notificationSettings,
            });
            setEmailNotifications(checked);
            message.success('Email notifications ' + (checked ? 'enabled' : 'disabled'));
        } catch (error) {
            message.error('Failed to update email settings');
            console.error('Error updating email settings:', error);
        }
    };

    const items = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={3}>Treatment Plan Details</Title>
                        <Space>
                            {plan.proposed_edits && plan.proposed_edits.length > 0 && (
                                <Badge count={plan.proposed_edits.length}>
                                    <Button
                                        icon={<HistoryOutlined />}
                                        onClick={() => setShowProposedEdits(true)}
                                    >
                                        Review Proposed Changes
                                    </Button>
                                </Badge>
                            )}
                            <Tag color={getStatusColor(plan.status)} style={{ fontSize: '16px', padding: '8px 16px' }}>
                                {getStatusText(plan.status)}
                            </Tag>
                        </Space>
                    </div>

                    <Divider />

                    <Space direction="vertical" size={16}>
                        <div>
                            <Text strong>Patient:</Text>
                            <Text> {plan.patient_id}</Text>
                        </div>
                        <div>
                            <Text strong>Created:</Text>
                            <Text> {new Date(plan.created_at).toLocaleDateString()}</Text>
                        </div>
                        <div>
                            <Text strong>Priority:</Text>
                            <Text> {plan.priority}</Text>
                        </div>
                        <div>
                            <Text strong>Total Cost:</Text>
                            <Text> ${plan.total_cost.toFixed(2)}</Text>
                        </div>
                    </Space>

                    <Divider />

                    <Space>
                        {hasPermission('edit_plan') && !plan.is_locked && (
                            <Button
                                icon={<EditOutlined />}
                                onClick={onEdit}
                            >
                                Edit Plan
                            </Button>
                        )}
                        
                        {hasPermission('approve_plan') && plan.status === TreatmentStatus.DRAFT && (
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={onApprove}
                            >
                                Approve Plan
                            </Button>
                        )}

                        {hasPermission('lock_plan') && (
                            <Button
                                icon={plan.is_locked ? <UnlockOutlined /> : <LockOutlined />}
                                onClick={plan.is_locked ? onUnlock : onLock}
                            >
                                {plan.is_locked ? 'Unlock Plan' : 'Lock Plan'}
                            </Button>
                        )}

                        {hasPermission('add_notes') && (
                            <Button
                                icon={<CommentOutlined />}
                                onClick={onAddNote}
                            >
                                Add Note
                            </Button>
                        )}
                    </Space>
                </Space>
            ),
        },
        {
            key: 'activity',
            label: 'Activity Log',
            children: <ActivityLog auditTrail={plan.audit_trail} />,
        },
        {
            key: 'edits',
            label: (
                <Space>
                    <span>Edit History</span>
                    {proposedEdits.length > 0 && (
                        <Badge count={proposedEdits.length} />
                    )}
                </Space>
            ),
            children: <ProposedEditsTimeline edits={proposedEdits} />,
        },
        {
            key: 'notifications',
            label: (
                <Space>
                    <BellOutlined />
                    <span>Notifications</span>
                </Space>
            ),
            children: (
                <Card>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Space>
                            <Switch
                                checked={emailNotifications}
                                onChange={handleEmailToggle}
                            />
                            <Text>Enable Email Notifications</Text>
                        </Space>

                        <Divider />

                        <Space direction="vertical" size="middle">
                            <Space>
                                <Switch
                                    checked={notificationSettings.newEdits}
                                    onChange={(checked) => handleNotificationToggle('newEdits', checked)}
                                    disabled={!emailNotifications}
                                />
                                <Text>Notify me of new proposed edits</Text>
                            </Space>

                            <Space>
                                <Switch
                                    checked={notificationSettings.editApprovals}
                                    onChange={(checked) => handleNotificationToggle('editApprovals', checked)}
                                    disabled={!emailNotifications}
                                />
                                <Text>Notify me when my edits are approved/rejected</Text>
                            </Space>

                            <Space>
                                <Switch
                                    checked={notificationSettings.financialChanges}
                                    onChange={(checked) => handleNotificationToggle('financialChanges', checked)}
                                    disabled={!emailNotifications}
                                />
                                <Text>Notify me of financial field changes</Text>
                            </Space>
                        </Space>
                    </Space>
                </Card>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <LockedFieldsAlert 
                lockedFields={lockedFields}
                insuranceClaimId={insuranceClaimId}
            />
            
            <Card
                title={
                    <Space>
                        <Title level={4}>Treatment Plan Details</Title>
                        {isFieldLocked('procedures') && (
                            <Tag color="red" icon={<LockOutlined />}>
                                Locked
                            </Tag>
                        )}
                    </Space>
                }
                extra={
                    <Space>
                        {isFieldLocked('procedures') && hasPermission('request_override') && (
                            <Button
                                type="primary"
                                danger
                                icon={<ExclamationCircleOutlined />}
                                onClick={() => setShowOverrideModal(true)}
                            >
                                Request Override
                            </Button>
                        )}
                        {!isFieldLocked('procedures') && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setShowProcedureModal(true)}
                            >
                                Add Procedure
                            </Button>
                        )}
                        <Button onClick={() => navigate(-1)}>Back</Button>
                    </Space>
                }
            >
                <Tabs items={items} defaultActiveKey="details" />
            </Card>

            <ProposedEditsModal
                visible={showProposedEdits}
                onClose={() => setShowProposedEdits(false)}
                onSave={onProposeEdits}
                plan={plan}
            />

            <FinancialOverrideRequest
                planId={plan.id}
                visible={showOverrideModal}
                onClose={() => setShowOverrideModal(false)}
                onSuccess={() => {
                    // Refresh the plan data
                    fetchLockedFields();
                }}
            />
        </div>
    );
};

export default TreatmentPlanDetails; 