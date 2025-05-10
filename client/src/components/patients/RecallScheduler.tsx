import React, { useState, useEffect } from 'react';
import { Card, CardContent, Divider, Typography, Grid, Box, Button, TextField, MenuItem, FormControl, InputLabel, Select, FormHelperText, Alert, Tabs, Tab, Badge } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { LoadingAnimation } from '@/components/ui/loading-animation';

interface RecallSchedulerProps {
  patientId: string;
  initialRecalls?: any[];
  onRecallAdded?: (recall: any) => void;
  onRecallUpdated?: (recall: any) => void;
  onRecallDeleted?: (recallId: string) => void;
}

// Define the interface for a recall history item
interface RecallHistoryItem {
  id: string;
  recall_type: string;
  due_date: string;
  appointment_date?: string;
  status: 'completed' | 'missed' | 'scheduled';
  notes?: string;
}

/**
 * Component for scheduling and managing patient recall appointments
 */
const RecallScheduler: React.FC<RecallSchedulerProps> = ({
  patientId,
  initialRecalls = [],
  onRecallAdded,
  onRecallUpdated,
  onRecallDeleted
}) => {
  const [recalls, setRecalls] = useState<any[]>(initialRecalls);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 for Active Recalls, 1 for History
  const [recallHistory, setRecallHistory] = useState<RecallHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    recallType: 'hygiene',
    frequency: '6', // Using the string value to match API
    customDays: '',
    nextDueDate: null,
    notes: '',
    reminderDays: [30, 14, 7, 1],
    maxReminders: 3
  });
  
  // Fetch recalls on component mount if not provided
  useEffect(() => {
    if (initialRecalls.length === 0) {
      fetchRecalls();
    }
  }, [patientId]);
  
  // Fetch recall history when the history tab is selected
  useEffect(() => {
    if (activeTab === 1) {
      fetchRecallHistory();
    }
  }, [activeTab]);
  
  const fetchRecalls = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patient-recalls/patient/${patientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recall schedules');
      }
      const data = await response.json();
      setRecalls(data);
    } catch (err) {
      console.error('Error fetching recalls:', err);
      setError('Failed to load recall schedules');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRecallHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/patient-recalls/patient/${patientId}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch recall history');
      }
      const data = await response.json();
      setRecallHistory(data);
    } catch (err) {
      console.error('Error fetching recall history:', err);
      // Don't set error state here to avoid disrupting the main UI
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format the data for the API
      const recallData = {
        patient_id: patientId,
        recall_type: formData.recallType,
        frequency: formData.frequency,
        custom_days: formData.frequency === 'custom' ? Number(formData.customDays) : undefined,
        next_due_date: formData.nextDueDate,
        notes: formData.notes,
        reminder_days_before: formData.reminderDays,
        max_reminders: formData.maxReminders
      };
      
      const response = await fetch('/api/patient-recalls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recallData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create recall schedule');
      }
      
      const data = await response.json();
      
      // Update state with the new recall
      setRecalls(prev => [...prev, data]);
      
      // Reset form
      setFormData({
        recallType: 'hygiene',
        frequency: '6',
        customDays: '',
        nextDueDate: null,
        notes: '',
        reminderDays: [30, 14, 7, 1],
        maxReminders: 3
      });
      
      setShowAddForm(false);
      
      // Call optional callback
      if (onRecallAdded) {
        onRecallAdded(data);
      }
    } catch (err) {
      console.error('Error creating recall schedule:', err);
      setError('Failed to create recall schedule');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (recallId: string) => {
    if (!window.confirm('Are you sure you want to delete this recall schedule?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/patient-recalls/${recallId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete recall schedule');
      }
      
      // Update state by removing the deleted recall
      setRecalls(prev => prev.filter(recall => recall.id !== recallId));
      
      // Call optional callback
      if (onRecallDeleted) {
        onRecallDeleted(recallId);
      }
    } catch (err) {
      console.error('Error deleting recall schedule:', err);
      setError('Failed to delete recall schedule');
    } finally {
      setLoading(false);
    }
  };
  
  // Format a recall type for display
  const formatRecallType = (type: string): string => {
    switch (type) {
      case 'hygiene':
        return 'Hygiene Cleaning';
      case 'perio_maintenance':
        return 'Periodontal Maintenance';
      case 'restorative_followup':
        return 'Restorative Follow-up';
      case 'patient_reactivation':
        return 'Patient Reactivation';
      default:
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };
  
  // Format a recall frequency for display
  const formatRecallFrequency = (frequency: string, customDays?: number): string => {
    switch (frequency) {
      case '1':
        return '1 Month';
      case '3':
        return '3 Months';
      case '4':
        return '4 Months';
      case '6':
        return '6 Months';
      case '12':
        return 'Yearly';
      case 'custom':
        return customDays ? `${customDays} Days` : 'Custom';
      default:
        return frequency;
    }
  };
  
  // Format a date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get color for recall history status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'success.main';
      case 'missed': return 'error.main';
      case 'scheduled': return 'info.main';
      default: return 'text.secondary';
    }
  };
  
  // Get icon for recall history status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon fontSize="small" color="success" />;
      case 'missed': return <CancelIcon fontSize="small" color="error" />;
      case 'scheduled': return <AccessTimeIcon fontSize="small" color="info" />;
      default: return null;
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <EventIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Recall Schedules
          </Typography>
        </div>
        
        <div>
          {!showAddForm && activeTab === 0 && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowAddForm(true)}
            >
              Add Recall
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          icon={<EventIcon fontSize="small" />} 
          label="Active Recalls" 
          id="tab-0"
          aria-controls="tabpanel-0"
        />
        <Tab 
          icon={<HistoryIcon fontSize="small" />} 
          label="Recall History" 
          id="tab-1"
          aria-controls="tabpanel-1"
        />
      </Tabs>
      
      <div
        role="tabpanel"
        hidden={activeTab !== 0}
        id="tabpanel-0"
        aria-labelledby="tab-0"
      >
        {activeTab === 0 && (
          <>
            {loading && !showAddForm && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <LoadingAnimation />
              </Box>
            )}
            
            {showAddForm && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <form onSubmit={handleSubmit}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                      New Recall Schedule
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {/* Recall Type */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="recallType-label">Recall Type</InputLabel>
                          <Select
                            labelId="recallType-label"
                            id="recallType"
                            name="recallType"
                            value={formData.recallType}
                            label="Recall Type"
                            onChange={handleSelectChange}
                            required
                          >
                            <MenuItem value="hygiene">Hygiene Cleaning</MenuItem>
                            <MenuItem value="perio_maintenance">Periodontal Maintenance</MenuItem>
                            <MenuItem value="restorative_followup">Restorative Follow-up</MenuItem>
                            <MenuItem value="patient_reactivation">Patient Reactivation</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Frequency */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="frequency-label">Frequency</InputLabel>
                          <Select
                            labelId="frequency-label"
                            id="frequency"
                            name="frequency"
                            value={formData.frequency}
                            label="Frequency"
                            onChange={handleSelectChange}
                            required
                          >
                            <MenuItem value="1">Every 1 Month</MenuItem>
                            <MenuItem value="3">Every 3 Months</MenuItem>
                            <MenuItem value="4">Every 4 Months</MenuItem>
                            <MenuItem value="6">Every 6 Months</MenuItem>
                            <MenuItem value="12">Yearly</MenuItem>
                            <MenuItem value="custom">Custom</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Custom Days */}
                      {formData.frequency === 'custom' && (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            required
                            type="number"
                            id="customDays"
                            name="customDays"
                            label="Custom Days"
                            value={formData.customDays}
                            onChange={handleInputChange}
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                      )}
                      
                      {/* Next Due Date */}
                      <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="Next Due Date"
                            value={formData.nextDueDate}
                            onChange={(date) => setFormData(prev => ({ ...prev, nextDueDate: date }))}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                required: true
                              }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      
                      {/* Notes */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          id="notes"
                          name="notes"
                          label="Notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                        />
                      </Grid>
                    </Grid>
                    
                    <div className="flex justify-end mt-4 gap-2">
                      <Button 
                        variant="outlined" 
                        onClick={() => setShowAddForm(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        variant="contained"
                        disabled={loading}
                      >
                        Save Recall
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>
            )}
            
            {recalls.length > 0 ? (
              <div className="space-y-4">
                {recalls.map(recall => (
                  <Card key={recall.id} variant="outlined">
                    <CardContent>
                      <div className="flex justify-between items-start">
                        <div>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {formatRecallType(recall.recall_type)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Every {formatRecallFrequency(recall.frequency, recall.custom_days)}
                          </Typography>
                        </div>
                        <Button
                          variant="text"
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(recall.id)}
                        >
                          Delete
                        </Button>
                      </div>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Next Due Date
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(recall.next_due_date)}
                          </Typography>
                        </Grid>
                        
                        {recall.last_appointment_date && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">
                              Last Appointment
                            </Typography>
                            <Typography variant="body1">
                              {formatDate(recall.last_appointment_date)}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                      
                      {recall.notes && (
                        <div className="mt-3">
                          <Typography variant="body2" color="text.secondary">
                            Notes
                          </Typography>
                          <Typography variant="body2">
                            {recall.notes}
                          </Typography>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !loading && (
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    No recall schedules have been set up for this patient.
                  </Typography>
                  {!showAddForm && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setShowAddForm(true)}
                    >
                      Add Recall Schedule
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
      
      <div
        role="tabpanel"
        hidden={activeTab !== 1}
        id="tabpanel-1"
        aria-labelledby="tab-1"
      >
        {activeTab === 1 && (
          <>
            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <LoadingAnimation />
              </Box>
            ) : recallHistory.length > 0 ? (
              <div className="space-y-4">
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Past Recall Appointments
                </Typography>
                
                {recallHistory.map((historyItem) => (
                  <Card key={historyItem.id} variant="outlined">
                    <CardContent>
                      <div className="flex justify-between items-start">
                        <div>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(historyItem.status)}
                            {formatRecallType(historyItem.recall_type)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Due: {formatDate(historyItem.due_date)}
                          </Typography>
                        </div>
                        <Badge 
                          sx={{ 
                            bgcolor: `${getStatusColor(historyItem.status)}15`, 
                            color: getStatusColor(historyItem.status),
                            borderRadius: '4px',
                            px: 1,
                            py: 0.5,
                            fontWeight: 'medium',
                            fontSize: '0.75rem',
                            textTransform: 'capitalize'
                          }}
                        >
                          {historyItem.status}
                        </Badge>
                      </div>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      {historyItem.appointment_date && (
                        <Typography variant="body2">
                          Appointment Date: {formatDate(historyItem.appointment_date)}
                        </Typography>
                      )}
                      
                      {historyItem.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {historyItem.notes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No recall history available for this patient.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecallScheduler; 