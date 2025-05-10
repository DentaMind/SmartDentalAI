import React, { useState, useEffect } from 'react';
import { Chip, Tooltip, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import StorageIcon from '@mui/icons-material/Storage';
import API from '../../lib/api';

interface DbHealth {
  status: string;
  issues: string[];
}

const DatabaseHealthBadge: React.FC = () => {
  const [health, setHealth] = useState<DbHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.get('/api/admin/db-health');
        setHealth(response);
      } catch (err) {
        console.error('Error fetching database health:', err);
        setError('Failed to fetch database health');
        // Provide fallback data
        setHealth({
          status: 'error',
          issues: ['Could not fetch database health']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    // Refresh every 5 minutes
    const interval = setInterval(fetchHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Chip
        size="small"
        label="Loading..."
        icon={<CircularProgress size={16} />}
      />
    );
  }

  if (error || !health) {
    return (
      <Tooltip title={error || 'Unknown status'}>
        <Chip
          size="small"
          label="DB Error"
          color="error"
          icon={<ErrorIcon />}
        />
      </Tooltip>
    );
  }

  // Determine badge display based on health status
  let color: 'success' | 'warning' | 'error' | 'default' = 'default';
  let icon = <StorageIcon />;
  let label = 'DB Unknown';

  switch (health.status) {
    case 'healthy':
      color = 'success';
      icon = <CheckCircleIcon />;
      label = 'DB Healthy';
      break;
    case 'warning':
      color = 'warning';
      icon = <WarningIcon />;
      label = 'DB Warning';
      break;
    case 'error':
    case 'unhealthy':
      color = 'error';
      icon = <ErrorIcon />;
      label = 'DB Issues';
      break;
  }

  return (
    <Tooltip title={health.issues.length > 0 ? 
      `Database issues: ${health.issues.slice(0, 3).join(', ')}${health.issues.length > 3 ? ` and ${health.issues.length - 3} more` : ''}` : 
      'Database is healthy'
    }>
      <Chip
        size="small"
        label={label}
        color={color}
        icon={icon}
      />
    </Tooltip>
  );
};

export default DatabaseHealthBadge; 