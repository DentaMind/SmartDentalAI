import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

// Types
interface Transaction {
  id: string;
  transaction_type: 'expense' | 'income';
  amount: number;
  date: string;
  description: string;
  category: string;
  payment_method: string;
  status: string;
}

interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  income_by_category: Record<string, number>;
  expenses_by_category: Record<string, number>;
  top_vendors: Array<{ name: string; total: number }>;
  recent_transactions: Transaction[];
}

interface FinancialForecast {
  projected_income: number;
  projected_expenses: number;
  projected_profit: number;
  confidence_score: number;
  assumptions: Record<string, any>;
  risk_factors: string[];
}

const FinanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [forecast, setForecast] = useState<FinancialForecast | null>(null);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    transaction_type: 'expense',
    amount: 0,
    date: new Date().toISOString(),
    category: '',
    payment_method: '',
  });

  // Fetch financial data
  const fetchFinancialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, forecastRes] = await Promise.all([
        fetch(`/api/finance/summary?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`),
        fetch('/api/finance/forecast?months=3'),
      ]);

      if (!summaryRes.ok || !forecastRes.ok) {
        throw new Error('Failed to fetch financial data');
      }

      const summaryData = await summaryRes.json();
      const forecastData = await forecastRes.json();

      setSummary(summaryData);
      setForecast(forecastData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [startDate, endDate]);

  // Handle transaction creation
  const handleCreateTransaction = async () => {
    try {
      const response = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      setShowTransactionDialog(false);
      fetchFinancialData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    }
  };

  // Export financial data
  const handleExport = async () => {
    try {
      const response = await fetch('/api/finance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          format: 'csv',
          include_transactions: true,
          include_reconciliations: true,
          include_forecasts: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_data_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" color="primary">Total Income</Typography>
          <Typography variant="h4">${summary?.total_income.toFixed(2)}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" color="error">Total Expenses</Typography>
          <Typography variant="h4">${summary?.total_expenses.toFixed(2)}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" color={summary?.net_profit >= 0 ? 'success' : 'error'}>Net Profit</Typography>
          <Typography variant="h4">${summary?.net_profit.toFixed(2)}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  // Render income/expense chart
  const renderIncomeExpenseChart = () => {
    const data = Object.entries(summary?.income_by_category || {}).map(([category, amount]) => ({
      category,
      income: amount,
      expenses: summary?.expenses_by_category[category] || 0,
    }));

    return (
      <Paper sx={{ p: 2, height: 400 }}>
        <Typography variant="h6">Income vs Expenses by Category</Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="income" fill="#4caf50" />
            <Bar dataKey="expenses" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render forecast section
  const renderForecast = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Financial Forecast</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1">Projected Income</Typography>
          <Typography variant="h5">${forecast?.projected_income.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1">Projected Expenses</Typography>
          <Typography variant="h5">${forecast?.projected_expenses.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1">Projected Profit</Typography>
          <Typography variant="h5" color={forecast?.projected_profit >= 0 ? 'success' : 'error'}>
            ${forecast?.projected_profit.toFixed(2)}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2">Confidence Score: {(forecast?.confidence_score * 100).toFixed(1)}%</Typography>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Financial Dashboard</Typography>
        <Box>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExport} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchFinancialData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowTransactionDialog(true)}
          >
            New Transaction
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => newValue && setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => newValue && setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderSummaryCards()}
          <Box sx={{ mt: 3 }}>
            {renderIncomeExpenseChart()}
          </Box>
          <Box sx={{ mt: 3 }}>
            {renderForecast()}
          </Box>
        </>
      )}

      <Dialog open={showTransactionDialog} onClose={() => setShowTransactionDialog(false)}>
        <DialogTitle>New Transaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={newTransaction.transaction_type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, transaction_type: e.target.value })}
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                >
                  {newTransaction.transaction_type === 'expense' ? (
                    <>
                      <MenuItem value="lab">Lab</MenuItem>
                      <MenuItem value="supplies">Supplies</MenuItem>
                      <MenuItem value="software">Software</MenuItem>
                      <MenuItem value="rent">Rent</MenuItem>
                      <MenuItem value="utilities">Utilities</MenuItem>
                      <MenuItem value="payroll">Payroll</MenuItem>
                      <MenuItem value="insurance">Insurance</MenuItem>
                      <MenuItem value="marketing">Marketing</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem value="insurance">Insurance</MenuItem>
                      <MenuItem value="patient">Patient</MenuItem>
                      <MenuItem value="refund">Refund</MenuItem>
                      <MenuItem value="adjustment">Adjustment</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={newTransaction.payment_method}
                  onChange={(e) => setNewTransaction({ ...newTransaction, payment_method: e.target.value })}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                  <MenuItem value="ach">ACH</MenuItem>
                  <MenuItem value="stripe">Stripe</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransactionDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTransaction} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinanceDashboard; 