import React from 'react';
import { Timeline, Tag, Typography, Space } from 'antd';
import { UserOutlined, EditOutlined, CheckCircleOutlined, LockOutlined, CommentOutlined, FileTextOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

const { Text } = Typography;

interface AuditEntry {
    timestamp: string;
    user_id: string;
    user_role: string;
    action: string;
    details: any;
}

interface ActivityLogProps {
    auditTrail: AuditEntry[];
}

const getActionIcon = (action: string) => {
    switch (action) {
        case 'created':
            return <UserOutlined style={{ color: '#1890ff' }} />;
        case 'updated':
            return <EditOutlined style={{ color: '#fa8c16' }} />;
        case 'approved':
            return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        case 'locked':
            return <LockOutlined style={{ color: '#722ed1' }} />;
        case 'unlocked':
            return <LockOutlined style={{ color: '#52c41a' }} />;
        case 'added_note':
            return <CommentOutlined style={{ color: '#faad14' }} />;
        case 'submitted_claim':
            return <FileTextOutlined style={{ color: '#1890ff' }} />;
        case 'deleted':
            return <UserOutlined style={{ color: '#f5222d' }} />;
        default:
            return <UserOutlined />;
    }
};

const getActionColor = (action: string) => {
    switch (action) {
        case 'created':
            return 'blue';
        case 'updated':
            return 'orange';
        case 'approved':
            return 'green';
        case 'locked':
            return 'purple';
        case 'unlocked':
            return 'green';
        case 'added_note':
            return 'gold';
        case 'submitted_claim':
            return 'blue';
        case 'deleted':
            return 'red';
        default:
            return 'default';
    }
};

const getActionText = (action: string, details: any) => {
    switch (action) {
        case 'created':
            return 'Created treatment plan';
        case 'updated':
            return 'Updated procedures';
        case 'approved':
            return 'Approved treatment plan';
        case 'locked':
            return 'Locked treatment plan';
        case 'unlocked':
            return 'Unlocked treatment plan';
        case 'added_note':
            return `Added note: ${details.note}`;
        case 'submitted_claim':
            return 'Submitted insurance claim';
        case 'deleted':
            return 'Deleted treatment plan';
        default:
            return action;
    }
};

const ActivityLog: React.FC<ActivityLogProps> = ({ auditTrail }) => {
    return (
        <div style={{ marginTop: 24 }}>
            <Typography.Title level={4}>Activity Log</Typography.Title>
            <Timeline>
                {auditTrail.map((entry, index) => (
                    <Timeline.Item
                        key={index}
                        dot={getActionIcon(entry.action)}
                        color={getActionColor(entry.action)}
                    >
                        <Space direction="vertical" size={0}>
                            <Space>
                                <Text strong>{entry.user_id}</Text>
                                <Tag color="default">{entry.user_role}</Tag>
                                <Tag color={getActionColor(entry.action)}>
                                    {getActionText(entry.action, entry.details)}
                                </Tag>
                            </Space>
                            <Text type="secondary">
                                {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                            </Text>
                        </Space>
                    </Timeline.Item>
                ))}
            </Timeline>
        </div>
    );
};

export default ActivityLog; 