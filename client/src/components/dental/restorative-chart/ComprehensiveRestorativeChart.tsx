import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Divider,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  Popover
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit'; 
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

// Define tooth groups for the chart
const UPPER_RIGHT = [1, 2, 3, 4, 5, 6, 7, 8];
const UPPER_LEFT = [9, 10, 11, 12, 13, 14, 15, 16];
const LOWER_LEFT = [17, 18, 19, 20, 21, 22, 23, 24];
const LOWER_RIGHT = [25, 26, 27, 28, 29, 30, 31, 32];

// Define restoration types and materials
const RESTORATION_TYPES = [
  'Crown', 
  'Filling', 
  'Implant', 
  'Bridge', 
  'Veneer', 
  'Root Canal', 
  'Extraction',
  'Inlay',
  'Onlay',
  'Missing'
];

const RESTORATION_MATERIALS = [
  'Amalgam',
  'Composite',
  'Gold',
  'Porcelain',
  'Zirconia',
  'PFM',
  'EMAX',
  'Temporary'
];

// Tooth surfaces
const SURFACES = ['M', 'O', 'D', 'F', 'L', 'B', 'I'];

interface ToothRestoration {
  type: string;
  material?: string;
  surfaces?: string[];
  date?: string;
  provider?: string;
  notes?: string;
}

interface ToothData {
  number: number;
  status: 'Normal' | 'Missing' | 'Implant' | 'Primary';
  restorations: ToothRestoration[];
}

type DentalChart = Record<number, ToothData>;

interface ChartNote {
  toothNumber: number;
  description: string;
  date: string;
}

interface ComprehensiveRestorativeChartProps {
  patientId?: string;
  patientName?: string;
  initialData?: DentalChart;
  readOnly?: boolean;
  onSave?: (data: DentalChart) => void;
}

/**
 * ComprehensiveRestorativeChart displays a full dental chart with 
 * interactive tooth selection and automatically generated notes
 */
