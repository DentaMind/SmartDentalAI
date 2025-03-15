import axios from 'axios';
import { z } from 'zod';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { aiRequestQueue } from './ai-request-queue';
import { AIServiceType } from '../config/ai-keys';

// Define dental-specific terms dictionary schema
export const dentalTermSchema = z.object({
  term: z.string(),
  translations: z.record(z.string(), z.string()),
  definition: z.string().optional(),
  category: z.enum(['diagnosis', 'treatment', 'anatomy', 'instruments', 'materials', 'conditions', 'medications', 'procedures', 'other']).optional(),
  pronunciationGuides: z.record(z.string(), z.string()).optional(),
});

export type DentalTerm = z.infer<typeof dentalTermSchema>;

// Translation quality feedback schema
export const translationFeedbackSchema = z.object({
  originalText: z.string(),
  translatedText: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
  correctedTranslation: z.string().optional(),
  userId: z.number(),
  timestamp: z.date().default(() => new Date()),
});

export type TranslationFeedback = z.infer<typeof translationFeedbackSchema>;

// Translation cache configuration
const CACHE_TTL = 60 * 60 * 24 * 30; // Cache for 30 days by default
const STANDARD_TERMS_TTL = 60 * 60 * 24 * 90; // Cache dental terms for 90 days

class TranslationService {
  private translationCache: NodeCache;
  private dentalTerminologyCache: NodeCache;
  private translationMemory: Map<string, Map<string, string>>;
  private translationAnalytics: Map<string, { 
    count: number, 
    avgTime: number,
    charactersTranslated: number,
    apiCalls: number,
    cacheHits: number,
    errors: number,
    lastUsed: Date 
  }>;
  
  constructor() {
    // Initialize caches with standard and long TTL
    this.translationCache = new NodeCache({ 
      stdTTL: CACHE_TTL,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Store references to improve performance
      maxKeys: 100000 // Set a reasonable limit to prevent memory issues
    });
    
    this.dentalTerminologyCache = new NodeCache({ 
      stdTTL: STANDARD_TERMS_TTL,
      checkperiod: 3600, // Check for expired keys every hour
      useClones: false
    });
    
    // Initialize translation memory (long-term storage across languages)
    this.translationMemory = new Map();
    
    // Initialize analytics tracking
    this.translationAnalytics = new Map();
    
    // Pre-load common dental terms (in a real implementation, these would be loaded from a database)
    this.initializeDentalTerminology();
  }
  
  /**
   * Generate a unique hash for a text to be translated to use as cache key
   */
  private generateCacheKey(text: string, sourceLanguage: string, targetLanguage: string): string {
    return crypto
      .createHash('md5')
      .update(`${text.trim().toLowerCase()}|${sourceLanguage}|${targetLanguage}`)
      .digest('hex');
  }
  
  /**
   * Add entry to translation memory for future reference
   */
  private addToTranslationMemory(sourceText: string, translatedText: string, sourceLanguage: string, targetLanguage: string): void {
    // Create language pair map if it doesn't exist
    const languagePair = `${sourceLanguage}-${targetLanguage}`;
    if (!this.translationMemory.has(languagePair)) {
      this.translationMemory.set(languagePair, new Map());
    }
    
    // Add translation to memory
    const languageMap = this.translationMemory.get(languagePair);
    if (languageMap) {
      languageMap.set(sourceText.trim().toLowerCase(), translatedText);
    }
    
    // Update analytics
    this.updateTranslationAnalytics(languagePair, 0, 0, sourceText.length, false, true, false);
  }
  
  /**
   * Check translation memory for existing translation
   */
  private getFromTranslationMemory(text: string, sourceLanguage: string, targetLanguage: string): string | null {
    const languagePair = `${sourceLanguage}-${targetLanguage}`;
    const languageMap = this.translationMemory.get(languagePair);
    
    if (languageMap) {
      const normalizedText = text.trim().toLowerCase();
      return languageMap.get(normalizedText) || null;
    }
    
    return null;
  }
  
