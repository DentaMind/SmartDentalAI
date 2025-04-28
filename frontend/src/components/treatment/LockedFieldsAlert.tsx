import React from 'react';
import { Alert, Typography, Space, Tag } from 'antd';
import { LockOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface LockedFieldsAlertProps {
    lockedFields: string[];
    insuranceClaimId?: string;
}

const LockedFieldsAlert: React.FC<LockedFieldsAlertProps> = ({
    lockedFields,
    insuranceClaimId
}) => {
    if (!lockedFields.length) {
        return null;
    }

    const getFieldLabel = (field: string) => {
        switch (field) {
            case 'procedures':
                return 'Procedures';
            case 'total_cost':
                return 'Total Cost';
            default:
                return field;
        }
    };

    return (
        <Alert
            message={
                <Space direction="vertical" size="small">
                    <Space>
                        <LockOutlined />
                        <Text strong>Locked Fields</Text>
                    </Space>
                    <Space wrap>
                        {lockedFields.map(field => (
                            <Tag key={field} color="red" icon={<LockOutlined />}>
                                {getFieldLabel(field)}
                            </Tag>
                        ))}
                    </Space>
                    {insuranceClaimId && (
                        <Space>
                            <InfoCircleOutlined />
                            <Text type="secondary">
                                Fields locked due to insurance claim {insuranceClaimId}
                            </Text>
                        </Space>
                    )}
                </Space>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
        />
    );
};

export default LockedFieldsAlert; 