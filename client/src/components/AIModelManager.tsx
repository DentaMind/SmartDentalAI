import { Button, Table, Modal, message, Switch, Space } from 'antd';
import { useState, useEffect } from 'react';
import { AIModelService } from '../services/ai-model';
import { AITriageService } from '../services/ai-triage';

interface ModelVersion {
  id: number;
  version: string;
  isActive: boolean;
  createdAt: string;
}

interface ABSummary {
  version: string;
  total: number;
  improved: number;
  stable: number;
  worsened: number;
}

export const AIModelManager = () => {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestModalVisible, setSuggestModalVisible] = useState(false);
  const [suggestedVersion, setSuggestedVersion] = useState<string | null>(null);
  const [autoSuggest, setAutoSuggest] = useState(false);

  useEffect(() => {
    fetchVersions();
    const savedAutoSuggest = localStorage.getItem('autoSuggestWeekly');
    if (savedAutoSuggest) {
      setAutoSuggest(JSON.parse(savedAutoSuggest));
    }
  }, []);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const data = await AIModelService.getAllVersions();
      setVersions(data);
    } catch (error) {
      message.error('Failed to fetch model versions');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestBestModel = async () => {
    try {
      const summaries = await AITriageService.getABSummary();
      if (summaries.length === 0) {
        message.warning('No A/B testing data available');
        return;
      }

      // Calculate improvement rate for each version
      const versionScores = summaries.map(summary => ({
        version: summary.version,
        score: (summary.improved - summary.worsened) / summary.total
      }));

      // Find version with highest improvement rate
      const bestVersion = versionScores.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      setSuggestedVersion(bestVersion.version);
      setSuggestModalVisible(true);
    } catch (error) {
      message.error('Failed to analyze model performance');
    }
  };

  const handleDeploySuggestedVersion = async () => {
    if (!suggestedVersion) return;

    try {
      await AIModelService.deployVersion(suggestedVersion);
      message.success('Model version deployed successfully');
      setSuggestModalVisible(false);
      fetchVersions();
    } catch (error) {
      message.error('Failed to deploy model version');
    }
  };

  const handleAutoSuggestToggle = (checked: boolean) => {
    setAutoSuggest(checked);
    localStorage.setItem('autoSuggestWeekly', JSON.stringify(checked));
    if (checked) {
      message.info('Auto-suggest enabled. The system will suggest the best model weekly.');
    } else {
      message.info('Auto-suggest disabled.');
    }
  };

  const columns = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? 'green' : 'gray' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleSuggestBestModel}>
          Suggest Best Model
        </Button>
        <Switch
          checked={autoSuggest}
          onChange={handleAutoSuggestToggle}
          checkedChildren="Auto-Suggest On"
          unCheckedChildren="Auto-Suggest Off"
        />
      </Space>

      <Table
        dataSource={versions}
        columns={columns}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title="Suggested Model Version"
        visible={suggestModalVisible}
        onOk={handleDeploySuggestedVersion}
        onCancel={() => setSuggestModalVisible(false)}
        okText="Deploy"
        cancelText="Cancel"
      >
        <p>Based on A/B testing results, version {suggestedVersion} shows the best performance.</p>
        <p>Would you like to deploy this version?</p>
      </Modal>
    </div>
  );
}; 