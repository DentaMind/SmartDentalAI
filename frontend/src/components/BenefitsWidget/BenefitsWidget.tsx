import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Info,
  LocalHospital,
  AttachMoney,
  Assignment,
  Refresh,
} from '@mui/icons-material';
import { useBenefitsData } from '@hooks/useBenefitsData';
import { useLedgerData } from '@hooks/useLedgerData';
import { PreAuthDialog } from '@components/PreAuth/PreAuthDialog';
import { LedgerSummary } from '@components/LedgerSummary/LedgerSummary';
import type { BenefitsWidgetProps } from './types';

const BenefitsWidget: React.FC<BenefitsWidgetProps> = ({
  patientId,
  onPreAuthRequired,
  className,
}) => {
  const { benefitsData, isLoading: benefitsLoading, isError: benefitsError, refresh: refreshBenefits } = useBenefitsData(patientId);
  const { ledgerData, isLoading: ledgerLoading, isError: ledgerError, refresh: refreshLedger, getSummaryForCDT, getEntriesForCDT } = useLedgerData(patientId);
  const [selectedProcedure, setSelectedProcedure] = useState<{
    cdtCode: string;
    description: string;
  } | null>(null);

  const isLoading = benefitsLoading || ledgerLoading;
  const isError = benefitsError || ledgerError;

  const refresh = () => {
    refreshBenefits();
    refreshLedger();
  };

  useEffect(() => {
    if (benefitsData?.coverage) {
      const preAuthCodes = benefitsData.coverage
        .filter(item => item.requiresPreAuth)
        .map(item => item.cdtCode);
      
      if (preAuthCodes.length > 0 && onPreAuthRequired) {
        onPreAuthRequired(preAuthCodes);
      }
    }
  }, [benefitsData?.coverage, onPreAuthRequired]);

  const handlePreAuthClick = (cdtCode: string, description: string) => {
    setSelectedProcedure({ cdtCode, description });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardContent>
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<Refresh />}
                onClick={() => refresh()}
              >
                Retry
              </Button>
            }
          >
            Failed to load benefits data
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!benefitsData?.benefits?.length) {
    return (
      <Card className={className}>
        <CardContent>
          <Alert severity="info">No benefits information available</Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (requiresPreAuth: boolean, warnings: string[]) => {
    if (requiresPreAuth) return <Warning color="warning" />;
    if (warnings.length > 0) return <Info color="info" />;
    return <CheckCircle color="success" />;
  };

  return (
    <>
      <Card className={className}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Insurance Benefits
            </Typography>
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={() => refresh()}
            >
              Refresh
            </Button>
          </Box>

          {/* Benefits Summary */}
          <List>
            {benefitsData.benefits.map((benefit, index) => (
              <React.Fragment key={benefit.type}>
                <ListItem>
                  <ListItemIcon>
                    {benefit.type === 'Annual Maximum' ? (
                      <AttachMoney />
                    ) : benefit.type === 'Preventive' ? (
                      <LocalHospital />
                    ) : (
                      <Assignment />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={benefit.type}
                    secondary={
                      <Box component="span">
                        <Typography component="span" color={benefit.remaining <= 0 ? 'error' : 'textSecondary'}>
                          Used: ${benefit.used.toLocaleString()} | Remaining: ${benefit.remaining.toLocaleString()}
                        </Typography>
                        <Typography component="div" variant="caption" color="textSecondary">
                          Total: ${benefit.total.toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <Typography variant="body2" color="textSecondary">
                    Renews: {new Date(benefit.nextRenewal).toLocaleDateString()}
                  </Typography>
                </ListItem>
                {index < benefitsData.benefits.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {/* Coverage Alerts */}
          {benefitsData.coverage?.map((item) => (
            <Box key={item.cdtCode}>
              <Alert
                severity={item.requiresPreAuth ? 'warning' : item.warnings.length ? 'info' : 'success'}
                icon={getStatusIcon(item.requiresPreAuth, item.warnings)}
                sx={{ mt: 2 }}
                action={
                  item.requiresPreAuth && (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => handlePreAuthClick(item.cdtCode, item.description)}
                    >
                      Submit Pre-Auth
                    </Button>
                  )
                }
              >
                <Typography variant="subtitle2">
                  {item.cdtCode} - {item.description}
                </Typography>
                <Typography variant="body2">
                  Coverage: {item.coveragePercent}%
                  {item.requiresPreAuth && ' (Pre-authorization required)'}
                </Typography>
                {item.warnings.map((warning, idx) => (
                  <Typography key={idx} variant="body2" color="text.secondary">
                    • {warning}
                  </Typography>
                ))}
              </Alert>
              
              {/* Ledger Summary */}
              <LedgerSummary
                cdtCode={item.cdtCode}
                description={item.description}
                entries={getEntriesForCDT(item.cdtCode)}
                summary={getSummaryForCDT(item.cdtCode)}
              />
            </Box>
          ))}
        </CardContent>
      </Card>

      {selectedProcedure && (
        <PreAuthDialog
          open={!!selectedProcedure}
          onClose={() => setSelectedProcedure(null)}
          patientId={patientId}
          cdtCode={selectedProcedure.cdtCode}
          procedureDescription={selectedProcedure.description}
        />
      )}
    </>
  );
};

export default BenefitsWidget; 