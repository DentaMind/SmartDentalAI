import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
  Checkbox,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  transaction_type: 'expense' | 'income';
  category: string;
  payment_method: string;
  status: string;
  bank_reference: string | null;
  notes: string | null;
}

interface ReconciliationTransaction {
  id: number;
  reconciliation_id: number;
  transaction_id: number;
  bank_reference: string;
  is_matched: boolean;
  matched_at: string | null;
  notes: string | null;
}

interface Reconciliation {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
  total_transactions: number;
  matched_transactions: number;
  total_amount: number;
  matched_amount: number;
}

interface ReconciliationReport {
  reconciliation: Reconciliation;
  summary: {
    total_transactions: number;
    matched_transactions: number;
    unmatched_transactions: number;
    total_amount: number;
    matched_amount: number;
    unmatched_amount: number;
    completion_percentage: number;
  };
  transactions: Transaction[];
  reconciliation_transactions: ReconciliationTransaction[];
}

interface ReconciliationDetailProps {
  reconciliationId: number;
}

interface BulkMatchDialogProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onMatch: (matches: { transactionId: number; bankReference: string }[]) => void;
}

const BulkMatchDialog: React.FC<BulkMatchDialogProps> = ({ open, onClose, transactions, onMatch }) => {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [bankReferences, setBankReferences] = useState<Record<number, string>>({});

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleSelectTransaction = (transactionId: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleBankReferenceChange = (transactionId: number, value: string) => {
    setBankReferences(prev => ({ ...prev, [transactionId]: value }));
  };

  const handleSubmit = () => {
    const matches = Array.from(selectedTransactions).map(transactionId => ({
      transactionId,
      bankReference: bankReferences[transactionId] || '',
    }));
    onMatch(matches);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Match Transactions</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Button onClick={handleSelectAll}>
            {selectedTransactions.size === transactions.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedTransactions.size === transactions.length}
                    indeterminate={selectedTransactions.size > 0 && selectedTransactions.size < transactions.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Bank Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedTransactions.has(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={bankReferences[transaction.id] || ''}
                      onChange={(e) => handleBankReferenceChange(transaction.id, e.target.value)}
                      disabled={!selectedTransactions.has(transaction.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          disabled={selectedTransactions.size === 0 || !Array.from(selectedTransactions).every(id => bankReferences[id])}
        >
          Match Selected
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReconciliationDetail: React.FC<ReconciliationDetailProps> = ({ reconciliationId }) => {
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [matchingDialogOpen, setMatchingDialogOpen] = useState(false);
  const [bankReference, setBankReference] = useState('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [bulkMatchDialogOpen, setBulkMatchDialogOpen] = useState(false);

  useEffect(() => {
    fetchReconciliationReport();
  }, [reconciliationId]);

  const fetchReconciliationReport = async () => {
    try {
      const response = await axios.get(`/api/finance/reconciliations/${reconciliationId}`);
      setReport(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch reconciliation report');
      setLoading(false);
    }
  };

  const handleMatchTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      await axios.post(`/api/finance/reconciliations/${reconciliationId}/transactions`, {
        transaction_id: selectedTransaction.id,
        bank_reference: bankReference,
      });
      setMatchingDialogOpen(false);
      setBankReference('');
      fetchReconciliationReport();
      showSnackbar('Transaction matched successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to match transaction', 'error');
    }
  };

  const handleUpdateMatch = async (transactionId: number, isMatched: boolean) => {
    try {
      await axios.put(`/api/finance/reconciliations/${reconciliationId}/transactions/${transactionId}`, {
        is_matched: isMatched,
      });
      fetchReconciliationReport();
      showSnackbar(`Transaction ${isMatched ? 'matched' : 'unmatched'} successfully`, 'success');
    } catch (err) {
      showSnackbar('Failed to update transaction match', 'error');
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      const response = await axios.get(`/api/finance/reconciliations/${reconciliationId}/export`, {
        params: { format },
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reconciliation_${reconciliationId}_${format}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSnackbar(`Exported successfully in ${format.toUpperCase()} format`, 'success');
    } catch (err) {
      showSnackbar('Failed to export reconciliation', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
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

  const handleBulkMatch = async (matches: { transactionId: number; bankReference: string }[]) => {
    try {
      await axios.post(`/api/finance/reconciliations/${reconciliationId}/transactions/bulk`, {
        matches,
      });
      fetchReconciliationReport();
      showSnackbar('Transactions matched successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to match transactions', 'error');
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!report) {
    return <Typography>No reconciliation data found</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          Reconciliation Details
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={() => { handleExport('csv'); setExportMenuAnchor(null); }}>
              Export as CSV
            </MenuItem>
            <MenuItem onClick={() => { handleExport('pdf'); setExportMenuAnchor(null); }}>
              Export as PDF
            </MenuItem>
            <MenuItem onClick={() => { handleExport('excel'); setExportMenuAnchor(null); }}>
              Export as Excel
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Typography>
              Date Range: {formatDate(report.reconciliation.start_date)} - {formatDate(report.reconciliation.end_date)}
            </Typography>
            <Typography>
              Status: <Chip label={report.reconciliation.status} color="primary" />
            </Typography>
            <Typography>
              Transactions: {report.summary.matched_transactions} / {report.summary.total_transactions}
            </Typography>
            <Typography>
              Amount: {formatCurrency(report.summary.matched_amount)} / {formatCurrency(report.summary.total_amount)}
            </Typography>
            <Box mt={2}>
              <LinearProgress
                variant="determinate"
                value={report.summary.completion_percentage}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AttachMoneyIcon />}
                  onClick={() => {
                    const unmatched = report.transactions.filter(
                      (t) => !report.reconciliation_transactions.find((rt) => rt.transaction_id === t.id)
                    );
                    if (unmatched.length > 0) {
                      setSelectedTransaction(unmatched[0]);
                      setMatchingDialogOpen(true);
                    }
                  }}
                >
                  Match Next Unmatched
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  onClick={() => setBulkMatchDialogOpen(true)}
                >
                  Bulk Match
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Bank Reference</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.transactions.map((transaction) => {
              const reconciliationTransaction = report.reconciliation_transactions.find(
                (rt) => rt.transaction_id === transaction.id
              );

              return (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>{transaction.transaction_type}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.payment_method}</TableCell>
                  <TableCell>
                    {reconciliationTransaction?.bank_reference || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={reconciliationTransaction?.is_matched ? 'Matched' : 'Unmatched'}
                      color={reconciliationTransaction?.is_matched ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    {!reconciliationTransaction ? (
                      <Tooltip title="Match Transaction">
                        <IconButton
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setMatchingDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip title="Mark as Unmatched">
                          <IconButton
                            onClick={() => handleUpdateMatch(reconciliationTransaction.id, false)}
                            disabled={!reconciliationTransaction.is_matched}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Mark as Matched">
                          <IconButton
                            onClick={() => handleUpdateMatch(reconciliationTransaction.id, true)}
                            disabled={reconciliationTransaction.is_matched}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={matchingDialogOpen} onClose={() => setMatchingDialogOpen(false)}>
        <DialogTitle>Match Transaction</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              Transaction Details
            </Typography>
            <Typography>Date: {selectedTransaction && formatDate(selectedTransaction.date)}</Typography>
            <Typography>Description: {selectedTransaction?.description}</Typography>
            <Typography>Amount: {selectedTransaction && formatCurrency(selectedTransaction.amount)}</Typography>
          </Box>
          <Box mt={2}>
            <TextField
              autoFocus
              margin="dense"
              label="Bank Reference"
              fullWidth
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMatchingDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMatchTransaction} color="primary" disabled={!bankReference}>
            Match
          </Button>
        </DialogActions>
      </Dialog>

      <BulkMatchDialog
        open={bulkMatchDialogOpen}
        onClose={() => setBulkMatchDialogOpen(false)}
        transactions={report?.transactions.filter(
          t => !report.reconciliation_transactions.find(rt => rt.transaction_id === t.id)
        ) || []}
        onMatch={handleBulkMatch}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReconciliationDetail; 