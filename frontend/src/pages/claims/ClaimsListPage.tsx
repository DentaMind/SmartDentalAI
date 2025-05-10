import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Table, 
    Button, 
    Input, 
    Select, 
    DatePicker, 
    Space, 
    Card, 
    Tag,
    message,
    Spin
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { claimsService } from '../../services/claimsService';
import { InsuranceClaim, ClaimStatus } from '../../types/claims';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ClaimsListPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [claims, setClaims] = useState<InsuranceClaim[]>([]);
    const [filteredClaims, setFilteredClaims] = useState<InsuranceClaim[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<[string, string] | null>(null);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const data = await claimsService.getClaims();
            setClaims(data);
            setFilteredClaims(data);
        } catch (error) {
            message.error('Failed to fetch claims');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        let filtered = [...claims];

        if (searchText) {
            filtered = filtered.filter(claim => 
                claim.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
                claim.claimNumber.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(claim => claim.status === statusFilter);
        }

        if (dateRange) {
            filtered = filtered.filter(claim => {
                const claimDate = new Date(claim.submissionDate);
                const startDate = new Date(dateRange[0]);
                const endDate = new Date(dateRange[1]);
                return claimDate >= startDate && claimDate <= endDate;
            });
        }

        setFilteredClaims(filtered);
    };

    const getStatusColor = (status: ClaimStatus) => {
        switch (status) {
            case ClaimStatus.SUBMITTED:
                return 'blue';
            case ClaimStatus.PAID:
                return 'green';
            case ClaimStatus.DENIED:
                return 'red';
            case ClaimStatus.APPEALED:
                return 'orange';
            default:
                return 'default';
        }
    };

    const columns = [
        {
            title: 'Claim Number',
            dataIndex: 'claimNumber',
            key: 'claimNumber',
        },
        {
            title: 'Patient',
            dataIndex: 'patientName',
            key: 'patientName',
        },
        {
            title: 'Submission Date',
            dataIndex: 'submissionDate',
            key: 'submissionDate',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: ClaimStatus) => (
                <Tag color={getStatusColor(status)}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount: number) => `$${amount.toFixed(2)}`,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: InsuranceClaim) => (
                <Space>
                    <Button 
                        type="link" 
                        onClick={() => navigate(`/claims/${record.id}`)}
                    >
                        View Details
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Card title="Insurance Claims">
            <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                    <Input
                        placeholder="Search claims..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 200 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 150 }}
                    >
                        <Option value="all">All Statuses</Option>
                        <Option value={ClaimStatus.SUBMITTED}>Submitted</Option>
                        <Option value={ClaimStatus.PAID}>Paid</Option>
                        <Option value={ClaimStatus.DENIED}>Denied</Option>
                        <Option value={ClaimStatus.APPEALED}>Appealed</Option>
                    </Select>
                    <RangePicker
                        onChange={(dates) => {
                            if (dates) {
                                setDateRange([
                                    dates[0]?.format('YYYY-MM-DD') || '',
                                    dates[1]?.format('YYYY-MM-DD') || ''
                                ]);
                            } else {
                                setDateRange(null);
                            }
                        }}
                    />
                    <Button type="primary" onClick={handleSearch}>
                        Search
                    </Button>
                </Space>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/claims/new')}
                >
                    New Claim
                </Button>
                <Spin spinning={loading}>
                    <Table
                        dataSource={filteredClaims}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                    />
                </Spin>
            </Space>
        </Card>
    );
};

export default ClaimsListPage; 