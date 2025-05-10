import React from 'react';
import { Button, Slider, Space, Tooltip } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ExportOutlined,
  DeleteOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { Xray } from '@shared/schema';

interface MeasurementToolsProps {
  xray: Xray;
  onScaleChange: (scale: number) => void;
  onExport: () => void;
  onCalibrate: () => void;
  onClear: () => void;
  onIntraoralToggle: () => void;
  calibrationMode: boolean;
  showIntraoral: boolean;
}

export const MeasurementTools: React.FC<MeasurementToolsProps> = ({
  xray,
  onScaleChange,
  onExport,
  onCalibrate,
  onClear,
  onIntraoralToggle,
  calibrationMode,
  showIntraoral
}) => {
  const handleZoomIn = () => {
    onScaleChange(scale => Math.min(scale + 0.1, 2));
  };

  const handleZoomOut = () => {
    onScaleChange(scale => Math.max(scale - 0.1, 0.5));
  };

  return (
    <div className="measurement-tools">
      <Space>
        <Tooltip title="Zoom Out">
          <Button
            icon={<ZoomOutOutlined />}
            onClick={handleZoomOut}
          />
        </Tooltip>
        <Tooltip title="Zoom In">
          <Button
            icon={<ZoomInOutlined />}
            onClick={handleZoomIn}
          />
        </Tooltip>
        <Slider
          min={0.5}
          max={2}
          step={0.1}
          defaultValue={1}
          onChange={onScaleChange}
          style={{ width: 100 }}
        />
        {xray.intraoralScan && (
          <Tooltip title={showIntraoral ? "Hide Intraoral Overlay" : "Show Intraoral Overlay"}>
            <Button
              icon={showIntraoral ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={onIntraoralToggle}
            />
          </Tooltip>
        )}
        <Tooltip title="Export Measurements">
          <Button
            icon={<ExportOutlined />}
            onClick={onExport}
          />
        </Tooltip>
        <Tooltip title="Clear All">
          <Button
            icon={<DeleteOutlined />}
            onClick={onClear}
          />
        </Tooltip>
        <Tooltip title={calibrationMode ? "Exit Calibration" : "Enter Calibration"}>
          <Button
            icon={<SettingOutlined />}
            onClick={onCalibrate}
            type={calibrationMode ? "primary" : "default"}
          />
        </Tooltip>
      </Space>
    </div>
  );
}; 