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

interface ModelVersion {
  version: string;
  deploymentDate: string;
  totalSuggestions: number;
  averageConfidence: number;
  accuracy: number;
  overrideRate: number;
  performanceTrend: {
    date: string;
    accuracy: number;
    confidence: number;
    overrides: number;
  }[];
}

interface ModelVersionComparisonProps {
  filters: FilterState;
}

const ModelVersionComparison: React.FC<ModelVersionComparisonProps> = ({ filters }) => {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const queryParams = new URLSearchParams({
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end,
          ...(filters.diagnosisType && { diagnosisType: filters.diagnosisType }),
          ...(filters.providerId && { providerId: filters.providerId.toString() }),
          includeOverrides: filters.includeOverrides?.toString() || 'true'
        });

        const response = await fetch(`/api/diagnosis/model-versions/compare?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch model version comparison');
        }
        
        const data = await response.json();
        setVersions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [filters]);

  if (loading) return <div>Loading model version comparison...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Model Version Comparison</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {versions.map(version => (
          <div key={version.version} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Version {version.version}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Deployed: {new Date(version.deploymentDate).toLocaleDateString()}
            </p>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Suggestions</p>
                <p className="text-2xl font-bold">{version.totalSuggestions}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Average Confidence</p>
                <p className="text-2xl font-bold">{version.averageConfidence.toFixed(1)}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Accuracy Rate</p>
                <p className="text-2xl font-bold">{version.accuracy.toFixed(1)}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Override Rate</p>
                <p className="text-2xl font-bold">{version.overrideRate.toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">Performance Trend</h4>
              <div className="h-48">
                <Line
                  data={{
                    labels: version.performanceTrend.map(t => t.date),
                    datasets: [
                      {
                        label: 'Accuracy %',
                        data: version.performanceTrend.map(t => t.accuracy),
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                      },
                      {
                        label: 'Confidence %',
                        data: version.performanceTrend.map(t => t.confidence),
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                      },
                      {
                        label: 'Overrides',
                        data: version.performanceTrend.map(t => t.overrides),
                        borderColor: 'rgb(54, 162, 235)',
                        tension: 0.1
                      }
                    ]
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelVersionComparison; 