  /**
   * Update analytics for tracking and optimization
   */
  private updateTranslationAnalytics(
    languagePair: string,
    translationTime: number,
    apiCallCount: number,
    characterCount: number,
    isError: boolean = false,
    isCacheHit: boolean = false,
    isApiCall: boolean = true
  ): void {
    const stats = this.translationAnalytics.get(languagePair) || {
      count: 0,
      avgTime: 0,
      charactersTranslated: 0,
      apiCalls: 0,
      cacheHits: 0,
      errors: 0,
      lastUsed: new Date()
    };
    
    // Update stats
    stats.count += 1;
    stats.lastUsed = new Date();
    stats.charactersTranslated += characterCount;
    
    if (isApiCall) {
      stats.apiCalls += apiCallCount;
      
      // Update average processing time (for API calls only)
      stats.avgTime = ((stats.avgTime * (stats.count - 1)) + translationTime) / stats.count;
    }
    
    if (isCacheHit) {
      stats.cacheHits += 1;
    }
    
    if (isError) {
      stats.errors += 1;
    }
    
    // Save updated stats
    this.translationAnalytics.set(languagePair, stats);
  }
  
  /**
   * Initialize dental terminology dictionary with common terms
   * In a real implementation, this would load from a database
   */
  private initializeDentalTerminology(): void {
    // Sample dental terms with translations
    const sampleTerms: DentalTerm[] = [
      {
        term: 'caries',
        translations: {
          'en': 'cavity',
          'es': 'caries',
          'fr': 'carie',
          'zh': '蛀牙',
          'ar': 'تسوس الأسنان',
          'ru': 'кариес',
          'de': 'Karies',
          'it': 'carie',
          'pt': 'cárie',
          'ja': '虫歯',
          'ko': '충치',
          'hi': 'दंत क्षय',
          'vi': 'sâu răng'
        },
        definition: 'Decay of tooth structure caused by dental plaque bacteria',
        category: 'conditions',
        pronunciationGuides: {
          'en': 'KAIR-eez',
          'es': 'KAH-ree-es',
          'fr': 'kah-REE',
          'de': 'KAH-ree-es'
        }
      },
      {
        term: 'periodontal disease',
        translations: {
          'en': 'gum disease',
          'es': 'enfermedad periodontal',
          'fr': 'maladie parodontale',
          'zh': '牙周疾病',
          'ar': 'أمراض اللثة',
          'ru': 'заболевание пародонта',
          'de': 'Parodontitis',
          'it': 'malattia parodontale',
          'pt': 'doença periodontal',
          'ja': '歯周病',
          'ko': '치주 질환',
          'hi': 'पेरिओडोंटल रोग',
          'vi': 'bệnh nha chu'
        },
        definition: 'Inflammatory condition affecting the tissues surrounding the teeth',
        category: 'conditions',
        pronunciationGuides: {
          'en': 'pair-ee-oh-DON-tul di-ZEEZ',
          'es': 'en-fer-me-DAD pe-rio-don-TAL',
          'fr': 'ma-la-DEE pa-ro-don-TAL'
        }
      },
      {
        term: 'prophylaxis',
        translations: {
          'en': 'teeth cleaning',
          'es': 'profilaxis',
          'fr': 'prophylaxie',
          'zh': '预防性清洁',
          'ar': 'تنظيف وقائي',
          'ru': 'профилактика',
          'de': 'Prophylaxe',
          'it': 'profilassi',
          'pt': 'profilaxia',
          'ja': '予防処置',
          'ko': '예방',
          'hi': 'प्रोफिलैक्सिस',
          'vi': 'vệ sinh dự phòng'
        },
        definition: 'Professional cleaning procedure to remove plaque and calculus',
        category: 'procedures',
        pronunciationGuides: {
          'en': 'pro-fi-LAK-sis',
          'es': 'pro-fi-LAK-sis',
          'fr': 'pro-fi-lak-SEE'
        }
      },
      {
        term: 'endodontic therapy',
        translations: {
          'en': 'root canal treatment',
          'es': 'tratamiento de conducto',
          'fr': 'traitement de canal',
          'zh': '根管治疗',
          'ar': 'علاج قناة الجذر',
          'ru': 'эндодонтическое лечение',
          'de': 'Wurzelkanalbehandlung',
          'it': 'terapia endodontica',
          'pt': 'tratamento de canal',
          'ja': '根管治療',
          'ko': '근관 치료',
          'hi': 'रूट कैनाल उपचार',
          'vi': 'điều trị tủy răng'
        },
        definition: 'Procedure to remove infected pulp and seal the root canal system',
        category: 'procedures',
        pronunciationGuides: {
          'en': 'en-do-DON-tik THER-uh-pee',
          'es': 'tra-ta-mi-EN-to de con-DUC-to',
          'fr': 'tret-MAN de ka-NAL'
        }
      },
      {
        term: 'amalgam',
        translations: {
          'en': 'silver filling',
          'es': 'amalgama',
          'fr': 'amalgame',
          'zh': '汞合金',
          'ar': 'ملغم',
          'ru': 'амальгама',
          'de': 'Amalgam',
          'it': 'amalgama',
          'pt': 'amálgama',
          'ja': 'アマルガム',
          'ko': '아말감',
          'hi': 'अमलगम',
          'vi': 'hỗn hợp thủy ngân'
        },
        definition: 'A mixture of metals used for dental fillings, containing mercury, silver, tin, and copper',
        category: 'materials',
        pronunciationGuides: {
          'en': 'uh-MAL-gum',
          'es': 'a-mal-GA-ma',
          'fr': 'a-mal-GAM'
        }
      }
    ];
    
    // Cache each term individually
    sampleTerms.forEach(term => {
      this.dentalTerminologyCache.set(`term:${term.term.toLowerCase()}`, term);
      
      // Add to regular translation cache for all language pairs
      Object.entries(term.translations).forEach(([sourceLang, sourceValue]) => {
        Object.entries(term.translations).forEach(([targetLang, targetValue]) => {
          if (sourceLang !== targetLang) {
            const cacheKey = this.generateCacheKey(sourceValue, sourceLang, targetLang);
            this.translationCache.set(cacheKey, targetValue);
            
            // Also add to translation memory
            this.addToTranslationMemory(sourceValue, targetValue, sourceLang, targetLang);
          }
        });
      });
    });
  }
  
