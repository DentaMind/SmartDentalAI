import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import ReconciliationList from './ReconciliationList';
import ReconciliationDetail from './ReconciliationDetail';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  status: 'pending' | 'approved' | 'rejected' | 'reconciled';
  bank_reference?: string;
  notes?: string;
}

interface Reconciliation {
  id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  total_transactions: number;
  matched_transactions: number;
  total_amount: number;
  matched_amount: number;
  created_by: string;
  approved_by?: string;
  created_at: string;
  completed_at?: string;
}

interface ReconciliationWorkflowProps {
  transactions: Transaction[];
  reconciliations: Reconciliation[];
  onMatchTransaction: (transactionId: string, bankReference: string) => void;
  onApproveTransaction: (transactionId: string) => void;
  onRejectTransaction: (transactionId: string, reason: string) => void;
  onStartReconciliation: (startDate: string, endDate: string) => void;
  onCompleteReconciliation: (reconciliationId: string) => void;
  onCancelReconciliation: (reconciliationId: string, reason: string) => void;
  onExportReport: (reconciliationId: string, format: 'pdf' | 'csv') => void;
}

const ReconciliationWorkflow: React.FC = () => {
  const [selectedReconciliationId, setSelectedReconciliationId] = useState<number | null>(null);

  const handleViewReconciliation = (id: number) => {
    setSelectedReconciliationId(id);
  };

  const handleBackToList = () => {
    setSelectedReconciliationId(null);
  };

  return (
    <Box>
      {selectedReconciliationId ? (
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToList}
            sx={{ mb: 2 }}
          >
            Back to List
          </Button>
          <ReconciliationDetail reconciliationId={selectedReconciliationId} />
        </Box>
      ) : (
        <ReconciliationList onViewReconciliation={handleViewReconciliation} />
      )}
    </Box>
  );
};

export default ReconciliationWorkflow; 