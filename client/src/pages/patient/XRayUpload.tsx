import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  AlertTitle,
  CircularProgress,
  Stack,
  Divider,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import XrayButtonGroup from '../../components/xray/XrayButtonGroup';

const XRayUpload: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [xrayType, setXrayType] = useState('panoramic');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      // Convert FileList to array and append to existing files
      const newFiles = Array.from(event.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (uploadedFiles.length === 0) {
      setError("Please select at least one X-ray file to upload");
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call to upload the files
      // const formData = new FormData();
      // uploadedFiles.forEach(file => formData.append('files', file));
      // formData.append('patientId', patientId);
      // formData.append('type', xrayType);
      // formData.append('notes', notes);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // If successful
      setSuccess(true);
      setTimeout(() => {
        navigate(`/patients/${patientId}/x-rays/view`);
      }, 1500);
    } catch (err) {
      console.error('Error uploading X-rays:', err);
      setError("Failed to upload X-rays. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  
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
          Upload X-Ray Images
        </Typography>
      </Box>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Success</AlertTitle>
          X-rays uploaded successfully! Redirecting to view X-rays...
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Upload New X-Ray Images
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">X-Ray Type</FormLabel>
              <RadioGroup 
                row 
                value={xrayType} 
                onChange={(e) => setXrayType(e.target.value)}
              >
                <FormControlLabel value="panoramic" control={<Radio />} label="Panoramic" />
                <FormControlLabel value="periapical" control={<Radio />} label="Periapical" />
                <FormControlLabel value="bitewing" control={<Radio />} label="Bitewing" />
                <FormControlLabel value="cbct" control={<Radio />} label="CBCT" />
              </RadioGroup>
            </FormControl>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              Select X-Ray Files
              <input
                type="file"
                hidden
                accept="image/*,.dcm"
                multiple
                onChange={handleFileChange}
              />
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Accepted formats: JPG, PNG, DICOM (.dcm)
            </Typography>
            
            {uploadedFiles.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Files ({uploadedFiles.length})
                </Typography>
                <Stack spacing={1} divider={<Divider flexItem />}>
                  {uploadedFiles.map((file, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </Typography>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleRemoveFile(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
            
            <TextField
              label="Notes (Optional)"
              multiline
              rows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="Add any additional information about these X-rays"
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={uploading || uploadedFiles.length === 0}
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload X-Rays'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            X-Ray Guidelines
          </Typography>
          <Typography variant="body2" paragraph>
            For optimal AI analysis, please ensure X-rays are:
          </Typography>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>
              <Typography variant="body2">Clear and in focus</Typography>
            </li>
            <li>
              <Typography variant="body2">Properly oriented (patient's right on the left side of the image)</Typography>
            </li>
            <li>
              <Typography variant="body2">Captured with adequate contrast and brightness</Typography>
            </li>
            <li>
              <Typography variant="body2">Free from artifacts and overlapping structures when possible</Typography>
            </li>
          </ul>
        </CardContent>
        <CardActions>
          <XrayButtonGroup patientId={patientId || ''} compact />
        </CardActions>
      </Card>
    </Box>
  );
};

export default XRayUpload; 