  /**
   * Get a dental term with all its translations and context
   */
  public getDentalTerm(term: string): DentalTerm | null {
    return this.dentalTerminologyCache.get(`term:${term.toLowerCase()}`) || null;
  }
  
  /**
   * Get all dental terms (for admin/reference purposes)
   */
  public getAllDentalTerms(): DentalTerm[] {
    const terms: DentalTerm[] = [];
    const keys = this.dentalTerminologyCache.keys();
    
    for (const key of keys) {
      if (key.startsWith('term:')) {
        const term = this.dentalTerminologyCache.get<DentalTerm>(key);
        if (term) {
          terms.push(term);
        }
      }
    }
    
    return terms;
  }
  
  /**
   * Add a new dental term to the terminology database
   */
  public addDentalTerm(term: DentalTerm): boolean {
    try {
      // Validate the term
      const validatedTerm = dentalTermSchema.parse(term);
      
      // Add to terminology cache
      this.dentalTerminologyCache.set(`term:${validatedTerm.term.toLowerCase()}`, validatedTerm);
      
      // Add translations to translation cache and memory
      Object.entries(validatedTerm.translations).forEach(([sourceLang, sourceValue]) => {
        Object.entries(validatedTerm.translations).forEach(([targetLang, targetValue]) => {
          if (sourceLang !== targetLang) {
            const cacheKey = this.generateCacheKey(sourceValue, sourceLang, targetLang);
            this.translationCache.set(cacheKey, targetValue);
            
            // Also add to translation memory
            this.addToTranslationMemory(sourceValue, targetValue, sourceLang, targetLang);
          }
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error adding dental term:', error);
      return false;
    }
  }
  
  /**
   * Process a batch of translations in parallel
   */
  public async translateBatch(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string[]> {
    const startTime = Date.now();
    const results: string[] = [];
    const apiCalls: number = texts.length;
    let cacheHits: number = 0;
    let characterCount: number = 0;
    
    // Calculate total character count for analytics
    characterCount = texts.reduce((sum, text) => sum + text.length, 0);
    
    // Process each text in parallel
    const translationPromises = texts.map(async (text) => {
      return this.translate(text, sourceLanguage, targetLanguage);
    });
    
    // Wait for all translations to complete
    const completedTranslations = await Promise.all(translationPromises);
    results.push(...completedTranslations);
    
    // Calculate how many were cached vs. API calls
    cacheHits = completedTranslations.filter((_, index) => {
      const cacheKey = this.generateCacheKey(texts[index], sourceLanguage, targetLanguage);
      return this.translationCache.has(cacheKey);
    }).length;
    
    const actualApiCalls = apiCalls - cacheHits;
    
    // Update analytics
    const languagePair = `${sourceLanguage}-${targetLanguage}`;
    const translationTime = Date.now() - startTime;
    this.updateTranslationAnalytics(
      languagePair,
      translationTime,
      actualApiCalls,
      characterCount,
      false,
      cacheHits > 0,
      true
    );
    
    return results;
  }
  
  /**
   * Translate dental specialized terminology
   */
  private translateDentalTerm(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string | null {
    // Check if this is a dental term we know
    const allTerms = this.getAllDentalTerms();
    
    for (const dentalTerm of allTerms) {
      // Check if the source text matches a known translation in the source language
      const sourceTranslation = dentalTerm.translations[sourceLanguage];
      
      if (sourceTranslation && 
          text.toLowerCase().includes(sourceTranslation.toLowerCase()) &&
          dentalTerm.translations[targetLanguage]) {
        
        // Replace the dental term with the correct translation
        const targetTranslation = dentalTerm.translations[targetLanguage];
        const termRegExp = new RegExp(sourceTranslation, 'gi');
        
        return text.replace(termRegExp, targetTranslation);
      }
    }
    
    return null;
  }
  
  /**
   * Submit translation feedback to improve future translations
   */
  public async submitTranslationFeedback(feedback: TranslationFeedback): Promise<boolean> {
    try {
      // Validate the feedback object
      const validatedFeedback = translationFeedbackSchema.parse(feedback);
      
      // If there's a corrected translation, update the translation memory and cache
      if (validatedFeedback.correctedTranslation) {
        // Add corrected translation to memory
        this.addToTranslationMemory(
          validatedFeedback.originalText,
          validatedFeedback.correctedTranslation,
          validatedFeedback.sourceLanguage,
          validatedFeedback.targetLanguage
        );
        
        // Update cache with corrected translation
        const cacheKey = this.generateCacheKey(
          validatedFeedback.originalText,
          validatedFeedback.sourceLanguage,
          validatedFeedback.targetLanguage
        );
        
        this.translationCache.set(cacheKey, validatedFeedback.correctedTranslation);
      }
      
      // In a real implementation, store feedback in database for analysis
      
      return true;
    } catch (error) {
      console.error('Error submitting translation feedback:', error);
      return false;
    }
  }
  
  /**
   * Get translation analytics for reporting
   */
  public getTranslationAnalytics(): Record<string, any> {
    const analytics: Record<string, any> = {};
    
    this.translationAnalytics.forEach((stats, languagePair) => {
      analytics[languagePair] = {
        ...stats,
        cacheHitRate: stats.count > 0 ? (stats.cacheHits / stats.count) * 100 : 0,
        errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0,
        averageProcessingTimeMs: stats.avgTime,
        apiUsageRate: stats.count > 0 ? (stats.apiCalls / stats.count) * 100 : 0
      };
    });
    
    return analytics;
  }
  
  /**
   * Get pronunciation guide for a term in a specific language
   */
  public getPronunciationGuide(term: string, language: string): string | null {
    const dentalTerm = this.getDentalTerm(term);
    
    if (dentalTerm && dentalTerm.pronunciationGuides && dentalTerm.pronunciationGuides[language]) {
      return dentalTerm.pronunciationGuides[language];
    }
    
    return null;
  }
  
  /**
   * Add pronunciation guide for a dental term
   */
  public addPronunciationGuide(term: string, language: string, pronunciation: string): boolean {
    const dentalTerm = this.getDentalTerm(term);
    
    if (!dentalTerm) {
      return false;
    }
    
    // Create pronunciationGuides object if it doesn't exist
    if (!dentalTerm.pronunciationGuides) {
      dentalTerm.pronunciationGuides = {};
    }
    
    // Add or update pronunciation
    dentalTerm.pronunciationGuides[language] = pronunciation;
    
    // Update term in cache
    this.dentalTerminologyCache.set(`term:${term.toLowerCase()}`, dentalTerm);
    
    return true;
  }
  
  /**
   * Translate text using selected translation service with caching
   */
  public async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    options: { 
      preferCache?: boolean,
      isPatientCommunication?: boolean, 
      useTerminology?: boolean,
      priority?: number
    } = {}
  ): Promise<string> {
    // Default options
    const defaultOptions = {
      preferCache: true,
      isPatientCommunication: true,
      useTerminology: true,
      priority: 5 // Default priority
    };
    
    const settings = { ...defaultOptions, ...options };
    
    // If source and target languages are the same, return the original text
    if (sourceLanguage === targetLanguage) {
      return text;
    }
    
    const startTime = Date.now();
    const languagePair = `${sourceLanguage}-${targetLanguage}`;
    let apiCallMade = false;
    
    try {
      // Check for empty text
      if (!text || text.trim() === '') {
        return '';
      }
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(text, sourceLanguage, targetLanguage);
      
      // Check cache first if preferred
      if (settings.preferCache) {
        // Try translation cache
        const cachedTranslation = this.translationCache.get<string>(cacheKey);
        if (cachedTranslation) {
          // Update analytics
          this.updateTranslationAnalytics(
            languagePair, 
            0, 
            0, 
            text.length, 
            false, 
            true, 
            false
          );
          return cachedTranslation;
        }
        
        // Try translation memory
        const memoryTranslation = this.getFromTranslationMemory(text, sourceLanguage, targetLanguage);
        if (memoryTranslation) {
          return memoryTranslation;
        }
      }
      
      // Check for dental terminology if enabled
      if (settings.useTerminology) {
        const dentalTranslation = this.translateDentalTerm(text, sourceLanguage, targetLanguage);
        if (dentalTranslation) {
          // Cache this translation for future use
          this.translationCache.set(cacheKey, dentalTranslation);
          
          // Update translation memory
          this.addToTranslationMemory(text, dentalTranslation, sourceLanguage, targetLanguage);
          
          return dentalTranslation;
        }
      }
      
      // No cache hit, use translation service via queue
      apiCallMade = true;
      const translation = await aiRequestQueue.enqueueRequest<string>(
        AIServiceType.PATIENT_COMMUNICATION,
        settings.priority,
        async () => {
          // In a production environment, this would call an actual translation API
          // like Google Translate, DeepL, or Azure Translator
          
          // For this implementation, we'll use a simulated response
          // that would normally come from the OpenAI API or another translation service
          
          // This could be replaced with actual API calls like:
          // const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          //   model: 'gpt-3.5-turbo',
          //   messages: [
          //     { role: 'system', content: `You are a translation assistant. Translate the following text from ${sourceLanguage} to ${targetLanguage}.` },
          //     { role: 'user', content: text }
          //   ]
          // }, {
          //   headers: {
          //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          //     'Content-Type': 'application/json'
          //   }
          // });
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // For demonstration, we'll create a simulated translation
          // In a real implementation, this would be the response from the translation API
          let simulatedTranslation = '';
          
          // Add prefix based on target language to simulate translation
          switch (targetLanguage) {
            case 'es':
              simulatedTranslation = `[ES] ${text}`;
              break;
            case 'fr':
              simulatedTranslation = `[FR] ${text}`;
              break;
            case 'zh':
              simulatedTranslation = `[ZH] ${text}`;
              break;
            case 'ar':
              simulatedTranslation = `[AR] ${text}`;
              break;
            case 'ru':
              simulatedTranslation = `[RU] ${text}`;
              break;
            case 'de':
              simulatedTranslation = `[DE] ${text}`;
              break;
            default:
              simulatedTranslation = `[${targetLanguage.toUpperCase()}] ${text}`;
          }
          
          return simulatedTranslation;
        }
      );
      
      // Cache successful translation
      this.translationCache.set(cacheKey, translation);
      
      // Add to translation memory
      this.addToTranslationMemory(text, translation, sourceLanguage, targetLanguage);
      
      return translation;
    } catch (error) {
      console.error(`Translation error (${sourceLanguage} -> ${targetLanguage}):`, error);
      
      // Update analytics with error
      this.updateTranslationAnalytics(
        languagePair,
        Date.now() - startTime,
        apiCallMade ? 1 : 0,
        text.length,
        true,
        false,
        apiCallMade
      );
      
      // Return original text if translation fails
      return text;
    }
  }
  
  /**
   * Get suggestions for message templates based on appointment type
   */
  public async getSmartMessageSuggestions(
    appointmentType: string,
    patientLanguage: string,
    patientHistory: any = {}
  ): Promise<string[]> {
    try {
      // In a real implementation, this would use machine learning to suggest appropriate
      // templates based on the appointment type, patient history, etc.
      
      // For this implementation, we'll use predefined suggestions based on appointment type
      const suggestions: string[] = [];
      
      switch (appointmentType.toLowerCase()) {
        case 'cleaning':
        case 'prophylaxis':
          suggestions.push(
            "Please bring your insurance card and arrive 15 minutes early to complete paperwork.",
            "Don't forget to bring a list of any medications you're currently taking."
          );
          break;
        case 'filling':
        case 'restoration':
          suggestions.push(
            "You may experience some sensitivity after your filling. This is normal and should subside within a few days.",
            "Please avoid eating or drinking for 1 hour after your filling procedure."
          );
          break;
        case 'root canal':
        case 'endodontic':
          suggestions.push(
            "Take any prescribed medication as directed to manage discomfort after your root canal.",
            "Avoid chewing on the treated tooth until your permanent restoration is placed."
          );
          break;
        case 'extraction':
        case 'surgery':
          suggestions.push(
            "Please arrange for someone to drive you home after your extraction procedure.",
            "Follow the post-extraction care instructions to promote healing and prevent complications."
          );
          break;
        default:
          suggestions.push(
            "Please bring your insurance card and ID to your appointment.",
            "If you need to reschedule, please give us at least 24 hours notice."
          );
      }
      
      // Translate suggestions if needed
      if (patientLanguage !== 'en') {
        const translatedSuggestions = await this.translateBatch(
          suggestions,
          'en',
          patientLanguage
        );
        return translatedSuggestions;
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating smart message suggestions:', error);
      return [];
    }
  }
  
  /**
   * Analyze message for cultural appropriateness
   */
  public async analyzeCulturalAppropriateness(
    message: string,
    targetLanguage: string,
    targetCulture: string
  ): Promise<{ 
    appropriate: boolean, 
    suggestedChanges?: string, 
    culturalNotes?: string 
  }> {
    try {
      // This would analyze a message for cultural appropriateness
      // In a real implementation, this would use AI to check for cultural sensitivities
      
      // For this implementation, we'll return a mock response
      return {
        appropriate: true,
        culturalNotes: "Message appears culturally appropriate for the target audience."
      };
    } catch (error) {
      console.error('Error analyzing cultural appropriateness:', error);
      return { appropriate: true };
    }
  }
  
  /**
   * Get translation cache statistics
   */
  public getCacheStats(): {
    translationCacheSize: number,
    terminologyCacheSize: number,
    translationMemorySize: number,
    cacheHitRate: number
  } {
    // Get cache statistics
    const translationStats = this.translationCache.getStats();
    const terminologyStats = this.dentalTerminologyCache.getStats();
    
    // Calculate translation memory size
    let translationMemoryEntries = 0;
    this.translationMemory.forEach(languageMap => {
      translationMemoryEntries += languageMap.size;
    });
    
    // Calculate cache hit rate
    const analytics = this.getTranslationAnalytics();
    let totalRequests = 0;
    let totalCacheHits = 0;
    
    Object.values(analytics).forEach((stats: any) => {
      totalRequests += stats.count;
      totalCacheHits += stats.cacheHits;
    });
    
    const cacheHitRate = totalRequests > 0 ? (totalCacheHits / totalRequests) * 100 : 0;
    
    return {
      translationCacheSize: translationStats.keys,
      terminologyCacheSize: terminologyStats.keys,
      translationMemorySize: translationMemoryEntries,
      cacheHitRate
    };
  }
  
  /**
   * Clear translation cache (for testing or maintenance)
   */
  public clearCache(): void {
    this.translationCache.flushAll();
    // Re-initialize terminology
    this.initializeDentalTerminology();
  }
}

export const translationService = new TranslationService();