import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Heart, 
  Brain, 
  Activity, 
  Pill, 
  Syringe,
  Thermometer,
  Droplets,
  Info,
  AlertTriangle,
  Stethoscope,
  HeartPulse,
  Timer,
  BookOpen,
  ListTodo,
  Search
} from "lucide-react";

import { Input } from "@/components/ui/input";

// Custom Lungs icon component
const Lungs = React.forwardRef<SVGSVGElement, React.ComponentProps<'svg'>>(
  ({ className, ...props }, ref) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ref={ref}
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M6.081 20c2.633-2.133 4.283-4.85 5.035-7.959.234-1.337-.135-2.536-1.172-2.536-.94 0-1.562.812-1.57 1.751L8 20" />
        <path d="M17.92 20c-2.633-2.133-4.283-4.85-5.035-7.959-.234-1.337.135-2.536 1.172-2.536.94 0 1.562.812 1.57 1.751L16 20" />
        <path d="M8 20v2" />
        <path d="M16 20v2" />
        <path d="M12 2c.771.732 1.392 1.532 1.839 2.395a8.468 8.468 0 0 1 .661 4.228c-.068.937.059 1.78.373 2.505.315.724.786 1.339 1.254 1.339M12 2c-.771.732-1.392 1.532-1.839 2.395a8.468 8.468 0 0 0-.661 4.228c.068.937-.059 1.78-.373 2.505-.315.724-.786 1.339-1.254 1.339" />
      </svg>
    );
  }
);
Lungs.displayName = "Lungs";

export interface DiseaseInfo {
  id: string;
  name: string;
  category: 'cardiovascular' | 'endocrine' | 'respiratory' | 'neurological' | 'immune' | 'other';
  description: string;
  symptoms: string[];
  dentalConsiderations: string[];
  medications: {
    name: string;
    purpose: string;
    dentalImplications: string[];
  }[];
  emergencyManagement?: string[];
  dentalImplications: {
    anesthesia?: string[];
    bleeding?: string[];
    drugInteractions?: string[];
    treatment?: string[];
    healing?: string[];
  };
  references: string[];
}

interface DiseaseInformationProps {
  patientId?: number;
  conditions?: string[];
  medications?: string[];
  readOnly?: boolean;
}

