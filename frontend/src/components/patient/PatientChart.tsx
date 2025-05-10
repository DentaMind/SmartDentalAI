import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Typography, Modal } from 'antd';
import { PlusOutlined, HeartOutlined } from '@ant-design/icons';
import treatmentService, { TreatmentPlan, TreatmentStatus } from '../../services/treatmentService';
import TreatmentPlanForm from '../treatment/TreatmentPlanForm';
import { Link } from 'react-router-dom';

const { Title } = Typography;
const { TabPane } = Tabs;

interface PatientChartProps {
    patientId: string;
}

const PatientChart: React.FC<PatientChartProps> = ({ patientId }) => {
    const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchTreatmentPlans();
    }, [patientId]);

    const fetchTreatmentPlans = async () => {
        try {
            setLoading(true);
            const plans = await treatmentService.getPatientTreatmentPlans(patientId);
            setTreatmentPlans(plans);
        } catch (error) {
            message.error('Failed to fetch treatment plans');
        } finally {
            setLoading(false);
        }
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

    const treatmentPlanColumns = [
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
            title: 'Procedures',
            dataIndex: 'procedures',
            key: 'procedures',
            render: (procedures: any[]) => procedures.length,
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: TreatmentPlan) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => {
                            // TODO: Implement view details
                        }}
                    >
                        View Details
                    </Button>
                </Space>
            ),
        },
    ];

    const handleCreateTreatmentPlan = async (values: any) => {
        try {
            await treatmentService.createTreatmentPlan(values, 'current-user-id');
            message.success('Treatment plan created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchTreatmentPlans();
        } catch (error) {
            message.error('Failed to create treatment plan');
        }
    };

    return (
        <div className="patient-chart">
            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Link to={`/patients/${patientId}/health`}>
                        <Button icon={<HeartOutlined />} type="primary">
                            View Health Records
                        </Button>
                    </Link>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                    >
                        Create Treatment Plan
                    </Button>
                </Space>
            </div>
            <Tabs defaultActiveKey="1">
                <TabPane tab="Overview" key="1">
                    {/* Patient overview content */}
                </TabPane>
                <TabPane tab="Treatment Plans" key="2">
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={4}>Treatment Plans</Title>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setModalVisible(true)}
                            >
                                Create Treatment Plan
                            </Button>
                        </div>

                        <Table
                            columns={treatmentPlanColumns}
                            dataSource={treatmentPlans}
                            loading={loading}
                            rowKey="id"
                        />
                    </Card>
                </TabPane>
                <TabPane tab="Medical History" key="3">
                    {/* Medical history content */}
                </TabPane>
                <TabPane tab="Documents" key="4">
                    {/* Documents content */}
                </TabPane>
            </Tabs>

            <Modal
                title="Create Treatment Plan"
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={800}
            >
                <TreatmentPlanForm
                    form={form}
                    initialValues={{ patient_id: patientId }}
                    onSubmit={handleCreateTreatmentPlan}
                />
            </Modal>
        </div>
    );
};

export default PatientChart; 