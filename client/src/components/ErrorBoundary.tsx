import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Paper 
          sx={{ 
            padding: 4, 
            margin: 2, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            textAlign: 'center',
            maxWidth: '800px',
            mx: 'auto'
          }}
        >
          <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          
          <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
            An error occurred while rendering this component. Please try refreshing the page.
          </Typography>
          
          {this.state.error && (
            <Box sx={{ 
              bgcolor: 'rgba(0,0,0,0.05)', 
              p: 2, 
              borderRadius: 1, 
              width: '100%',
              mb: 3,
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {this.state.error.toString()}
              </Typography>
              
              {this.state.errorInfo && (
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', mt: 2, color: 'text.secondary' }}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              )}
            </Box>
          )}
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleReset}
            sx={{ mr: 1 }}
          >
            Try Again
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 