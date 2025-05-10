import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    Box,
} from '@mui/material';
import type { TreatmentProcedure, TreatmentPhase } from '@/types/treatment-plan';
import { useBenefitsData } from '@/hooks/useBenefitsData';

interface ProcedureDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (procedure: TreatmentProcedure) => void;
    patientId: string;
}

export const ProcedureDialog: React.FC<ProcedureDialogProps> = ({
    open,
    onClose,
    onSave,
    patientId
}) => {
    const { benefitsData } = useBenefitsData(patientId);
    const [procedure, setProcedure] = useState<Partial<TreatmentProcedure>>({
        phase: 'phase_1',
        fee: 0
    });

    const handleChange = (field: keyof TreatmentProcedure, value: any) => {
        setProcedure(prev => ({ ...prev, [field]: value }));

        // If CDT code changes, update fee and description from benefits data
        if (field === 'cdt_code' && benefitsData?.coverage) {
            const coverage = benefitsData.coverage.find(c => c.cdtCode === value);
            if (coverage) {
                setProcedure(prev => ({
                    ...prev,
                    description: coverage.description,
                    fee: coverage.fee || 0
                }));
            }
        }
    };

    const handleSubmit = () => {
        if (!procedure.cdt_code || !procedure.description || procedure.fee === undefined) {
            return;
        }

        onSave(procedure as TreatmentProcedure);
        setProcedure({ phase: 'phase_1', fee: 0 });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Add Procedure</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>CDT Code</InputLabel>
                            <Select
                                value={procedure.cdt_code || ''}
                                onChange={(e) => handleChange('cdt_code', e.target.value)}
                                label="CDT Code"
                            >
                                {benefitsData?.coverage?.map((coverage) => (
                                    <MenuItem key={coverage.cdtCode} value={coverage.cdtCode}>
                                        {coverage.cdtCode} - {coverage.description}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Phase</InputLabel>
                            <Select
                                value={procedure.phase || 'phase_1'}
                                onChange={(e) => handleChange('phase', e.target.value)}
                                label="Phase"
                            >
                                <MenuItem value="urgent">Urgent</MenuItem>
                                <MenuItem value="phase_1">Phase 1</MenuItem>
                                <MenuItem value="phase_2">Phase 2</MenuItem>
                                <MenuItem value="maintenance">Maintenance</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Tooth Number"
                            value={procedure.tooth_number || ''}
                            onChange={(e) => handleChange('tooth_number', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Surface"
                            value={procedure.surface || ''}
                            onChange={(e) => handleChange('surface', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Description"
                            value={procedure.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Fee"
                            value={procedure.fee || ''}
                            onChange={(e) => handleChange('fee', parseFloat(e.target.value))}
                            InputProps={{
                                startAdornment: <Box component="span" mr={1}>$</Box>
                            }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Clinical Notes"
                            value={procedure.clinical_notes || ''}
                            onChange={(e) => handleChange('clinical_notes', e.target.value)}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={!procedure.cdt_code || !procedure.description || procedure.fee === undefined}
                >
                    Add Procedure
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 