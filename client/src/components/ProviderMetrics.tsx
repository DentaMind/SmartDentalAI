import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FilterState } from './GlobalFilters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProviderMetrics {
  providerId: number;
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  overrides: number;
  accuracy: number;
  averageResponseTime: number;
  accuracyTrend: { date: string; accuracy: number }[];
  diagnosisAccuracy: {
    diagnosis: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
}

interface ProviderMetricsProps {
  filters: FilterState;
}

const ProviderMetrics: React.FC<ProviderMetricsProps> = ({ filters }) => {
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const queryParams = new URLSearchParams({
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end,
          ...(filters.diagnosisType && { diagnosisType: filters.diagnosisType }),
          ...(filters.providerId && { providerId: filters.providerId.toString() }),
          includeOverrides: filters.includeOverrides?.toString() || 'true'
        });

        const response = await fetch(`/api/diagnosis/provider-metrics?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch provider metrics');
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [filters]);

  if (loading) return <div>Loading metrics...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Provider Performance Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map(provider => (
          <div key={provider.providerId} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Provider {provider.providerId}</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Suggestions</p>
                <p className="text-2xl font-bold">{provider.totalSuggestions}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Accuracy Rate</p>
                <p className="text-2xl font-bold">{provider.accuracy.toFixed(1)}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">AI Overrides</p>
                <p className="text-2xl font-bold">{provider.overrides}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Average Response Time</p>
                <p className="text-2xl font-bold">{provider.averageResponseTime.toFixed(1)}s</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">Accuracy Trend</h4>
              <div className="h-48">
                <Line
                  data={{
                    labels: provider.accuracyTrend.map(t => t.date),
                    datasets: [{
                      label: 'Accuracy %',
                      data: provider.accuracyTrend.map(t => t.accuracy),
                      borderColor: 'rgb(75, 192, 192)',
                      tension: 0.1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">Per-Diagnosis Accuracy</h4>
              <div className="space-y-2">
                {provider.diagnosisAccuracy.map(diagnosis => (
                  <div key={diagnosis.diagnosis} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{diagnosis.diagnosis}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{diagnosis.accuracy.toFixed(1)}%</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${diagnosis.accuracy}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderMetrics; 