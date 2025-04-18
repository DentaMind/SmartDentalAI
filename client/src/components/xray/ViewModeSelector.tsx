import React from 'react';
import { Segmented, Tooltip } from 'antd';
import { Xray } from '@shared/schema';

export type ViewMode = 'fmx' | 'pano' | 'cbct' | 'scan' | 'cerec' | 'overlay';

interface ViewModeSelectorProps {
  xray: Xray;
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  xray,
  value,
  onChange
}) => {
  const options = [
    { 
      label: 'FMX', 
      value: 'fmx', 
      tooltip: 'View intraoral X-rays',
      disabled: !xray.imageUrl 
    },
    { 
      label: 'Pano', 
      value: 'pano', 
      tooltip: 'View panoramic radiograph',
      disabled: !xray.panoUrl 
    },
    { 
      label: 'CBCT', 
      value: 'cbct', 
      tooltip: 'View 3D CBCT scan',
      disabled: !xray.cbctUrl 
    },
    { 
      label: 'Intraoral Scan', 
      value: 'scan', 
      tooltip: 'View 3D intraoral scan',
      disabled: !xray.intraoralScan 
    },
    { 
      label: 'CEREC', 
      value: 'cerec', 
      tooltip: 'View CAD/CAM CEREC scan',
      disabled: !xray.cerecScan 
    },
    { 
      label: 'Overlay', 
      value: 'overlay', 
      tooltip: 'Overlay scan onto 2D image',
      disabled: !(xray.imageUrl && xray.intraoralScan) 
    }
  ];

  return (
    <div className="view-mode-selector">
      <Segmented
        value={value}
        onChange={(value) => onChange(value as ViewMode)}
        options={options.map(option => ({
          label: (
            <Tooltip title={option.tooltip}>
              <span>{option.label}</span>
            </Tooltip>
          ),
          value: option.value,
          disabled: option.disabled
        }))}
      />
    </div>
  );
}; 