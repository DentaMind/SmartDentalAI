import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  AppBar,
  Toolbar,
  Slide,
  Divider,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TuneIcon from '@mui/icons-material/Tune';
import { TransitionProps } from '@mui/material/transitions';
import XrayButtonGroup from '../../components/xray/XrayButtonGroup';

// Sample X-ray data
const SAMPLE_XRAYS = [
  {
    id: 'xray-001',
    patientId: 'p1',
    type: 'Panoramic',
    date: '2023-05-15',
    imageUrl: 'https://www.dentalcare.com/~/media/images/en-us/education/ce-articles/0118/fig9.jpg',
    findings: 'No significant pathology noted. Wisdom teeth partially erupted.',
    provider: 'Dr. Smith',
    tags: ['Routine', 'Full Mouth']
  },
  {
    id: 'xray-002',
    patientId: 'p1',
    type: 'Periapical',
    date: '2023-06-10',
    imageUrl: 'https://www.dentalcare.com/~/media/images/en-us/education/ce-articles/0118/fig11.jpg',
    findings: 'Periapical radiolucency noted at tooth #14.',
    provider: 'Dr. Johnson',
    tags: ['Diagnostic', 'Single Tooth']
  },
  {
    id: 'xray-003',
    patientId: 'p1',
    type: 'Bitewing',
    date: '2023-04-22',
    imageUrl: 'https://www.dentalcare.com/~/media/images/en-us/education/ce-articles/0118/fig5.jpg',
    findings: 'Early interproximal caries between teeth #3-4.',
    provider: 'Dr. Smith',
    tags: ['Diagnostic', 'Posterior']
  }
];

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const XRayViewer: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [xrays, setXrays] = useState<typeof SAMPLE_XRAYS>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedXray, setSelectedXray] = useState<(typeof SAMPLE_XRAYS)[0] | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Simulate API call to fetch patient X-rays
    const fetchXrays = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call:
        // const response = await fetch(`/api/patients/${patientId}/xrays`);
        // const data = await response.json();
        
        // For now, simulate API delay and use sample data
        setTimeout(() => {
          setXrays(SAMPLE_XRAYS);
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error fetching X-rays:', err);
        setError('Failed to load X-ray records');
        setLoading(false);
      }
    };

    if (patientId) {
      fetchXrays();
    }
  }, [patientId]);

  const handleViewXray = (xray: typeof SAMPLE_XRAYS[0]) => {
    setSelectedXray(xray);
    setOpenModal(true);
    setZoomLevel(1);
    setRotation(0);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation(prev => prev + 90);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        <Button 
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/patients/${patientId}/chart`)}
        >
          Back to Patient Chart
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/patients/${patientId}/chart`)}
          sx={{ mb: 2 }}
        >
          Back to Patient Chart
        </Button>
        <Typography variant="h5" fontWeight="bold">
          X-Ray Records
        </Typography>
      </Box>

      {xrays.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No X-Ray Records Found
          </Typography>
          <Typography variant="body1" mb={3}>
            This patient doesn't have any X-ray images in their record yet.
          </Typography>
          <XrayButtonGroup patientId={patientId || ''} compact />
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {xrays.map((xray) => (
            <Grid item key={xray.id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={xray.imageUrl}
                  alt={`${xray.type} X-Ray`}
                  sx={{ 
                    objectFit: 'cover',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.9
                    }
                  }}
                  onClick={() => handleViewXray(xray)}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {xray.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {xray.date}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Provider: {xray.provider}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {xray.findings}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {xray.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Full screen X-ray viewer dialog */}
      <Dialog
        fullScreen
        open={openModal}
        onClose={handleCloseModal}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleCloseModal}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {selectedXray?.type} X-Ray ({selectedXray?.date})
            </Typography>
            <IconButton color="inherit" onClick={handleZoomIn}>
              <ZoomInIcon />
            </IconButton>
            <IconButton color="inherit" onClick={handleZoomOut}>
              <ZoomOutIcon />
            </IconButton>
            <IconButton color="inherit" onClick={handleRotateLeft}>
              <RotateLeftIcon />
            </IconButton>
            <IconButton color="inherit" onClick={handleRotateRight}>
              <RotateRightIcon />
            </IconButton>
            <IconButton color="inherit">
              <TuneIcon />
            </IconButton>
            <IconButton color="inherit">
              <FileDownloadIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 'calc(100vh - 64px)',
            bgcolor: '#000'
          }}
        >
          <Box 
            component="img"
            src={selectedXray?.imageUrl}
            alt={`${selectedXray?.type} X-Ray`}
            sx={{ 
              maxHeight: '90vh',
              maxWidth: '90vw',
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
          />
        </Box>
        
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0, 0, 0, 0.7)', p: 2, color: 'white' }}>
          <Typography variant="subtitle1" gutterBottom>
            Findings: {selectedXray?.findings}
          </Typography>
          <Typography variant="body2">
            Provider: {selectedXray?.provider} | Tags: {selectedXray?.tags.join(', ')}
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
};

export default XRayViewer; 