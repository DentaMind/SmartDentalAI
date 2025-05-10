import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Assignment as AssignmentIcon,
    LocalHospital as LocalHospitalIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { useTreatmentPlan } from '@/hooks/useTreatmentPlan';
import type { TreatmentProcedure, TreatmentPhase } from '@/types/treatment-plan';
import { ProcedureDialog } from './ProcedureDialog';
import { ConsentDialog } from './ConsentDialog';
import { ProcedureList } from './ProcedureList';
import { PhaseSummary } from './PhaseSummary';

interface TreatmentPlanBuilderProps {
    patientId: string;
    planId?: string;
    providerId: string;
    onPlanCreated?: (planId: string) => void;
    className?: string;
}

export const TreatmentPlanBuilder: React.FC<TreatmentPlanBuilderProps> = ({
    patientId,
    planId,
    providerId,
    onPlanCreated,
    className
}) => {
    const {
        plan,
        summary,
        isLoading,
        isError,
        createPlan,
        addProcedure,
        updateProcedureStatus,
        signConsent
    } = useTreatmentPlan(planId);

    const [isAddingProcedure, setIsAddingProcedure] = useState(false);
    const [isSigningConsent, setIsSigningConsent] = useState(false);
    const [notes, setNotes] = useState('');
    const [selectedPhase, setSelectedPhase] = useState<TreatmentPhase>('phase_1');

    const handleCreatePlan = async () => {
        try {
            const newPlan = await createPlan({
                patient_id: patientId,
                created_by: providerId,
                notes: notes || undefined
            });
            onPlanCreated?.(newPlan.id);
        } catch (error) {
            console.error('Failed to create plan:', error);
        }
    };

    const handleAddProcedure = async (procedure: TreatmentProcedure) => {
        try {
            await addProcedure({
                cdt_code: procedure.cdt_code,
                description: procedure.description,
                tooth_number: procedure.tooth_number,
                surface: procedure.surface,
                phase: procedure.phase,
                fee: procedure.fee,
                clinical_notes: procedure.clinical_notes,
                ai_findings: procedure.ai_findings,
                radiographs: procedure.radiographs
            });
            setIsAddingProcedure(false);
        } catch (error) {
            console.error('Failed to add procedure:', error);
        }
    };

    const handleSignConsent = async (signedBy: string) => {
        try {
            await signConsent(signedBy);
            setIsSigningConsent(false);
        } catch (error) {
            console.error('Failed to sign consent:', error);
        }
    };

    const handleExportPDF = async () => {
        try {
            const response = await fetch(`/api/treatment-plans/${plan.id}/pdf`);
            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }
            
            // Create blob from response
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `treatment_plan_${plan.id}.pdf`;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to export PDF:', error);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Failed to load treatment plan data
            </Alert>
        );
    }

    if (!plan && !planId) {
        return (
            <Card className={className}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Create New Treatment Plan
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Treatment Plan Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreatePlan}
                    >
                        Create Plan
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!plan) return null;

    const needsPreAuth = plan.procedures.some(p => p.preauth_required);
    const canSignConsent = plan.status === 'planned' && plan.procedures.length > 0;

    return (
        <Card className={className}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                        Treatment Plan
                    </Typography>
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleExportPDF}
                            sx={{ mr: 1 }}
                        >
                            Export PDF
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setIsAddingProcedure(true)}
                        >
                            Add Procedure
                        </Button>
                    </Box>
                </Box>

                {needsPreAuth && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Some procedures require pre-authorization
                    </Alert>
                )}

                {summary && (
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={4}>
                            <PhaseSummary
                                phase="urgent"
                                count={summary.procedures_by_phase.urgent}
                                selected={selectedPhase === 'urgent'}
                                onClick={() => setSelectedPhase('urgent')}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <PhaseSummary
                                phase="phase_1"
                                count={summary.procedures_by_phase.phase_1}
                                selected={selectedPhase === 'phase_1'}
                                onClick={() => setSelectedPhase('phase_1')}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <PhaseSummary
                                phase="phase_2"
                                count={summary.procedures_by_phase.phase_2}
                                selected={selectedPhase === 'phase_2'}
                                onClick={() => setSelectedPhase('phase_2')}
                            />
                        </Grid>
                    </Grid>
                )}

                <ProcedureList
                    procedures={plan.procedures.filter(p => p.phase === selectedPhase)}
                    onStatusChange={updateProcedureStatus}
                />

                {summary && (
                    <Box mt={2}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" gutterBottom>
                            Financial Summary
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="textSecondary">
                                    Total Treatment Fee
                                </Typography>
                                <Typography variant="h6">
                                    ${summary.total_treatment_fee.toLocaleString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="textSecondary">
                                    Insurance Coverage
                                </Typography>
                                <Typography variant="h6">
                                    ${summary.total_insurance_coverage.toLocaleString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="textSecondary">
                                    Patient Responsibility
                                </Typography>
                                <Typography variant="h6">
                                    ${summary.total_patient_responsibility.toLocaleString()}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {canSignConsent && (
                    <Box mt={2} display="flex" justifyContent="flex-end">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setIsSigningConsent(true)}
                        >
                            Sign Consent
                        </Button>
                    </Box>
                )}
            </CardContent>

            <ProcedureDialog
                open={isAddingProcedure}
                onClose={() => setIsAddingProcedure(false)}
                onSave={handleAddProcedure}
                patientId={patientId}
            />

            <ConsentDialog
                open={isSigningConsent}
                onClose={() => setIsSigningConsent(false)}
                onSign={handleSignConsent}
            />
        </Card>
    );
}; 