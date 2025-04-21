import React, { useEffect, useState } from 'react';
import { Drawer, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { format } from 'date-fns';
import { ChevronRight, AlertTriangle, CheckCircle, XCircle, Loader2, GitCompare } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { VersionComparisonDrawer } from './VersionComparisonDrawer';

interface ModelVersionDetails {
  version: string;
  releaseDate: string;
  changelog: string[];
  confidenceThresholds: {
    condition: string;
    threshold: number;
    change: 'increased' | 'decreased' | 'unchanged';
  }[];
  affectedReviews: number;
  accuracyMetrics: {
    overall: number;
    byCondition: Record<string, number>;
  };
}

interface ModelVersionDrawerProps {
  version: string;
  isOpen: boolean;
  onClose: () => void;
  reviews: any[]; // Replace with proper type
}

interface ModelVersion {
  version: string;
  releaseDate: string;
}

export const ModelVersionDrawer: React.FC<ModelVersionDrawerProps> = ({
  version,
  isOpen,
  onClose,
  reviews,
}) => {
  const [versionDetails, setVersionDetails] = useState<ModelVersionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [availableVersions, setAvailableVersions] = useState<ModelVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  useEffect(() => {
    const fetchAvailableVersions = async () => {
      setIsLoadingVersions(true);
      try {
        const versions = await api.getModelVersions();
        setAvailableVersions(versions);
      } catch (err) {
        toast.error('Failed to load available versions');
        console.error('Error fetching versions:', err);
      } finally {
        setIsLoadingVersions(false);
      }
    };

    if (isOpen) {
      fetchAvailableVersions();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchVersionDetails = async () => {
      if (!version || !isOpen) return;

      setIsLoading(true);
      setError(null);

      try {
        const details = await api.getModelVersionDetails(version);
        setVersionDetails({
          ...details,
          affectedReviews: reviews.filter(r => r.modelVersion === version).length,
        });
      } catch (err) {
        setError('Failed to load model version details');
        toast.error('Failed to load model version details');
        console.error('Error fetching model version details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersionDetails();
  }, [version, isOpen, reviews]);

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'increased':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'decreased':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <ChevronRight className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleCompareClick = () => {
    if (!selectedVersion) {
      toast.error('Please select a version to compare');
      return;
    }
    setShowComparison(true);
  };

  if (!versionDetails && isLoading) {
    return (
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '40%',
            minWidth: 400,
            maxWidth: 600,
          },
        }}
      >
        <div className="p-6 flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </Drawer>
    );
  }

  if (error) {
    return (
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '40%',
            minWidth: 400,
            maxWidth: 600,
          },
        }}
      >
        <div className="p-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-red-800">Error Loading Details</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    );
  }

  if (!versionDetails) return null;

  return (
    <>
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '40%',
            minWidth: 400,
            maxWidth: 600,
          },
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Model Version {version}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Released on {format(new Date(versionDetails.releaseDate), 'MMMM d, yyyy')}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Affected {versionDetails.affectedReviews} reviews
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Compare with Another Version</h3>
              <div className="flex items-center space-x-2">
                <FormControl fullWidth>
                  <InputLabel>Select Version</InputLabel>
                  <Select
                    value={selectedVersion || ''}
                    onChange={(e) => setSelectedVersion(e.target.value as string)}
                    label="Select Version"
                    disabled={isLoadingVersions}
                  >
                    {availableVersions
                      .filter(v => v.version !== version)
                      .map(v => (
                        <MenuItem key={v.version} value={v.version}>
                          v{v.version} ({format(new Date(v.releaseDate), 'MMM d, yyyy')})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <button
                  onClick={handleCompareClick}
                  disabled={!selectedVersion}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>Compare</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Changelog</h3>
              <ul className="space-y-2">
                {versionDetails.changelog.map((change, index) => (
                  <li key={index} className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-1 mr-2" />
                    <span className="text-gray-700">{change}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Confidence Thresholds</h3>
              <div className="space-y-2">
                {versionDetails.confidenceThresholds.map((threshold, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-gray-700">{threshold.condition}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {threshold.threshold.toFixed(2)}
                      </span>
                      {getChangeIcon(threshold.change)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Accuracy Metrics</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700">Overall Accuracy</span>
                    <span className="text-lg font-semibold">
                      {(versionDetails.accuracyMetrics.overall * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${versionDetails.accuracyMetrics.overall * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {Object.entries(versionDetails.accuracyMetrics.byCondition).map(
                    ([condition, accuracy]) => (
                      <div key={condition} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{condition}</span>
                        <span className="text-sm font-medium">
                          {(accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important Note</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    These metrics are based on the validation dataset and may vary in
                    production. Always use clinical judgment when reviewing AI
                    suggestions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {selectedVersion && showComparison && (
        <VersionComparisonDrawer
          version1={version}
          version2={selectedVersion}
          isOpen={showComparison}
          onClose={() => {
            setShowComparison(false);
            setSelectedVersion(null);
          }}
          reviews={reviews}
        />
      )}
    </>
  );
}; 