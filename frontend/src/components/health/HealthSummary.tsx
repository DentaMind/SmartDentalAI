import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Alert, Spin, Space } from 'antd';
import { PatientHealthSummary, ImmunizationType, BloodWorkType } from '../../types/health';
import { healthService } from '../../services/healthService';
import { formatDate } from '../../utils/dateUtils';

const { Title, Text } = Typography;

interface HealthSummaryProps {
    patientId: string;
}

const HealthSummary: React.FC<HealthSummaryProps> = ({ patientId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<PatientHealthSummary | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await healthService.getHealthSummary(patientId);
                setSummary(data);
            } catch (err) {
                setError('Failed to load health summary');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [patientId]);

    if (loading) {
        return <Spin size="large" />;
    }

    if (error) {
        return <Alert type="error" message={error} />;
    }

    if (!summary) {
        return <Alert type="info" message="No health records found" />;
    }

    const immunizationColumns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: ImmunizationType) => (
                <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Last Administered',
            dataIndex: 'last_administered',
            key: 'last_administered',
            render: (date: string) => formatDate(date),
        },
        {
            title: 'Next Due',
            dataIndex: 'next_due',
            key: 'next_due',
            render: (date: string) => date ? formatDate(date) : 'N/A',
        },
        {
            title: 'Status',
            key: 'is_current',
            render: (_, record: any) => (
                <Tag color={record.is_current ? 'green' : 'red'}>
                    {record.is_current ? 'Current' : 'Due'}
                </Tag>
            ),
        },
    ];

    const bloodWorkColumns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: BloodWorkType) => (
                <Tag color="purple">{type.replace('_', ' ').toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Latest Value',
            dataIndex: 'latest_value',
            key: 'latest_value',
            render: (value: number, record: any) => (
                <Space>
                    <Text>{value} {record.unit}</Text>
                    <Tag color={
                        record.trend === 'increasing' ? 'red' :
                        record.trend === 'decreasing' ? 'green' : 'blue'
                    }>
                        {record.trend}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Reference Range',
            dataIndex: 'reference_range',
            key: 'reference_range',
        },
        {
            title: 'Last Updated',
            dataIndex: 'latest_date',
            key: 'latest_date',
            render: (date: string) => formatDate(date),
        },
    ];

    const immunizationData = Object.entries(summary.immunization_status).map(([type, status]) => ({
        key: type,
        type,
        ...status,
    }));

    const bloodWorkData = Object.entries(summary.blood_work_trends).map(([type, trend]) => ({
        key: type,
        type,
        ...trend,
    }));

    return (
        <div className="health-summary">
            <Card>
                <Title level={4}>Health Summary</Title>
                <Text type="secondary">
                    Last updated: {formatDate(summary.last_updated)}
                </Text>

                <div style={{ marginTop: 24 }}>
                    <Title level={5}>Immunization Status</Title>
                    <Table
                        columns={immunizationColumns}
                        dataSource={immunizationData}
                        pagination={false}
                        size="small"
                    />
                </div>

                <div style={{ marginTop: 24 }}>
                    <Title level={5}>Blood Work Trends</Title>
                    <Table
                        columns={bloodWorkColumns}
                        dataSource={bloodWorkData}
                        pagination={false}
                        size="small"
                    />
                </div>
            </Card>
        </div>
    );
};

export default HealthSummary; 