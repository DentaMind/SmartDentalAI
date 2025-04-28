import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Descriptions, Space, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import PatientChart from '../components/patient/PatientChart';

const { Title } = Typography;

const PatientDetailsPage: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patientId) {
            fetchPatientDetails();
        }
    }, [patientId]);

    const fetchPatientDetails = async () => {
        try {
            // TODO: Replace with actual patient service
            // const data = await patientService.getPatient(patientId);
            // setPatient(data);
            setLoading(false);
        } catch (error) {
            // Handle error
            setLoading(false);
        }
    };

    if (!patientId) {
        return <div>Patient ID not provided</div>;
    }

    return (
        <div>
            <Card loading={loading}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={2}>Patient Details</Title>
                    <Button type="primary" icon={<EditOutlined />}>
                        Edit Patient
                    </Button>
                </div>

                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Patient ID">{patientId}</Descriptions.Item>
                    <Descriptions.Item label="Name">John Doe</Descriptions.Item>
                    <Descriptions.Item label="Date of Birth">1990-01-01</Descriptions.Item>
                    <Descriptions.Item label="Gender">Male</Descriptions.Item>
                    <Descriptions.Item label="Phone">(555) 123-4567</Descriptions.Item>
                    <Descriptions.Item label="Email">john.doe@example.com</Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                        123 Main St, City, State 12345
                    </Descriptions.Item>
                    <Descriptions.Item label="Insurance Provider">ABC Insurance</Descriptions.Item>
                    <Descriptions.Item label="Policy Number">POL123456789</Descriptions.Item>
                </Descriptions>
            </Card>

            <div style={{ marginTop: 24 }}>
                <PatientChart patientId={patientId} />
            </div>
        </div>
    );
};

export default PatientDetailsPage; 