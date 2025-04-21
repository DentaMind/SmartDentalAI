import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Space, Typography, List, message, Dropdown } from 'antd';
import { getCase, getCasesByPatient, deleteCase, exportCasesToCSV, exportCasesToPDF } from '../../api/crown-bridge';
import { CrownBridgeCase } from '../../types/crown-bridge';
import { ScanPreview } from './ScanPreview';
import { MoreOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface CaseLoaderProps {
  onCaseLoaded: (caseData: CrownBridgeCase) => void;
  patientId?: string;
}

export const CaseLoader: React.FC<CaseLoaderProps> = ({ onCaseLoaded, patientId }) => {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<CrownBridgeCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadCases(patientId);
    }
  }, [patientId]);

  const loadCases = async (patientId: string) => {
    try {
      setLoading(true);
      const patientCases = await getCasesByPatient(patientId);
      setCases(patientCases);
    } catch (error) {
      message.error('Failed to load cases');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = async (caseId: string) => {
    try {
      setLoading(true);
      const caseData = await getCase(caseId);
      setSelectedCase(caseId);
      onCaseLoaded(caseData);
    } catch (error) {
      message.error('Failed to load case');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      await deleteCase(caseId);
      setCases(cases.filter(c => c.id !== caseId));
      if (selectedCase === caseId) {
        setSelectedCase(null);
      }
      message.success('Case deleted successfully');
    } catch (error) {
      message.error('Failed to delete case');
      console.error(error);
    }
  };

  const handleExportCSV = async () => {
    if (!patientId) return;
    try {
      await exportCasesToCSV(patientId);
    } catch (error) {
      message.error('Failed to export cases as CSV');
      console.error(error);
    }
  };

  const handleExportPDF = async () => {
    if (!patientId) return;
    try {
      await exportCasesToPDF(patientId);
    } catch (error) {
      message.error('Failed to export cases as PDF');
      console.error(error);
    }
  };

  const exportMenu = {
    items: [
      {
        key: 'csv',
        label: 'Export as CSV',
        icon: <DownloadOutlined />,
        onClick: handleExportCSV
      },
      {
        key: 'pdf',
        label: 'Export as PDF',
        icon: <DownloadOutlined />,
        onClick: handleExportPDF
      }
    ]
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Load Existing Case</Title>
          {patientId && (
            <Dropdown menu={exportMenu} placement="bottomRight">
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          )}
        </div>
        
        {patientId ? (
          <>
            <Select
              style={{ width: '100%' }}
              placeholder="Select a case"
              value={selectedCase}
              onChange={handleCaseSelect}
              loading={loading}
            >
              {cases.map((caseItem) => (
                <Option key={caseItem.id} value={caseItem.id}>
                  {new Date(caseItem.createdAt).toLocaleDateString()} - {caseItem.settings.designType}
                </Option>
              ))}
            </Select>

            {selectedCase && (
              <List
                dataSource={cases.filter(c => c.id === selectedCase)}
                renderItem={(caseItem) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteCase(caseItem.id)}
                      />
                    ]}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>Case Details:</Text>
                      <Text>Design Type: {caseItem.settings.designType}</Text>
                      <Text>Material: {caseItem.settings.material}</Text>
                      <Text>Created: {new Date(caseItem.createdAt).toLocaleString()}</Text>
                      
                      {caseItem.preparationScan && (
                        <ScanPreview
                          title="Preparation Scan"
                          geometry={caseItem.preparationScan}
                        />
                      )}
                      
                      {caseItem.design && (
                        <ScanPreview
                          title="Design"
                          geometry={caseItem.design}
                        />
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </>
        ) : (
          <Text type="secondary">Select a patient to load cases</Text>
        )}
      </Space>
    </Card>
  );
}; 