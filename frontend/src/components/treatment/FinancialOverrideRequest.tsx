import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Space, message } from 'antd';
import { treatmentService } from '../../services/treatmentService';

const { TextArea } = Input;
const { Text } = Typography;

interface FinancialOverrideRequestProps {
    planId: string;
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const FinancialOverrideRequest: React.FC<FinancialOverrideRequestProps> = ({
    planId,
    visible,
    onClose,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            await treatmentService.requestFinancialOverride(planId, {
                reason: values.reason,
                justification: values.justification,
                fields_to_unlock: values.fields,
            });
            message.success('Override request submitted successfully');
            onSuccess();
            onClose();
        } catch (error) {
            message.error('Failed to submit override request');
            console.error('Error submitting override request:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Request Financial Override"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Text type="secondary">
                        This request will be reviewed by an administrator. Please provide detailed justification for unlocking financial fields.
                    </Text>

                    <Form.Item
                        name="reason"
                        label="Reason for Override"
                        rules={[{ required: true, message: 'Please provide a reason' }]}
                    >
                        <Input placeholder="Brief reason for the override request" />
                    </Form.Item>

                    <Form.Item
                        name="justification"
                        label="Detailed Justification"
                        rules={[{ required: true, message: 'Please provide detailed justification' }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Explain why this override is necessary and what changes will be made"
                        />
                    </Form.Item>

                    <Form.Item
                        name="fields"
                        label="Fields to Unlock"
                        rules={[{ required: true, message: 'Please select fields to unlock' }]}
                    >
                        <Input
                            placeholder="Comma-separated list of fields (e.g., procedures, total_cost)"
                        />
                    </Form.Item>

                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Submit Request
                        </Button>
                    </Space>
                </Space>
            </Form>
        </Modal>
    );
};

export default FinancialOverrideRequest; 