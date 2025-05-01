import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { EmailService } from '../services/emailService';

interface EmailComposeProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialTo?: string;
  initialSubject?: string;
}

const EmailCompose: React.FC<EmailComposeProps> = ({
  onSuccess,
  onCancel,
  initialTo = '',
  initialSubject = ''
}) => {
  const [formData, setFormData] = useState({
    to: initialTo,
    cc: '',
    bcc: '',
    subject: initialSubject,
    body: '',
    priority: 'normal',
    category: 'general'
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      await EmailService.sendEmail(formDataToSend);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="To"
          value={formData.to}
          onChange={handleChange('to')}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="CC"
          value={formData.cc}
          onChange={handleChange('cc')}
          margin="normal"
        />
        <TextField
          fullWidth
          label="BCC"
          value={formData.bcc}
          onChange={handleChange('bcc')}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Subject"
          value={formData.subject}
          onChange={handleChange('subject')}
          margin="normal"
          required
        />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            select
            label="Priority"
            value={formData.priority}
            onChange={handleChange('priority')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
          <TextField
            select
            label="Category"
            value={formData.category}
            onChange={handleChange('category')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="patient">Patient</MenuItem>
            <MenuItem value="insurance">Insurance</MenuItem>
          </TextField>
        </Box>
        <TextField
          fullWidth
          label="Message"
          value={formData.body}
          onChange={handleChange('body')}
          margin="normal"
          multiline
          rows={10}
          required
        />
      </Box>

      {attachments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Attachments:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => handleRemoveAttachment(index)}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="attach-file"
            type="file"
            multiple
            onChange={handleFileAttach}
          />
          <label htmlFor="attach-file">
            <IconButton component="span">
              <AttachFileIcon />
            </IconButton>
          </label>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading || !formData.to || !formData.subject || !formData.body}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EmailCompose; 