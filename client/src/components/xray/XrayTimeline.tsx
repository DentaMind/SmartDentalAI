import React from 'react';
import { Xray } from '@shared/schema';

interface XrayTimelineProps {
  xrays: Xray[];
  selectedXrayId?: number;
  onXraySelect: (xray: Xray) => void;
  onCompareSelect?: (xray: Xray) => void;
}

export const XrayTimeline: React.FC<XrayTimelineProps> = ({
  xrays,
  selectedXrayId,
  onXraySelect,
  onCompareSelect
}) => {
  // Group X-rays by date
  const groupedXrays = xrays.reduce((acc, xray) => {
    const date = new Date(xray.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(xray);
    return acc;
  }, {} as Record<string, Xray[]>);

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">X-ray History</h2>
      <div className="space-y-6">
        {Object.entries(groupedXrays).map(([date, dateXrays]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{date}</h3>
            <div className="space-y-2">
              {dateXrays.map((xray) => (
                <div
                  key={xray.id}
                  className={`p-2 rounded cursor-pointer ${
                    selectedXrayId === xray.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="flex items-center justify-between"
                    onClick={() => onXraySelect(xray)}
                  >
                    <div>
                      <div className="text-sm font-medium capitalize">{xray.type}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(xray.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    {onCompareSelect && (
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompareSelect(xray);
                        }}
                      >
                        Compare
                      </button>
                    )}
                  </div>
                  {xray.notes && (
                    <div className="mt-1 text-xs text-gray-600">{xray.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 