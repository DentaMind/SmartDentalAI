import React, { useState, useMemo } from 'react';
import { Timeline, Card, Typography, Space, Tag, Avatar, Tooltip, Divider, Select, DatePicker, Input } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import { ProposedEdit, EditStatus } from '../../services/treatmentService';
import { formatDistanceToNow } from 'date-fns';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

interface ProposedEditsTimelineProps {
    edits: ProposedEdit[];
}

const ProposedEditsTimeline: React.FC<ProposedEditsTimelineProps> = ({ edits }) => {
    const [statusFilter, setStatusFilter] = useState<EditStatus | 'all'>('all');
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [searchText, setSearchText] = useState('');

    const filteredEdits = useMemo(() => {
        return edits.filter(edit => {
            // Status filter
            if (statusFilter !== 'all' && edit.status !== statusFilter) {
                return false;
            }

            // Date range filter
            if (dateRange[0] && dateRange[1]) {
                const editDate = new Date(edit.proposed_at);
                if (editDate < dateRange[0] || editDate > dateRange[1]) {
                    return false;
                }
            }

            // Search text filter
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                return (
                    edit.reason.toLowerCase().includes(searchLower) ||
                    edit.proposed_by.toLowerCase().includes(searchLower) ||
                    (edit.review_notes?.toLowerCase().includes(searchLower) || false) ||
                    (edit.reviewed_by?.toLowerCase().includes(searchLower) || false)
                );
            }

            return true;
        });
    }, [edits, statusFilter, dateRange, searchText]);

    const getStatusColor = (status: EditStatus) => {
        switch (status) {
            case EditStatus.APPROVED:
                return 'success';
            case EditStatus.REJECTED:
                return 'error';
            case EditStatus.PENDING:
                return 'processing';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: EditStatus) => {
        switch (status) {
            case EditStatus.APPROVED:
                return <CheckCircleOutlined />;
            case EditStatus.REJECTED:
                return <CloseCircleOutlined />;
            case EditStatus.PENDING:
                return <ClockCircleOutlined />;
            default:
                return null;
        }
    };

    const renderChanges = (changes: any) => {
        return (
            <Space direction="vertical" size="small">
                {changes.added?.map((item: any, index: number) => (
                    <Text key={`added-${index}`} type="success">
                        + Added: {item.description} (${item.cost})
                    </Text>
                ))}
                {changes.modified?.map((item: any, index: number) => (
                    <Text key={`modified-${index}`} type="warning">
                        ~ Modified: {item.description} (${item.cost})
                    </Text>
                ))}
                {changes.removed?.map((item: any, index: number) => (
                    <Text key={`removed-${index}`} type="danger">
                        - Removed: {item.description}
                    </Text>
                ))}
            </Space>
        );
    };

    return (
        <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Space wrap style={{ marginBottom: 16 }}>
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 150 }}
                        options={[
                            { value: 'all', label: 'All Statuses' },
                            { value: EditStatus.PENDING, label: 'Pending' },
                            { value: EditStatus.APPROVED, label: 'Approved' },
                            { value: EditStatus.REJECTED, label: 'Rejected' },
                        ]}
                    />
                    <RangePicker
                        onChange={(dates) => setDateRange(dates as [Date | null, Date | null])}
                        style={{ width: 250 }}
                    />
                    <Search
                        placeholder="Search edits..."
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 200 }}
                    />
                </Space>

                <Divider />

                <Timeline>
                    {filteredEdits.map((edit) => (
                        <Timeline.Item
                            key={edit.id}
                            color={getStatusColor(edit.status)}
                            dot={getStatusIcon(edit.status)}
                        >
                            <Space direction="vertical" size="small">
                                <Space>
                                    <Avatar icon={<UserOutlined />} />
                                    <Text strong>{edit.proposed_by}</Text>
                                    <Tag color={getStatusColor(edit.status)}>
                                        {edit.status}
                                    </Tag>
                                    <Text type="secondary">
                                        {formatDistanceToNow(new Date(edit.proposed_at), { addSuffix: true })}
                                    </Text>
                                </Space>
                                
                                <Card size="small">
                                    <Space direction="vertical" size="small">
                                        <Text strong>Reason:</Text>
                                        <Text>{edit.reason}</Text>
                                        
                                        <Text strong>Changes:</Text>
                                        {renderChanges(edit.changes)}
                                        
                                        {edit.review_notes && (
                                            <>
                                                <Text strong>Review Notes:</Text>
                                                <Text type="secondary">{edit.review_notes}</Text>
                                            </>
                                        )}
                                        
                                        {edit.reviewed_by && (
                                            <Space>
                                                <Text type="secondary">Reviewed by:</Text>
                                                <Text>{edit.reviewed_by}</Text>
                                                <Text type="secondary">
                                                    {formatDistanceToNow(new Date(edit.reviewed_at), { addSuffix: true })}
                                                </Text>
                                            </Space>
                                        )}
                                    </Space>
                                </Card>
                            </Space>
                        </Timeline.Item>
                    ))}
                </Timeline>
            </Space>
        </Card>
    );
};

export default ProposedEditsTimeline; 