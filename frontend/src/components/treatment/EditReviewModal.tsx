import React, { useState } from 'react';
import { Modal, Form, Input, Button, Space, Typography, Divider, Tag, Timeline, Card } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { ProposedEdit } from '../../services/treatmentService';

const { Text, Title } = Typography;

interface EditReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onApprove: (editId: string, notes: string) => void;
    onReject: (editId: string, notes: string) => void;
    edit: ProposedEdit;
}

const EditReviewModal: React.FC<EditReviewModalProps> = ({
    visible,
    onClose,
    onApprove,
    onReject,
    edit,
}) => {
    const [form] = Form.useForm();
    const [reviewNotes, setReviewNotes] = useState('');

    const handleApprove = () => {
        form.validateFields().then(() => {
            onApprove(edit.id, reviewNotes);
            onClose();
        });
    };

    const handleReject = () => {
        form.validateFields().then(() => {
            onReject(edit.id, reviewNotes);
            onClose();
        });
    };

    const renderChanges = () => {
        return (
            <Card title="Proposed Changes" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <Text strong>Reason for Changes:</Text>
                        <Text> {edit.reason}</Text>
                    </div>
                    <Divider />
                    <Text strong>Changes Summary:</Text>
                    <div style={{ marginTop: 8 }}>
                        {edit.changes.added && edit.changes.added.length > 0 && (
                            <Tag color="blue">New Procedures: {edit.changes.added.length}</Tag>
                        )}
                        {edit.changes.modified && edit.changes.modified.length > 0 && (
                            <Tag color="orange">Modified Procedures: {edit.changes.modified.length}</Tag>
                        )}
                        {edit.changes.removed && edit.changes.removed.length > 0 && (
                            <Tag color="red">Removed Procedures: {edit.changes.removed.length}</Tag>
                        )}
                    </div>
                    <Divider />
                    <Text strong>Detailed Changes:</Text>
                    <div style={{ marginTop: 8 }}>
                        {edit.changes.added?.map((proc: any) => (
                            <Text type="success" key={proc.code}>
                                + {proc.code} - {proc.description}
                                <br />
                            </Text>
                        ))}
                        {edit.changes.modified?.map((proc: any) => (
                            <Text type="warning" key={proc.code}>
                                ~ {proc.code} - {proc.description}
                                <br />
                            </Text>
                        ))}
                        {edit.changes.removed?.map((proc: any) => (
                            <Text type="danger" key={proc.code}>
                                - {proc.code} - {proc.description}
                                <br />
                            </Text>
                        ))}
                    </div>
                </Space>
            </Card>
        );
    };

    const renderTimeline = () => {
        return (
            <Timeline>
                <Timeline.Item
                    dot={<UserOutlined style={{ fontSize: '16px' }} />}
                    color="blue"
                >
                    <Text strong>Proposed by:</Text> {edit.proposed_by}
                    <br />
                    <Text type="secondary">
                        {new Date(edit.proposed_at).toLocaleString()}
                    </Text>
                </Timeline.Item>
                {edit.reviewed_at && (
                    <Timeline.Item
                        dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
                        color={edit.status === 'approved' ? 'green' : 'red'}
                    >
                        <Text strong>Reviewed by:</Text> {edit.reviewed_by}
                        <br />
                        <Text type="secondary">
                            {new Date(edit.reviewed_at).toLocaleString()}
                        </Text>
                        {edit.review_notes && (
                            <>
                                <br />
                                <Text>Notes: {edit.review_notes}</Text>
                            </>
                        )}
                    </Timeline.Item>
                )}
            </Timeline>
        );
    };

    return (
        <Modal
            title="Review Proposed Changes"
            visible={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button
                    key="reject"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={handleReject}
                >
                    Reject Changes
                </Button>,
                <Button
                    key="approve"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleApprove}
                >
                    Approve Changes
                </Button>
            ]}
        >
            {renderChanges()}
            {renderTimeline()}
            <Divider />
            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item
                    name="review_notes"
                    label="Review Notes"
                    rules={[{ required: true, message: 'Please provide review notes' }]}
                >
                    <Input.TextArea
                        rows={4}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditReviewModal; 