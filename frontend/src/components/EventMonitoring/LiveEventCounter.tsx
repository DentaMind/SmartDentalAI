import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { EventStats } from '@/types/events';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  stats: EventStats;
}

export const LiveEventCounter: React.FC<Props> = ({ stats }) => {
  const [prevCount, setPrevCount] = useState(0);
  const [isIncreasing, setIsIncreasing] = useState(false);
  
  useEffect(() => {
    if (stats?.total_events > prevCount) {
      setIsIncreasing(true);
      setTimeout(() => setIsIncreasing(false), 1000);
    }
    setPrevCount(stats?.total_events || 0);
  }, [stats?.total_events]);

  return (
    <Box>
      <AnimatePresence>
        <motion.div
          key={stats?.total_events}
          initial={{ scale: 1 }}
          animate={{ scale: isIncreasing ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Typography variant="h3" align="center" color={isIncreasing ? 'primary.main' : 'inherit'}>
            {stats?.total_events?.toLocaleString() || 0}
          </Typography>
        </motion.div>
      </AnimatePresence>
      
      <Typography variant="body2" color="text.secondary" align="center" mt={1}>
        Total Events
      </Typography>
      
      <Box mt={3}>
        <Typography variant="body2" color="text.secondary">
          Last Minute:
        </Typography>
        <Typography variant="h6">
          {Math.round(stats?.recent_events_per_minute || 0)} events
        </Typography>
        
        <Typography variant="body2" color="text.secondary" mt={2}>
          Peak Rate:
        </Typography>
        <Typography variant="h6">
          {stats?.peak_events_per_minute || 0} events/min
        </Typography>
      </Box>
    </Box>
  );
}; 