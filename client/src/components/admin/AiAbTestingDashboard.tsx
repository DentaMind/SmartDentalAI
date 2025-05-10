import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Space, Spin } from 'antd';
import { Pie } from '@ant-design/plots';

const { Title } = Typography;

interface TriageRecord {
  modelVersion: string;
  outcome: 'improved' | 'worsened' | 'stable';
}

interface Aggregated {
  version: string;
  improved: number;
  worsened: number;
  stable: number;
  total: number;
}

export const AiAbTestingDashboard: React.FC = () => {
  const [data, setData] = useState<TriageRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai-triage/all');
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const aggregateByVersion = (): Aggregated[] => {
    const map: Record<string, Aggregated> = {};
    for (const record of data) {
      if (!map[record.modelVersion]) {
        map[record.modelVersion] = {
          version: record.modelVersion,
          improved: 0,
          worsened: 0,
          stable: 0,
          total: 0,
        };
      }
      map[record.modelVersion][record.outcome]++;
      map[record.modelVersion].total++;
    }
    return Object.values(map);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  const tableData = aggregateByVersion();

  return (
    <Card>
      <Title level={4}>A/B Test: Model Version Performance</Title>

      <Table
        rowKey="version"
        columns={[
          {
            title: 'Model Version',
            dataIndex: 'version',
            key: 'version',
            render: (v) => <Tag color="blue">{v}</Tag>,
          },
          {
            title: 'Improved',
            dataIndex: 'improved',
            key: 'improved',
          },
          {
            title: 'Stable',
            dataIndex: 'stable',
            key: 'stable',
          },
          {
            title: 'Worsened',
            dataIndex: 'worsened',
            key: 'worsened',
          },
          {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
          },
        ]}
        dataSource={tableData}
        pagination={false}
      />

      <Space direction="horizontal" style={{ marginTop: 24 }}>
        {tableData.map((v) => (
          <Card key={v.version} title={`Pie: ${v.version}`} style={{ width: 300 }}>
            <Pie
              data={[
                { type: 'Improved', value: v.improved },
                { type: 'Stable', value: v.stable },
                { type: 'Worsened', value: v.worsened },
              ]}
              angleField="value"
              colorField="type"
              radius={0.8}
              label={{ type: 'inner', offset: '-30%', content: '{value}' }}
              interactions={[{ type: 'element-active' }]}
            />
          </Card>
        ))}
      </Space>
    </Card>
  );
}; 