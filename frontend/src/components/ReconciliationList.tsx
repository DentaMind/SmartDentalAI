import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  TableSortLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

interface Reconciliation {
  id: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  total_transactions: number;
  matched_transactions: number;
  total_amount: number;
  matched_amount: number;
  created_by: number;
  approved_by: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

type Order = 'asc' | 'desc';
type SortField = 'start_date' | 'end_date' | 'status' | 'total_transactions' | 'matched_transactions' | 'total_amount' | 'matched_amount';

const ReconciliationList: React.FC = () => {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null);
  const [newReconciliation, setNewReconciliation] = useState({
    start_date: new Date(),
    end_date: new Date(),
  });

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting state
  const [orderBy, setOrderBy] = useState<SortField>('start_date');
  const [order, setOrder] = useState<Order>('desc');

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    try {
      const response = await axios.get('/api/finance/reconciliations');
      setReconciliations(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch reconciliations');
      setLoading(false);
    }
  };

  const handleCreateReconciliation = async () => {
    try {
      await axios.post('/api/finance/reconciliations', newReconciliation);
      setOpenDialog(false);
      fetchReconciliations();
    } catch (err) {
      setError('Failed to create reconciliation');
    }
  };

  const handleUpdateReconciliation = async (id: number, status: string) => {
    try {
      await axios.put(`/api/finance/reconciliations/${id}`, { status });
      fetchReconciliations();
    } catch (err) {
      setError('Failed to update reconciliation');
    }
  };

  const handleDeleteReconciliation = async (id: number) => {
    try {
      await axios.delete(`/api/finance/reconciliations/${id}`);
      fetchReconciliations();
    } catch (err) {
      setError('Failed to delete reconciliation');
    }
  };

  const handleExportReconciliation = async (id: number) => {
    try {
      const response = await axios.get(`/api/finance/reconciliations/${id}/export`);
      const { content, filename } = response.data;
      
      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export reconciliation');
    }
  };

  const handleRequestSort = (property: SortField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredReconciliations = reconciliations
    .filter((reconciliation) => {
      if (statusFilter !== 'all' && reconciliation.status !== statusFilter) {
        return false;
      }

      if (dateRangeFilter.start && new Date(reconciliation.start_date) < dateRangeFilter.start) {
        return false;
      }

      if (dateRangeFilter.end && new Date(reconciliation.end_date) > dateRangeFilter.end) {
        return false;
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          reconciliation.id.toString().includes(searchLower) ||
          formatDate(reconciliation.start_date).includes(searchLower) ||
          formatDate(reconciliation.end_date).includes(searchLower) ||
          reconciliation.status.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => {
      const isAsc = order === 'asc';
      switch (orderBy) {
        case 'start_date':
          return isAsc
            ? new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
            : new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case 'end_date':
          return isAsc
            ? new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
            : new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
        case 'status':
          return isAsc
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        case 'total_transactions':
          return isAsc
            ? a.total_transactions - b.total_transactions
            : b.total_transactions - a.total_transactions;
        case 'matched_transactions':
          return isAsc
            ? a.matched_transactions - b.matched_transactions
            : b.matched_transactions - a.matched_transactions;
        case 'total_amount':
          return isAsc
            ? a.total_amount - b.total_amount
            : b.total_amount - a.total_amount;
        case 'matched_amount':
          return isAsc
            ? a.matched_amount - b.matched_amount
            : b.matched_amount - a.matched_amount;
        default:
          return 0;
      }
    });

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Reconciliations</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Reconciliation
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={dateRangeFilter.start}
                onChange={(date) => setDateRangeFilter({ ...dateRangeFilter, start: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={dateRangeFilter.end}
                onChange={(date) => setDateRangeFilter({ ...dateRangeFilter, end: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'start_date'}
                  direction={orderBy === 'start_date' ? order : 'asc'}
                  onClick={() => handleRequestSort('start_date')}
                >
                  Date Range
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'matched_transactions'}
                  direction={orderBy === 'matched_transactions' ? order : 'asc'}
                  onClick={() => handleRequestSort('matched_transactions')}
                >
                  Transactions
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'matched_amount'}
                  direction={orderBy === 'matched_amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('matched_amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReconciliations
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((reconciliation) => (
                <TableRow key={reconciliation.id}>
                  <TableCell>
                    {formatDate(reconciliation.start_date)} - {formatDate(reconciliation.end_date)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={reconciliation.status}
                      color={getStatusColor(reconciliation.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {reconciliation.matched_transactions} / {reconciliation.total_transactions}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(reconciliation.matched_amount)} / {formatCurrency(reconciliation.total_amount)}
                  </TableCell>
                  <TableCell>
                    <LinearProgress
                      variant="determinate"
                      value={(reconciliation.matched_transactions / reconciliation.total_transactions) * 100}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        onClick={() => setSelectedReconciliation(reconciliation)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => {
                          setSelectedReconciliation(reconciliation);
                          setOpenDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export">
                      <IconButton
                        onClick={() => handleExportReconciliation(reconciliation.id)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDeleteReconciliation(reconciliation.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReconciliations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {selectedReconciliation ? 'Edit Reconciliation' : 'New Reconciliation'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box mt={2}>
              <DatePicker
                label="Start Date"
                value={newReconciliation.start_date}
                onChange={(date) => setNewReconciliation({ ...newReconciliation, start_date: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
            <Box mt={2}>
              <DatePicker
                label="End Date"
                value={newReconciliation.end_date}
                onChange={(date) => setNewReconciliation({ ...newReconciliation, end_date: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateReconciliation} color="primary">
            {selectedReconciliation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReconciliationList; 