import React, { useState, useEffect } from 'react';
import { OverrideReview, User, AuditLogEntry } from '../types';
import { format } from 'date-fns';
import { X, Check, XCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface ReviewAuditModalProps {
  review: OverrideReview;
  users: User[];
  currentModelVersion: string;
  onClose: () => void;
  onUpdateStatus: (reviewId: string, status: 'approved' | 'rejected', notes: string) => void;
}

const PAGE_SIZE = 20;

const ReviewAuditModal: React.FC<ReviewAuditModalProps> = ({
  review,
  users,
  currentModelVersion,
  onClose,
  onUpdateStatus,
}) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [newNotes, setNewNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'approved' | 'rejected'>('approved');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const { logs, total } = await api.getReviewAuditLogs(review.id, currentPage, PAGE_SIZE);
        setAuditLogs(prev => currentPage === 1 ? logs : [...prev, ...logs]);
        setTotalLogs(total);
      } catch (err) {
        setError('Failed to load audit logs');
        console.error('Error loading audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [review.id, currentPage]);

  const toggleEntry = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleStatusUpdate = () => {
    if (newNotes.trim()) {
      onUpdateStatus(review.id, selectedStatus, newNotes);
      onClose();
    }
  };

  const handleLoadMore = () => {
    if (!loading && auditLogs.length < totalLogs) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Review Audit History</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Review ID</h3>
                <p className="text-lg">{review.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(review.status)}
                  <span className="text-lg capitalize">{review.status}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Audit History</h3>
              {error && (
                <div className="text-red-500 mb-4">{error}</div>
              )}
              <div className="space-y-4">
                {auditLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleEntry(entry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(entry.action)}
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-sm text-gray-500">
                          by {getUserName(entry.userId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
                        </span>
                        {expandedEntries.has(entry.id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    {expandedEntries.has(entry.id) && (
                      <div className="mt-4 space-y-2">
                        {entry.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                            <p className="text-sm">{entry.notes}</p>
                          </div>
                        )}
                        {entry.metadata && Object.entries(entry.metadata).map(([key, value]) => (
                          <div key={key}>
                            <h4 className="text-sm font-medium text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <p className="text-sm">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              )}

              {auditLogs.length < totalLogs && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full mt-4 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Update Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as 'approved' | 'rejected')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Add notes about this status update..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newNotes.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAuditModal; 