const fs = require('fs');
const path = require('path');

// Function to update a file
const updateFile = (filePath) => {
  console.log(`Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Replace the import statement if it exists
    if (content.includes('import { LoadingAnimation }')) {
      content = content.replace(
        /import { LoadingAnimation } from "@\/components\/ui\/loading-animation";/g,
        'import { LoadingSpinner } from "@/components/ui/loading-spinner";'
      );
      updated = true;
    }
    
    // Replace loading animation usage patterns
    if (content.includes('<LoadingAnimation')) {
      // Replace <LoadingAnimation size="sm" /> with spinner
      content = content.replace(
        /<LoadingAnimation size="sm" \/>/g, 
        '<LoadingSpinner className="h-4 w-4 mr-2" />'
      );
      
      // Replace standard LoadingAnimation
      content = content.replace(
        /<LoadingAnimation \/>/g,
        '<LoadingSpinner className="h-8 w-8 text-primary" />'
      );
      
      // Replace any remaining LoadingAnimation with props
      content = content.replace(
        /<LoadingAnimation([^\/]*?)\/>/g,
        '<LoadingSpinner className="h-8 w-8 text-primary" />'
      );
      
      updated = true;
    }
    
    // Special case for loading with text
    if (content.includes('<><LoadingAnimation')) {
      content = content.replace(
        /<><LoadingAnimation size="sm" \/> ([^<]+)<\/>/g,
        '<><LoadingSpinner className="h-4 w-4 mr-2" /> $1</>'
      );
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
      return true;
    } else {
      console.log(`No changes needed in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
};

// Files to update
const files = [
  'client/src/components/diagnosis/PatientTreatmentEditor.tsx',
  'client/src/components/diagnosis/DiagnosisFeedbackPanel.tsx',
  'client/src/components/diagnosis/TreatmentPlanEditor.tsx'
];

// Process each file
let updatedCount = 0;
files.forEach(file => {
  const updated = updateFile(file);
  if (updated) updatedCount++;
});

console.log(`Completed. Updated ${updatedCount} of ${files.length} files.`);
