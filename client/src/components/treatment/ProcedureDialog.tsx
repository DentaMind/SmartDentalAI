import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Autocomplete,
  Typography,
  Chip,
  Paper,
  Box,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  ProcedureStatus, 
  PriorityLevel, 
  PlanPhase,
  TreatmentProcedure
} from '../../types/treatment-plan';

// CDT Codes data (simplified sample - would typically come from a service or API)
const CDT_CODES = [
  { code: 'D0120', description: 'Periodic oral evaluation' },
  { code: 'D0140', description: 'Limited oral evaluation - problem focused' },
  { code: 'D0150', description: 'Comprehensive oral evaluation - new or established patient' },
  { code: 'D0210', description: 'Intraoral - complete series of radiographic images' },
  { code: 'D0220', description: 'Intraoral - periapical first radiographic image' },
  { code: 'D0230', description: 'Intraoral - periapical each additional radiographic image' },
  { code: 'D0270', description: 'Bitewing - single radiographic image' },
  { code: 'D0272', description: 'Bitewings - two radiographic images' },
  { code: 'D0273', description: 'Bitewings - three radiographic images' },
  { code: 'D0274', description: 'Bitewings - four radiographic images' },
  { code: 'D1110', description: 'Prophylaxis - adult' },
  { code: 'D1120', description: 'Prophylaxis - child' },
  { code: 'D1351', description: 'Sealant - per tooth' },
  { code: 'D2140', description: 'Amalgam - one surface, primary or permanent' },
  { code: 'D2150', description: 'Amalgam - two surfaces, primary or permanent' },
  { code: 'D2160', description: 'Amalgam - three surfaces, primary or permanent' },
  { code: 'D2330', description: 'Resin-based composite - one surface, anterior' },
  { code: 'D2331', description: 'Resin-based composite - two surfaces, anterior' },
  { code: 'D2332', description: 'Resin-based composite - three surfaces, anterior' },
  { code: 'D2740', description: 'Crown - porcelain/ceramic substrate' },
  { code: 'D2750', description: 'Crown - porcelain fused to high noble metal' },
  { code: 'D2950', description: 'Core buildup, including any pins when required' },
  { code: 'D3310', description: 'Endodontic therapy, anterior tooth (excluding final restoration)' },
  { code: 'D3320', description: 'Endodontic therapy, premolar tooth (excluding final restoration)' },
  { code: 'D3330', description: 'Endodontic therapy, molar tooth (excluding final restoration)' },
  { code: 'D4341', description: 'Periodontal scaling and root planing - four or more teeth per quadrant' },
  { code: 'D5110', description: 'Complete denture - maxillary' },
  { code: 'D5120', description: 'Complete denture - mandibular' },
  { code: 'D6010', description: 'Surgical placement of implant body: endosteal implant' },
  { code: 'D7140', description: 'Extraction, erupted tooth or exposed root' },
  { code: 'D7210', description: 'Extraction, erupted tooth requiring removal of bone and/or sectioning of tooth' }
];

// Tooth surface options
const SURFACES = ['Mesial', 'Occlusal', 'Distal', 'Facial', 'Lingual'];

// Quadrant options
const QUADRANTS = ['Upper Right', 'Upper Left', 'Lower Left', 'Lower Right'];

// Arch options
const ARCHES = ['Upper', 'Lower'];

interface ProcedureDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (procedureData: any) => void;
  procedure?: TreatmentProcedure;
  initialPhase?: PlanPhase;
}

