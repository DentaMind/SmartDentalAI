import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Space, message, Tag } from 'antd';
import { BloodWorkResult, BloodWorkType } from '../../types/health';
import { healthService } from '../../services/healthService';
import { formatDate } from '../../utils/dateUtils';

const { Option } = Select;

interface BloodWorkManagerProps {
    patientId: string;
}

const BloodWorkManager: React.FC<BloodWorkManagerProps> = ({ patientId }) => {
    const [loading, setLoading] = useState(true);
    const [bloodWork, setBloodWork] = useState<BloodWorkResult[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchBloodWork();
    }, [patientId]);

    const fetchBloodWork = async () => {
        try {
            const data = await healthService.getBloodWork(patientId);
            setBloodWork(data);
        } catch (error) {
            message.error('Failed to load blood work results');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBloodWork = async (values: any) => {
        try {
            await healthService.addBloodWork(
                patientId,
                values.type,
                values.date_taken.toDate(),
                values.value,
                values.unit,
                values.reference_range,
                values.notes
            );
            message.success('Blood work result added successfully');
            setIsModalVisible(false);
            form.resetFields();
            fetchBloodWork();
        } catch (error) {
            message.error('Failed to add blood work result');
            console.error(error);
        }
    };

    const columns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: BloodWorkType) => (
                <Tag color="purple">{type.replace('_', ' ').toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Date Taken',
            dataIndex: 'date_taken',
            key: 'date_taken',
            render: (date: string) => formatDate(date),
        },
        {
            title: 'Value',
            key: 'value',
            render: (_, record: BloodWorkResult) => (
                <Space>
                    <Text>{record.value} {record.unit}</Text>
                    <Tag color={
                        record.value > parseFloat(record.reference_range.split('-')[1]) ? 'red' :
                        record.value < parseFloat(record.reference_range.split('-')[0]) ? 'yellow' : 'green'
                    }>
                        {record.reference_range}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
        },
        {
            title: 'Uploaded By',
            dataIndex: 'uploaded_by',
            key: 'uploaded_by',
        },
    ];

    return (
        <div className="blood-work-manager">
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={() => setIsModalVisible(true)}>
                    Add Blood Work Result
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={bloodWork}
                loading={loading}
                rowKey="id"
            />

            <Modal
                title="Add Blood Work Result"
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
                    onFinish={handleAddBloodWork}
                >
                    <Form.Item
                        name="type"
                        label="Blood Work Type"
                        rules={[{ required: true, message: 'Please select blood work type' }]}
                    >
                        <Select>
                            {Object.values(BloodWorkType).map(type => (
                                <Option key={type} value={type}>
                                    {type.replace('_', ' ').toUpperCase()}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="date_taken"
                        label="Date Taken"
                        rules={[{ required: true, message: 'Please select date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="value"
                        label="Value"
                        rules={[{ required: true, message: 'Please enter value' }]}
                    >
                        <Input type="number" step="0.01" />
                    </Form.Item>

                    <Form.Item
                        name="unit"
                        label="Unit"
                        rules={[{ required: true, message: 'Please enter unit' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="reference_range"
                        label="Reference Range"
                        rules={[{ required: true, message: 'Please enter reference range' }]}
                    >
                        <Input placeholder="e.g., 0-100" />
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

export default BloodWorkManager; 