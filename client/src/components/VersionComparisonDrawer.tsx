import React, { useState } from 'react';
import { Drawer, Tabs, Tab, Box, Button, TextField, Alert } from '@mui/material';
import { ChevronRight, AlertTriangle, ArrowUp, ArrowDown, Minus, Download, Copy, Loader2, Mail } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../hooks/useAuth';

interface VersionComparisonProps {
  version1: string;
  version2: string;
  isOpen: boolean;
  onClose: () => void;
  reviews: any[]; // Replace with proper type
}

interface VersionComparison {
  version1: {
    details: any; // Replace with proper type
    affectedReviews: number;
  };
  version2: {
    details: any; // Replace with proper type
    affectedReviews: number;
  };
  accuracyDeltas: Record<string, number>;
  thresholdDeltas: Record<string, number>;
  reviewImpactDelta: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`comparison-tabpanel-${index}`}
      aria-labelledby={`comparison-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const VersionComparisonDrawer: React.FC<VersionComparisonProps> = ({
  version1,
  version2,
  isOpen,
  onClose,
  reviews,
}) => {
  const [comparison, setComparison] = React.useState<VersionComparison | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const { user } = useAuth();

  React.useEffect(() => {
    const fetchComparison = async () => {
      if (!version1 || !version2 || !isOpen) return;

      setIsLoading(true);
      setError(null);

      try {
        const [details1, details2] = await Promise.all([
          api.getModelVersionDetails(version1),
          api.getModelVersionDetails(version2),
        ]);

        const affectedReviews1 = reviews.filter(r => r.modelVersion === version1).length;
        const affectedReviews2 = reviews.filter(r => r.modelVersion === version2).length;

        // Calculate deltas
        const accuracyDeltas: Record<string, number> = {};
        const thresholdDeltas: Record<string, number> = {};

        Object.keys(details1.accuracyMetrics.byCondition).forEach(condition => {
          accuracyDeltas[condition] = 
            details2.accuracyMetrics.byCondition[condition] - 
            details1.accuracyMetrics.byCondition[condition];
        });

        details1.confidenceThresholds.forEach((threshold: any) => {
          const threshold2 = details2.confidenceThresholds.find(
            (t: any) => t.condition === threshold.condition
          );
          if (threshold2) {
            thresholdDeltas[threshold.condition] = threshold2.threshold - threshold.threshold;
          }
        });

        setComparison({
          version1: {
            details: details1,
            affectedReviews: affectedReviews1,
          },
          version2: {
            details: details2,
            affectedReviews: affectedReviews2,
          },
          accuracyDeltas,
          thresholdDeltas,
          reviewImpactDelta: affectedReviews2 - affectedReviews1,
        });
      } catch (err) {
        setError('Failed to load version comparison');
        toast.error('Failed to load version comparison');
        console.error('Error fetching version comparison:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparison();
  }, [version1, version2, isOpen, reviews]);

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (delta < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatDelta = (delta: number) => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(2)}`;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const generateAiSummary = async () => {
    if (!comparison) return;

    setIsGeneratingSummary(true);
    try {
      const summary = await api.generateVersionComparisonSummary({
        version1,
        version2,
        accuracyDeltas: comparison.accuracyDeltas,
        thresholdDeltas: comparison.thresholdDeltas,
        reviewImpactDelta: comparison.reviewImpactDelta,
      });
      setAiSummary(summary);
    } catch (err) {
      toast.error('Failed to generate AI summary');
      console.error('Error generating summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const exportToCSV = () => {
    if (!comparison) return;

    const headers = ['Metric', 'Change'];
    const rows = [
      ...Object.entries(comparison.accuracyDeltas).map(([condition, delta]) => [
        `Accuracy (${condition})`,
        `${formatDelta(delta * 100)}%`,
      ]),
      ...Object.entries(comparison.thresholdDeltas).map(([condition, delta]) => [
        `Threshold (${condition})`,
        formatDelta(delta),
      ]),
      ['Review Impact', `${formatDelta(comparison.reviewImpactDelta)} reviews`],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `version-comparison-${version1}-vs-${version2}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    if (!comparison) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Version Comparison: v${version1} vs v${version2}`, 14, 20);

    // Add accuracy changes table
    doc.setFontSize(12);
    doc.text('Accuracy Changes by Condition', 14, 30);
    const accuracyData = Object.entries(comparison.accuracyDeltas).map(([condition, delta]) => [
      condition,
      `${formatDelta(delta * 100)}%`,
    ]);
    (doc as any).autoTable({
      startY: 35,
      head: [['Condition', 'Change']],
      body: accuracyData,
    });

    // Add threshold changes table
    doc.text('Confidence Threshold Changes', 14, (doc as any).lastAutoTable.finalY + 10);
    const thresholdData = Object.entries(comparison.thresholdDeltas).map(([condition, delta]) => [
      condition,
      formatDelta(delta),
    ]);
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Condition', 'Change']],
      body: thresholdData,
    });

    // Add review impact
    doc.text('Review Impact', 14, (doc as any).lastAutoTable.finalY + 10);
    doc.text(`${formatDelta(comparison.reviewImpactDelta)} reviews`, 14, (doc as any).lastAutoTable.finalY + 20);

    doc.save(`version-comparison-${version1}-vs-${version2}.pdf`);
  };

  const handleSendEmail = async () => {
    if (!comparison || !aiSummary) {
      toast.error('Please generate a summary first');
      return;
    }

    if (!recipientEmail) {
      setEmailError('Please enter a recipient email');
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);

    try {
      await api.emailVersionComparison({
        version1,
        version2,
        accuracyDeltas: comparison.accuracyDeltas,
        thresholdDeltas: comparison.thresholdDeltas,
        reviewImpactDelta: comparison.reviewImpactDelta,
        summary: aiSummary,
        recipientEmail,
      });

      toast.success('Email sent successfully');
      setRecipientEmail('');
    } catch (err) {
      setEmailError('Failed to send email');
      toast.error('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '50%',
            minWidth: 500,
            maxWidth: 800,
          },
        }}
      >
        <div className="p-6 flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </Drawer>
    );
  }

  if (error) {
    return (
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '50%',
            minWidth: 500,
            maxWidth: 800,
          },
        }}
      >
        <div className="p-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-red-800">Error Loading Comparison</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    );
  }

  if (!comparison) return null;

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '50%',
          minWidth: 500,
          maxWidth: 800,
        },
      }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Comparing v{version1} vs v{version2}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <Tabs value={tabValue} onChange={handleTabChange} aria-label="comparison tabs">
          <Tab label="Comparison" />
          <Tab label="Export & Summary" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">v{version1}</h3>
                <p className="text-sm text-blue-700">
                  {comparison.version1.affectedReviews} affected reviews
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">v{version2}</h3>
                <p className="text-sm text-blue-700">
                  {comparison.version2.affectedReviews} affected reviews
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Accuracy Changes by Condition</h3>
            <div className="space-y-2">
              {Object.entries(comparison.accuracyDeltas).map(([condition, delta]) => (
                <div
                  key={condition}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-gray-700">{condition}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatDelta(delta * 100)}%
                    </span>
                    {getDeltaIcon(delta)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Confidence Threshold Changes</h3>
            <div className="space-y-2">
              {Object.entries(comparison.thresholdDeltas).map(([condition, delta]) => (
                <div
                  key={condition}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-gray-700">{condition}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatDelta(delta)}
                    </span>
                    {getDeltaIcon(delta)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-yellow-800">Review Impact</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Version {version2} has {Math.abs(comparison.reviewImpactDelta)} {comparison.reviewImpactDelta > 0 ? 'more' : 'fewer'} affected reviews than version {version1}.
                </p>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Export Comparison</h3>
              <div className="flex space-x-4">
                <Button
                  variant="outlined"
                  startIcon={<Download className="w-4 h-4" />}
                  onClick={exportToCSV}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download className="w-4 h-4" />}
                  onClick={exportToPDF}
                >
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">AI Summary</h3>
              <div className="flex space-x-4">
                <Button
                  variant="contained"
                  onClick={generateAiSummary}
                  disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Summary'
                  )}
                </Button>
                {aiSummary && (
                  <Button
                    variant="outlined"
                    startIcon={<Copy className="w-4 h-4" />}
                    onClick={() => {
                      navigator.clipboard.writeText(aiSummary);
                      toast.success('Summary copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                )}
              </div>
              {aiSummary && (
                <TextField
                  multiline
                  fullWidth
                  rows={4}
                  value={aiSummary}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              )}
            </div>

            {aiSummary && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Report</h3>
                <div className="space-y-4">
                  <TextField
                    fullWidth
                    label="Recipient Email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    error={!!emailError}
                    helperText={emailError}
                    placeholder={user?.email || 'Enter email address'}
                  />
                  <div className="flex space-x-4">
                    <Button
                      variant="contained"
                      startIcon={isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      onClick={handleSendEmail}
                      disabled={isSendingEmail || !recipientEmail}
                    >
                      {isSendingEmail ? 'Sending...' : 'Send Email'}
                    </Button>
                    {user?.email && (
                      <Button
                        variant="outlined"
                        onClick={() => setRecipientEmail(user.email)}
                      >
                        Use My Email
                      </Button>
                    )}
                  </div>
                  <Alert severity="info" className="mt-4">
                    The email will include the AI summary and a detailed PDF report with accuracy changes, threshold adjustments, and review impact analysis.
                  </Alert>
                </div>
              </div>
            )}
          </div>
        </TabPanel>
      </div>
    </Drawer>
  );
}; 