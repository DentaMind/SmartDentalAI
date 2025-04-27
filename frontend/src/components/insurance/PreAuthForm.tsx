import React, { useState } from 'react';
import { useInsuranceEvents } from '@/hooks/useInsuranceEvents';
import { useQuery, useMutation } from 'react-query';
import { apiRequest } from '@/lib/apiRequest';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

interface PreAuthFormProps {
  patientId: number;
}

export const PreAuthForm: React.FC<PreAuthFormProps> = ({ patientId }) => {
  const [procedureCode, setProcedureCode] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    collectPreAuthSubmitted,
    collectPreAuthDecision,
    collectPreAuthDocumentUploaded
  } = useInsuranceEvents();

  const { data: procedures } = useQuery(
    'procedures',
    () => apiRequest('GET', '/api/procedures')
  );

  const submitMutation = useMutation(
    async (data: any) => {
      const response = await apiRequest('POST', `/api/patients/${patientId}/preauth`, data);
      return response;
    },
    {
      onSuccess: async (response) => {
        await collectPreAuthSubmitted(patientId, response.preAuthId, {
          procedureCode,
          diagnosis,
          source: 'user'
        });
      },
      onError: (error: Error) => {
        setError(error.message);
      }
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await submitMutation.mutateAsync({
        procedureCode,
        diagnosis,
        notes
      });
    } catch (err) {
      // Error handling is done in mutation options
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiRequest(
      'POST',
      `/api/patients/${patientId}/preauth/documents`,
      formData
    );

    await collectPreAuthDocumentUploaded(patientId, response.preAuthId, file.name, {
      source: 'user',
      documentType: file.type
    });
  };

  return (
    <Box component={Paper} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        Pre-Authorization Request
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
              <InputLabel>Procedure Code</InputLabel>
              <Select
                value={procedureCode}
                onChange={(e) => setProcedureCode(e.target.value)}
                required
              >
                {procedures?.map((proc: any) => (
                  <MenuItem key={proc.code} value={proc.code}>
                    {proc.code} - {proc.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              style={{ display: 'none' }}
              id="preauth-file-upload"
            />
            <label htmlFor="preauth-file-upload">
              <Button component="span" variant="outlined" sx={{ mr: 2 }}>
                Upload Supporting Documents
              </Button>
            </label>

            <Button
              type="submit"
              variant="contained"
              disabled={submitMutation.isLoading}
            >
              Submit Pre-Authorization
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}; 