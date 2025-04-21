import React, { useState } from 'react';
import { OverrideReview } from '../../shared/schema';

interface OverrideReviewPanelProps {
  overrideId: number;
  confidence: number;
  onReviewSubmit: (review: Omit<OverrideReview, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const OverrideReviewPanel: React.FC<OverrideReviewPanelProps> = ({
  overrideId,
  confidence,
  onReviewSubmit
}) => {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onReviewSubmit({
        overrideId,
        reviewerId: 1, // This should come from the authenticated user
        status,
        notes,
        confidence
      });
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Override Review</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Confidence Score</p>
        <p className="text-2xl font-bold">{confidence.toFixed(1)}%</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Enter your review notes..."
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Decision
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="approved"
                checked={status === 'approved'}
                onChange={() => setStatus('approved')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Approve</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="rejected"
                checked={status === 'rejected'}
                onChange={() => setStatus('rejected')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Reject</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default OverrideReviewPanel; 