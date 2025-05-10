import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Button,
  Menu,
  IconButton,
  Tooltip,
  ListItemIcon,
  ListItemText,
  ListItem
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import AdminLayout from '../../components/admin/AdminLayout';
import aiFeedbackService from '../../services/aiFeedbackService';
import clinicalEvidenceService from '../../services/clinicalEvidenceService';
import userService from '../../services/userService';
import analyticsExportService from '../../services/analyticsExportService';

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Time period options for filtering
const timePeriods = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
  { value: 'year', label: 'Last 365 Days' }
];

// Main dashboard component
const AIAnalyticsDashboard: React.FC = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Filter states
  const [period, setPeriod] = useState('month');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [providers, setProviders] = useState<Array<{id: string, name: string}>>([]);
  
  // Data states
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [treatmentPatterns, setTreatmentPatterns] = useState<any>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Load providers on component mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providersList = await userService.getProvidersWithFeedback();
        setProviders(providersList);
      } catch (err) {
        console.error('Error loading providers:', err);
      }
    };
    
    loadProviders();
  }, []);
  
  // Load data on component mount and when filters change
  useEffect(() => {
    loadDashboardData();
  }, [period, selectedProvider]);
  
  // Function to load all dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load feedback analytics data with provider filter
      const feedbackAnalytics = await aiFeedbackService.getFeedbackAnalytics(period, selectedProvider);
      setFeedbackData(feedbackAnalytics);
      
      // Load evidence feedback data with provider filter
      const evidenceFeedback = await aiFeedbackService.getEvidenceFeedbackAnalytics(period, selectedProvider);
      setEvidenceData(evidenceFeedback);
      
      // Load treatment patterns data with provider filter
      const patterns = await aiFeedbackService.getTreatmentPatterns(period, selectedProvider);
      setTreatmentPatterns(patterns);
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle period change
  const handlePeriodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPeriod(event.target.value as string);
  };
  
  // Handle provider change
  const handleProviderChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedProvider(event.target.value as string);
  };
  
  // Handle export menu open
  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };
  
  // Handle export menu close
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };
  
  // Export functions
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      handleExportMenuClose();
      
      // Export data based on current tab
      if (tabValue === 0 && feedbackData) {
        analyticsExportService.exportFeedbackAnalyticsCSV(
          feedbackData,
          selectedProvider,
          period
        );
      } else if (tabValue === 1 && evidenceData) {
        analyticsExportService.exportEvidenceAnalyticsCSV(
          evidenceData,
          selectedProvider,
          period
        );
      } else if (tabValue === 2 && treatmentPatterns) {
        analyticsExportService.exportTreatmentPatternsCSV(
          treatmentPatterns,
          selectedProvider,
          period
        );
      }
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setExportLoading(false);
    }
  };
  
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      handleExportMenuClose();
      
      // Generate and download comprehensive PDF report with all data
      if (feedbackData && evidenceData && treatmentPatterns) {
        await analyticsExportService.exportAnalyticsPDF(
          feedbackData,
          evidenceData,
          treatmentPatterns,
          selectedProvider,
          period
        );
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setExportLoading(false);
    }
  };
  
  // Prepare chart data
  const prepareAcceptanceRateData = () => {
    if (!feedbackData) return [];
    
    return [
      { name: 'Accepted', value: feedbackData.accepted_count },
      { name: 'Rejected', value: feedbackData.rejected_count },
      { name: 'Modified', value: feedbackData.modified_count }
    ];
  };
  
  const prepareEvidenceReliabilityData = () => {
    if (!evidenceData || !evidenceData.evidence_grades) return [];
    
    return [
      { name: 'Grade A', value: evidenceData.evidence_grades.A || 0 },
      { name: 'Grade B', value: evidenceData.evidence_grades.B || 0 },
      { name: 'Grade C', value: evidenceData.evidence_grades.C || 0 },
      { name: 'Grade D', value: evidenceData.evidence_grades.D || 0 }
    ];
  };
  
  const prepareTreatmentTypeData = () => {
    if (!treatmentPatterns || !treatmentPatterns.by_procedure_type) return [];
    
    return Object.entries(treatmentPatterns.by_procedure_type).map(([key, value]) => ({
      name: key,
      count: value
    }));
  };
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Evidence grade colors
  const GRADE_COLORS = {
    'Grade A': '#00C853', // High quality
    'Grade B': '#64DD17', // Moderate quality
    'Grade C': '#FFD600', // Low quality 
    'Grade D': '#FF9100'  // Very low quality
  };
  
  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">AI Treatment Analytics Dashboard</Typography>
          
          <Stack direction="row" spacing={2}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={selectedProvider}
                onChange={handleProviderChange}
                label="Provider"
              >
                <MenuItem value="all">All Providers</MenuItem>
                {providers.map(provider => (
                  <MenuItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={period}
                onChange={handlePeriodChange}
                label="Time Period"
              >
                {timePeriods.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<FileDownloadIcon />}
              endIcon={<ArrowDownIcon />}
              onClick={handleExportMenuOpen}
              disabled={loading || exportLoading}
            >
              Export
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
            >
              <ListItem button onClick={handleExportCSV}>
                <ListItemIcon>
                  <CsvIcon />
                </ListItemIcon>
                <ListItemText primary="Export as CSV" secondary="Current tab data only" />
              </ListItem>
              <ListItem button onClick={handleExportPDF}>
                <ListItemIcon>
                  <PdfIcon />
                </ListItemIcon>
                <ListItemText primary="Export as PDF" secondary="Complete report" />
              </ListItem>
            </Menu>
          </Stack>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading || exportLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
            {exportLoading && 
              <Typography variant="body2" sx={{ ml: 2 }}>
                Generating export...
              </Typography>
            }
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Total Treatment Suggestions
                    </Typography>
                    <Typography variant="h4">
                      {feedbackData ? feedbackData.total_count : 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Acceptance Rate
                    </Typography>
                    <Typography variant="h4">
                      {feedbackData ? 
                        `${Math.round((feedbackData.accepted_count / feedbackData.total_count) * 100)}%` : 
                        '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Avg. Evidence Quality
                    </Typography>
                    <Typography variant="h4">
                      {evidenceData ? 
                        evidenceData.avg_evidence_quality.toFixed(1) : 
                        'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Top Evidence Grade
                    </Typography>
                    <Typography variant="h4">
                      {evidenceData && evidenceData.top_evidence_grade ? 
                        evidenceData.top_evidence_grade : 
                        'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Tabs for different analytics views */}
            <Paper sx={{ mb: 4 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab label="Treatment Acceptance" />
                <Tab label="Evidence Reliability" />
                <Tab label="Treatment Patterns" />
              </Tabs>
              
              {/* Treatment Acceptance Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Treatment Suggestion Acceptance
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareAcceptanceRateData()}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {prepareAcceptanceRateData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      {['Accepted', 'Rejected', 'Modified'].map((status, index) => (
                        <Chip 
                          key={status}
                          label={status}
                          sx={{ 
                            mx: 1, 
                            bgcolor: COLORS[index % COLORS.length],
                            color: 'white'
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Acceptance Rate by Specialty
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={feedbackData ? feedbackData.by_specialty : []}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                          <YAxis dataKey="name" type="category" width={150} />
                          <RechartsTooltip formatter={(value) => `${value}%`} />
                          <Legend />
                          <Bar dataKey="acceptance_rate" name="Acceptance Rate (%)" fill="#0088FE" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Acceptance Rate Trend
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={feedbackData ? feedbackData.trend_data : []}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis tickFormatter={(value) => `${value}%`} />
                          <RechartsTooltip formatter={(value) => `${value}%`} />
                          <Legend />
                          <Line type="monotone" dataKey="acceptance_rate" name="Acceptance Rate" stroke="#0088FE" />
                          <Line type="monotone" dataKey="rejection_rate" name="Rejection Rate" stroke="#FF8042" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>
              
              {/* Evidence Reliability Tab */}
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Evidence Grade Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareEvidenceReliabilityData()}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {prepareEvidenceReliabilityData().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={Object.values(GRADE_COLORS)[index % Object.values(GRADE_COLORS).length]} 
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      {Object.entries(GRADE_COLORS).map(([grade, color]) => (
                        <Chip 
                          key={grade}
                          label={grade}
                          sx={{ 
                            mx: 1, 
                            bgcolor: color,
                            color: grade === 'Grade C' ? 'black' : 'white'
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Evidence Reliability Scores
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={evidenceData ? evidenceData.evidence_types : []}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `${value.toFixed(1)}`} domain={[0, 5]} />
                          <RechartsTooltip formatter={(value) => value.toFixed(2)} />
                          <Legend />
                          <Bar dataKey="accuracy" name="Accuracy (1-5)" fill="#0088FE" />
                          <Bar dataKey="relevance" name="Relevance (0-1)" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Top Evidence Sources by Usage
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={evidenceData ? evidenceData.top_evidence_sources : []}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="title" type="category" width={250} />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="usage_count" name="Usage Count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Evidence Reliability Heatmap
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      This heatmap shows evidence reliability scores across different treatment categories.
                      Darker shades indicate higher trust and acceptance rates.
                    </Typography>
                    <Box sx={{ height: 450, width: '100%' }}>
                      {evidenceData && evidenceData.evidence_heatmap ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <div style={{ width: '100%', height: '100%', position: 'relative', overflowX: 'auto' }}>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: `auto ${evidenceData.evidence_heatmap.categories.map(() => '1fr').join(' ')}`,
                              gridGap: '1px',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              minWidth: '100%'
                            }}>
                              {/* Render header row with category names */}
                              <div style={{ padding: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                                Evidence Type
                              </div>
                              {evidenceData.evidence_heatmap.categories.map((category: string) => (
                                <div key={category} style={{ 
                                  padding: '8px', 
                                  fontWeight: 'bold', 
                                  textAlign: 'center',
                                  minWidth: '120px' 
                                }}>
                                  {category}
                                </div>
                              ))}
                              
                              {/* Render each evidence type row */}
                              {evidenceData.evidence_heatmap.evidence_types.map((type: string) => (
                                <React.Fragment key={type}>
                                  <div style={{ 
                                    padding: '8px', 
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    minWidth: '150px'
                                  }}>
                                    {type}
                                  </div>
                                  {evidenceData.evidence_heatmap.categories.map((category: string) => {
                                    const dataPoint = evidenceData.evidence_heatmap.data.find(
                                      (d: any) => d.evidence_type === type && d.category === category
                                    );
                                    
                                    // Calculate background color intensity based on score
                                    const score = dataPoint ? dataPoint.score : 0;
                                    const opacity = Math.min(score / 5, 1); // Normalize to 0-1 range
                                    const bgcolor = `rgba(0, 137, 255, ${opacity})`;
                                    
                                    return (
                                      <div 
                                        key={`${type}-${category}`} 
                                        style={{ 
                                          backgroundColor: bgcolor,
                                          color: opacity > 0.7 ? 'white' : 'black',
                                          padding: '8px',
                                          textAlign: 'center',
                                          cursor: 'pointer',
                                          minWidth: '120px'
                                        }}
                                        title={`${type} - ${category}: ${score.toFixed(1)}`}
                                      >
                                        {dataPoint ? score.toFixed(1) : '-'}
                                      </div>
                                    );
                                  })}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          height: '100%',
                          border: '1px dashed #ccc',
                          borderRadius: 1
                        }}>
                          <Typography variant="body2" color="textSecondary">
                            No evidence feedback data available for heatmap visualization
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>
              
              {/* Treatment Patterns Tab */}
              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Treatment Types Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareTreatmentTypeData()}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, count, percent }) => `${name}: ${count} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {prepareTreatmentTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Top Treatment Procedures
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={treatmentPatterns ? treatmentPatterns.top_procedures : []}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={150} />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="count" name="Usage Count" fill="#0088FE" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Confidence Score vs. Acceptance Rate
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={treatmentPatterns ? treatmentPatterns.confidence_vs_acceptance : []}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="confidence_level" />
                          <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                          <RechartsTooltip formatter={(value) => `${value}%`} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="acceptance_rate" 
                            name="Acceptance Rate (%)" 
                            stroke="#0088FE" 
                            strokeWidth={2}
                            dot={{ r: 6 }}
                            activeDot={{ r: 8 }}
                          />
                          
                          {/* Trendline - calculated based on the data */}
                          {treatmentPatterns && treatmentPatterns.confidence_vs_acceptance && 
                            treatmentPatterns.confidence_vs_acceptance.length > 0 && (
                              <Line
                                type="linear"
                                dataKey="trendline"
                                name="Trendline"
                                stroke="#FF8042"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={false}
                                legendType="line"
                                isAnimationActive={false}
                              />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>
            </Paper>
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default AIAnalyticsDashboard; 