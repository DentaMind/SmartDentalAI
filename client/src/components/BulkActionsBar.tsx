import React from 'react';
import { Check, X, Download } from 'lucide-react';

interface BulkActionsBarProps {
  selectedReviews: Set<string>;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onExport: (format: 'csv' | 'json') => void;
  onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedReviews,
  onBulkApprove,
  onBulkReject,
  onExport,
  onClearSelection,
}) => {
  if (selectedReviews.size === 0) return null;

  return (
    <div className="bg-white shadow rounded-lg mb-4">
      <div className="px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            {selectedReviews.size} reviews selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onBulkApprove}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Check className="h-4 w-4 mr-2" />
            Approve Selected
          </button>
          <button
            onClick={onBulkReject}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <X className="h-4 w-4 mr-2" />
            Reject Selected
          </button>
          <div className="relative">
            <button
              onClick={() => onExport('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => onExport('json')}
              className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 