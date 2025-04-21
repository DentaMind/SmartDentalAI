import React, { useState, useEffect } from 'react';
import ProviderMetrics from './ProviderMetrics';
import ModelVersionComparison from './ModelVersionComparison';
import AuditLogs from './AuditLogs';
import GlobalFilters, { FilterState } from './GlobalFilters';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'comparison' | 'logs'>('metrics');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    includeOverrides: true
  });
  const [availableDiagnoses, setAvailableDiagnoses] = useState<string[]>([]);

  useEffect(() => {
    const fetchDiagnoses = async () => {
      try {
        const response = await fetch('/api/diagnosis/types', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch diagnosis types');
        }
        
        const data = await response.json();
        setAvailableDiagnoses(data);
      } catch (err) {
        console.error('Error fetching diagnosis types:', err);
      }
    };

    fetchDiagnoses();
  }, []);

  const handleFilterChange = async (newFilters: FilterState) => {
    if (newFilters.exportFormat) {
      // Handle export
      try {
        const queryParams = new URLSearchParams({
          startDate: newFilters.dateRange.start,
          endDate: newFilters.dateRange.end,
          ...(newFilters.diagnosisType && { diagnosisType: newFilters.diagnosisType }),
          ...(newFilters.providerId && { providerId: newFilters.providerId.toString() }),
          includeOverrides: newFilters.includeOverrides?.toString() || 'true'
        });

        const response = await fetch(`/api/diagnosis/export?${queryParams}&format=${newFilters.exportFormat}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to export data');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagnosis-data-${new Date().toISOString()}.${newFilters.exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Error exporting data:', err);
      }
    } else {
      setFilters(newFilters);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <GlobalFilters 
            onFilterChange={handleFilterChange}
            availableDiagnoses={availableDiagnoses}
          />

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`${
                  activeTab === 'metrics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Provider Metrics
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`${
                  activeTab === 'comparison'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Model Version Comparison
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Audit Logs
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'metrics' && <ProviderMetrics filters={filters} />}
            {activeTab === 'comparison' && <ModelVersionComparison filters={filters} />}
            {activeTab === 'logs' && <AuditLogs filters={filters} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 