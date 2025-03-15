import { translationService } from './server/services/translation-service';

// Test the translation service
async function testTranslation() {
  console.log("Testing Translation Service");
  
  try {
    // Test simple translation
    const text = "Hello, how are you feeling today? Do you have any tooth pain?";
    console.log(`Original text: ${text}`);
    
    // Test translation to Spanish
    const spanishTranslation = await translationService.translate(
      text, 
      'en', 
      'es',
      { priority: 8 }
    );
    console.log(`Spanish translation: ${spanishTranslation}`);
    
    // Test translation to French
    const frenchTranslation = await translationService.translate(
      text, 
      'en', 
      'fr',
      { priority: 6 }
    );
    console.log(`French translation: ${frenchTranslation}`);
    
    // Test translation to Chinese
    const chineseTranslation = await translationService.translate(
      text, 
      'en', 
      'zh',
      { priority: 7 }
    );
    console.log(`Chinese translation: ${chineseTranslation}`);
    
    // Test dental terminology translation
    const dentalTerm = "periodontal disease";
    console.log(`\nTesting dental terminology: ${dentalTerm}`);
    
    const spanishDentalTerm = await translationService.translate(
      dentalTerm, 
      'en', 
      'es'
    );
    console.log(`Spanish dental term: ${spanishDentalTerm}`);
    
    // Test batch translation
    const batchTexts = [
      "Please schedule your next appointment.",
      "Don't forget to brush and floss daily.",
      "Take your prescribed medication as directed."
    ];
    
    console.log("\nTesting batch translation:");
    const batchResults = await translationService.translateBatch(
      batchTexts,
      'en',
      'fr'
    );
    
    batchResults.forEach((translation, index) => {
      console.log(`Original: ${batchTexts[index]}`);
      console.log(`French: ${translation}`);
      console.log();
    });
    
    // Get translation cache stats
    const cacheStats = translationService.getCacheStats();
    console.log("\nCache statistics:");
    console.log(cacheStats);
    
  } catch (error) {
    console.error("Translation test error:", error);
  }
}

// Run the test
testTranslation();