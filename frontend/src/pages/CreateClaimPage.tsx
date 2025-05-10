import React, { useState } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Select,
    DatePicker,
    Space,
    Table,
    Typography,
    message,
    InputNumber,
    Divider
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import {
    insuranceClaimsService,
    ClaimType,
    ClaimProcedureCreate,
    InsuranceClaimCreate
} from '../services/insuranceClaimsService';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/formatters';

const { Title } = Typography;
const { Option } = Select;

const CreateClaimPage: React.FC = () => {
    const [form] = Form.useForm();
    const [procedures, setProcedures] = useState<ClaimProcedureCreate[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { patientId, treatmentPlanId } = useParams<{
        patientId: string;
        treatmentPlanId: string;
    }>();

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
            key: 'tooth_number'
        },
        {
            title: 'Surface',
            dataIndex: 'surface',
            key: 'surface'
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
            key: 'date_of_service'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: ClaimProcedureCreate, index: number) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                        const newProcedures = [...procedures];
                        newProcedures.splice(index, 1);
                        setProcedures(newProcedures);
                    }}
                />
            )
        }
    ];

    const handleAddProcedure = (values: any) => {
        const newProcedure: ClaimProcedureCreate = {
            procedure_code: values.procedure_code,
            description: values.description,
            tooth_number: values.tooth_number,
            surface: values.surface,
            fee: values.fee,
            date_of_service: values.date_of_service.format('YYYY-MM-DD'),
            provider_id: values.provider_id,
            notes: values.notes
        };

        setProcedures([...procedures, newProcedure]);
        form.resetFields(['procedure_code', 'description', 'tooth_number', 'surface', 'fee', 'date_of_service', 'provider_id', 'notes']);
    };

    const handleSubmit = async (values: any) => {
        if (procedures.length === 0) {
            message.error('Please add at least one procedure');
            return;
        }

        setLoading(true);
        try {
            const claimData: InsuranceClaimCreate = {
                patient_id: patientId || values.patient_id,
                treatment_plan_id: treatmentPlanId || values.treatment_plan_id,
                insurance_provider_id: values.insurance_provider_id,
                procedures: procedures,
                claim_type: values.claim_type,
                notes: values.notes
            };

            await insuranceClaimsService.createClaim(claimData);
            message.success('Claim created successfully');
            navigate('/claims');
        } catch (error) {
            message.error('Failed to create claim');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = procedures.reduce((sum, proc) => sum + proc.fee, 0);

    return (
        <div className="create-claim-page">
            <Card title={<Title level={4}>Create New Insurance Claim</Title>}>
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout="vertical"
                    initialValues={{
                        claim_type: ClaimType.INITIAL
                    }}
                >
                    <Row gutter={16}>
                        {!patientId && (
                            <Col span={12}>
                                <Form.Item
                                    name="patient_id"
                                    label="Patient ID"
                                    rules={[{ required: true }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        )}
                        {!treatmentPlanId && (
                            <Col span={12}>
                                <Form.Item
                                    name="treatment_plan_id"
                                    label="Treatment Plan ID"
                                    rules={[{ required: true }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        )}
                        <Col span={12}>
                            <Form.Item
                                name="insurance_provider_id"
                                label="Insurance Provider"
                                rules={[{ required: true }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="claim_type"
                                label="Claim Type"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    {Object.values(ClaimType).map(type => (
                                        <Option key={type} value={type}>
                                            {type}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Add Procedures</Divider>

                    <Form.Item>
                        <Space>
                            <Form.Item
                                name="procedure_code"
                                rules={[{ required: true }]}
                                noStyle
                            >
                                <Input placeholder="Procedure Code" />
                            </Form.Item>
                            <Form.Item
                                name="description"
                                rules={[{ required: true }]}
                                noStyle
                            >
                                <Input placeholder="Description" />
                            </Form.Item>
                            <Form.Item name="tooth_number" noStyle>
                                <Input placeholder="Tooth Number" />
                            </Form.Item>
                            <Form.Item name="surface" noStyle>
                                <Input placeholder="Surface" />
                            </Form.Item>
                            <Form.Item
                                name="fee"
                                rules={[{ required: true }]}
                                noStyle
                            >
                                <InputNumber
                                    placeholder="Fee"
                                    min={0}
                                    step={0.01}
                                    precision={2}
                                />
                            </Form.Item>
                            <Form.Item
                                name="date_of_service"
                                rules={[{ required: true }]}
                                noStyle
                            >
                                <DatePicker placeholder="Date of Service" />
                            </Form.Item>
                            <Form.Item
                                name="provider_id"
                                rules={[{ required: true }]}
                                noStyle
                            >
                                <Input placeholder="Provider ID" />
                            </Form.Item>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    form.validateFields([
                                        'procedure_code',
                                        'description',
                                        'fee',
                                        'date_of_service',
                                        'provider_id'
                                    ]).then(values => {
                                        handleAddProcedure(values);
                                    });
                                }}
                            >
                                Add
                            </Button>
                        </Space>
                    </Form.Item>

                    <Table
                        columns={procedureColumns}
                        dataSource={procedures}
                        rowKey={(record, index) => index.toString()}
                        pagination={false}
                        footer={() => (
                            <div style={{ textAlign: 'right' }}>
                                <strong>Total Amount: {formatCurrency(totalAmount)}</strong>
                            </div>
                        )}
                    />

                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={4} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Create Claim
                            </Button>
                            <Button onClick={() => navigate('/claims')}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default CreateClaimPage; 