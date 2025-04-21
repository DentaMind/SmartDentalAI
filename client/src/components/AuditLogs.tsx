import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AuditLog, OverrideReview } from '../../shared/schema';
import { FilterState } from './GlobalFilters';
import OverrideReviewPanel from './OverrideReviewPanel';

interface AuditLogsProps {
  filters: FilterState;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ filters }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOverride, setSelectedOverride] = useState<AuditLog | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const queryParams = new URLSearchParams({
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end,
          ...(filters.diagnosisType && { diagnosisType: filters.diagnosisType }),
          ...(filters.providerId && { providerId: filters.providerId.toString() }),
          includeOverrides: filters.includeOverrides?.toString() || 'true'
        });

        const response = await fetch(`/api/diagnosis/audit-logs?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filters]);

  const handleReviewSubmit = async (review: Omit<OverrideReview, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/diagnosis/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(review)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setSelectedOverride(null);
      // Refresh logs to show updated review status
      const queryParams = new URLSearchParams({
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        ...(filters.diagnosisType && { diagnosisType: filters.diagnosisType }),
        ...(filters.providerId && { providerId: filters.providerId.toString() }),
        includeOverrides: filters.includeOverrides?.toString() || 'true'
      });

      const logsResponse = await fetch(`/api/diagnosis/audit-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!logsResponse.ok) {
        throw new Error('Failed to refresh audit logs');
      }
      
      const data = await logsResponse.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  if (loading) return <div>Loading audit logs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Audit Logs</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map(log => (
              <tr
                key={log.id}
                className={log.type === 'override' ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}
                onClick={() => log.type === 'override' && setSelectedOverride(log)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.providerId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {log.details}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOverride && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Override Review</h3>
                <button
                  onClick={() => setSelectedOverride(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <OverrideReviewPanel
                overrideId={selectedOverride.id}
                confidence={selectedOverride.metadata?.confidence || 0}
                onReviewSubmit={handleReviewSubmit}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs; 