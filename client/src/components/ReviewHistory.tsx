import React, { useState } from 'react';
import { ReviewAuditEntry, OverrideReview } from '../types';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ReviewHistoryProps {
  review: OverrideReview;
  currentModelVersion: string;
}

const ReviewHistory: React.FC<ReviewHistoryProps> = ({ review, currentModelVersion }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const isModelVersionOutdated = review.modelVersion !== currentModelVersion;

  return (
    <div className="border rounded-lg p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-medium">Review History</span>
          {isModelVersionOutdated && (
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              Model v{review.modelVersion}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {review.auditHistory.length} entries
        </span>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {review.auditHistory.map((entry) => (
            <div key={entry.id} className="pl-6 border-l-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(entry.newStatus || 'pending')}
                  <span className="font-medium capitalize">{entry.action}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              {entry.notes && (
                <p className="mt-1 text-sm text-gray-600">{entry.notes}</p>
              )}
              {entry.previousStatus && entry.newStatus && (
                <div className="mt-1 text-sm text-gray-500">
                  Status changed from{' '}
                  <span className="font-medium">{entry.previousStatus}</span> to{' '}
                  <span className="font-medium">{entry.newStatus}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewHistory; 