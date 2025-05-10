import React, { useState } from 'react';
import { XrayPosition, XrayType } from '@shared/schema';
import { XrayUpload } from './XrayUpload';

interface FMXLayoutProps {
  patientId: number;
  onXrayUploaded: (position: XrayPosition) => void;
}

const FMX_POSITIONS = [
  { id: 'UR1', label: 'UR Central', type: 'periapical' },
  { id: 'UR2', label: 'UR Lateral', type: 'periapical' },
  { id: 'UR3', label: 'UR Canine', type: 'periapical' },
  { id: 'UR4', label: 'UR 1st Premolar', type: 'periapical' },
  { id: 'UR5', label: 'UR 2nd Premolar', type: 'periapical' },
  { id: 'UR6', label: 'UR 1st Molar', type: 'periapical' },
  { id: 'UR7', label: 'UR 2nd Molar', type: 'periapical' },
  { id: 'UR8', label: 'UR 3rd Molar', type: 'periapical' },
  { id: 'UL1', label: 'UL Central', type: 'periapical' },
  { id: 'UL2', label: 'UL Lateral', type: 'periapical' },
  { id: 'UL3', label: 'UL Canine', type: 'periapical' },
  { id: 'UL4', label: 'UL 1st Premolar', type: 'periapical' },
  { id: 'UL5', label: 'UL 2nd Premolar', type: 'periapical' },
  { id: 'UL6', label: 'UL 1st Molar', type: 'periapical' },
  { id: 'UL7', label: 'UL 2nd Molar', type: 'periapical' },
  { id: 'UL8', label: 'UL 3rd Molar', type: 'periapical' },
  { id: 'LL1', label: 'LL Central', type: 'periapical' },
  { id: 'LL2', label: 'LL Lateral', type: 'periapical' },
  { id: 'LL3', label: 'LL Canine', type: 'periapical' },
  { id: 'LL4', label: 'LL 1st Premolar', type: 'periapical' },
  { id: 'LL5', label: 'LL 2nd Premolar', type: 'periapical' },
  { id: 'LL6', label: 'LL 1st Molar', type: 'periapical' },
  { id: 'LL7', label: 'LL 2nd Molar', type: 'periapical' },
  { id: 'LL8', label: 'LL 3rd Molar', type: 'periapical' },
  { id: 'LR1', label: 'LR Central', type: 'periapical' },
  { id: 'LR2', label: 'LR Lateral', type: 'periapical' },
  { id: 'LR3', label: 'LR Canine', type: 'periapical' },
  { id: 'LR4', label: 'LR 1st Premolar', type: 'periapical' },
  { id: 'LR5', label: 'LR 2nd Premolar', type: 'periapical' },
  { id: 'LR6', label: 'LR 1st Molar', type: 'periapical' },
  { id: 'LR7', label: 'LR 2nd Molar', type: 'periapical' },
  { id: 'LR8', label: 'LR 3rd Molar', type: 'periapical' },
  { id: 'BW1', label: 'Upper Right BW', type: 'bitewing' },
  { id: 'BW2', label: 'Upper Left BW', type: 'bitewing' },
  { id: 'BW3', label: 'Lower Right BW', type: 'bitewing' },
  { id: 'BW4', label: 'Lower Left BW', type: 'bitewing' },
];

export const FMXLayout: React.FC<FMXLayoutProps> = ({ patientId, onXrayUploaded }) => {
  const [uploadingPosition, setUploadingPosition] = useState<string | null>(null);

  const handlePositionClick = (positionId: string) => {
    setUploadingPosition(positionId);
  };

  const handleUploadComplete = (xrayId: number) => {
    if (uploadingPosition) {
      onXrayUploaded(uploadingPosition as XrayPosition);
      setUploadingPosition(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-8 gap-4">
        {FMX_POSITIONS.map((position) => (
          <div
            key={position.id}
            className="relative aspect-square border-2 border-gray-200 rounded-lg p-2 cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => handlePositionClick(position.id)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-gray-500">{position.label}</span>
            </div>
            
            {uploadingPosition === position.id && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                <XrayUpload
                  patientId={patientId}
                  onUploadComplete={handleUploadComplete}
                  defaultType={position.type as XrayType}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 