import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...', fullPage = false }) => {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      padding={3}
      gap={2}
    >
      <CircularProgress />
      {message && (
        <Typography variant="body2" color="textSecondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        width="100%"
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default Loading; 