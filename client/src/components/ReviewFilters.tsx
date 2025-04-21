import React from 'react';
import { User } from '../types';
import { Calendar, Filter, Download } from 'lucide-react';

interface ReviewFiltersProps {
  users: User[];
  modelVersions: string[];
  onFilterChange: (filters: ReviewFilterState) => void;
  onExport: (format: 'csv' | 'json') => void;
  exportFilteredOnly: boolean;
  onExportFilteredOnlyChange: (value: boolean) => void;
}

export interface ReviewFilterState {
  startDate: Date | null;
  endDate: Date | null;
  status: string[];
  reviewerId: number | null;
  modelVersion: string | null;
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  users,
  modelVersions,
  onFilterChange,
  onExport,
  exportFilteredOnly,
  onExportFilteredOnlyChange,
}) => {
  const [filters, setFilters] = React.useState<ReviewFilterState>({
    startDate: null,
    endDate: null,
    status: [],
    reviewerId: null,
    modelVersion: null,
  });

  const handleFilterChange = (updates: Partial<ReviewFilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h3>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center text-sm gap-2">
            <input
              type="checkbox"
              checked={exportFilteredOnly}
              onChange={(e) => onExportFilteredOnlyChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            Export only filtered data
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport('csv')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => onExport('json')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date Range</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md"
              onChange={(e) => handleFilterChange({ startDate: e.target.value ? new Date(e.target.value) : null })}
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md"
              onChange={(e) => handleFilterChange({ endDate: e.target.value ? new Date(e.target.value) : null })}
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            multiple
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleFilterChange({ status: selected });
            }}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Reviewer */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Reviewer</label>
          <select
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) => handleFilterChange({ reviewerId: e.target.value ? parseInt(e.target.value) : null })}
          >
            <option value="">All Reviewers</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model Version */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Model Version</label>
          <select
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) => handleFilterChange({ modelVersion: e.target.value || null })}
          >
            <option value="">All Versions</option>
            {modelVersions.map((version) => (
              <option key={version} value={version}>
                v{version}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters; 