const ComprehensiveRestorativeChart: React.FC<ComprehensiveRestorativeChartProps> = ({
  patientId,
  patientName = 'Patient',
  initialData,
  readOnly = false,
  onSave
}) => {
  // Initialize empty chart data if none provided
  const initializeEmptyChart = (): DentalChart => {
    const chart: DentalChart = {};
    
    [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT].forEach(toothNumber => {
      chart[toothNumber] = {
        number: toothNumber,
        status: 'Normal',
        restorations: []
      };
    });
    
    return chart;
  };

  // State
  const [chartData, setChartData] = useState<DentalChart>(initialData || initializeEmptyChart());
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [notes, setNotes] = useState<ChartNote[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [scale, setScale] = useState(1);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  // Generate notes based on chart data
  useEffect(() => {
    const newNotes: ChartNote[] = [];
    
    Object.values(chartData).forEach(tooth => {
      if (tooth.status !== 'Normal') {
        newNotes.push({
          toothNumber: tooth.number,
          description: `#${tooth.number} ${tooth.status}`,
          date: new Date().toLocaleDateString()
        });
      }
      
      tooth.restorations.forEach(restoration => {
        let description = `#${tooth.number} `;
        
        if (restoration.surfaces && restoration.surfaces.length > 0) {
          description += restoration.surfaces.join('') + ' ';
        }
        
        description += restoration.type;
        
        if (restoration.material) {
          description += ` (${restoration.material})`;
        }
        
        newNotes.push({
          toothNumber: tooth.number,
          description,
          date: restoration.date || new Date().toLocaleDateString()
        });
      });
    });
    
    setNotes(newNotes);
  }, [chartData]);

  // Handle selecting a tooth
  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
  };

  // Handle hovering over a tooth
  const handleToothHover = (event: React.MouseEvent<HTMLDivElement>, toothNumber: number) => {
    setHoveredTooth(toothNumber);
    setAnchorEl(event.currentTarget);
  };
  
  // Handle closing the hover popover
  const handleClosePopover = () => {
    setHoveredTooth(null);
    setAnchorEl(null);
  };

  // Handle saving the chart
  const handleSave = () => {
    if (onSave) {
      onSave(chartData);
    }
    console.log('Saving chart data:', chartData);
  };

  // Handle adding a restoration to a tooth
  const handleAddRestoration = (toothNumber: number, restoration: ToothRestoration) => {
    setChartData(prev => {
      const updatedChart = { ...prev };
      updatedChart[toothNumber] = {
        ...updatedChart[toothNumber],
        restorations: [...updatedChart[toothNumber].restorations, restoration]
      };
      return updatedChart;
    });
  };

  // Handle updating tooth status
  const handleUpdateToothStatus = (toothNumber: number, status: 'Normal' | 'Missing' | 'Implant' | 'Primary') => {
    setChartData(prev => {
      const updatedChart = { ...prev };
      updatedChart[toothNumber] = {
        ...updatedChart[toothNumber],
        status
      };
      return updatedChart;
    });
  };

  // Get color for tooth based on status and restorations
  const getToothColor = (toothNumber: number) => {
    const tooth = chartData[toothNumber];
    
    if (tooth.status === 'Missing') return '#f5f5f5';
    if (tooth.status === 'Implant') return '#b0c4de';
    
    const hasRootCanal = tooth.restorations.some(r => r.type === 'Root Canal');
    if (hasRootCanal) return '#ffcdd2';
    
    const hasCrown = tooth.restorations.some(r => r.type === 'Crown');
    if (hasCrown) {
      const crown = tooth.restorations.find(r => r.type === 'Crown');
      if (crown?.material === 'Gold') return '#ffd700';
      if (crown?.material === 'Porcelain' || crown?.material === 'EMAX') return '#ffffff';
      if (crown?.material === 'Zirconia') return '#f5f5f5';
      if (crown?.material === 'PFM') return '#e0e0e0';
      return '#e0e0e0';
    }
    
    return '#f8f8f8';
  };

  // Get shape for tooth based on tooth number
  const getToothShape = (toothNumber: number) => {
    // Molars
    if ([1, 2, 15, 16, 17, 18, 31, 32].includes(toothNumber)) {
      return 'M 0,0 L 40,0 L 40,50 L 0,50 Z';
    }
    
    // Premolars
    if ([4, 5, 12, 13, 20, 21, 28, 29].includes(toothNumber)) {
      return 'M 5,0 L 35,0 L 40,50 L 0,50 Z';
    }
    
    // Canines
    if ([6, 11, 22, 27].includes(toothNumber)) {
      return 'M 10,0 L 30,0 L 35,50 L 5,50 Z';
    }
    
    // Incisors
    return 'M 15,0 L 25,0 L 30,50 L 10,50 Z';
  };

  // Render a single tooth
  const renderTooth = (toothNumber: number) => {
    const tooth = chartData[toothNumber];
    const isSelected = selectedTooth === toothNumber;
    const hasRestoration = tooth.restorations.length > 0 || tooth.status !== 'Normal';
    const color = getToothColor(toothNumber);
    
    return (
      <Box
        sx={{
          position: 'relative',
          width: 40 * scale,
          height: 50 * scale,
          border: isSelected ? '2px solid #1976d2' : '1px solid #ddd',
          borderRadius: 1,
          cursor: 'pointer',
          backgroundColor: color,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 0 5px rgba(25, 118, 210, 0.5)',
            transform: 'translateY(-2px)'
          }
        }}
        onClick={() => handleToothClick(toothNumber)}
        onMouseEnter={(e) => handleToothHover(e, toothNumber)}
        onMouseLeave={handleClosePopover}
      >
        {/* Tooth number */}
        <Typography 
          variant="caption" 
          sx={{ 
            bgcolor: '#f5f5f5', 
            width: '100%', 
            textAlign: 'center',
            fontWeight: 'bold',
            borderBottom: '1px solid #ddd'
          }}
        >
          {toothNumber}
        </Typography>
        
        {/* Tooth body */}
        <Box 
          sx={{ 
            flex: 1, 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {/* Root canal indicator */}
          {tooth.restorations.some(r => r.type === 'Root Canal') && (
            <Box 
              sx={{ 
                position: 'absolute',
                height: '70%',
                width: '4px',
                bgcolor: '#f44336',
                zIndex: 1
              }} 
            />
          )}
          
          {/* Status indicators */}
          {tooth.status === 'Missing' && (
            <Typography sx={{ color: '#757575', fontSize: '1.2rem', fontWeight: 'bold' }}>
              X
            </Typography>
          )}
          
          {tooth.status === 'Implant' && (
            <Typography sx={{ color: '#1976d2', fontSize: '0.7rem', fontWeight: 'bold' }}>
              IMP
            </Typography>
          )}
          
          {/* Restoration surface markers */}
          {tooth.restorations.filter(r => r.surfaces && r.surfaces.length > 0).map((restoration, index) => (
            restoration.surfaces?.map(surface => {
              let position = {};
              
              switch(surface) {
                case 'M':
                  position = { left: 0, top: '50%', transform: 'translateY(-50%)', width: '20%', height: '40%' };
                  break;
                case 'D':
                  position = { right: 0, top: '50%', transform: 'translateY(-50%)', width: '20%', height: '40%' };
                  break;
                case 'O':
                case 'I':
                  position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '30%' };
                  break;
                case 'F':
                case 'B':
                  position = { top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '20%' };
                  break;
                case 'L':
                  position = { bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '20%' };
                  break;
                default:
                  return null;
              }
              
              return (
                <Box
                  key={`${toothNumber}-${restoration.type}-${surface}`}
                  sx={{
                    position: 'absolute',
                    ...position,
                    bgcolor: restoration.material === 'Amalgam' ? '#a9a9a9' : 
                             restoration.material === 'Composite' ? '#f5f5dc' :
                             restoration.material === 'Gold' ? '#ffd700' : '#e0e0e0',
                    border: '1px solid rgba(0,0,0,0.2)',
                    zIndex: 2
                  }}
                />
              );
            })
          ))}
          
          {/* Crown - covers the whole tooth */}
          {tooth.restorations.some(r => r.type === 'Crown') && (
            <Box 
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                border: '3px solid rgba(0,0,0,0.3)',
                borderRadius: 1,
                zIndex: 1
              }} 
            />
          )}
        </Box>
      </Box>
    );
  };

  // Render the tooth chart grid
  const renderToothChart = () => {
    return (
      <Paper sx={{ p: 3, mb: 3, overflow: 'auto' }}>
        {/* Upper teeth */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
            Upper Teeth (Right — Left)
          </Typography>
          
          <Grid container justifyContent="center" spacing={1}>
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
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Lower teeth */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
            Lower Teeth (Right — Left)
          </Typography>
          
          <Grid container justifyContent="center" spacing={1}>
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
        </Box>
      </Paper>
    );
  };

  // Render the chart notes/legend
  const renderChartNotes = () => {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Chart Notes</Typography>
          <Button 
            variant="outlined" 
            startIcon={<PrintIcon />}
            size="small"
          >
            Print
          </Button>
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tooth</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notes.map((note, index) => (
                <TableRow key={index}>
                  <TableCell>{note.toothNumber}</TableCell>
                  <TableCell>{note.description}</TableCell>
                  <TableCell>{note.date}</TableCell>
                </TableRow>
              ))}
              {notes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No treatments/conditions recorded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" sx={{ mb: 2 }}>Legend</Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#ffcdd2', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
              <Typography variant="body2">Root Canal</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#f5f5f5', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
              <Typography variant="body2">Missing</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#b0c4de', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
              <Typography variant="body2">Implant</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#f5f5dc', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
              <Typography variant="body2">Composite</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  // Render tooth selection panel
  const renderSelectedToothPanel = () => {
    if (selectedTooth === null) {
      return (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">
            Select a tooth to view details or add restorations
          </Typography>
        </Paper>
      );
    }
    
    const tooth = chartData[selectedTooth];
    
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Tooth #{selectedTooth}</Typography>
          
          <Box>
            <Chip 
              label={tooth.status} 
              color={
                tooth.status === 'Normal' ? 'default' :
                tooth.status === 'Missing' ? 'error' :
                tooth.status === 'Implant' ? 'info' : 'warning'
              }
              size="small"
              sx={{ mr: 1 }}
            />
            
            <IconButton size="small" disabled={readOnly}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Restorations:</Typography>
        
        {tooth.restorations.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Surfaces</TableCell>
                  <TableCell>Date</TableCell>
                  {!readOnly && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {tooth.restorations.map((restoration, index) => (
                  <TableRow key={index}>
                    <TableCell>{restoration.type}</TableCell>
                    <TableCell>{restoration.material || '—'}</TableCell>
                    <TableCell>{restoration.surfaces?.join(', ') || '—'}</TableCell>
                    <TableCell>{restoration.date || '—'}</TableCell>
                    {!readOnly && (
                      <TableCell align="right">
                        <IconButton size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No restorations recorded
          </Typography>
        )}
        
        {!readOnly && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            size="small"
            sx={{ mt: 2 }}
            onClick={() => {
              // Mocked adding a sample restoration
              handleAddRestoration(selectedTooth, {
                type: 'Crown',
                material: 'Zirconia',
                date: new Date().toLocaleDateString()
              });
            }}
          >
            Add Restoration
          </Button>
        )}
      </Paper>
    );
  };

  return (
    <Box>
      {/* Top control bar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">
            {patientName} - Dental Chart
          </Typography>
          {patientId && (
            <Typography variant="body2" color="text.secondary">
              Patient ID: {patientId}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Zoom Out">
            <IconButton onClick={() => setScale(prev => Math.max(0.7, prev - 0.1))}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom In">
            <IconButton onClick={() => setScale(prev => Math.min(1.3, prev + 0.1))}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          {!readOnly && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Chart
            </Button>
          )}
        </Box>
      </Paper>
      
      {/* Tab navigation */}
      <Tabs 
        value={selectedTab} 
        onChange={(_, newValue) => setSelectedTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Chart" />
        <Tab label="Notes" />
      </Tabs>
      
      {selectedTab === 0 && (
        <Box>
          {renderToothChart()}
          {renderSelectedToothPanel()}
        </Box>
      )}
      
      {selectedTab === 1 && (
        <Box>
          {renderChartNotes()}
        </Box>
      )}
      
      {/* Tooth detail popover */}
      <Popover
        open={Boolean(anchorEl) && hoveredTooth !== null}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {hoveredTooth !== null && (
          <Box sx={{ p: 2, maxWidth: 250 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Tooth #{hoveredTooth}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              Status: <strong>{chartData[hoveredTooth].status}</strong>
            </Typography>
            
            {chartData[hoveredTooth].restorations.length > 0 ? (
              <>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Restorations:
                </Typography>
                
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {chartData[hoveredTooth].restorations.map((restoration, index) => (
                    <Typography key={index} component="li" variant="body2">
                      {restoration.type} 
                      {restoration.material ? ` (${restoration.material})` : ''}
                      {restoration.surfaces ? ` on ${restoration.surfaces.join(', ')}` : ''}
                    </Typography>
                  ))}
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No restorations recorded
              </Typography>
            )}
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default ComprehensiveRestorativeChart; 