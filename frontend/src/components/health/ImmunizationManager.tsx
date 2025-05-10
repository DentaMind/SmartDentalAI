import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Space, message, Tag } from 'antd';
import { Immunization, ImmunizationType } from '../../types/health';
import { healthService } from '../../services/healthService';
import { formatDate } from '../../utils/dateUtils';

const { Option } = Select;

interface ImmunizationManagerProps {
    patientId: string;
}

const ImmunizationManager: React.FC<ImmunizationManagerProps> = ({ patientId }) => {
    const [loading, setLoading] = useState(true);
    const [immunizations, setImmunizations] = useState<Immunization[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchImmunizations();
    }, [patientId]);

    const fetchImmunizations = async () => {
        try {
            const data = await healthService.getImmunizations(patientId);
            setImmunizations(data);
        } catch (error) {
            message.error('Failed to load immunizations');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddImmunization = async (values: any) => {
        try {
            await healthService.addImmunization(
                patientId,
                values.type,
                values.date_administered.toDate(),
                values.next_due_date?.toDate(),
                values.lot_number,
                values.notes
            );
            message.success('Immunization added successfully');
            setIsModalVisible(false);
            form.resetFields();
            fetchImmunizations();
        } catch (error) {
            message.error('Failed to add immunization');
            console.error(error);
        }
    };

    const columns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: ImmunizationType) => (
                <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Date Administered',
            dataIndex: 'date_administered',
            key: 'date_administered',
            render: (date: string) => formatDate(date),
        },
        {
            title: 'Next Due',
            dataIndex: 'next_due_date',
            key: 'next_due_date',
            render: (date: string) => date ? formatDate(date) : 'N/A',
        },
        {
            title: 'Lot Number',
            dataIndex: 'lot_number',
            key: 'lot_number',
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
        },
        {
            title: 'Administered By',
            dataIndex: 'administered_by',
            key: 'administered_by',
        },
    ];

    return (
        <div className="immunization-manager">
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={() => setIsModalVisible(true)}>
                    Add Immunization
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={immunizations}
                loading={loading}
                rowKey="id"
            />

            <Modal
                title="Add Immunization"
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAddImmunization}
                >
                    <Form.Item
                        name="type"
                        label="Immunization Type"
                        rules={[{ required: true, message: 'Please select immunization type' }]}
                    >
                        <Select>
                            {Object.values(ImmunizationType).map(type => (
                                <Option key={type} value={type}>
                                    {type.replace('_', ' ').toUpperCase()}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="date_administered"
                        label="Date Administered"
                        rules={[{ required: true, message: 'Please select date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="next_due_date"
                        label="Next Due Date"
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="lot_number"
                        label="Lot Number"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Notes"
                    >
                        <Input.TextArea />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Add
                            </Button>
                            <Button onClick={() => {
                                setIsModalVisible(false);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ImmunizationManager; 