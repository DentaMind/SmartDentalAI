import express, { Request, Response } from 'express';
import { z } from 'zod';
import { translationService } from '../services/translation-service';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

// Translation request schema
const translateRequestSchema = z.object({
  text: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  options: z.object({
    preferCache: z.boolean().optional(),
    isPatientCommunication: z.boolean().optional(),
    useTerminology: z.boolean().optional(),
    priority: z.number().optional()
  }).optional()
});

// Batch translation request schema
const batchTranslateRequestSchema = z.object({
  texts: z.array(z.string()),
  sourceLanguage: z.string(),
  targetLanguage: z.string()
});

// Dental term schema
const dentalTermRequestSchema = z.object({
  term: z.string(),
  translations: z.record(z.string(), z.string()),
  definition: z.string().optional(),
  category: z.enum(['diagnosis', 'treatment', 'anatomy', 'instruments', 'materials', 'conditions', 'medications', 'procedures', 'other']).optional(),
  pronunciationGuides: z.record(z.string(), z.string()).optional()
});

// Translation feedback schema
const translationFeedbackRequestSchema = z.object({
  originalText: z.string(),
  translatedText: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
  correctedTranslation: z.string().optional()
});

// Smart message suggestions request schema
const smartMessageSuggestionsSchema = z.object({
  appointmentType: z.string(),
  patientLanguage: z.string(),
  patientHistory: z.any().optional()
});

// Cultural appropriateness analysis request schema
const culturalAppropriatenessSchema = z.object({
  message: z.string(),
  targetLanguage: z.string(),
  targetCulture: z.string()
});

// Pronunciation guide request schema
const pronunciationGuideRequestSchema = z.object({
  term: z.string(),
  language: z.string(),
  pronunciation: z.string()
});

/**
 * @route POST /api/translate
 * @desc Translate text from one language to another
 * @access Private
 */
router.post('/translate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage, options } = translateRequestSchema.parse(req.body);
    
    const translatedText = await translationService.translate(
      text,
      sourceLanguage,
      targetLanguage,
      options
    );
    
    return res.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(400).json({ error: 'Invalid translation request' });
  }
});

/**
 * @route POST /api/translate/batch
 * @desc Translate multiple texts in a batch
 * @access Private
 */
router.post('/translate/batch', requireAuth, async (req: Request, res: Response) => {
  try {
    const { texts, sourceLanguage, targetLanguage } = batchTranslateRequestSchema.parse(req.body);
    
    const translatedTexts = await translationService.translateBatch(
      texts,
      sourceLanguage,
      targetLanguage
    );
    
    return res.json({ translatedTexts });
  } catch (error) {
    console.error('Batch translation error:', error);
    return res.status(400).json({ error: 'Invalid batch translation request' });
  }
});

/**
 * @route GET /api/translate/terminology
 * @desc Get all dental terminology
 * @access Private
 */
router.get('/translate/terminology', requireAuth, async (_req: Request, res: Response) => {
  try {
    const terms = translationService.getAllDentalTerms();
    return res.json({ terms });
  } catch (error) {
    console.error('Error fetching dental terminology:', error);
    return res.status(500).json({ error: 'Failed to fetch dental terminology' });
  }
});

/**
 * @route GET /api/translate/terminology/:term
 * @desc Get specific dental term
 * @access Private
 */
router.get('/translate/terminology/:term', requireAuth, async (req: Request, res: Response) => {
  try {
    const { term } = req.params;
    const dentalTerm = translationService.getDentalTerm(term);
    
    if (!dentalTerm) {
      return res.status(404).json({ error: 'Dental term not found' });
    }
    
    return res.json({ term: dentalTerm });
  } catch (error) {
    console.error('Error fetching dental term:', error);
    return res.status(500).json({ error: 'Failed to fetch dental term' });
  }
});

/**
 * @route POST /api/translate/terminology
 * @desc Add new dental term
 * @access Private (Doctor/Admin only)
 */
router.post('/translate/terminology', requireAuth, requireRole(['doctor', 'admin']), async (req: Request, res: Response) => {
  try {
    const termData = dentalTermRequestSchema.parse(req.body);
    const success = translationService.addDentalTerm(termData);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to add dental term' });
    }
    
    return res.json({ success: true, term: termData });
  } catch (error) {
    console.error('Error adding dental term:', error);
    return res.status(400).json({ error: 'Invalid dental term data' });
  }
});

