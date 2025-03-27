/**
 * useTemplates Hook
 * 
 * This hook provides access to standardized note templates for various
 * dental procedures and examinations.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNoteTemplates } from '@/lib/api';

export interface Template {
  id: string;
  name: string;
  category: 'exam' | 'procedure' | 'perio' | 'followup' | 'general';
  content: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'comprehensive-exam',
    name: 'Comprehensive Exam',
    category: 'exam',
    content: `COMPREHENSIVE EXAMINATION

SUBJECTIVE:
Chief complaint: 
Patient reports: 

OBJECTIVE:
Extraoral examination: WNL
Intraoral examination:
- Soft tissues: 
- Hard tissues:
- Periodontal status:
- Occlusion:

X-ray findings:

ASA Classification: 

ASSESSMENT:
Diagnosis:

PLAN:
Treatment recommendations:
1. 
2.
3.

Patient acceptance: 
Next appointment: 
`
  },
  {
    id: 'perio-reeval',
    name: 'Perio Re-evaluation',
    category: 'perio',
    content: `PERIODONTAL RE-EVALUATION

SUBJECTIVE:
Patient reports: 

OBJECTIVE:
Periodontal findings:
- Probing depths:
- Bleeding on probing: 
- Recession:
- Mobility:
- Furcation involvement:

Oral hygiene assessment:

ASSESSMENT:
Comparison to previous charting:

PLAN:
Recommendations:
1. 
2.
3.

Next periodontal maintenance: 
`
  },
  {
    id: 'new-patient',
    name: 'New Patient Consult',
    category: 'exam',
    content: `NEW PATIENT CONSULTATION

SUBJECTIVE:
Chief complaint: 
Medical history: 
Dental history: 

OBJECTIVE:
Extraoral examination: 
Intraoral examination:
- Soft tissues:
- Hard tissues:
- Periodontal screening:
- Occlusion:

X-ray findings:

ASSESSMENT:
Initial diagnosis:

PLAN:
Treatment recommendations:
1. 
2.
3.

Financial considerations:
Patient questions/concerns:
Next steps:
`
  },
  {
    id: 'procedure-note',
    name: 'Procedure Note',
    category: 'procedure',
    content: `PROCEDURE NOTE

Procedure performed: 
Teeth/areas treated: 

Anesthesia: 
Materials used: 
Isolation method: 

Procedure details:

Post-op instructions given: 
Patient toleration: 

Follow-up plan:
`
  },
  {
    id: 'soap-note',
    name: 'SOAP Note',
    category: 'general',
    content: `SUBJECTIVE:


OBJECTIVE:


ASSESSMENT:


PLAN:

`
  }
];

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);

  // Fetch templates from API if available
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/note-templates'],
    queryFn: async () => {
      try {
        return await getNoteTemplates();
      } catch (err) {
        console.error('Failed to fetch templates, using defaults', err);
        return null;
      }
    },
    enabled: false, // Disable auto-fetching for now until API endpoint is ready
  });

  useEffect(() => {
    if (data) {
      setTemplates([...DEFAULT_TEMPLATES, ...data]);
    }
  }, [data]);

  const getTemplateByName = (name: string): Template | undefined => {
    return templates.find(t => t.name === name || t.id === name);
  };

  const getTemplatesByCategory = (category: Template['category']): Template[] => {
    return templates.filter(t => t.category === category);
  };

  return {
    templates,
    getTemplateByName,
    getTemplatesByCategory,
    isLoading,
    error
  };
}