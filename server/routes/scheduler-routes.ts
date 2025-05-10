import express from 'express';

const router = express.Router();

// Basic placeholder route
router.get('/scheduler/availability', (req, res) => {
  res.json({ message: 'Scheduler API endpoint' });
});

export default router;