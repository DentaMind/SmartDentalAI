import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon
} from '@mui/icons-material';
import { templateService, Template, TemplateCreate, TemplateUpdate } from '../services/templateService';
import { MessageCategory, CommunicationIntent } from '../types/communication';

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateCreate | TemplateUpdate>({
    id: '',
    name: '',
    subject: '',
    body: '',
    category: undefined,
    intent: undefined,
    variables: {},
    is_active: true
  });
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category,
        intent: template.intent,
        variables: template.variables || {},
        is_active: template.is_active
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        id: '',
        name: '',
        subject: '',
        body: '',
        category: undefined,
        intent: undefined,
        variables: {},
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTemplate(null);
    setFormData({
      id: '',
      name: '',
      subject: '',
      body: '',
      category: undefined,
      intent: undefined,
      variables: {},
      is_active: true
    });
  };

  const handleSubmit = async () => {
    try {
      if (selectedTemplate) {
        await templateService.updateTemplate(selectedTemplate.id, formData as TemplateUpdate);
        setSuccess('Template updated successfully');
      } else {
        await templateService.createTemplate(formData as TemplateCreate);
        setSuccess('Template created successfully');
      }
      handleCloseDialog();
      fetchTemplates();
    } catch (err) {
      setError('Failed to save template');
      console.error(err);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templateService.deleteTemplate(templateId);
        setSuccess('Template deleted successfully');
        fetchTemplates();
      } catch (err) {
        setError('Failed to delete template');
        console.error(err);
      }
    }
  };

  const handleToggleStatus = async (template: Template) => {
    try {
      if (template.is_active) {
        await templateService.deactivateTemplate(template.id);
      } else {
        await templateService.activateTemplate(template.id);
      }
      setSuccess(`Template ${template.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchTemplates();
    } catch (err) {
      setError('Failed to update template status');
      console.error(err);
    }
  };

  const handleOpenPreview = (template: Template) => {
    setSelectedTemplate(template);
    const variables = templateService.extractVariables(template.subject + template.body);
    const initialData: Record<string, any> = {};
    variables.forEach(variable => {
      initialData[variable] = '';
    });
    setPreviewData(initialData);
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setSelectedTemplate(null);
    setPreviewData({});
  };

  const handlePreviewChange = (variable: string, value: string) => {
    setPreviewData(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const renderPreview = async () => {
    if (!selectedTemplate) return;
    try {
      const rendered = await templateService.renderTemplate(selectedTemplate.id, previewData);
      return (
        <Box mt={2}>
          <Typography variant="h6">Preview</Typography>
          <Typography variant="subtitle1">Subject: {rendered.subject}</Typography>
          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
            {rendered.body}
          </Typography>
        </Box>
      );
    } catch (err) {
      return <Alert severity="error">Failed to render preview</Alert>;
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Message Templates</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Template
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Intent</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.category || '-'}</TableCell>
                  <TableCell>{template.intent || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={template.is_active ? 'Active' : 'Inactive'}
                      color={template.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenPreview(template)}>
                      <PreviewIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog(template)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleToggleStatus(template)}>
                      {template.is_active ? <DeactivateIcon /> : <ActivateIcon />}
                    </IconButton>
                    <IconButton onClick={() => handleDelete(template.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTemplate ? 'Edit Template' : 'New Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MessageCategory })}
                  label="Category"
                >
                  {Object.values(MessageCategory).map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Intent</InputLabel>
                <Select
                  value={formData.intent || ''}
                  onChange={(e) => setFormData({ ...formData, intent: e.target.value as CommunicationIntent })}
                  label="Intent"
                >
                  {Object.values(CommunicationIntent).map((intent) => (
                    <MenuItem key={intent} value={intent}>
                      {intent}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Body"
                multiline
                rows={4}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPreview} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>Preview Template</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Typography variant="h6">{selectedTemplate.name}</Typography>
              <Box mt={2}>
                {Object.entries(previewData).map(([variable, value]) => (
                  <TextField
                    key={variable}
                    fullWidth
                    label={variable}
                    value={value}
                    onChange={(e) => handlePreviewChange(variable, e.target.value)}
                    sx={{ mb: 2 }}
                  />
                ))}
              </Box>
              {renderPreview()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateManager; 