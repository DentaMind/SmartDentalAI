import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardHeader,
  Badge,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Typography,
  Box,
  Chip,
  Grid,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
} from '@mui/material';
import {
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface SecurityAuditSummary {
  timestamp: string;
  total_routes: number;
  routes_with_auth: number;
  routes_without_auth: number;
  routes_with_role_checks: number;
  total_vulnerabilities: number;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  medium_vulnerabilities: number;
  low_vulnerabilities: number;
  report_path?: string;
}

interface SecurityReport {
  filename: string;
  path: string;
  created_at: string;
  size: number;
}

interface SecurityIssue {
  issue_type: string;
  description: string;
  file_path: string;
  line_number: number;
  severity: string;
  remediation: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  status: 'passed' | 'failed' | 'warning' | 'unknown';
  description: string;
}

const SecurityChecklistDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [runningAudit, setRunningAudit] = useState<boolean>(false);
  const [auditSummary, setAuditSummary] = useState<SecurityAuditSummary | null>(null);
  const [securityReports, setSecurityReports] = useState<SecurityReport[]>([]);
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Security checklist for HIPAA compliance
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'auth-1',
      category: 'Authentication',
      title: 'API Authentication Coverage',
      status: 'unknown',
      description: 'All API endpoints must use authentication',
    },
    {
      id: 'auth-2',
      category: 'Authentication',
      title: 'Password Security',
      status: 'unknown',
      description: 'Password hashing and secure storage must be implemented',
    },
    {
      id: 'auth-3',
      category: 'Authorization',
      title: 'Role-Based Access Control',
      status: 'unknown',
      description: 'Role verification for protected endpoints',
    },
    {
      id: 'hipaa-1',
      category: 'HIPAA',
      title: 'Patient Data Protection',
      status: 'unknown',
      description: 'Patient data endpoints must have authentication and authorization',
    },
    {
      id: 'sec-1',
      category: 'Security',
      title: 'SQL Injection Protection',
      status: 'unknown',
      description: 'All database queries must be parameterized',
    },
    {
      id: 'sec-2',
      category: 'Security',
      title: 'Sensitive Data Exposure',
      status: 'unknown',
      description: 'No sensitive data in logs or error messages',
    },
  ]);

  // Fetch security status when component mounts
  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  // Update checklist status based on audit summary
  useEffect(() => {
    if (auditSummary) {
      const updatedChecklist = [...checklist];
      
      // Update authentication coverage
      const authCoverage = auditSummary.routes_with_auth / auditSummary.total_routes;
      updatedChecklist[0].status = authCoverage > 0.9 
        ? 'passed' 
        : authCoverage > 0.7 
          ? 'warning' 
          : 'failed';
      
      // Update RBAC coverage
      const roleCoverage = auditSummary.routes_with_role_checks / auditSummary.total_routes;
      updatedChecklist[2].status = roleCoverage > 0.75 
        ? 'passed' 
        : roleCoverage > 0.5 
          ? 'warning' 
          : 'failed';
      
      // Update patient data protection
      updatedChecklist[3].status = auditSummary.critical_vulnerabilities > 0 
        ? 'failed' 
        : auditSummary.high_vulnerabilities > 0 
          ? 'warning' 
          : 'passed';
      
      setChecklist(updatedChecklist);
    }
  }, [auditSummary]);
  
  // Fetch latest security status
  const fetchSecurityStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get security status
      const statusResponse = await axios.get('/api/security/status');
      
      // Get latest audit summary
      let summaryResponse;
      try {
        summaryResponse = await axios.get('/reports/summary.json');
      } catch (err) {
        console.warn('Could not fetch security summary:', err);
      }
      
      // Get list of security reports
      const reportsResponse = await axios.get('/api/security/audit/reports');
      
      // Update state with fetched data
      if (summaryResponse?.data) {
        setAuditSummary(summaryResponse.data);
      }
      
      setSecurityReports(reportsResponse.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching security status:', err);
      setError('Failed to fetch security information. Please try again later.');
      setLoading(false);
    }
  };
  
  // Run a new security audit
  const runSecurityAudit = async () => {
    setRunningAudit(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/security/audit', {
        generate_report: true,
        scan_files: true,
        scan_routes: true
      });
      
      await fetchSecurityStatus();
      setRunningAudit(false);
    } catch (err) {
      console.error('Error running security audit:', err);
      setError('Failed to run security audit. Please try again later.');
      setRunningAudit(false);
    }
  };
  
  // Calculate security score from audit summary
  const calculateSecurityScore = (): number => {
    if (!auditSummary) return 0;
    
    // Start with 100 points
    let score = 100;
    
    // Deduct for authentication issues
    const authPercentage = auditSummary.routes_with_auth / auditSummary.total_routes;
    if (authPercentage < 0.9) {
      score -= (1 - authPercentage) * 30;
    }
    
    // Deduct for role check issues
    const rolePercentage = auditSummary.routes_with_role_checks / auditSummary.total_routes;
    if (rolePercentage < 0.8) {
      score -= (1 - rolePercentage) * 20;
    }
    
    // Deduct for vulnerabilities (weighted)
    score -= auditSummary.critical_vulnerabilities * 15;
    score -= auditSummary.high_vulnerabilities * 10;
    score -= auditSummary.medium_vulnerabilities * 5;
    score -= auditSummary.low_vulnerabilities * 2;
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  };
  
  // Format timestamp 
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };
  
  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ffeb3b';
      case 'low': return '#4caf50';
      default: return '#2196f3';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckIcon style={{ color: 'green' }} />;
      case 'failed': return <ErrorIcon style={{ color: 'red' }} />;
      case 'warning': return <WarningIcon style={{ color: 'orange' }} />;
      default: return <InfoIcon style={{ color: 'blue' }} />;
    }
  };
  
  // Calculate security score color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };
  
  if (loading) {
    return (
      <Box p={3} textAlign="center">
        <CircularProgress />
        <Typography variant="body1" mt={2}>
          Loading security information...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <SecurityIcon style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Security Dashboard
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={runSecurityAudit}
          disabled={runningAudit}
        >
          {runningAudit ? 'Running Audit...' : 'Run Security Audit'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {runningAudit && (
        <Box mb={3}>
          <Alert severity="info">
            <AlertTitle>Running Security Audit</AlertTitle>
            This may take a few minutes...
          </Alert>
          <LinearProgress sx={{ mt: 1 }} />
        </Box>
      )}
      
      <Grid container spacing={3}>
        {/* Security Score */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Security Score" />
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Box position="relative" display="flex" justifyContent="center" alignItems="center">
                  <CircularProgress
                    variant="determinate"
                    value={calculateSecurityScore()}
                    size={120}
                    thickness={8}
                    sx={{ color: getScoreColor(calculateSecurityScore()) }}
                  />
                  <Box
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 'bold', color: getScoreColor(calculateSecurityScore()) }}
                    >
                      {calculateSecurityScore()}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="textSecondary" mt={2}>
                  Last updated: {auditSummary ? formatTimestamp(auditSummary.timestamp) : 'Never'}
                </Typography>
                
                {auditSummary && auditSummary.critical_vulnerabilities > 0 && (
                  <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                    <AlertTitle>Critical Issues</AlertTitle>
                    Found {auditSummary.critical_vulnerabilities} critical security issues that need immediate attention!
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Security Stats */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Security Statistics" />
            <CardContent>
              {auditSummary ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="#2196f3">
                        {auditSummary.total_routes}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Routes
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h6" color={auditSummary.routes_with_auth / auditSummary.total_routes > 0.9 ? '#4caf50' : '#ff9800'}>
                        {Math.round((auditSummary.routes_with_auth / auditSummary.total_routes) * 100)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Authentication
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h6" color={auditSummary.routes_with_role_checks / auditSummary.total_routes > 0.8 ? '#4caf50' : '#ff9800'}>
                        {Math.round((auditSummary.routes_with_role_checks / auditSummary.total_routes) * 100)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Role Verification
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h6" color={auditSummary.total_vulnerabilities > 0 ? '#f44336' : '#4caf50'}>
                        {auditSummary.total_vulnerabilities}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Vulnerabilities
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Vulnerabilities by Severity
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip 
                          label={`${auditSummary.critical_vulnerabilities} Critical`} 
                          color={auditSummary.critical_vulnerabilities > 0 ? "error" : "default"}
                          size="small"
                        />
                        <Chip 
                          label={`${auditSummary.high_vulnerabilities} High`} 
                          color={auditSummary.high_vulnerabilities > 0 ? "warning" : "default"}
                          size="small"
                        />
                        <Chip 
                          label={`${auditSummary.medium_vulnerabilities} Medium`} 
                          color={auditSummary.medium_vulnerabilities > 0 ? "info" : "default"}
                          size="small"
                        />
                        <Chip 
                          label={`${auditSummary.low_vulnerabilities} Low`} 
                          color="default"
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body1">
                  No security audit data available. Run a security audit to see statistics.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* HIPAA Security Checklist */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="HIPAA Security Checklist" />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Requirement</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {checklist.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          {getStatusIcon(item.status)}
                          {' '}
                          <Typography component="span" color={
                            item.status === 'passed' ? 'green' :
                            item.status === 'failed' ? 'error' :
                            item.status === 'warning' ? 'orange' : 'info'
                          }>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Security Reports */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Security Reports</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {securityReports.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Report Name</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {securityReports.map((report) => (
                        <TableRow key={report.path}>
                          <TableCell>{report.filename}</TableCell>
                          <TableCell>{formatTimestamp(report.created_at)}</TableCell>
                          <TableCell>{Math.round(report.size / 1024)} KB</TableCell>
                          <TableCell>
                            <Button
                              component="a"
                              href={`/api/security/audit/reports/${report.filename}`}
                              target="_blank"
                              size="small"
                              variant="outlined"
                            >
                              View Report
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1">
                  No security reports available. Run a security audit to generate reports.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Security Documentation */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Security Resources" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    component={Link}
                    href="/docs/SECURITY.md"
                    target="_blank"
                    fullWidth
                  >
                    Security Guidelines
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    component={Link}
                    href="/docs/SECURITY_CHECKLIST.md"
                    target="_blank"
                    fullWidth
                  >
                    Security Checklist
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    component="a"
                    href="https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html"
                    target="_blank"
                    fullWidth
                  >
                    HIPAA Security Rules
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecurityChecklistDashboard; 