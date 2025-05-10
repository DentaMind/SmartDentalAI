import React, { useState, useEffect } from 'react';
import { OverrideReview, User } from '../types';
import ReviewFilters from './ReviewFilters';
import ReviewerWorkload from './ReviewerWorkload';
import ReviewAuditModal from './ReviewAuditModal';
import { ReviewerAnalytics } from './ReviewerAnalytics';
import { format } from 'date-fns';
import { Check, X, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { ReviewList } from './ReviewList';
import { BulkActionsBar } from './BulkActionsBar';

interface ReviewDashboardProps {
  users: User[];
  reviews: OverrideReview[];
  modelVersions: string[];
  currentModelVersion: string;
  onUpdateReviewStatus: (reviewId: string, status: 'approved' | 'rejected', notes: string) => Promise<void>;
}

const ReviewDashboard: React.FC<ReviewDashboardProps> = ({
  users,
  reviews: initialReviews,
  modelVersions,
  currentModelVersion,
  onUpdateReviewStatus,
}) => {
  const [reviews, setReviews] = useState<OverrideReview[]>(initialReviews);
  const [selectedReview, setSelectedReview] = useState<OverrideReview | null>(null);
  const [exportFilteredOnly, setExportFilteredOnly] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    reviewer: 'all',
    modelVersion: 'all',
    startDate: '',
    endDate: '',
  });
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Load saved filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('reviewFilters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('reviewFilters', JSON.stringify(filters));
  }, [filters]);

  // Filter reviews based on current filter state
  const filteredReviews = reviews.filter(review => {
    if (filters.startDate && new Date(review.createdAt) < filters.startDate) return false;
    if (filters.endDate && new Date(review.createdAt) > filters.endDate) return false;
    if (filters.status !== 'all' && review.status !== filters.status) return false;
    if (filters.reviewer !== 'all' && review.reviewerId !== filters.reviewer) return false;
    if (filters.modelVersion !== 'all' && review.modelVersion !== filters.modelVersion) return false;
    return true;
  });

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const dataToExport = exportFilteredOnly ? filteredReviews : reviews;
      const data = dataToExport.map(review => ({
        id: review.id,
        status: review.status,
        reviewer: users.find(u => u.id === review.reviewerId)?.name || 'Unknown',
        modelVersion: review.modelVersion,
        createdAt: format(new Date(review.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        updatedAt: format(new Date(review.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
        notes: review.notes,
      }));

      if (format === 'csv') {
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `review-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `review-export-${format(new Date(), 'yyyy-MM-dd')}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(`Export completed successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export reviews');
    }
  };

  const handleReviewStatusUpdate = async (reviewId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      await onUpdateReviewStatus(reviewId, status, notes);
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, status, notes, updatedAt: new Date().toISOString() }
          : review
      ));
      toast.success(`Review ${status} successfully`);
    } catch (error) {
      console.error('Failed to update review status:', error);
      toast.error('Failed to update review status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <X className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const handleBulkApprove = async (notes: string) => {
    try {
      const reviewIds = Array.from(selectedReviews);
      await api.bulkUpdateReviewStatus(reviewIds, 'approved', notes);
      setSelectedReviews(new Set());
    } catch (error) {
      toast.error('Failed to approve reviews');
      throw error;
    }
  };

  const handleBulkReject = async (notes: string) => {
    try {
      const reviewIds = Array.from(selectedReviews);
      await api.bulkUpdateReviewStatus(reviewIds, 'rejected', notes);
      setSelectedReviews(new Set());
    } catch (error) {
      toast.error('Failed to reject reviews');
      throw error;
    }
  };

  const handleClearSelection = () => {
    setSelectedReviews(new Set());
  };

  const handleReviewSelect = (reviewId: string) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handleSelectAll = () => {
    const filteredReviews = reviews.filter(review => {
      if (filters.status !== 'all' && review.status !== filters.status) return false;
      if (filters.reviewer !== 'all' && review.reviewerId !== filters.reviewer) return false;
      if (filters.modelVersion !== 'all' && review.modelVersion !== filters.modelVersion) return false;
      if (filters.startDate && new Date(review.createdAt) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(review.createdAt) > new Date(filters.endDate)) return false;
      return true;
    });
    setSelectedReviews(new Set(filteredReviews.map(r => r.id)));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Review Dashboard</h1>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      </div>

      {showAnalytics && (
        <div className="bg-white rounded-lg shadow p-4">
          <ReviewerAnalytics
            reviews={reviews}
            users={users}
            currentModelVersion={currentModelVersion}
          />
        </div>
      )}

      <ReviewFilters
        filters={filters}
        onFiltersChange={setFilters}
        modelVersions={modelVersions}
        users={users}
        exportFilteredOnly={exportFilteredOnly}
        onExportFilteredOnlyChange={setExportFilteredOnly}
        onExport={handleExport}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Recent Reviews</h2>
            </div>
            <div className="divide-y">
              {filteredReviews.map(review => (
                <div
                  key={review.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(review.status)}
                      <div>
                        <p className="font-medium">
                          {users.find(u => u.id === review.reviewerId)?.name || 'Unknown Reviewer'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(review.createdAt), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        v{review.modelVersion}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <ReviewerWorkload
            users={users}
            reviews={reviews}
          />
        </div>
      </div>

      <ReviewList
        reviews={reviews}
        filters={filters}
        users={users}
        currentModelVersion={currentModelVersion}
        onUpdateReviewStatus={onUpdateReviewStatus}
        selectedReviews={selectedReviews}
        onReviewSelect={handleReviewSelect}
        onSelectAll={handleSelectAll}
      />

      <BulkActionsBar
        selectedReviews={selectedReviews}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onExport={handleExport}
        onClearSelection={handleClearSelection}
      />

      {selectedReview && (
        <ReviewAuditModal
          review={selectedReview}
          users={users}
          currentModelVersion={currentModelVersion}
          onClose={() => setSelectedReview(null)}
          onUpdateStatus={handleReviewStatusUpdate}
        />
      )}
    </div>
  );
};

export default ReviewDashboard; 