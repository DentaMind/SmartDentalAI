import express from 'express';

const router = express.Router();

// Basic placeholder route
router.get('/insurance/verification', (req, res) => {
  res.json({ message: 'Insurance API endpoint' });
});

export default router;