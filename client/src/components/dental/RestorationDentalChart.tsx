import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Divider, 
  useTheme,
  Button,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import ToothSvg from './ToothSvg';
import { 
  DentalConditionType, 
  ToothCondition, 
  ConditionIcon, 
  SurfaceMarker, 
  DentalChartLegend,
  getDentalConditionColor
} from './DentalConditions';

// Define the tooth map for adult dentition using Universal Numbering System
const UPPER_RIGHT = [1, 2, 3, 4, 5, 6, 7, 8];
const UPPER_LEFT = [9, 10, 11, 12, 13, 14, 15, 16];
const LOWER_LEFT = [17, 18, 19, 20, 21, 22, 23, 24];
const LOWER_RIGHT = [25, 26, 27, 28, 29, 30, 31, 32];

// Surface abbreviations
const SURFACES = ['M', 'O', 'D', 'B', 'L']; // Mesial, Occlusal, Distal, Buccal, Lingual

interface RestorationDentalChartProps {
  patientId?: string;
  conditions?: Record<number, ToothCondition[]>;
  readOnly?: boolean;
  onConditionChange?: (toothNumber: number, conditions: ToothCondition[]) => void;
}

const RestorationDentalChart: React.FC<RestorationDentalChartProps> = ({
  patientId,
  conditions = {},
  readOnly = false,
  onConditionChange
}) => {
  const muiTheme = useTheme();
  const colorMode = muiTheme.palette.mode;
  const [scale, setScale] = useState(1);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCondition, setNewCondition] = useState<Partial<ToothCondition>>({
    type: 'filling',
    surfaces: ['O'],
    material: 'composite'
  });

  // Function to determine tooth type for better visualization
  const getToothType = (toothNumber: number) => {
    // Incisors
    if ([8, 9, 24, 25].includes(toothNumber)) return 'centralIncisor';
    if ([7, 10, 23, 26].includes(toothNumber)) return 'lateralIncisor';
    
    // Canines
    if ([6, 11, 22, 27].includes(toothNumber)) return 'canine';
    
    // Premolars
    if ([4, 5, 12, 13, 20, 21, 28, 29].includes(toothNumber)) return 'premolar';
    
    // Molars
    return 'molar';
  };

  // Function to determine if a tooth has a given condition
  const hasCondition = (toothNumber: number, conditionType: DentalConditionType): boolean => {
    return !!conditions[toothNumber]?.some(c => c.type === conditionType);
  };

  // Function to get conditions for a tooth
  const getToothConditions = (toothNumber: number): ToothCondition[] => {
    return conditions[toothNumber] || [];
  };

  const handleToothClick = (toothNumber: number) => {
    if (readOnly) return;
    
    setSelectedTooth(toothNumber);
    setDialogOpen(true);
  };

  const handleAddCondition = () => {
    if (!selectedTooth || !newCondition.type) return;
    
    const updatedConditions = [...(conditions[selectedTooth] || [])];
    updatedConditions.push(newCondition as ToothCondition);
    
    onConditionChange?.(selectedTooth, updatedConditions);
    
    setDialogOpen(false);
    setNewCondition({
      type: 'filling',
      surfaces: ['O'],
      material: 'composite'
    });
  };

  const handleRemoveCondition = (toothNumber: number, index: number) => {
    if (readOnly) return;
    
    const updatedConditions = [...(conditions[toothNumber] || [])];
    updatedConditions.splice(index, 1);
    
    onConditionChange?.(toothNumber, updatedConditions);
  };

  const renderTooth = (toothNumber: number) => {
    const toothType = getToothType(toothNumber);
    const isUpper = toothNumber <= 16;
    const isAnterior = ['centralIncisor', 'lateralIncisor', 'canine'].includes(toothType);
    const isMolar = toothType === 'molar';
    const toothConditions = getToothConditions(toothNumber);
    const missing = hasCondition(toothNumber, 'missing');
    
    return (
      <Box 
        sx={{ 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: readOnly ? 'default' : 'pointer',
          '&:hover': {
            '& .tooth-number': {
              color: muiTheme.palette.primary.main,
              fontWeight: 'bold'
            },
            '& .tooth-svg': {
              filter: 'drop-shadow(0px 0px 2px rgba(25, 118, 210, 0.5))'
            }
          },
          transform: `scale(${scale})`,
          transition: 'transform 0.3s ease'
        }}
        onClick={() => handleToothClick(toothNumber)}
      >
        {/* Tooth number */}
        <Typography 
          className="tooth-number"
          variant="caption" 
          align="center"
          sx={{ 
            fontWeight: 'medium',
            mb: 0.5,
            width: '100%',
            textAlign: 'center'
          }}
        >
          {toothNumber}
        </Typography>
        
        {/* Tooth with conditions */}
        <Box 
          className="tooth-svg"
          sx={{ 
            position: 'relative',
            mb: 0.5,
            width: 35,
            height: 55
          }}
        >
          <ToothSvg
            position={isUpper ? 'upper' : 'lower'}
            isAnterior={isAnterior}
            isMolar={isMolar}
            missing={missing}
            width={35}
            height={55}
          />
          
          {/* Render surface conditions */}
          {!missing && toothConditions.map((condition, index) => {
            if (condition.surfaces && condition.surfaces.length > 0) {
              return condition.surfaces.map(surface => (
                <SurfaceMarker
                  key={`${toothNumber}-${condition.type}-${surface}-${index}`}
                  surface={surface}
                  condition={condition.type}
                  theme={colorMode as 'light' | 'dark'}
                />
              ));
            } else {
              // If no specific surfaces are specified, show an overall condition icon
              return (
                <Box
                  key={`${toothNumber}-${condition.type}-${index}`}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <ConditionIcon 
                    condition={condition.type} 
                    color={getDentalConditionColor(condition.type, colorMode as 'light' | 'dark')}
                    size={30}
                  />
                </Box>
              );
            }
          })}
        </Box>
        
        {/* Indicators for special conditions */}
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5, 
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 40,
          minHeight: 16
        }}>
          {toothConditions.map((condition, index) => {
            // Only show indicators for major conditions that aren't surface-specific
            if (['implant', 'rootCanal', 'crown', 'bridge', 'denture'].includes(condition.type)) {
              return (
                <Tooltip 
                  key={`${toothNumber}-indicator-${index}`}
                  title={`${condition.type}${condition.material ? ` (${condition.material})` : ''}`}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: getDentalConditionColor(condition.type, colorMode as 'light' | 'dark')
                    }}
                  />
                </Tooltip>
              );
            }
            return null;
          })}
        </Box>
      </Box>
    );
  };

  const renderToothDetails = () => {
    if (!selectedTooth) return null;
    
    const toothConditions = getToothConditions(selectedTooth);
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Tooth {selectedTooth} Details
        </Typography>
        
        {toothConditions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No conditions recorded for this tooth.
          </Typography>
        ) : (
          toothConditions.map((condition, index) => (
            <Box 
              key={`${selectedTooth}-detail-${index}`}
              sx={{ 
                mb: 1, 
                p: 1, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ConditionIcon 
                  condition={condition.type} 
                  color={getDentalConditionColor(condition.type, colorMode as 'light' | 'dark')}
                  size={20}
                />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {condition.type.charAt(0).toUpperCase() + condition.type.slice(1)}
                  </Typography>
                  {condition.surfaces && condition.surfaces.length > 0 && (
                    <Typography variant="caption" display="block">
                      Surfaces: {condition.surfaces.join(', ')}
                    </Typography>
                  )}
                  {condition.material && (
                    <Typography variant="caption" display="block">
                      Material: {condition.material}
                    </Typography>
                  )}
                  {condition.date && (
                    <Typography variant="caption" display="block">
                      Date: {condition.date}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {!readOnly && (
                <Button 
                  size="small" 
                  color="error" 
                  variant="outlined"
                  onClick={() => handleRemoveCondition(selectedTooth, index)}
                >
                  Remove
                </Button>
              )}
            </Box>
          ))
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" fontWeight="medium">
          Restorative Dental Chart
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setScale(prev => Math.max(0.7, prev - 0.1))}>
            <ZoomOutIcon />
          </IconButton>
          <IconButton onClick={() => setScale(prev => Math.min(1.3, prev + 0.1))}>
            <ZoomInIcon />
          </IconButton>
          <Tooltip title="Click on a tooth to see details or add conditions">
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3, overflow: 'auto' }}>
        {/* Upper teeth */}
        <Box sx={{ mb: 3, overflow: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom align="center">
            Right — Upper Teeth — Left
          </Typography>
          
          <Grid container justifyContent="center">
            <Grid item container xs={12} justifyContent="center" spacing={1}>
              {UPPER_RIGHT.map(toothNumber => (
                <Grid item key={`upper-right-${toothNumber}`}>
                  {renderTooth(toothNumber)}
                </Grid>
              ))}
              {UPPER_LEFT.map(toothNumber => (
                <Grid item key={`upper-left-${toothNumber}`}>
                  {renderTooth(toothNumber)}
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Lower teeth */}
        <Box>
          <Typography variant="subtitle2" gutterBottom align="center">
            Right — Lower Teeth — Left
          </Typography>
          
          <Grid container justifyContent="center">
            <Grid item container xs={12} justifyContent="center" spacing={1}>
              {LOWER_RIGHT.map(toothNumber => (
                <Grid item key={`lower-right-${toothNumber}`}>
                  {renderTooth(toothNumber)}
                </Grid>
              ))}
              {LOWER_LEFT.map(toothNumber => (
                <Grid item key={`lower-left-${toothNumber}`}>
                  {renderTooth(toothNumber)}
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Legend */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Chart Legend
        </Typography>
        <DentalChartLegend theme={colorMode as 'light' | 'dark'} />
      </Paper>
      
      {/* Tooth details section - shows when a tooth is selected */}
      {selectedTooth && (
        <Paper sx={{ p: 2, mb: 3 }}>
          {renderToothDetails()}
        </Paper>
      )}
      
      {/* Dialog for adding new conditions */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {`Add Condition to Tooth ${selectedTooth}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Condition Type</InputLabel>
              <Select
                value={newCondition.type || ''}
                onChange={(e) => setNewCondition({ 
                  ...newCondition, 
                  type: e.target.value as DentalConditionType 
                })}
                label="Condition Type"
              >
                <MenuItem value="filling">Filling</MenuItem>
                <MenuItem value="caries">Caries</MenuItem>
                <MenuItem value="crown">Crown</MenuItem>
                <MenuItem value="implant">Implant</MenuItem>
                <MenuItem value="rootCanal">Root Canal</MenuItem>
                <MenuItem value="bridge">Bridge</MenuItem>
                <MenuItem value="veneer">Veneer</MenuItem>
                <MenuItem value="extraction">Extraction</MenuItem>
                <MenuItem value="missing">Missing</MenuItem>
                <MenuItem value="porcelain">Porcelain</MenuItem>
                <MenuItem value="denture">Denture</MenuItem>
                <MenuItem value="postAndCore">Post & Core</MenuItem>
              </Select>
            </FormControl>
            
            {newCondition.type !== 'missing' && newCondition.type !== 'implant' && 
             newCondition.type !== 'extraction' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Surfaces</InputLabel>
                <Select
                  multiple
                  value={newCondition.surfaces || []}
                  onChange={(e) => setNewCondition({ 
                    ...newCondition, 
                    surfaces: e.target.value as string[] 
                  })}
                  label="Surfaces"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  <MenuItem value="M">Mesial (M)</MenuItem>
                  <MenuItem value="O">Occlusal (O)</MenuItem>
                  <MenuItem value="D">Distal (D)</MenuItem>
                  <MenuItem value="B">Buccal (B)</MenuItem>
                  <MenuItem value="L">Lingual (L)</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {(newCondition.type === 'filling' || newCondition.type === 'crown') && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Material</InputLabel>
                <Select
                  value={newCondition.material || ''}
                  onChange={(e) => setNewCondition({ 
                    ...newCondition, 
                    material: e.target.value as string 
                  })}
                  label="Material"
                >
                  <MenuItem value="composite">Composite</MenuItem>
                  <MenuItem value="amalgam">Amalgam</MenuItem>
                  <MenuItem value="ceramic">Ceramic</MenuItem>
                  <MenuItem value="gold">Gold</MenuItem>
                  <MenuItem value="porcelain">Porcelain</MenuItem>
                  <MenuItem value="zirconia">Zirconia</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <TextField
              label="Notes"
              multiline
              rows={2}
              fullWidth
              value={newCondition.notes || ''}
              onChange={(e) => setNewCondition({ 
                ...newCondition, 
                notes: e.target.value 
              })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newCondition.date || ''}
              onChange={(e) => setNewCondition({ 
                ...newCondition, 
                date: e.target.value 
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddCondition} 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RestorationDentalChart; 