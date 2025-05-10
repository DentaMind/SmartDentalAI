import React, { useState } from 'react';
import { Modal, Form, Input, Button, Space, Typography, Divider, Tag } from 'antd';
import { EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { TreatmentPlan } from '../../services/treatmentService';

const { Text } = Typography;

interface ProposedEditsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (edits: any) => void;
    plan: TreatmentPlan;
}

const ProposedEditsModal: React.FC<ProposedEditsModalProps> = ({
    visible,
    onClose,
    onSave,
    plan,
}) => {
    const [form] = Form.useForm();
    const [showDiff, setShowDiff] = useState(false);

    const handleSave = () => {
        form.validateFields().then(values => {
            onSave({
                ...values,
                proposed_by: 'assistant', // This would come from auth context
                proposed_at: new Date().toISOString(),
                status: 'pending_review'
            });
            onClose();
        });
    };

    const renderDiffView = () => {
        return (
            <div style={{ marginTop: 16 }}>
                <Text strong>Changes Summary:</Text>
                <div style={{ marginTop: 8 }}>
                    <Tag color="blue">New Procedures: 2</Tag>
                    <Tag color="orange">Modified Procedures: 1</Tag>
                    <Tag color="red">Removed Procedures: 1</Tag>
                </div>
                <Divider />
                <Text strong>Detailed Changes:</Text>
                <div style={{ marginTop: 8 }}>
                    <Text type="success">+ D2391 - Resin-based composite - one surface, posterior</Text>
                    <br />
                    <Text type="success">+ D2740 - Crown - porcelain/ceramic substrate</Text>
                    <br />
                    <Text type="warning">~ D2391 - Cost updated from $150 to $175</Text>
                    <br />
                    <Text type="danger">- D2391 - Resin-based composite - one surface, anterior</Text>
                </div>
            </div>
        );
    };

    return (
        <Modal
            title="Propose Treatment Plan Changes"
            visible={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button 
                    key="preview" 
                    type="primary" 
                    onClick={() => setShowDiff(true)}
                >
                    Preview Changes
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    onClick={handleSave}
                    icon={<CheckCircleOutlined />}
                >
                    Submit for Review
                </Button>
            ]}
        >
            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item
                    name="reason"
                    label="Reason for Changes"
                    rules={[{ required: true, message: 'Please explain the reason for these changes' }]}
                >
                    <Input.TextArea rows={4} />
                </Form.Item>

                {showDiff && renderDiffView()}

                <Divider />

                <Text type="secondary">
                    Note: These changes will be submitted for doctor review. The original treatment plan will remain unchanged until approved.
                </Text>
            </Form>
        </Modal>
    );
};

export default ProposedEditsModal; 