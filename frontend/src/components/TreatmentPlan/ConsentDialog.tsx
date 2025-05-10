import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    FormControlLabel,
    Checkbox,
} from '@mui/material';

interface ConsentDialogProps {
    open: boolean;
    onClose: () => void;
    onSign: (signedBy: string) => void;
}

export const ConsentDialog: React.FC<ConsentDialogProps> = ({
    open,
    onClose,
    onSign
}) => {
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [hasAgreed, setHasAgreed] = useState(false);

    const handleSubmit = () => {
        if (!name || !hasAgreed) return;
        onSign(name);
        setName('');
        setRelationship('');
        setHasAgreed(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Treatment Plan Consent</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" paragraph>
                        By signing this treatment plan, I acknowledge that:
                    </Typography>
                    <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                        <li>I have reviewed and understand the proposed treatment plan</li>
                        <li>The treatment procedures, risks, benefits, and alternatives have been explained to me</li>
                        <li>I understand the estimated costs and insurance coverage</li>
                        <li>I have had the opportunity to ask questions about the treatment plan</li>
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Relationship to Patient (if not self)"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={hasAgreed}
                            onChange={(e) => setHasAgreed(e.target.checked)}
                        />
                    }
                    label="I agree to the treatment plan and consent to begin treatment"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={!name || !hasAgreed}
                >
                    Sign & Accept
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 