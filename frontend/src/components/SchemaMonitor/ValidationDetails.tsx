import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Collapse,
  useTheme
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchValidationStats, fetchValidationErrors } from '@/api/schema';

interface ValidationStats {
  total_validations: number;
  failed_validations: number;
  error_rate: number;
  hourly_stats: {
    hour: string;
    total: number;
    failed: number;
  }[];
}

interface ValidationError {
  event_type: string;
  timestamp: string;
  error_message: string;
  event_payload: any;
}

const ErrorRow: React.FC<{ error: ValidationError }> = ({ error }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow
        sx={{
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <TableCell>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{error.event_type}</TableCell>
        <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
        <TableCell>{error.error_message}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Event Payload
              </Typography>
              <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(error.event_payload, null, 2)}
              </pre>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const ValidationDetails: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, errorsData] = await Promise.all([
          fetchValidationStats(),
          fetchValidationErrors()
        ]);
        setStats(statsData);
        setErrors(errorsData);
        setError(null);
      } catch (err) {
        setError('Failed to load validation data');
        console.error('Validation data error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Refresh every minute
    const interval = setInterval(loadData, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return null;
  }

  const errorRate = (stats.error_rate * 100).toFixed(2);
  const errorRateColor =
    stats.error_rate < 0.01
      ? 'success'
      : stats.error_rate < 0.05
      ? 'warning'
      : 'error';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Schema Validation Details
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Validation Health
            </Typography>
            <Chip
              label={`${errorRate}% Error Rate`}
              color={errorRateColor}
              sx={{ ml: 2 }}
            />
          </Box>

          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.hourly_stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={theme.palette.primary.main}
                  name="Total Validations"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke={theme.palette.error.main}
                  name="Failed Validations"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Validation Errors
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50} />
                <TableCell>Event Type</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Error Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.map((error, index) => (
                <ErrorRow key={index} error={error} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}; 