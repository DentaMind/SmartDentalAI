import React, { useState, useEffect } from 'react';
import { Table, Button, DatePicker, Select, Input, message, Tag } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

interface AuditLog {
  id: number;
  userId: number;
  userEmail: string;
  userRole: string;
  action: string;
  status: 'success' | 'failed';
  details: string;
  metadata: Record<string, any>;
  createdAt: string;
  adminNotes?: string;
}

const AuditLogDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [editingNote, setEditingNote] = useState<{ id: number; notes: string } | null>(null);

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'User',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (email: string, record) => (
        <div>
          <div>{email}</div>
          <Tag color={record.userRole === 'admin' ? 'blue' : 'green'}>
            {record.userRole}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      filters: [
        { text: 'Promote', value: 'promote' },
        { text: 'Rollback', value: 'rollback' },
        { text: 'Failed Attempt', value: 'attempt' },
      ],
      onFilter: (value, record) => record.action.includes(value as string),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    },
    {
      title: 'Admin Notes',
      dataIndex: 'adminNotes',
      key: 'adminNotes',
      render: (notes: string, record) => (
        <div>
          {editingNote?.id === record.id ? (
            <Input.TextArea
              value={editingNote.notes}
              onChange={(e) => setEditingNote({ id: record.id, notes: e.target.value })}
              onBlur={() => {
                updateAdminNotes(record.id, editingNote.notes);
                setEditingNote(null);
              }}
              autoSize
            />
          ) : (
            <div onClick={() => setEditingNote({ id: record.id, notes: notes || '' })}>
              {notes || 'Click to add notes'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Metadata',
      dataIndex: 'metadata',
      key: 'metadata',
      render: (metadata: Record<string, any>) => (
        <pre style={{ maxWidth: '300px', overflow: 'auto' }}>
          {JSON.stringify(metadata, null, 2)}
        </pre>
      ),
    },
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: dateRange?.[0]?.toISOString(),
          endDate: dateRange?.[1]?.toISOString(),
          action: actionFilter !== 'all' ? actionFilter : undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          search: searchText || undefined,
        }),
      });
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      message.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const updateAdminNotes = async (id: number, notes: string) => {
    try {
      await fetch('/api/audit-logs/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, notes }),
      });
      message.success('Notes updated successfully');
      fetchLogs();
    } catch (error) {
      message.error('Failed to update notes');
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Status', 'Details', 'Admin Notes', 'Metadata'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        log.userEmail,
        log.userRole,
        log.action,
        log.status,
        log.details,
        log.adminNotes || '',
        JSON.stringify(log.metadata),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
  };

  useEffect(() => {
    fetchLogs();
  }, [dateRange, actionFilter, roleFilter, searchText]);

  return (
    <div style={{ padding: '24px' }}>
      <h1>Audit Log Dashboard</h1>
      
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
        />
        
        <Select
          style={{ width: 200 }}
          value={actionFilter}
          onChange={setActionFilter}
          options={[
            { value: 'all', label: 'All Actions' },
            { value: 'promote', label: 'Promote' },
            { value: 'rollback', label: 'Rollback' },
            { value: 'attempt', label: 'Failed Attempts' },
          ]}
        />

        <Select
          style={{ width: 200 }}
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'all', label: 'All Roles' },
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' },
          ]}
        />

        <Input
          placeholder="Search logs..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={exportToCSV}
        >
          Export to CSV
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default AuditLogDashboard; 