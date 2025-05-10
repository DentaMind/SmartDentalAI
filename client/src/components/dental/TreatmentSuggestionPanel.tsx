import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Divider,
  Collapse,
  Link,
  Paper,
  Stack,
  Alert,
  IconButton,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';

interface ResearchLink {
  title: string;
  url: string;
}

interface Evidence {
  researchLinks?: ResearchLink[];
  clinicalGuidelines?: string;
}

interface TreatmentCost {
  cost: number;
  insuranceCoverage: string;
  patientPortion: number;
}

interface Finding {
  id: string;
  type: string;
  description: string;
  location: string;
  confidence: number;
  suggestedTreatments: string[];
  evidence?: Evidence;
}

interface TreatmentSuggestionPanelProps {
  findings: Finding[];
  treatmentCosts?: Record<string, TreatmentCost>;
  onAcceptTreatment?: (findingId: string, treatment: string) => void;
  onRejectFinding?: (findingId: string) => void;
  patientName?: string;
  analysisId?: string;
}

const TreatmentSuggestionPanel: React.FC<TreatmentSuggestionPanelProps> = ({
  findings,
  treatmentCosts,
  onAcceptTreatment,
  onRejectFinding,
  patientName = 'Patient',
  analysisId = ''
}) => {
  const theme = useTheme();
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);

  const toggleFinding = (findingId: string) => {
    setExpandedFinding(expandedFinding === findingId ? null : findingId);
  };

  const toggleEvidence = (findingId: string) => {
    setExpandedEvidence(expandedEvidence === findingId ? null : findingId);
  };

  // Estimate total treatment costs
  const estimateTotalCost = () => {
    if (!treatmentCosts) return { total: 0, patientTotal: 0 };
    
    let total = 0;
    let patientTotal = 0;
    
    findings.forEach(finding => {
      if (finding.suggestedTreatments && finding.suggestedTreatments.length) {
        // Just take the first suggested treatment for cost estimation
        const treatment = finding.suggestedTreatments[0];
        if (treatmentCosts[treatment]) {
          total += treatmentCosts[treatment].cost;
          patientTotal += treatmentCosts[treatment].patientPortion;
        }
      }
    });
    
    return { total, patientTotal };
  };
  
  const { total, patientTotal } = estimateTotalCost();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI-Suggested Treatments
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Based on the diagnostic analysis for {patientName}
        </Typography>
        
        {findings.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No findings detected in this image.
          </Alert>
        ) : (
          <>
            <List>
              {findings.map((finding) => (
                <Paper key={finding.id} sx={{ mb: 2, overflow: 'hidden' }}>
                  <ListItem 
                    button 
                    onClick={() => toggleFinding(finding.id)}
                    sx={{ 
                      bgcolor: 'background.paper',
                      borderLeft: '4px solid',
                      borderColor: finding.confidence > 0.85 ? 'error.main' : 
                                  finding.confidence > 0.7 ? 'warning.main' : 'info.main',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">{finding.type}</Typography>
                          <Chip 
                            label={`${Math.round(finding.confidence * 100)}%`} 
                            size="small" 
                            color={finding.confidence > 0.85 ? 'error' : 
                                  finding.confidence > 0.7 ? 'warning' : 'info'}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary={finding.location}
                    />
                    {expandedFinding === finding.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItem>
                  
                  <Collapse in={expandedFinding === finding.id}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {finding.description}
                      </Typography>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Suggested Treatments:
                      </Typography>
                      
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        {finding.suggestedTreatments.map((treatment) => (
                          <Box key={treatment} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{treatment}</Typography>
                            
                            {treatmentCosts && treatmentCosts[treatment] && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip 
                                  label={`$${treatmentCosts[treatment].cost}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                                
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  color="primary"
                                  onClick={() => onAcceptTreatment && onAcceptTreatment(finding.id, treatment)}
                                >
                                  Accept
                                </Button>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                      
                      {finding.evidence && (
                        <>
                          <Button 
                            size="small" 
                            onClick={() => toggleEvidence(finding.id)}
                            endIcon={expandedEvidence === finding.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{ mb: 1 }}
                          >
                            Clinical Evidence
                          </Button>
                          
                          <Collapse in={expandedEvidence === finding.id}>
                            <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'primary.main' }}>
                              {finding.evidence.clinicalGuidelines && (
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>Guidelines:</strong> {finding.evidence.clinicalGuidelines}
                                </Typography>
                              )}
                              
                              {finding.evidence.researchLinks && finding.evidence.researchLinks.length > 0 && (
                                <>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Research:</strong>
                                  </Typography>
                                  <List dense>
                                    {finding.evidence.researchLinks.map((link, idx) => (
                                      <ListItem key={idx} sx={{ py: 0 }}>
                                        <Link href={link.url} target="_blank" rel="noopener">
                                          {link.title}
                                        </Link>
                                      </ListItem>
                                    ))}
                                  </List>
                                </>
                              )}
                            </Box>
                          </Collapse>
                        </>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          startIcon={<WarningIcon />}
                          onClick={() => onRejectFinding && onRejectFinding(finding.id)}
                        >
                          Reject Finding
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
                </Paper>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Estimated Treatment Cost Summary
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Estimated Cost:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>${total}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Estimated Patient Portion:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>${patientTotal}</Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                * These are estimates based on average costs. Actual costs may vary.
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TreatmentSuggestionPanel; 