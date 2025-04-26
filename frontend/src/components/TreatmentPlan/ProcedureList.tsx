import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    Box,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import type { TreatmentProcedure, TreatmentStatus } from '@/types/treatment-plan';

interface ProcedureListProps {
    procedures: TreatmentProcedure[];
    onStatusChange: (procedureId: string, status: TreatmentStatus, completedDate?: string, providerId?: string) => void;
    providerId?: string;
}

export const ProcedureList: React.FC<ProcedureListProps> = ({
    procedures,
    onStatusChange,
    providerId
}) => {
    const getStatusColor = (status: TreatmentStatus) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'planned':
                return 'info';
            case 'accepted':
                return 'primary';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    const handleComplete = (procedure: TreatmentProcedure) => {
        if (!providerId) {
            console.error('Provider ID is required to complete a procedure');
            return;
        }
        onStatusChange(procedure.id, 'completed', new Date().toISOString(), providerId);
    };

    const handleReject = (procedure: TreatmentProcedure) => {
        onStatusChange(procedure.id, 'rejected');
    };

    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>CDT Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell align="right">Fee</TableCell>
                    <TableCell align="right">Insurance</TableCell>
                    <TableCell align="right">Patient</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {procedures.map((procedure) => (
                    <TableRow key={procedure.id}>
                        <TableCell>
                            <Box display="flex" alignItems="center">
                                {procedure.cdt_code}
                                {procedure.preauth_required && (
                                    <Tooltip title="Pre-authorization required">
                                        <WarningIcon
                                            color="warning"
                                            fontSize="small"
                                            sx={{ ml: 1 }}
                                        />
                                    </Tooltip>
                                )}
                            </Box>
                        </TableCell>
                        <TableCell>{procedure.description}</TableCell>
                        <TableCell>
                            {procedure.tooth_number}
                            {procedure.surface && ` (${procedure.surface})`}
                        </TableCell>
                        <TableCell align="right">
                            ${procedure.fee.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                            ${procedure.insurance_covered.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                            ${procedure.patient_responsibility.toLocaleString()}
                        </TableCell>
                        <TableCell>
                            <Chip
                                label={procedure.status}
                                color={getStatusColor(procedure.status)}
                                size="small"
                            />
                        </TableCell>
                        <TableCell>
                            {procedure.status === 'planned' && (
                                <>
                                    <Tooltip title="Complete">
                                        <IconButton
                                            size="small"
                                            color="success"
                                            onClick={() => handleComplete(procedure)}
                                        >
                                            <CheckCircleIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleReject(procedure)}
                                        >
                                            <CancelIcon />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}; 