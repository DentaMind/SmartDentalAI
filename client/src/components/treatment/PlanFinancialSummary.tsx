import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Chip,
  Alert,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  PriceCheck as PriceCheckIcon,
  AttachMoney as MoneyIcon,
  Healing as HealingIcon,
  LocalHospital as InsuranceIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { TreatmentPlan, TreatmentProcedure } from '../../types/treatment-plan';

interface PlanFinancialSummaryProps {
  plan: TreatmentPlan;
}

export const PlanFinancialSummary: React.FC<PlanFinancialSummaryProps> = ({
  plan
}) => {
  // Group procedures by phase
  const proceduresByPhase: Record<string, TreatmentProcedure[]> = {};
  
  plan.procedures.forEach(proc => {
    if (!proceduresByPhase[proc.phase]) {
      proceduresByPhase[proc.phase] = [];
    }
    proceduresByPhase[proc.phase].push(proc);
  });
  
  // Calculate totals
  const totalFee = plan.total_fee;
  const insuranceCoverage = plan.insurance_portion;
  const patientResponsibility = plan.patient_portion;
  
  // Calculate coverage percentage
  const coveragePercentage = totalFee > 0 
    ? Math.round((insuranceCoverage / totalFee) * 100) 
    : 0;
  
  // Count procedures requiring preauth
  const proceduresRequiringPreauth = plan.procedures.filter(p => p.preauth_required).length;
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Treatment Cost
                  </Typography>
                  <Typography variant="h5">
                    ${totalFee.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <InsuranceIcon fontSize="large" color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Insurance Coverage
                  </Typography>
                  <Typography variant="h5">
                    ${insuranceCoverage.toFixed(2)}
                  </Typography>
                  <Typography variant="caption">
                    {coveragePercentage}% of total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PriceCheckIcon fontSize="large" color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Patient Responsibility
                  </Typography>
                  <Typography variant="h5">
                    ${patientResponsibility.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Pre-authorization Alert */}
        {proceduresRequiringPreauth > 0 && (
          <Grid item xs={12}>
            <Alert 
              severity="warning"
              icon={<WarningIcon />}
              sx={{ mb: 2 }}
            >
              {proceduresRequiringPreauth} procedure(s) require pre-authorization from insurance
            </Alert>
          </Grid>
        )}
        
        {/* Insurance Verification Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
            <Typography variant="subtitle1" gutterBottom>
              Insurance Verification
            </Typography>
            
            <Box display="flex" alignItems="center" mb={1}>
              <Chip 
                label={plan.insurance_verified ? "Verified" : "Not Verified"} 
                color={plan.insurance_verified ? "success" : "default"}
                size="small"
                sx={{ mr: 1 }}
              />
              {plan.insurance_notes && (
                <Typography variant="body2" color="textSecondary">
                  {plan.insurance_notes}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Procedures Table */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Procedure Breakdown
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Procedure</TableCell>
                  <TableCell>Tooth</TableCell>
                  <TableCell>CDT Code</TableCell>
                  <TableCell>Phase</TableCell>
                  <TableCell align="right">Fee</TableCell>
                  <TableCell align="right">Insurance</TableCell>
                  <TableCell align="right">Patient</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plan.procedures.map(proc => {
                  // Calculate insurance coverage for this procedure
                  const insuranceAmount = proc.insurance_coverage 
                    ? (proc.fee * proc.insurance_coverage / 100) 
                    : 0;
                  
                  // Calculate patient responsibility for this procedure
                  const patientAmount = proc.fee - insuranceAmount;
                  
                  return (
                    <TableRow key={proc.id}>
                      <TableCell>{proc.procedure_name}</TableCell>
                      <TableCell>{proc.tooth_number || '-'}</TableCell>
                      <TableCell>{proc.cdt_code || '-'}</TableCell>
                      <TableCell>
                        {proc.phase.replace('_', ' ').toUpperCase()}
                      </TableCell>
                      <TableCell align="right">${proc.fee.toFixed(2)}</TableCell>
                      <TableCell align="right">${insuranceAmount.toFixed(2)}</TableCell>
                      <TableCell align="right">${patientAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Totals Row */}
                <TableRow>
                  <TableCell colSpan={4} align="right">
                    <Typography variant="subtitle2">TOTALS:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">${totalFee.toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">${insuranceCoverage.toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">${patientResponsibility.toFixed(2)}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        {/* Financial Options */}
        {plan.financial_options && Object.keys(plan.financial_options).length > 0 && (
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Financial Options
            </Typography>
            
            <Paper sx={{ p: 2 }} variant="outlined">
              {/* Render financial options based on data structure */}
              {Object.entries(plan.financial_options).map(([key, value]) => (
                <Box key={key} mb={2}>
                  <Typography variant="subtitle2">
                    {key.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2">
                    {typeof value === 'object' 
                      ? JSON.stringify(value) 
                      : value.toString()}
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}; 