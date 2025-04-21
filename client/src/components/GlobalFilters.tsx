import React from 'react';

interface GlobalFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  availableDiagnoses: string[];
}

export interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  providerId?: number;
  diagnosisType?: string;
  includeOverrides?: boolean;
}

const GlobalFilters: React.FC<GlobalFiltersProps> = ({ onFilterChange, availableDiagnoses }) => {
  const [filters, setFilters] = React.useState<FilterState>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    includeOverrides: true
  });

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Global Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Range</label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Diagnosis Type</label>
          <select
            value={filters.diagnosisType || ''}
            onChange={(e) => handleFilterChange('diagnosisType', e.target.value || undefined)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Diagnoses</option>
            {availableDiagnoses.map(diagnosis => (
              <option key={diagnosis} value={diagnosis}>
                {diagnosis}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Include Overrides</label>
          <div className="mt-1">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={filters.includeOverrides}
                onChange={(e) => handleFilterChange('includeOverrides', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Overrides</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Export Filtered Data</label>
          <div className="mt-1 flex space-x-2">
            <button
              onClick={() => onFilterChange({ ...filters, exportFormat: 'csv' })}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, exportFormat: 'json' })}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalFilters; 