const fs = require('fs');
const path = 'client/src/components/diagnosis/PatientTreatmentEditor.tsx';

let content = fs.readFileSync(path, 'utf8');
content = content.replace(/import { LoadingAnimation } from "@\/components\/ui\/loading-animation";/g, 
                         'import { LoadingSpinner } from "@/components/ui/loading-spinner";');
                         
content = content.replace(/<><LoadingAnimation size="sm" \/> Approving\.\.\.<\/>/g,
                         '<><LoadingSpinner className="h-4 w-4 mr-2" /> Approving...</>');
                         
content = content.replace(/<LoadingAnimation \/>/g,
                         '<LoadingSpinner className="h-8 w-8 text-primary" />');

fs.writeFileSync(path, content);
console.log('Replacements completed');