/**
 * @route POST /api/translate/feedback
 * @desc Submit translation feedback
 * @access Private
 */
router.post('/translate/feedback', requireAuth, async (req: Request, res: Response) => {
  try {
    const feedbackData = translationFeedbackRequestSchema.parse(req.body);
    
    // Add userId from authenticated request
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    const success = await translationService.submitTranslationFeedback({
      ...feedbackData,
      userId,
      timestamp: new Date()
    });
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to submit translation feedback' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error submitting translation feedback:', error);
    return res.status(400).json({ error: 'Invalid translation feedback data' });
  }
});

/**
 * @route GET /api/translate/analytics
 * @desc Get translation analytics
 * @access Private (Admin/Doctor only)
 */
router.get('/translate/analytics', requireAuth, requireRole(['doctor', 'admin']), async (_req: Request, res: Response) => {
  try {
    const analytics = translationService.getTranslationAnalytics();
    return res.json(analytics);
  } catch (error) {
    console.error('Error fetching translation analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch translation analytics' });
  }
});

/**
 * @route GET /api/translate/cache-stats
 * @desc Get translation cache statistics
 * @access Private (Admin/Doctor only)
 */
router.get('/translate/cache-stats', requireAuth, requireRole(['doctor', 'admin']), async (_req: Request, res: Response) => {
  try {
    const stats = translationService.getCacheStats();
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching cache statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch cache statistics' });
  }
});

/**
 * @route POST /api/translate/clear-cache
 * @desc Clear translation cache
 * @access Private (Admin only)
 */
router.post('/translate/clear-cache', requireAuth, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    translationService.clearCache();
    return res.json({ success: true, message: 'Translation cache cleared' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({ error: 'Failed to clear cache' });
  }
});

/**
 * @route POST /api/translate/smart-suggestions
 * @desc Get smart message suggestions
 * @access Private
 */
router.post('/translate/smart-suggestions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { appointmentType, patientLanguage, patientHistory } = smartMessageSuggestionsSchema.parse(req.body);
    
    const suggestions = await translationService.getSmartMessageSuggestions(
      appointmentType,
      patientLanguage,
      patientHistory
    );
    
    return res.json({ suggestions });
  } catch (error) {
    console.error('Error generating smart message suggestions:', error);
    return res.status(400).json({ error: 'Invalid request for smart message suggestions' });
  }
});

/**
 * @route POST /api/translate/cultural-analysis
 * @desc Analyze message for cultural appropriateness
 * @access Private
 */
router.post('/translate/cultural-analysis', requireAuth, async (req: Request, res: Response) => {
  try {
    const { message, targetLanguage, targetCulture } = culturalAppropriatenessSchema.parse(req.body);
    
    const analysis = await translationService.analyzeCulturalAppropriateness(
      message,
      targetLanguage,
      targetCulture
    );
    
    return res.json(analysis);
  } catch (error) {
    console.error('Error analyzing cultural appropriateness:', error);
    return res.status(400).json({ error: 'Invalid cultural analysis request' });
  }
});

/**
 * @route GET /api/translate/pronunciation/:term/:language
 * @desc Get pronunciation guide for a term
 * @access Private
 */
router.get('/translate/pronunciation/:term/:language', requireAuth, async (req: Request, res: Response) => {
  try {
    const { term, language } = req.params;
    
    const pronunciationGuide = translationService.getPronunciationGuide(term, language);
    
    if (!pronunciationGuide) {
      return res.status(404).json({ error: 'Pronunciation guide not found' });
    }
    
    return res.json({ pronunciationGuide });
  } catch (error) {
    console.error('Error fetching pronunciation guide:', error);
    return res.status(500).json({ error: 'Failed to fetch pronunciation guide' });
  }
});

/**
 * @route POST /api/translate/pronunciation
 * @desc Add pronunciation guide for a term
 * @access Private (Doctor/Admin only)
 */
router.post('/translate/pronunciation', requireAuth, requireRole(['doctor', 'admin']), async (req: Request, res: Response) => {
  try {
    const { term, language, pronunciation } = pronunciationGuideRequestSchema.parse(req.body);
    
    const success = translationService.addPronunciationGuide(term, language, pronunciation);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to add pronunciation guide' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error adding pronunciation guide:', error);
    return res.status(400).json({ error: 'Invalid pronunciation guide data' });
  }
});

export default router;