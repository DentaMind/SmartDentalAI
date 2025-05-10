import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PrescriptionForm from '../components/prescriptions/PrescriptionForm';
import PrescriptionList from '../components/prescriptions/PrescriptionList';
import { Prescription } from '../types/prescriptions';
import { useAuth } from '../contexts/AuthContext';
import { prescriptionService } from '../services/prescriptionService';

const PrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const { user } = useAuth();

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

  const handleCreate = async (values: any) => {
    try {
      await prescriptionService.createPrescription(values);
      message.success('Prescription created successfully');
      setIsModalVisible(false);
      fetchPrescriptions();
    } catch (error) {
      message.error('Failed to create prescription');
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingPrescription) return;
    
    try {
      await prescriptionService.updatePrescription(editingPrescription.id, values);
      message.success('Prescription updated successfully');
      setIsModalVisible(false);
      setEditingPrescription(null);
      fetchPrescriptions();
    } catch (error) {
      message.error('Failed to update prescription');
    }
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

  const handleEditClick = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingPrescription(null);
  };

  return (
    <div>
      <Card
        title="Prescriptions"
        extra={
          user?.role === 'admin' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              New Prescription
            </Button>
          )
        }
      >
        <PrescriptionList
          prescriptions={prescriptions}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        title={editingPrescription ? 'Edit Prescription' : 'New Prescription'}
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        <PrescriptionForm
          initialValues={editingPrescription}
          onSubmit={editingPrescription ? handleEdit : handleCreate}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default PrescriptionsPage; 