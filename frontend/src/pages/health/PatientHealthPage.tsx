import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Card, Button, Space, Typography, Alert, Spin, FloatButton, message } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import HealthSummary from '../../components/health/HealthSummary';
import ImmunizationManager from '../../components/health/ImmunizationManager';
import BloodWorkManager from '../../components/health/BloodWorkManager';
import { healthService } from '../../services/healthService';
import { PatientHealthSummary } from '../../types/health';
import { formatDate } from '../../utils/dateUtils';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PatientHealthPage: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<PatientHealthSummary | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [healthAlerts, setHealthAlerts] = useState<string[]>([]);

    useEffect(() => {
        if (!patientId) {
            navigate('/patients');
            return;
        }

        fetchHealthData();
    }, [patientId, navigate]);

    const fetchHealthData = async () => {
        try {
            setLoading(true);
            const [summaryData, alerts] = await Promise.all([
                healthService.getHealthSummary(patientId!),
                healthService.getHealthAlerts(patientId!)
            ]);
            setSummary(summaryData);
            setHealthAlerts(alerts);
        } catch (err) {
            setError('Failed to load health data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (key: string) => {
        setActiveTab(key);
    };

    const handleAddRecord = () => {
        if (activeTab === 'immunizations') {
            // Trigger immunization modal
            const immunizationManager = document.querySelector('.immunization-manager');
            const addButton = immunizationManager?.querySelector('button');
            addButton?.click();
        } else if (activeTab === 'blood-work') {
            // Trigger blood work modal
            const bloodWorkManager = document.querySelector('.blood-work-manager');
            const addButton = bloodWorkManager?.querySelector('button');
            addButton?.click();
        }
    };

    if (loading) {
        return <Spin size="large" />;
    }

    if (error) {
        return <Alert type="error" message={error} />;
    }

    return (
        <div className="patient-health-page">
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Patient Health Records</Title>
                <Text type="secondary">
                    Last updated: {summary ? formatDate(summary.last_updated) : 'N/A'}
                </Text>
            </div>

            {healthAlerts.length > 0 && (
                <Alert
                    type="warning"
                    message="Health Alerts"
                    description={
                        <ul>
                            {healthAlerts.map((alert, index) => (
                                <li key={index}>{alert}</li>
                            ))}
                        </ul>
                    }
                    icon={<ExclamationCircleOutlined />}
                    style={{ marginBottom: 24 }}
                />
            )}

            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                type="card"
                size="large"
            >
                <TabPane tab="Overview" key="overview">
                    <HealthSummary patientId={patientId!} />
                </TabPane>
                <TabPane tab="Immunizations" key="immunizations">
                    <ImmunizationManager patientId={patientId!} />
                </TabPane>
                <TabPane tab="Blood Work" key="blood-work">
                    <BloodWorkManager patientId={patientId!} />
                </TabPane>
                <TabPane tab="Health Alerts" key="alerts">
                    <Card>
                        <Title level={4}>Health Alerts & Recommendations</Title>
                        {healthAlerts.length > 0 ? (
                            <ul>
                                {healthAlerts.map((alert, index) => (
                                    <li key={index} style={{ marginBottom: 8 }}>
                                        <Alert
                                            type="warning"
                                            message={alert}
                                            showIcon
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Alert
                                type="info"
                                message="No active health alerts"
                                description="All health indicators are within normal ranges."
                            />
                        )}
                    </Card>
                </TabPane>
            </Tabs>

            <FloatButton
                icon={<PlusOutlined />}
                type="primary"
                onClick={handleAddRecord}
                tooltip="Add Health Record"
            />
        </div>
    );
};

export default PatientHealthPage; 