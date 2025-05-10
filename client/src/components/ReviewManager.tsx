import React, { useState, useCallback } from 'react';
import { ReviewList } from './ReviewList';
import { BulkActionsBar } from './BulkActionsBar';
import { OverrideReview, User } from '../types';
import { toast } from 'sonner';

interface ReviewManagerProps {
  reviews: OverrideReview[];
  users: User[];
  currentModelVersion: string;
  onUpdateReviewStatus: (reviewId: string, status: 'approved' | 'rejected', notes: string) => Promise<void>;
  onExportReviews: (reviewIds: string[], format: 'csv' | 'json') => Promise<void>;
}

export const ReviewManager: React.FC<ReviewManagerProps> = ({
  reviews,
  users,
  currentModelVersion,
  onUpdateReviewStatus,
  onExportReviews,
}) => {
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    reviewer: 'all',
    modelVersion: 'all',
    startDate: '',
    endDate: '',
  });

  const handleReviewSelect = useCallback((reviewId: string, selected: boolean) => {
    setSelectedReviews(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(reviewId);
      } else {
        next.delete(reviewId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedReviews(selected ? new Set(reviews.map(r => r.id)) : new Set());
  }, [reviews]);

  const handleBulkApprove = useCallback(async () => {
    try {
      await Promise.all(
        Array.from(selectedReviews).map(reviewId =>
          onUpdateReviewStatus(reviewId, 'approved', 'Bulk approved')
        )
      );
      toast.success(`Approved ${selectedReviews.size} reviews`);
      setSelectedReviews(new Set());
    } catch (error) {
      toast.error('Failed to approve reviews');
    }
  }, [selectedReviews, onUpdateReviewStatus]);

  const handleBulkReject = useCallback(async () => {
    try {
      await Promise.all(
        Array.from(selectedReviews).map(reviewId =>
          onUpdateReviewStatus(reviewId, 'rejected', 'Bulk rejected')
        )
      );
      toast.success(`Rejected ${selectedReviews.size} reviews`);
      setSelectedReviews(new Set());
    } catch (error) {
      toast.error('Failed to reject reviews');
    }
  }, [selectedReviews, onUpdateReviewStatus]);

  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    try {
      await onExportReviews(Array.from(selectedReviews), format);
      toast.success(`Exported ${selectedReviews.size} reviews as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export reviews as ${format.toUpperCase()}`);
    }
  }, [selectedReviews, onExportReviews]);

  return (
    <div className="space-y-4">
      <BulkActionsBar
        selectedReviews={selectedReviews}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onExport={handleExport}
        onClearSelection={() => setSelectedReviews(new Set())}
      />
      <ReviewList
        reviews={reviews}
        filters={filters}
        users={users}
        currentModelVersion={currentModelVersion}
        selectedReviews={selectedReviews}
        onReviewSelect={handleReviewSelect}
        onSelectAll={handleSelectAll}
        onUpdateReviewStatus={onUpdateReviewStatus}
      />
    </div>
  );
}; 