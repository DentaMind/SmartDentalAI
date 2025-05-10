import express from 'express';

const router = express.Router();

// Basic placeholder route
router.get('/translation/languages', (req, res) => {
  res.json({ message: 'Translation API endpoint' });
});

export default router;