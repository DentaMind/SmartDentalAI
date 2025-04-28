import React from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useClaims } from '../../hooks/useClaims';
import { useNavigate } from 'react-router-dom';

interface GenerateClaimModalProps {
    visible: boolean;
    onCancel: () => void;
    treatmentPlan: {
        id: string;
        patient_id: string;
        patient_name: string;
    };
}

const GenerateClaimModal: React.FC<GenerateClaimModalProps> = ({
    visible,
    onCancel,
    treatmentPlan
}) => {
    const [form] = Form.useForm();
    const { generateClaim } = useClaims();
    const navigate = useNavigate();

    const handleSubmit = async (values: any) => {
        try {
            const claim = await generateClaim({
                treatment_plan_id: treatmentPlan.id,
                insurance_provider_id: values.insurance_provider_id,
                notes: values.notes
            });
            
            message.success('Insurance claim generated successfully');
            onCancel();
            form.resetFields();
            
            // Navigate to the new claim's details page
            navigate(`/claims/${claim.id}`);
        } catch (error) {
            message.error('Failed to generate insurance claim');
        }
    };

    return (
        <Modal
            title="Generate Insurance Claim"
            open={visible}
            onCancel={onCancel}
            onOk={() => form.submit()}
            okText="Generate Claim"
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="insurance_provider_id"
                    label="Insurance Provider"
                    rules={[{ required: true, message: 'Please select an insurance provider' }]}
                >
                    <Select
                        placeholder="Select insurance provider"
                        options={[
                            { value: 'provider-1', label: 'Delta Dental' },
                            { value: 'provider-2', label: 'MetLife' },
                            { value: 'provider-3', label: 'Cigna' }
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    name="notes"
                    label="Additional Notes"
                >
                    <Input.TextArea rows={4} placeholder="Enter any additional notes for the claim" />
                </Form.Item>

                <div style={{ marginTop: 16 }}>
                    <p><strong>Treatment Plan Details:</strong></p>
                    <p>Patient: {treatmentPlan.patient_name}</p>
                    <p>Plan ID: {treatmentPlan.id}</p>
                </div>
            </Form>
        </Modal>
    );
};

export default GenerateClaimModal; 