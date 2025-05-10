import React, { useState } from 'react';
import { Form, Input, Button, Space, Select, InputNumber, Card, Typography, Divider, Switch } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { TreatmentPlan, TreatmentPriority, TreatmentStatus } from '../../services/treatmentService';

const { Title } = Typography;

interface TreatmentPlanFormProps {
    form: any;
    initialValues?: TreatmentPlan | null;
    onSubmit: (values: any) => void;
}

const TreatmentPlanForm: React.FC<TreatmentPlanFormProps> = ({ form, initialValues, onSubmit }) => {
    const [procedures, setProcedures] = useState<any[]>(initialValues?.procedures || []);

    const handleSubmit = (values: any) => {
        onSubmit({
            ...values,
            procedures: procedures,
        });
    };

    const addProcedure = () => {
        setProcedures([...procedures, {
            code: '',
            description: '',
            tooth_numbers: [],
            surfaces: [],
            priority: TreatmentPriority.MEDIUM,
            estimated_duration: 30,
            estimated_cost: 0,
            insurance_coverage: 0,
            notes: '',
        }]);
    };

    const removeProcedure = (index: number) => {
        const newProcedures = [...procedures];
        newProcedures.splice(index, 1);
        setProcedures(newProcedures);
    };

    const updateProcedure = (index: number, field: string, value: any) => {
        const newProcedures = [...procedures];
        newProcedures[index] = {
            ...newProcedures[index],
            [field]: value,
        };
        setProcedures(newProcedures);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
        >
            <Form.Item
                name="patient_id"
                label="Patient ID"
                rules={[{ required: true, message: 'Please input patient ID!' }]}
            >
                <Input />
            </Form.Item>

            <Form.Item
                name="notes"
                label="Notes"
            >
                <Input.TextArea rows={4} />
            </Form.Item>

            <Divider>Procedures</Divider>

            {procedures.map((procedure, index) => (
                <Card
                    key={index}
                    style={{ marginBottom: 16 }}
                    title={`Procedure ${index + 1}`}
                    extra={
                        <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => removeProcedure(index)}
                        />
                    }
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                            label="Code"
                            required
                        >
                            <Input
                                value={procedure.code}
                                onChange={(e) => updateProcedure(index, 'code', e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Description"
                            required
                        >
                            <Input
                                value={procedure.description}
                                onChange={(e) => updateProcedure(index, 'description', e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Tooth Numbers"
                            required
                        >
                            <Select
                                mode="multiple"
                                value={procedure.tooth_numbers}
                                onChange={(value) => updateProcedure(index, 'tooth_numbers', value)}
                                style={{ width: '100%' }}
                            >
                                {Array.from({ length: 32 }, (_, i) => i + 1).map((num) => (
                                    <Select.Option key={num} value={num.toString()}>
                                        {num}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Surfaces"
                            required
                        >
                            <Select
                                mode="multiple"
                                value={procedure.surfaces}
                                onChange={(value) => updateProcedure(index, 'surfaces', value)}
                                style={{ width: '100%' }}
                            >
                                {['Occlusal', 'Buccal', 'Lingual', 'Mesial', 'Distal'].map((surface) => (
                                    <Select.Option key={surface} value={surface}>
                                        {surface}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Priority"
                            required
                        >
                            <Select
                                value={procedure.priority}
                                onChange={(value) => updateProcedure(index, 'priority', value)}
                                style={{ width: '100%' }}
                            >
                                {Object.values(TreatmentPriority).map((priority) => (
                                    <Select.Option key={priority} value={priority}>
                                        {priority}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Estimated Duration (minutes)"
                            required
                        >
                            <InputNumber
                                value={procedure.estimated_duration}
                                onChange={(value) => updateProcedure(index, 'estimated_duration', value)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Estimated Cost"
                            required
                        >
                            <InputNumber
                                value={procedure.estimated_cost}
                                onChange={(value) => updateProcedure(index, 'estimated_cost', value)}
                                style={{ width: '100%' }}
                                prefix="$"
                                step={0.01}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Insurance Coverage"
                        >
                            <InputNumber
                                value={procedure.insurance_coverage}
                                onChange={(value) => updateProcedure(index, 'insurance_coverage', value)}
                                style={{ width: '100%' }}
                                prefix="$"
                                step={0.01}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Requires Pre-Authorization"
                        >
                            <Switch
                                checked={procedure.requires_pre_auth}
                                onChange={(checked) => updateProcedure(index, 'requires_pre_auth', checked)}
                            />
                        </Form.Item>

                        {procedure.requires_pre_auth && (
                            <>
                                <Form.Item
                                    label="Pre-Authorization Status"
                                    required
                                >
                                    <Select
                                        value={procedure.pre_auth_status}
                                        onChange={(value) => updateProcedure(index, 'pre_auth_status', value)}
                                        style={{ width: '100%' }}
                                    >
                                        <Select.Option value="NOT_REQUIRED">Not Required</Select.Option>
                                        <Select.Option value="PENDING">Pending</Select.Option>
                                        <Select.Option value="APPROVED">Approved</Select.Option>
                                        <Select.Option value="DENIED">Denied</Select.Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    label="Pre-Authorization Reference"
                                >
                                    <Input
                                        value={procedure.pre_auth_reference}
                                        onChange={(e) => updateProcedure(index, 'pre_auth_reference', e.target.value)}
                                        placeholder="Enter pre-authorization reference number"
                                    />
                                </Form.Item>
                            </>
                        )}

                    </Space>
                </Card>
            ))}

            <Button
                type="dashed"
                onClick={addProcedure}
                block
                icon={<PlusOutlined />}
                style={{ marginBottom: 16 }}
            >
                Add Procedure
            </Button>

            <Form.Item>
                <Button type="primary" htmlType="submit">
                    {initialValues ? 'Update Treatment Plan' : 'Create Treatment Plan'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default TreatmentPlanForm; 