export function DiseaseInformation({
  patientId,
  conditions = [],
  medications = [],
  readOnly = false
}: DiseaseInformationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCondition, setActiveCondition] = useState<string | null>(null);

  // Example disease database (in a real app, this would come from the API)
  const diseases: DiseaseInfo[] = [
    {
      id: 'hypertension',
      name: 'Hypertension',
      category: 'cardiovascular',
      description: "Hypertension, or high blood pressure, is a chronic condition where the blood pressure in the arteries is persistently elevated. Blood pressure is the force exerted by circulating blood against the walls of the body's arteries.",
      symptoms: [
        'Often asymptomatic (silent killer)',
        'Headaches (particularly in the morning)',
        'Shortness of breath',
        'Nosebleeds',
        'Visual changes',
        'Dizziness'
      ],
      dentalConsiderations: [
        'Monitor blood pressure before any dental procedure',
        'Avoid elective dental treatment if blood pressure exceeds 180/110 mmHg',
        'Use stress reduction protocols',
        'Consider shorter appointments',
        'Position patient semi-upright (avoid supine position)',
        'Use caution with epinephrine in local anesthetics'
      ],
      medications: [
        {
          name: 'ACE inhibitors (e.g., Lisinopril)',
          purpose: 'Relaxes blood vessels',
          dentalImplications: [
            'May cause gingival hyperplasia',
            'Potential for orthostatic hypotension',
            'Potential for dry mouth (xerostomia)'
          ]
        },
        {
          name: 'Beta-blockers (e.g., Metoprolol)',
          purpose: 'Reduces heart rate and cardiac output',
          dentalImplications: [
            'May mask epinephrine-induced tachycardia',
            'Potential drug interaction with epinephrine',
            'May cause orthostatic hypotension'
          ]
        },
        {
          name: 'Calcium channel blockers (e.g., Amlodipine)',
          purpose: 'Relaxes blood vessels',
          dentalImplications: [
            'May cause gingival hyperplasia (overgrowth)',
            'Potential for dry mouth',
            'Potential taste alterations'
          ]
        },
        {
          name: 'Diuretics (e.g., Hydrochlorothiazide)',
          purpose: 'Increases urine output to reduce blood volume',
          dentalImplications: [
            'May cause dry mouth',
            'Potential for orthostatic hypotension',
            'Electrolyte imbalances'
          ]
        }
      ],
      emergencyManagement: [
        'If blood pressure exceeds 180/110 mmHg, defer elective treatment',
        'For hypertensive crisis (>200/120 mmHg with symptoms), activate emergency services',
        'Place patient in upright position',
        'Monitor vital signs',
        'Administer oxygen if available',
        'Be prepared to administer basic life support if needed'
      ],
      dentalImplications: {
        anesthesia: [
          'Limit epinephrine to 0.04mg (2 cartridges of 1:100,000) per appointment',
          'Avoid epinephrine in uncontrolled hypertension',
          'Consider using 3% mepivacaine or 4% prilocaine for anesthesia without vasoconstrictor',
          'Monitor vital signs during and after administration'
        ],
        bleeding: [
          'Patients on anti-platelet or anticoagulant medications may experience increased bleeding',
          'Use local hemostatic measures',
          'Consider surgical stents for extensive procedures'
        ],
        treatment: [
          'Semi-supine position preferable to supine',
          'Schedule shorter morning appointments',
          'Monitor blood pressure before, during, and after treatment',
          'Implement stress reduction protocols',
          'Be aware of white-coat hypertension (elevated readings in clinical settings)'
        ]
      },
      references: [
        'American Dental Association. Hypertension: Dental Management and Considerations.',
        'Little JW, et al. Dental Management of the Medically Compromised Patient. 9th ed. Mosby; 2017.',
        'Southerland JH, et al. Dental Management in the Medically Compromised Patient.'
      ]
    },
    {
      id: 'diabetes',
      name: 'Diabetes Mellitus',
      category: 'endocrine',
      description: 'Diabetes mellitus is a group of metabolic disorders characterized by high blood sugar levels over a prolonged period. It results from defects in insulin secretion, insulin action, or both, leading to abnormalities in carbohydrate, fat, and protein metabolism.',
      symptoms: [
        'Increased thirst and urination',
        'Unexplained weight loss',
        'Fatigue',
        'Blurred vision',
        'Slow-healing wounds',
        'Frequent infections'
      ],
      dentalConsiderations: [
        'Increased risk of periodontal disease',
        'Delayed wound healing',
        'Higher susceptibility to infections',
        'Dry mouth (xerostomia)',
        'Burning mouth syndrome',
        'Candidiasis',
        'Altered taste sensation'
      ],
      medications: [
        {
          name: 'Insulin',
          purpose: 'Hormone that allows cells to use glucose',
          dentalImplications: [
            'Risk of hypoglycemia during dental appointments',
            'Morning appointments preferable after breakfast and normal insulin dose',
            'Need to ensure patient has eaten before treatment'
          ]
        },
        {
          name: 'Metformin',
          purpose: 'Decreases glucose production in liver',
          dentalImplications: [
            'May cause metallic taste',
            'Potential for vitamin B12 deficiency leading to oral manifestations',
            'Risk of lactic acidosis with surgical procedures'
          ]
        },
        {
          name: 'Sulfonylureas (e.g., Glipizide)',
          purpose: 'Stimulates insulin release from pancreas',
          dentalImplications: [
            'Risk of hypoglycemia during longer appointments',
            'Potential interaction with certain antibiotics and antifungals',
            'May cause lichenoid reactions'
          ]
        }
      ],
      emergencyManagement: [
        'For hypoglycemia: administer 15g of fast-acting carbohydrate (juice, glucose gel)',
        'Recheck blood sugar after 15 minutes',
        'If unresponsive: activate emergency services and administer glucose gel in buccal vestibule',
        'For hyperglycemia: if patient shows signs of diabetic ketoacidosis (fruity breath, confusion), seek emergency care'
      ],
      dentalImplications: {
        anesthesia: [
          'No specific contraindications to local anesthetics',
          'Epinephrine can be used in normal concentrations for well-controlled diabetics',
          'Monitor for stress-induced hyperglycemia'
        ],
        healing: [
          'Delayed wound healing, especially in poorly controlled diabetes',
          'Increased risk of infection',
          'Consider prophylactic antibiotics for surgical procedures in poorly controlled patients',
          'More frequent follow-up appointments may be necessary'
        ],
        treatment: [
          'Morning appointments preferred (better stress tolerance)',
          'Confirm patient has eaten normally and taken medication',
          'Monitor blood glucose before invasive procedures (ideal range: 70-180 mg/dL)',
          'Ensure good glycemic control before elective surgical procedures',
          'More frequent periodontal maintenance recommended (every 3-4 months)'
        ]
      },
      references: [
        'American Dental Association. Diabetes and Oral Health.',
        'Mauri-Obradors E, et al. Oral manifestations of Diabetes Mellitus. A systematic review. Med Oral Patol Oral Cir Bucal. 2017.',
        'Preshaw PM, et al. Periodontitis and diabetes: a two-way relationship. Diabetologia. 2012.'
      ]
    },
    {
      id: 'anticoagulant-therapy',
      name: 'Anticoagulant Therapy',
      category: 'cardiovascular',
      description: 'Anticoagulant therapy involves medications that reduce the blood\'s ability to clot, used to prevent thromboembolic events in patients with conditions such as atrial fibrillation, deep vein thrombosis, or mechanical heart valves.',
      symptoms: [
        'No specific symptoms from the medication itself',
        'May present with easy bruising',
        'Potential for prolonged bleeding from minor injuries',
        'Possible gingival bleeding during routine oral hygiene'
      ],
      dentalConsiderations: [
        'Increased risk of bleeding during and after invasive dental procedures',
        'Need for laboratory testing (INR) before invasive procedures for warfarin users',
        'Consideration of local hemostatic measures',
        'Potential need for medication adjustment in consultation with physician'
      ],
      medications: [
        {
          name: 'Warfarin (Coumadin)',
          purpose: 'Vitamin K antagonist that prevents clot formation',
          dentalImplications: [
            'INR should be checked within 24-48 hours before invasive dental procedure',
            'Target INR 2.0-3.0 generally safe for most dental procedures',
            'Numerous drug interactions including with antibiotics (especially metronidazole, erythromycin)',
            'May need to avoid NSAIDs for pain management'
          ]
        },
        {
          name: 'Novel Oral Anticoagulants (NOACs: Dabigatran, Rivaroxaban, Apixaban)',
          purpose: 'Direct thrombin or factor Xa inhibitors',
          dentalImplications: [
            'No routine laboratory monitoring available',
            'Shorter half-life than warfarin',
            'Morning appointments preferable to manage potential bleeding throughout the day',
            'Less drug interactions than warfarin, but still avoid NSAIDs'
          ]
        },
        {
          name: 'Antiplatelet medications (Aspirin, Clopidogrel)',
          purpose: 'Prevents platelets from aggregating',
          dentalImplications: [
            'Generally not discontinued for routine dental procedures',
            'Increased bleeding time, but usually manageable with local measures',
            'May be combined with anticoagulants in some patients (high bleeding risk)'
          ]
        }
      ],
      emergencyManagement: [
        'For persistent bleeding: apply pressure with gauze soaked in tranexamic acid if available',
        'Use local hemostatic agents (gelatin sponge, oxidized cellulose, microfibrillar collagen)',
        'Consider suturing to achieve primary closure when appropriate',
        'For severe uncontrolled bleeding: refer to emergency department'
      ],
      dentalImplications: {
        bleeding: [
          'Prolonged bleeding during and after invasive procedures',
          'Use local hemostatic measures (pressure, hemostatic agents, sutures)',
          'Consider tranexamic acid rinse (5%) to minimize post-operative bleeding',
          'Avoid elective surgical procedures if INR > 3.5 (warfarin)'
        ],
        drugInteractions: [
          'Macrolide antibiotics and metronidazole can potentiate warfarin',
          'NSAIDs increase bleeding risk and should be avoided when possible',
          'Acetaminophen preferred for pain management',
          'Certain antifungals may interact with NOACs'
        ],
        treatment: [
          'Consultation with physician for complex cases',
          'Morning appointments preferred to manage bleeding complications',
          'Minimally invasive techniques when possible',
          'Staged treatment for extensive surgical needs',
          'Clear post-operative instructions regarding management of bleeding'
        ]
      },
      references: [
        'Wahl MJ. Dental surgery and antiplatelet agents: bleed or die. Am J Med. 2014.',
        'Dézsi CA, et al. Management of dental patients receiving antiplatelet therapy or chronic oral anticoagulation. J Am Coll Cardiol. 2019.',
        'American Dental Association. Anticoagulant and Antiplatelet Medications and Dental Procedures.'
      ]
    },
    {
      id: 'asthma',
      name: 'Asthma',
      category: 'respiratory',
      description: 'Asthma is a chronic inflammatory disease of the airways characterized by variable and recurring symptoms, reversible airflow obstruction, and bronchospasm. It is thought to be caused by a combination of genetic and environmental factors.',
      symptoms: [
        'Wheezing',
        'Shortness of breath',
        'Chest tightness',
        'Coughing, especially at night or early morning',
        'Symptoms worsen with respiratory infections, exercise, or allergen exposure'
      ],
      dentalConsiderations: [
        'Risk of asthma attack triggered by stress or anxiety of dental visit',
        'Potential sensitivity to sulfites (found in epinephrine-containing local anesthetics)',
        'Dry mouth from medications (especially β-agonists)',
        'Increased risk of oral candidiasis (from inhaled corticosteroids)',
        'Potential for oral manifestations of chronic mouth breathing'
      ],
      medications: [
        {
          name: 'Short-acting β-agonists (e.g., Albuterol)',
          purpose: 'Quick-relief of symptoms by relaxing bronchial smooth muscles',
          dentalImplications: [
            'May cause xerostomia (dry mouth)',
            'Potential tachycardia that could be exacerbated by epinephrine',
            'Patient should bring rescue inhaler to dental appointments'
          ]
        },
        {
          name: 'Inhaled corticosteroids (e.g., Fluticasone)',
          purpose: 'Long-term control by reducing airway inflammation',
          dentalImplications: [
            'Increased risk of oropharyngeal candidiasis',
            'Potential for adrenal suppression with long-term use',
            'May contribute to xerostomia'
          ]
        },
        {
          name: 'Leukotriene modifiers (e.g., Montelukast)',
          purpose: 'Block inflammatory mediators',
          dentalImplications: [
            'Few direct oral implications',
            'No significant interactions with common dental drugs'
          ]
        }
      ],
      emergencyManagement: [
        'Stop dental treatment immediately if asthma symptoms develop',
        'Position patient upright to maximize air exchange',
        "Administer short-acting β-agonist (patient's rescue inhaler)",
        'Administer oxygen via face mask at 4-6 L/min if available',
        'If no improvement after inhaler or symptoms are severe, activate emergency services',
        'Monitor vital signs while awaiting emergency response'
      ],
      dentalImplications: {
        anesthesia: [
          'Avoid sulfite-containing local anesthetics in sulfite-sensitive asthmatics',
          'Use of vasoconstrictor generally not contraindicated in well-controlled asthma',
          'Consider use of nitrous oxide to reduce anxiety in susceptible patients'
        ],
        drugInteractions: [
          'Avoid NSAIDs in aspirin-sensitive asthma patients (10% of adult asthmatics)',
          'Macrolide antibiotics may increase theophylline levels',
          'Use caution with benzodiazepines as they can cause respiratory depression'
        ],
        treatment: [
          'Schedule appointments during mid-morning or afternoon when lung function is optimal',
          'Implement stress reduction protocols',
          'Avoid rubber dam in patients with severe asthma if it increases anxiety',
          'Ensure good suction to prevent aspiration of water or debris',
          'Avoid triggers (e.g., strong scents, dusts) in the dental office'
        ]
      },
      references: [
        'Thomas MS, et al. Asthma and oral health: a review. Aust Dent J. 2010.',
        'Steinbacher DM, et al. The dental patient with asthma: an update and oral health considerations. J Am Dent Assoc. 2001.',
        'Global Initiative for Asthma (GINA). Global Strategy for Asthma Management and Prevention.'
      ]
    }
  ];

  // Handle search functionality
  const filteredDiseases = searchTerm === '' 
    ? diseases 
    : diseases.filter(disease => 
        disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disease.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Get categorized diseases for tab organization
  const cardiovascularDiseases = filteredDiseases.filter(d => d.category === 'cardiovascular');
  const endocrineDiseases = filteredDiseases.filter(d => d.category === 'endocrine');
  const respiratoryDiseases = filteredDiseases.filter(d => d.category === 'respiratory');
  const neurologicalDiseases = filteredDiseases.filter(d => d.category === 'neurological');
  const immuneDiseases = filteredDiseases.filter(d => d.category === 'immune');
  const otherDiseases = filteredDiseases.filter(d => d.category === 'other');

  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardiovascular':
        return <Heart className="h-4 w-4" />;
      case 'endocrine':
        return <Activity className="h-4 w-4" />;
      case 'respiratory':
        return <Lungs className="h-4 w-4" />;
      case 'neurological':
        return <Brain className="h-4 w-4" />;
      case 'immune':
        return <Droplets className="h-4 w-4" />;
      default:
        return <Stethoscope className="h-4 w-4" />;
    }
  };

  // Find matching diseases for patient conditions
  const patientDiseases = conditions.length > 0 
    ? diseases.filter(disease => 
        conditions.some(condition => {
          // Check if condition is a string
          if (typeof condition === 'string') {
            return condition.toLowerCase().includes(disease.name.toLowerCase());
          } else if (condition && typeof condition === 'object') {
            // If it's an object (like a DiseaseInfo), try to use its name property
            return condition.name?.toLowerCase().includes(disease.name.toLowerCase());
          }
          return false;
        })
      )
    : [];

  // Find medications that match patient's medications
  const relevantMedications = medications.length > 0
    ? diseases.flatMap(disease => 
        disease.medications.filter(med => 
          medications.some(m => {
            if (typeof m === 'string') {
              return m.toLowerCase().includes(med.name.toLowerCase());
            } else if (m && typeof m === 'object') {
              return m.name?.toLowerCase().includes(med.name.toLowerCase());
            }
            return false;
          })
        ).map(med => ({
          ...med,
          relatedCondition: disease.name
        }))
      )
    : [];

  // Render selected disease information
  const renderDiseaseDetail = (disease: DiseaseInfo) => {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {getCategoryIcon(disease.category)}
            <h3 className="text-lg font-semibold">{disease.name}</h3>
          </div>
          <p className="text-muted-foreground">{disease.description}</p>
        </div>
        
        {/* Symptoms */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Thermometer className="h-4 w-4 text-amber-500" />
            Common Symptoms
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {disease.symptoms.map((symptom, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <span className="text-sm">{symptom}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dental Considerations */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Stethoscope className="h-4 w-4 text-blue-500" />
            Dental Considerations
          </h4>
          <ul className="space-y-2">
            {disease.dentalConsiderations.map((consideration, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{consideration}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Medications */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Pill className="h-4 w-4 text-purple-500" />
            Common Medications & Dental Implications
          </h4>
          <div className="space-y-4">
            {disease.medications.map((med, i) => (
              <div key={i} className="border rounded-md p-3">
                <div className="font-medium text-sm">{med.name}</div>
                <div className="text-xs text-muted-foreground mb-2">Purpose: {med.purpose}</div>
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">Dental Implications:</div>
                  <ul className="space-y-1">
                    {med.dentalImplications.map((imp, j) => (
                      <li key={j} className="text-xs flex items-start gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-1" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Management */}
        {disease.emergencyManagement && (
          <div className="border-t pt-4">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Emergency Management
            </h4>
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Emergency Protocol</AlertTitle>
              <AlertDescription>
                <ul className="space-y-2 mt-2">
                  {disease.emergencyManagement.map((protocol, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Timer className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{protocol}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Dental Implications Details */}
        <div className="border-t pt-4">
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <ListTodo className="h-4 w-4 text-primary" />
            Detailed Dental Implications
          </h4>
          
          <Accordion type="single" collapsible className="w-full">
            {disease.dentalImplications.anesthesia && (
              <AccordionItem value="anesthesia">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-blue-500" />
                    <span>Anesthesia Considerations</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pl-6">
                    {disease.dentalImplications.anesthesia.map((item, i) => (
                      <li key={i} className="text-sm list-disc">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {disease.dentalImplications.bleeding && (
              <AccordionItem value="bleeding">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-red-500" />
                    <span>Bleeding Considerations</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pl-6">
                    {disease.dentalImplications.bleeding.map((item, i) => (
                      <li key={i} className="text-sm list-disc">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {disease.dentalImplications.drugInteractions && (
              <AccordionItem value="drug-interactions">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-purple-500" />
                    <span>Drug Interactions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pl-6">
                    {disease.dentalImplications.drugInteractions.map((item, i) => (
                      <li key={i} className="text-sm list-disc">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {disease.dentalImplications.healing && (
              <AccordionItem value="healing">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span>Healing & Postoperative Considerations</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pl-6">
                    {disease.dentalImplications.healing.map((item, i) => (
                      <li key={i} className="text-sm list-disc">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {disease.dentalImplications.treatment && (
              <AccordionItem value="treatment">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-amber-500" />
                    <span>Treatment Planning Considerations</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pl-6">
                    {disease.dentalImplications.treatment.map((item, i) => (
                      <li key={i} className="text-sm list-disc">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
        
        {/* References */}
        <div className="border-t pt-4">
          <h4 className="font-medium flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            References
          </h4>
          <ul className="space-y-1">
            {disease.references.map((ref, i) => (
              <li key={i} className="text-xs text-muted-foreground">{ref}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          Patient Systemic Disease Information
        </CardTitle>
        <CardDescription>
          Detailed information about systemic conditions and their impact on dental treatment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {patientDiseases.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Identified Patient Conditions
            </h3>
            <div className="space-y-3">
              {patientDiseases.map(disease => (
                <Card key={disease.id} className="overflow-hidden">
                  <div className="p-4 border-l-4 border-amber-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(disease.category)}
                        <h4 className="font-medium">{disease.name}</h4>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveCondition(disease.id)}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {disease.dentalConsiderations.slice(0, 2).map((consideration, i) => (
                        <HoverCard key={i}>
                          <HoverCardTrigger asChild>
                            <Badge variant="outline" className="cursor-help">
                              {consideration.split(' ').slice(0, 3).join(' ')}...
                            </Badge>
                          </HoverCardTrigger>
                          <HoverCardContent side="bottom" className="w-72">
                            <div className="flex items-start gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{consideration}</p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      ))}
                      {disease.dentalConsiderations.length > 2 && (
                        <Badge variant="outline">+{disease.dentalConsiderations.length - 2} more</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {relevantMedications.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-purple-500" />
              Patient Medication Implications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relevantMedications.map((med, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <div className="p-3">
                    <div className="font-medium text-sm">{med.name}</div>
                    <div className="text-xs text-muted-foreground">Related to: {med.relatedCondition}</div>
                    <Separator className="my-2" />
                    <div className="text-xs mt-1">
                      <span className="font-medium">Dental Implications:</span>
                      <ul className="mt-1 space-y-1">
                        {med.dentalImplications.map((imp, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-1" />
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Condition Details if one is selected */}
        {activeCondition && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Condition Details</h3>
              <Button variant="outline" size="sm" onClick={() => setActiveCondition(null)}>
                Close Details
              </Button>
            </div>
            {renderDiseaseDetail(diseases.find(d => d.id === activeCondition)!)}
          </div>
        )}
        
        {/* Disease Information Browser */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search for a condition..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 w-full grid grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cardiovascular" className="gap-1 items-center">
                <Heart className="h-3.5 w-3.5" /> Cardiac
              </TabsTrigger>
              <TabsTrigger value="endocrine" className="gap-1 items-center">
                <Activity className="h-3.5 w-3.5" /> Endocrine
              </TabsTrigger>
              <TabsTrigger value="respiratory" className="gap-1 items-center">
                <Lungs className="h-3.5 w-3.5" /> Respiratory
              </TabsTrigger>
              <TabsTrigger value="neurological" className="gap-1 items-center">
                <Brain className="h-3.5 w-3.5" /> Neurological
              </TabsTrigger>
              <TabsTrigger value="immune" className="gap-1 items-center">
                <Droplets className="h-3.5 w-3.5" /> Immune
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {filteredDiseases.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDiseases.map(disease => (
                    <Card key={disease.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(disease.category)}
                          <h4 className="font-medium">{disease.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {disease.description}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveCondition(disease.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No conditions found matching your search.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cardiovascular">
              {cardiovascularDiseases.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cardiovascularDiseases.map(disease => (
                    <Card key={disease.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <h4 className="font-medium">{disease.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {disease.description}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveCondition(disease.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No cardiovascular conditions found.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="endocrine">
              {endocrineDiseases.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {endocrineDiseases.map(disease => (
                    <Card key={disease.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-green-500" />
                          <h4 className="font-medium">{disease.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {disease.description}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveCondition(disease.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No endocrine conditions found.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="respiratory">
              {respiratoryDiseases.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {respiratoryDiseases.map(disease => (
                    <Card key={disease.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lungs className="h-4 w-4 text-blue-500" />
                          <h4 className="font-medium">{disease.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {disease.description}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveCondition(disease.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No respiratory conditions found.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="neurological">
              {neurologicalDiseases.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {neurologicalDiseases.map(disease => (
                    <Card key={disease.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <h4 className="font-medium">{disease.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {disease.description}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveCondition(disease.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No neurological conditions found.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="immune">
              {immuneDiseases.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {immuneDiseases.map(disease => (
                    <Card key={disease.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="h-4 w-4 text-amber-500" />
                          <h4 className="font-medium">{disease.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {disease.description}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveCondition(disease.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No immune system conditions found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}