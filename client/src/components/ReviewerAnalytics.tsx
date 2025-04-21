import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { OverrideReview, User } from '../types';
import { format, subDays } from 'date-fns';

interface ReviewerAnalyticsProps {
  reviews: OverrideReview[];
  users: User[];
  currentModelVersion: string;
}

interface ReviewerMetrics {
  id: string;
  name: string;
  totalReviews: number;
  approvedCount: number;
  rejectedCount: number;
  avgResponseTime: number;
  escalationCount: number;
  accuracyByModel: Record<string, number>;
}

export const ReviewerAnalytics: React.FC<ReviewerAnalyticsProps> = ({
  reviews,
  users,
  currentModelVersion,
}) => {
  // Calculate metrics for each reviewer
  const calculateReviewerMetrics = (): ReviewerMetrics[] => {
    const metricsByReviewer = new Map<string, ReviewerMetrics>();

    reviews.forEach(review => {
      if (!review.reviewerId) return;

      let metrics = metricsByReviewer.get(review.reviewerId);
      if (!metrics) {
        const reviewer = users.find(u => u.id === review.reviewerId);
        metrics = {
          id: review.reviewerId,
          name: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Unknown',
          totalReviews: 0,
          approvedCount: 0,
          rejectedCount: 0,
          avgResponseTime: 0,
          escalationCount: 0,
          accuracyByModel: {},
        };
        metricsByReviewer.set(review.reviewerId, metrics);
      }

      metrics.totalReviews++;
      if (review.status === 'approved') metrics.approvedCount++;
      if (review.status === 'rejected') metrics.rejectedCount++;
      if (review.escalated) metrics.escalationCount++;

      // Calculate response time
      const createdAt = new Date(review.createdAt);
      const updatedAt = new Date(review.updatedAt);
      const responseTime = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // in hours
      metrics.avgResponseTime = (metrics.avgResponseTime * (metrics.totalReviews - 1) + responseTime) / metrics.totalReviews;

      // Track accuracy by model version
      if (!metrics.accuracyByModel[review.modelVersion]) {
        metrics.accuracyByModel[review.modelVersion] = 0;
      }
      metrics.accuracyByModel[review.modelVersion]++;
    });

    return Array.from(metricsByReviewer.values());
  };

  // Calculate daily review counts for the last 30 days
  const calculateDailyMetrics = () => {
    const dailyData = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'MMM d');
      
      const dayReviews = reviews.filter(review => {
        const reviewDate = new Date(review.createdAt);
        return reviewDate.toDateString() === date.toDateString();
      });

      dailyData.push({
        date: dateStr,
        total: dayReviews.length,
        approved: dayReviews.filter(r => r.status === 'approved').length,
        rejected: dayReviews.filter(r => r.status === 'rejected').length,
      });
    }

    return dailyData;
  };

  const reviewerMetrics = calculateReviewerMetrics();
  const dailyMetrics = calculateDailyMetrics();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reviewerMetrics.map(metrics => (
          <div key={metrics.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">{metrics.name}</h3>
            <div className="space-y-1">
              <p>Total Reviews: {metrics.totalReviews}</p>
              <p>Approval Rate: {((metrics.approvedCount / metrics.totalReviews) * 100).toFixed(1)}%</p>
              <p>Avg Response Time: {metrics.avgResponseTime.toFixed(1)} hours</p>
              <p>Escalations: {metrics.escalationCount}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Daily Review Activity</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Reviews" />
              <Line type="monotone" dataKey="approved" stroke="#82ca9d" name="Approved" />
              <Line type="monotone" dataKey="rejected" stroke="#ff7300" name="Rejected" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Review Distribution by Model Version</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reviewerMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(reviewerMetrics[0]?.accuracyByModel || {}).map(version => (
                <Bar
                  key={version}
                  dataKey={`accuracyByModel.${version}`}
                  name={`v${version}`}
                  fill={version === currentModelVersion ? '#82ca9d' : '#8884d8'}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}; 