export const ProcedureDialog: React.FC<ProcedureDialogProps> = ({
  open,
  onClose,
  onSave,
  procedure,
  initialPhase = 'phase_1'
}) => {
  // Form state
  const [formData, setFormData] = useState({
    procedure_name: '',
    description: '',
    cdt_code: '',
    tooth_number: '',
    status: 'recommended' as ProcedureStatus,
    priority: 'medium' as PriorityLevel,
    phase: initialPhase as PlanPhase,
    fee: 0,
    notes: '',
    surfaces: [] as string[],
    quadrant: '',
    arch: '',
    preauth_required: false
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Selected CDT code details
  const [selectedCdtCode, setSelectedCdtCode] = useState<{code: string, description: string} | null>(null);
  
  // Reset form when dialog opens or procedure changes
  useEffect(() => {
    if (open) {
      if (procedure) {
        // Edit mode - populate form with procedure data
        setFormData({
          procedure_name: procedure.procedure_name,
          description: procedure.description || '',
          cdt_code: procedure.cdt_code || '',
          tooth_number: procedure.tooth_number || '',
          status: procedure.status,
          priority: procedure.priority,
          phase: procedure.phase,
          fee: procedure.fee,
          notes: procedure.notes || '',
          surfaces: procedure.surfaces || [],
          quadrant: procedure.quadrant || '',
          arch: procedure.arch || '',
          preauth_required: procedure.preauth_required
        });
        
        // Find matching CDT code
        if (procedure.cdt_code) {
          const cdtCode = CDT_CODES.find(c => c.code === procedure.cdt_code);
          setSelectedCdtCode(cdtCode || null);
        } else {
          setSelectedCdtCode(null);
        }
      } else {
        // Add mode - reset form
        setFormData({
          procedure_name: '',
          description: '',
          cdt_code: '',
          tooth_number: '',
          status: 'recommended',
          priority: 'medium',
          phase: initialPhase,
          fee: 0,
          notes: '',
          surfaces: [],
          quadrant: '',
          arch: '',
          preauth_required: false
        });
        setSelectedCdtCode(null);
      }
      setErrors({});
    }
  }, [open, procedure, initialPhase]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name!]: value
    }));
    
    // Clear error for this field
    if (name && errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle fee input (special handling for currency)
  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const fee = isNaN(value) ? 0 : value;
    
    setFormData(prev => ({
      ...prev,
      fee
    }));
  };
  
  // Handle CDT code selection
  const handleCdtCodeChange = (event: any, newValue: { code: string, description: string } | null) => {
    setSelectedCdtCode(newValue);
    
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        cdt_code: newValue.code,
        procedure_name: prev.procedure_name || newValue.description
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cdt_code: ''
      }));
    }
  };
  
  // Handle surface selection
  const handleSurfaceToggle = (surface: string) => {
    setFormData(prev => {
      const surfaces = [...prev.surfaces];
      
      if (surfaces.includes(surface)) {
        return {
          ...prev,
          surfaces: surfaces.filter(s => s !== surface)
        };
      } else {
        return {
          ...prev,
          surfaces: [...surfaces, surface]
        };
      }
    });
  };
  
  // Handle preauth toggle
  const handlePreauthToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      preauth_required: e.target.checked
    }));
  };
  
  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.procedure_name) {
      newErrors.procedure_name = 'Procedure name is required';
    }
    
    if (formData.fee < 0) {
      newErrors.fee = 'Fee cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle>
        {procedure ? 'Edit Procedure' : 'Add Procedure'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* CDT Code Selection */}
          <Grid item xs={12}>
            <Autocomplete
              options={CDT_CODES}
              getOptionLabel={(option) => `${option.code} - ${option.description}`}
              value={selectedCdtCode}
              onChange={handleCdtCodeChange}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="CDT Code" 
                  variant="outlined" 
                  fullWidth
                  helperText="Select a CDT code or enter custom procedure details below"
                />
              )}
            />
          </Grid>
          
          {/* Procedure Name & Description */}
          <Grid item xs={12} md={8}>
            <TextField
              name="procedure_name"
              label="Procedure Name"
              value={formData.procedure_name}
              onChange={handleChange}
              error={!!errors.procedure_name}
              helperText={errors.procedure_name}
              fullWidth
              required
            />
          </Grid>
          
          {/* Fee */}
          <Grid item xs={12} md={4}>
            <TextField
              name="fee"
              label="Fee"
              type="number"
              value={formData.fee}
              onChange={handleFeeChange}
              error={!!errors.fee}
              helperText={errors.fee}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          
          {/* Description */}
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          
          {/* Tooth & Surface Selection */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tooth Information
              </Typography>
              
              <Grid container spacing={2}>
                {/* Tooth Number */}
                <Grid item xs={12} md={6}>
                  <TextField
                    name="tooth_number"
                    label="Tooth Number"
                    value={formData.tooth_number}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                
                {/* Quadrant */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Quadrant</InputLabel>
                    <Select
                      name="quadrant"
                      value={formData.quadrant}
                      onChange={handleChange}
                      label="Quadrant"
                    >
                      <MenuItem value="">None</MenuItem>
                      {QUADRANTS.map(quadrant => (
                        <MenuItem key={quadrant} value={quadrant}>
                          {quadrant}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Arch */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Arch</InputLabel>
                    <Select
                      name="arch"
                      value={formData.arch}
                      onChange={handleChange}
                      label="Arch"
                    >
                      <MenuItem value="">None</MenuItem>
                      {ARCHES.map(arch => (
                        <MenuItem key={arch} value={arch}>
                          {arch}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Surface Chips */}
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Surfaces:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {SURFACES.map(surface => (
                      <Chip
                        key={surface}
                        label={surface}
                        color={formData.surfaces.includes(surface) ? 'primary' : 'default'}
                        onClick={() => handleSurfaceToggle(surface)}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Status & Priority */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Treatment Information
              </Typography>
              
              <Grid container spacing={2}>
                {/* Status */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      <MenuItem value="recommended">Recommended</MenuItem>
                      <MenuItem value="planned">Planned</MenuItem>
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Priority */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      label="Priority"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Phase */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Phase</InputLabel>
                    <Select
                      name="phase"
                      value={formData.phase}
                      onChange={handleChange}
                      label="Phase"
                    >
                      <MenuItem value="urgent">Urgent</MenuItem>
                      <MenuItem value="phase_1">Phase 1</MenuItem>
                      <MenuItem value="phase_2">Phase 2</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Pre-authorization Required */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.preauth_required}
                        onChange={handlePreauthToggle}
                        color="primary"
                      />
                    }
                    label="Requires Pre-authorization"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              name="notes"
              label="Clinical Notes"
              value={formData.notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
        >
          {procedure ? 'Update' : 'Add'} Procedure
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 