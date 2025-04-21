import React from 'react';
import { User, OverrideReview } from '../types';
import { format } from 'date-fns';

interface ReviewerWorkloadProps {
  users: User[];
  reviews: OverrideReview[];
}

const ReviewerWorkload: React.FC<ReviewerWorkloadProps> = ({ users, reviews }) => {
  const getWorkloadColor = (count: number, max: number) => {
    const intensity = Math.min(1, count / max);
    const hue = 120 - (intensity * 120); // Green to Red
    return `hsl(${hue}, 100%, 50%)`;
  };

  const calculateWorkload = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const reviewerWorkload = users.map(user => {
      const userReviews = reviews.filter(review => 
        review.reviewerId === user.id && 
        new Date(review.createdAt) >= thirtyDaysAgo
      );
      
      const pending = userReviews.filter(r => r.status === 'pending').length;
      const completed = userReviews.filter(r => r.status !== 'pending').length;
      
      return {
        user,
        pending,
        completed,
        total: userReviews.length,
      };
    });

    const maxReviews = Math.max(...reviewerWorkload.map(w => w.total));
    
    return reviewerWorkload.map(workload => ({
      ...workload,
      color: getWorkloadColor(workload.total, maxReviews),
    }));
  };

  const workloads = calculateWorkload();

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Reviewer Workload (Last 30 Days)</h3>
      <div className="space-y-4">
        {workloads.map((workload) => (
          <div key={workload.user.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{workload.user.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {workload.completed} completed
                </span>
                <span className="text-sm text-gray-500">
                  {workload.pending} pending
                </span>
                <span className="text-sm font-medium">
                  {workload.total} total
                </span>
              </div>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(workload.total / Math.max(...workloads.map(w => w.total))) * 100}%`,
                  backgroundColor: workload.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewerWorkload; 