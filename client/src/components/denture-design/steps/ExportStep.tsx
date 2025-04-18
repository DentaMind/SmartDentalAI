import React from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface ExportStepProps {
  onGenerate: () => void;
  onExportPDF: () => void;
  loading: boolean;
}

export const ExportStep: React.FC<ExportStepProps> = ({
  onGenerate,
  onExportPDF,
  loading
}) => {
  return (
    <Card>
      <Title level={4}>Export Design</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={onGenerate}
            loading={loading}
            size="large"
          >
            Export STL
          </Button>
          <Typography.Text type="secondary" style={{ marginLeft: '8px' }}>
            Export the denture design as an STL file for 3D printing
          </Typography.Text>
        </div>

        <div>
          <Button
            type="default"
            icon={<FilePdfOutlined />}
            onClick={onExportPDF}
            loading={loading}
            size="large"
          >
            Export PDF Documentation
          </Button>
          <Typography.Text type="secondary" style={{ marginLeft: '8px' }}>
            Generate a PDF report with design specifications and measurements
          </Typography.Text>
        </div>
      </Space>
    </Card>
  );
}; 