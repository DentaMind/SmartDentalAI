import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import ReviewDashboard from '../components/ReviewDashboard';
import { OverrideReview, User } from '../types';
import { api } from '../services/api';

const ReviewAdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<OverrideReview[]>([]);
  const [modelVersions, setModelVersions] = useState<string[]>([]);
  const [currentModelVersion, setCurrentModelVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, reviewsData, versionsData] = await Promise.all([
          api.getUsers(),
          api.getReviews(),
          api.getModelVersions(),
        ]);

        setUsers(usersData);
        setReviews(reviewsData);
        setModelVersions(versionsData);
        setCurrentModelVersion(versionsData[versionsData.length - 1] || '');
      } catch (err) {
        setError('Failed to load review data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      await api.updateReviewStatus(reviewId, status, notes);
      // The ReviewDashboard will handle updating its local state
    } catch (err) {
      console.error('Error updating review status:', err);
      throw err; // Let the ReviewDashboard handle the error toast
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Review Management</h1>
        <p className="text-gray-600 mt-2">
          Manage and review AI model overrides
        </p>
      </div>

      <ReviewDashboard
        users={users}
        reviews={reviews}
        modelVersions={modelVersions}
        currentModelVersion={currentModelVersion}
        onUpdateReviewStatus={handleUpdateReviewStatus}
      />
    </div>
  );
};

export default ReviewAdminPage; 