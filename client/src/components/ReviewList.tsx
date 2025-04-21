import React, { useState } from 'react';
import { OverrideReview, User } from '../types';
import { Check, X, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ModelVersionDrawer } from './ModelVersionDrawer';

interface ReviewListProps {
  reviews: OverrideReview[];
  filters: {
    status: string;
    reviewer: string;
    modelVersion: string;
    startDate: string;
    endDate: string;
  };
  users: User[];
  currentModelVersion: string;
  onUpdateReviewStatus: (reviewId: string, status: 'approved' | 'rejected', notes: string) => Promise<void>;
  selectedReviews: Set<string>;
  onReviewSelect: (reviewId: string) => void;
  onSelectAll: () => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  filters,
  users,
  currentModelVersion,
  onUpdateReviewStatus,
  selectedReviews,
  onReviewSelect,
  onSelectAll,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredReviews = reviews.filter(review => {
    if (filters.status !== 'all' && review.status !== filters.status) return false;
    if (filters.reviewer !== 'all' && review.reviewerId !== filters.reviewer) return false;
    if (filters.modelVersion !== 'all' && review.modelVersion !== filters.modelVersion) return false;
    if (filters.startDate && new Date(review.createdAt) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(review.createdAt) > new Date(filters.endDate)) return false;
    return true;
  });

  const handleVersionClick = (version: string) => {
    setSelectedVersion(version);
    setIsDrawerOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getReviewerName = (reviewerId: string) => {
    const reviewer = users.find(u => u.id === reviewerId);
    return reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Unknown';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Override Reviews</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Select All
          </button>
          <span className="text-sm text-gray-500">
            {selectedReviews.size} selected
          </span>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {filteredReviews.map(review => (
            <li key={review.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedReviews.has(review.id)}
                    onChange={() => onReviewSelect(review.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(review.status)}
                    <button
                      onClick={() => handleVersionClick(review.modelVersion)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        review.modelVersion === currentModelVersion
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      v{review.modelVersion}
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {getReviewerName(review.reviewerId)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(review.createdAt), 'MMM d, yyyy')}
                  </span>
                  <button
                    onClick={() => onUpdateReviewStatus(review.id, 'approved', '')}
                    className="text-green-600 hover:text-green-800"
                    disabled={review.status !== 'pending'}
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onUpdateReviewStatus(review.id, 'rejected', '')}
                    className="text-red-600 hover:text-red-800"
                    disabled={review.status !== 'pending'}
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-500">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ModelVersionDrawer
        version={selectedVersion || ''}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        reviews={reviews}
      />
    </div>
  );
}; 