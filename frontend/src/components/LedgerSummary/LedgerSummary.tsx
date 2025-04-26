import React from 'react';
import {
  Box,
  Chip,
  Typography,
  Tooltip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { LedgerEntry } from '@hooks/useLedgerData';

interface LedgerSummaryProps {
  cdtCode: string;
  description: string;
  entries: LedgerEntry[];
  summary: {
    amountBilled: number;
    insurancePaid: number;
    patientPaid: number;
    adjustments: number;
    remainingBalance: number;
  };
}

export const LedgerSummary: React.FC<LedgerSummaryProps> = ({
  cdtCode,
  description,
  entries,
  summary,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const getStatusColor = (status: LedgerEntry['status']) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'denied':
        return 'error';
      case 'submitted':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <Chip
          icon={<AccountBalanceIcon />}
          label={`Balance: ${formatCurrency(summary.remainingBalance)}`}
          color={summary.remainingBalance > 0 ? 'warning' : 'success'}
          size="small"
        />
        {entries.length > 0 && (
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ ml: 'auto' }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      <Collapse in={expanded}>
        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Billed</TableCell>
              <TableCell align="right">Insurance</TableCell>
              <TableCell align="right">Patient</TableCell>
              <TableCell align="right">Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.dateOfService)}</TableCell>
                <TableCell>
                  <Chip
                    label={entry.status}
                    color={getStatusColor(entry.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.charges.amountBilled)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.charges.insurancePaid)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.charges.patientPaid)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.charges.remainingBalance)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell align="right">
                {formatCurrency(summary.amountBilled)}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(summary.insurancePaid)}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(summary.patientPaid)}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(summary.remainingBalance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Collapse>
    </Box>
  );
}; 