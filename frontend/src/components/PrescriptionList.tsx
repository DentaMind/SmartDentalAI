import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, message } from 'antd';
import { prescriptionService } from '../services/prescriptionService';
import { Prescription, PrescriptionFormData } from '../types/prescriptions';
import dayjs from 'dayjs';

const { Option } = Select;

const PrescriptionList: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getPrescriptions();
      setPrescriptions(data);
    } catch (error) {
      message.error('Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: PrescriptionFormData) => {
    try {
      if (editingId) {
        await prescriptionService.updatePrescription(editingId, values);
        message.success('Prescription updated successfully');
      } else {
        await prescriptionService.createPrescription(values);
        message.success('Prescription created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchPrescriptions();
    } catch (error) {
      message.error('Failed to save prescription');
    }
  };

  const handleEdit = (record: Prescription) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      startDate: dayjs(record.startDate),
      endDate: record.endDate ? dayjs(record.endDate) : undefined,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await prescriptionService.deletePrescription(id);
      message.success('Prescription deleted successfully');
      fetchPrescriptions();
    } catch (error) {
      message.error('Failed to delete prescription');
    }
  };

  const columns = [
    {
      title: 'Medication',
      dataIndex: 'medication',
      key: 'medication',
    },
    {
      title: 'Dosage',
      dataIndex: 'dosage',
      key: 'dosage',
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Prescription) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" onClick={() => setModalVisible(true)} style={{ marginBottom: 16 }}>
        Add Prescription
      </Button>

      <Table
        columns={columns}
        dataSource={prescriptions}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingId ? 'Edit Prescription' : 'Add Prescription'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="patientId"
            label="Patient ID"
            rules={[{ required: true, message: 'Please input patient ID!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="medication"
            label="Medication"
            rules={[{ required: true, message: 'Please input medication!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="dosage"
            label="Dosage"
            rules={[{ required: true, message: 'Please input dosage!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="frequency"
            label="Frequency"
            rules={[{ required: true, message: 'Please input frequency!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: 'Please select start date!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="End Date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="instructions"
            label="Instructions"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PrescriptionList; 