import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Rating,
  Checkbox,
  Divider,
  Alert,
  CircularProgress,
  Collapse
} from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { useApi } from '../../hooks/useApi';

interface AiFeedbackFormProps {
  suggestionId: string;
  providerId: string;
  diagnosisId?: string;
  initialStatus?: string;
  procedureName?: string;
  onFeedbackSubmitted?: (feedback: any) => void;
  compact?: boolean;
}

const AiFeedbackForm: React.FC<AiFeedbackFormProps> = ({
  suggestionId,
  providerId,
  diagnosisId,
  initialStatus = 'pending',
  procedureName,
  onFeedbackSubmitted,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(!compact);
  const [status, setStatus] = useState(initialStatus);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [modifiedProcedure, setModifiedProcedure] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [useForTraining, setUseForTraining] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const api = useApi();

  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatus(event.target.value);
  };

  const handleAccuracyChange = (_: React.SyntheticEvent, value: number | null) => {
    setAccuracy(value);
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(event.target.value);
  };

  const handleModifiedProcedureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModifiedProcedure(event.target.value);
  };

  const handleRejectionReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRejectionReason(event.target.value);
  };

  const handleUseForTrainingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseForTraining(event.target.checked);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create the feedback payload
      const feedback = {
        suggestion_id: suggestionId,
        status,
        provider_id: providerId,
        notes,
        modified_procedure: status === 'modified' ? modifiedProcedure : undefined,
        rejection_reason: status === 'rejected' ? rejectionReason : undefined,
        accuracy: accuracy,
        is_used_for_training: useForTraining
      };
      
      // Submit feedback to the API
      await api.post('/api/treatments/feedback', feedback);
      
      setSuccess(true);
      
      // Call the callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedback);
      }
      
      // Reset form after 2 seconds if not in compact mode
      if (!compact) {
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } else {
        // Close the form in compact mode
        setExpanded(false);
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.detail || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle expansion in compact mode
  const toggleExpanded = () => {
    if (compact) {
      setExpanded(!expanded);
    }
  };

  return (
    <Card variant={compact ? "outlined" : "elevation"}>
      <CardContent sx={{ p: compact ? 1.5 : 2 }}>
        {compact && (
          <Box 
            onClick={toggleExpanded} 
            sx={{ 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box display="flex" alignItems="center">
              <FeedbackIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                {expanded ? 'Provide Feedback' : 'Add Feedback'}
              </Typography>
            </Box>
            {success && !expanded && (
              <Alert severity="success" sx={{ py: 0, ml: 2 }}>
                Feedback submitted
              </Alert>
            )}
          </Box>
        )}

        {!compact && (
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FeedbackIcon sx={{ mr: 1 }} />
            AI Suggestion Feedback
          </Typography>
        )}

        <Collapse in={expanded}>
          {!compact && <Divider sx={{ my: 1.5 }} />}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: compact ? 1 : 0 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2, mt: compact ? 1 : 0 }}>
              Feedback submitted successfully!
            </Alert>
          )}

          {procedureName && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Suggestion:</strong> {procedureName}
            </Typography>
          )}

          <Box mt={compact ? 1 : 2}>
            <Typography variant="subtitle2" gutterBottom>Decision</Typography>
            <RadioGroup
              value={status}
              onChange={handleStatusChange}
              row={compact}
            >
              <FormControlLabel value="accepted" control={<Radio size="small" />} label="Accept" />
              <FormControlLabel value="modified" control={<Radio size="small" />} label="Modify" />
              <FormControlLabel value="rejected" control={<Radio size="small" />} label="Reject" />
            </RadioGroup>
          </Box>

          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              AI Accuracy Rating
            </Typography>
            <Rating
              name="accuracy"
              value={accuracy}
              onChange={handleAccuracyChange}
              precision={0.5}
            />
          </Box>

          {status === 'modified' && (
            <Box mt={2}>
              <TextField
                label="Modified Procedure"
                value={modifiedProcedure}
                onChange={handleModifiedProcedureChange}
                fullWidth
                size="small"
                placeholder="Enter the corrected procedure"
              />
            </Box>
          )}

          {status === 'rejected' && (
            <Box mt={2}>
              <TextField
                label="Rejection Reason"
                value={rejectionReason}
                onChange={handleRejectionReasonChange}
                fullWidth
                size="small"
                placeholder="Why is this suggestion not appropriate?"
              />
            </Box>
          )}

          <Box mt={2}>
            <TextField
              label="Additional Notes"
              value={notes}
              onChange={handleNotesChange}
              fullWidth
              multiline
              rows={compact ? 2 : 3}
              size="small"
              placeholder="Add any additional comments about this AI suggestion"
            />
          </Box>

          <Box mt={2} display="flex" alignItems="center" justifyContent="space-between">
            <FormControlLabel
              control={
                <Checkbox
                  checked={useForTraining}
                  onChange={handleUseForTrainingChange}
                  size="small"
                />
              }
              label="Use for AI training"
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              size="small"
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AiFeedbackForm; 