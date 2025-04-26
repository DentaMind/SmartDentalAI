import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
} from '@mui/material';
import {
    LocalHospital as UrgentIcon,
    Assignment as Phase1Icon,
    CheckCircle as Phase2Icon,
    Repeat as MaintenanceIcon,
} from '@mui/icons-material';
import type { TreatmentPhase } from '@/types/treatment-plan';

interface PhaseSummaryProps {
    phase: TreatmentPhase;
    count: number;
    selected: boolean;
    onClick: () => void;
}

export const PhaseSummary: React.FC<PhaseSummaryProps> = ({
    phase,
    count,
    selected,
    onClick
}) => {
    const getPhaseInfo = (phase: TreatmentPhase) => {
        switch (phase) {
            case 'urgent':
                return {
                    label: 'Urgent Care',
                    icon: UrgentIcon,
                    color: '#f44336'
                };
            case 'phase_1':
                return {
                    label: 'Phase 1',
                    icon: Phase1Icon,
                    color: '#2196f3'
                };
            case 'phase_2':
                return {
                    label: 'Phase 2',
                    icon: Phase2Icon,
                    color: '#4caf50'
                };
            case 'maintenance':
                return {
                    label: 'Maintenance',
                    icon: MaintenanceIcon,
                    color: '#ff9800'
                };
            default:
                return {
                    label: 'Unknown',
                    icon: Phase1Icon,
                    color: '#9e9e9e'
                };
        }
    };

    const { label, icon: Icon, color } = getPhaseInfo(phase);

    return (
        <Card
            sx={{
                cursor: 'pointer',
                bgcolor: selected ? `${color}10` : 'transparent',
                border: selected ? `1px solid ${color}` : '1px solid transparent',
                '&:hover': {
                    bgcolor: `${color}20`
                }
            }}
            onClick={onClick}
        >
            <CardContent>
                <Box display="flex" alignItems="center">
                    <Icon sx={{ color, mr: 1 }} />
                    <Box flexGrow={1}>
                        <Typography variant="subtitle2" color="textSecondary">
                            {label}
                        </Typography>
                        <Typography variant="h6">
                            {count} Procedures
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}; 