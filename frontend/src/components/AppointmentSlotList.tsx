import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { AppointmentSlot, Provider } from '../types/calendar';
import { calendarService } from '../services/calendarService';

interface AppointmentSlotFormData {
  provider_id: number;
  start_time: Date;
  end_time: Date;
  appointment_type: string;
}

const AppointmentSlotList: React.FC = () => {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AppointmentSlot | null>(null);
  const [formData, setFormData] = useState<AppointmentSlotFormData>({
    provider_id: 0,
    start_time: new Date(),
    end_time: new Date(),
    appointment_type: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [providersData, slotsData] = await Promise.all([
        calendarService.getProviders(),
        calendarService.getAppointmentSlots()
      ]);
      setProviders(providersData);
      setSlots(slotsData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleOpenDialog = (slot?: AppointmentSlot) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData({
        provider_id: slot.provider_id,
        start_time: new Date(slot.start_time),
        end_time: new Date(slot.end_time),
        appointment_type: slot.appointment_type
      });
    } else {
      setEditingSlot(null);
      setFormData({
        provider_id: providers[0]?.id || 0,
        start_time: new Date(),
        end_time: new Date(),
        appointment_type: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSlot(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, [name]: date }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingSlot) {
        await calendarService.updateAppointmentSlot(editingSlot.id, formData);
      } else {
        await calendarService.createAppointmentSlot(formData);
      }
      await fetchData();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (slotId: number) => {
    try {
      await calendarService.deleteAppointmentSlot(slotId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleBook = async (slotId: number) => {
    try {
      await calendarService.bookAppointmentSlot(slotId, {
        patient_id: 1, // TODO: Get actual patient ID
        notes: ''
      });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCancel = async (slotId: number) => {
    try {
      await calendarService.cancelAppointmentSlot(slotId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Appointment Slots</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Slot
        </Button>
      </Box>

      <Paper>
        <List>
          {slots.map(slot => {
            const provider = providers.find(p => p.id === slot.provider_id);
            return (
              <ListItem key={slot.id}>
                <ListItemText
                  primary={
                    <>
                      <Typography component="span" variant="subtitle1">
                        {provider?.name || 'Unknown Provider'}
                      </Typography>
                      <Chip
                        size="small"
                        label={slot.appointment_type}
                        sx={{ ml: 1 }}
                      />
                    </>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {new Date(slot.start_time).toLocaleString()} -{' '}
                        {new Date(slot.end_time).toLocaleString()}
                      </Typography>
                      {!slot.is_available && (
                        <>
                          <br />
                          <Typography component="span" variant="body2" color="error">
                            Booked
                          </Typography>
                        </>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  {slot.is_available ? (
                    <IconButton
                      edge="end"
                      aria-label="book"
                      onClick={() => handleBook(slot.id)}
                    >
                      <CheckIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      edge="end"
                      aria-label="cancel"
                      onClick={() => handleCancel(slot.id)}
                    >
                      <CloseIcon />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleOpenDialog(slot)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(slot.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSlot ? 'Edit Appointment Slot' : 'Add Appointment Slot'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={formData.provider_id}
                  label="Provider"
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      provider_id: e.target.value as number
                    }))
                  }
                >
                  {providers.map(provider => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Time"
                  value={formData.start_time}
                  onChange={date => handleDateChange('start_time', date)}
                  renderInput={params => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Time"
                  value={formData.end_time}
                  onChange={date => handleDateChange('end_time', date)}
                  renderInput={params => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Appointment Type"
                name="appointment_type"
                value={formData.appointment_type}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editingSlot ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentSlotList; 