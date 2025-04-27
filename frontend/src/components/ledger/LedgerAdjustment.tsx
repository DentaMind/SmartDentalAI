import React, { useState } from 'react';
import { useLedgerEvents } from '@/hooks/useLedgerEvents';
import { useMutation } from 'react-query';
import { apiRequest } from '@/lib/apiRequest';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

interface LedgerAdjustmentProps {
  patientId: number;
  ledgerId: number;
}

type AdjustmentType = 'credit' | 'debit' | 'writeoff' | 'refund';

export const LedgerAdjustment: React.FC<LedgerAdjustmentProps> = ({
  patientId,
  ledgerId
}) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<AdjustmentType>('credit');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    collectLedgerAdjustment,
    collectLedgerRefund,
    collectLedgerWriteoff
  } = useLedgerEvents();

  const adjustmentMutation = useMutation(
    async (data: any) => {
      const response = await apiRequest('POST', `/api/ledger/${ledgerId}/adjust`, data);
      return response;
    },
    {
      onSuccess: async (response, variables) => {
        switch (variables.type) {
          case 'refund':
            await collectLedgerRefund(ledgerId, Number(amount), {
              reason,
              source: 'user',
              patientId
            });
            break;
          case 'writeoff':
            await collectLedgerWriteoff(ledgerId, Number(amount), {
              reason,
              source: 'user',
              patientId
            });
            break;
          default:
            await collectLedgerAdjustment(ledgerId, Number(amount), {
              type,
              reason,
              source: 'user',
              patientId
            });
        }
      },
      onError: (error: Error) => {
        setError(error.message);
      }
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || isNaN(Number(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await adjustmentMutation.mutateAsync({
        amount: Number(amount),
        type,
        reason
      });

      // Reset form
      setAmount('');
      setReason('');
    } catch (err) {
      // Error handling is done in mutation options
    }
  };

  return (
    <Box component={Paper} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        Ledger Adjustment
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Adjustment Type</InputLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as AdjustmentType)}
                required
              >
                <MenuItem value="credit">Credit</MenuItem>
                <MenuItem value="debit">Debit</MenuItem>
                <MenuItem value="writeoff">Write-off</MenuItem>
                <MenuItem value="refund">Refund</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              InputProps={{
                startAdornment: <span>$</span>
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reason"
              multiline
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={adjustmentMutation.isLoading}
            >
              Submit Adjustment
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}; 