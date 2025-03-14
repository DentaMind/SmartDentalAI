import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  HeartPulse, 
  Info, 
  AlertCircle, 
  Plus, 
  PlusCircle, 
  Pill, 
  Stethoscope,
  Clipboard,
  Thermometer,
  BookOpen
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { format } from 'date-fns';

interface DiseaseInfo {
  name: string;
  description: string;
  implications: string[];
  dentalConsiderations: string[];
  medications?: string[];
  category: 'cardiovascular' | 'endocrine' | 'respiratory' | 'gastrointestinal' | 'neurological' | 'musculoskeletal' | 'autoimmune' | 'infectious' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  dateAdded: Date;
  lastUpdated?: Date;
}

interface DiseaseInformationProps {
  patientId: number;
  conditions: DiseaseInfo[];
  readOnly?: boolean;
  onAdd?: (condition: string) => void;
  onUpdate?: (conditionName: string, updates: Partial<DiseaseInfo>) => void;
  onRemove?: (conditionName: string) => void;
}

export function DiseaseInformation({
  patientId,
  conditions = [],
  readOnly = false,
  onAdd,
  onUpdate,
  onRemove
}: DiseaseInformationProps) {
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardiovascular':
        return <HeartPulse className="h-4 w-4 text-red-500" />;
      case 'endocrine':
        return <Thermometer className="h-4 w-4 text-emerald-500" />;
      case 'respiratory':
        return <Clipboard className="h-4 w-4 text-blue-500" />;
      case 'gastrointestinal':
        return <Stethoscope className="h-4 w-4 text-amber-500" />;
      case 'neurological':
        return <BookOpen className="h-4 w-4 text-indigo-500" />;
      case 'musculoskeletal':
        return <Stethoscope className="h-4 w-4 text-cyan-500" />;
      case 'autoimmune':
        return <Pill className="h-4 w-4 text-purple-500" />;
      case 'infectious':
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Stethoscope className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'mild':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Mild</Badge>;
      case 'moderate':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Moderate</Badge>;
      case 'severe':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Severe</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Common disease information for quick tooltip/hover content
  const diseaseInformation: Record<string, {
    description: string;
    dentalImplications: string[];
    medications?: string[];
    contraindications?: string[];
  }> = {
    "Hypertension": {
      description: "High blood pressure condition where the long-term force of blood against artery walls is high enough to potentially cause health problems.",
      dentalImplications: [
        "Monitor blood pressure before procedures",
        "Limit epinephrine in anesthetics",
        "Consider stress reduction protocols",
        "Be aware of antihypertensive medication interactions"
      ],
      medications: [
        "ACE inhibitors", "Beta blockers", "Calcium channel blockers", "Diuretics"
      ],
      contraindications: [
        "High epinephrine concentrations if BP > 180/110",
        "Elective treatment when uncontrolled (>180/110)",
        "Certain vasoconstrictors"
      ]
    },
    "Diabetes Mellitus": {
      description: "Metabolic disorder characterized by high blood glucose levels over a prolonged period due to inadequate insulin production or cell response to insulin.",
      dentalImplications: [
        "Increased risk of periodontal disease",
        "Delayed wound healing",
        "Higher infection risk",
        "Morning appointments preferred",
        "Ensure patient has eaten properly"
      ],
      medications: [
        "Insulin", "Metformin", "Sulfonylureas", "GLP-1 agonists"
      ],
      contraindications: [
        "Elective treatment when blood glucose is poorly controlled",
        "Extensive surgical procedures without medical clearance"
      ]
    },
    "Coronary Artery Disease": {
      description: "Narrowing or blockage of the coronary arteries, usually caused by atherosclerosis, leading to reduced blood flow to the heart muscle.",
      dentalImplications: [
        "Stress reduction protocols",
        "Short appointments",
        "Semi-supine position may be better",
        "Avoid epinephrine if recent cardiac event",
        "Monitor vital signs during treatment"
      ],
      medications: [
        "Antiplatelet agents", "Statins", "Beta blockers", "Nitroglycerin"
      ],
      contraindications: [
        "Elective dental treatment within 6 months of MI or unstable angina",
        "High-concentration epinephrine"
      ]
    },
    "Asthma": {
      description: "Chronic inflammatory disease of the airways characterized by variable and recurring symptoms, reversible airflow obstruction, and bronchospasm.",
      dentalImplications: [
        "Ensure patient brings inhaler to appointments",
        "Avoid triggers (stress, sulfites, certain medications)",
        "Semi-upright position often more comfortable",
        "Avoid rubber dam in severe cases",
        "Avoid NSAIDs in aspirin-sensitive asthma"
      ],
      medications: [
        "Short-acting beta agonists", "Inhaled corticosteroids", "Long-acting beta agonists", "Leukotriene modifiers"
      ],
      contraindications: [
        "Aspirin and NSAIDs in aspirin-sensitive asthma",
        "Aerosols with sulfites"
      ]
    },
    "Rheumatoid Arthritis": {
      description: "Autoimmune disorder that causes chronic inflammation of the joints and other areas of the body.",
      dentalImplications: [
        "May have difficulty with prolonged open mouth",
        "Consider more frequent breaks",
        "Joint pain may limit comfortable positioning",
        "Higher risk of TMJ involvement",
        "Increased xerostomia risk from medications"
      ],
      medications: [
        "NSAIDs", "Corticosteroids", "DMARDs", "Biologics"
      ]
    },
    "Hypothyroidism": {
      description: "Condition in which the thyroid gland doesn't produce enough thyroid hormone, leading to various metabolic processes slowing down.",
      dentalImplications: [
        "Increased sensitivity to CNS depressants",
        "Delayed wound healing",
        "Increased bleeding tendency",
        "Increased susceptibility to infection",
        "May have enlarged tongue (macroglossia)"
      ],
      medications: [
        "Levothyroxine", "Liothyronine"
      ],
      contraindications: [
        "Elective procedures in uncontrolled cases",
        "Epinephrine in uncontrolled cases"
      ]
    },
    "Seizure Disorder": {
      description: "Neurological disorder characterized by recurrent epileptic seizures caused by abnormal electrical activity in the brain.",
      dentalImplications: [
        "Anti-seizure medications may cause gingival hyperplasia",
        "Avoid bright lights directly in eyes",
        "Have suction ready in case of seizure",
        "Use mouth props cautiously",
        "Stress reduction protocols"
      ],
      medications: [
        "Phenytoin", "Carbamazepine", "Valproic acid", "Lamotrigine"
      ],
      contraindications: [
        "Nitrous oxide in some cases",
        "Flashing lights (from curing units) with photosensitive epilepsy"
      ]
    },
    // Add more common conditions as needed
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            Medical Conditions
          </CardTitle>
          
          {!readOnly && onAdd && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAdd("")}
              className="h-8 gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Add Condition
            </Button>
          )}
        </div>
        <CardDescription>
          Patient's medical conditions and dental implications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {conditions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No medical conditions recorded</p>
            {!readOnly && onAdd && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAdd("")}
                className="mt-2 gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Condition
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {conditions.map((condition) => (
              <div
                key={condition.name}
                className="flex items-start gap-2 p-3 border rounded-md hover:bg-muted/40 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getCategoryIcon(condition.category)}
                </div>
                
                <div className="flex-grow space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {condition.name}
                      </h4>
                      {getSeverityBadge(condition.severity)}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Information</span>
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">{condition.name}</h4>
                            <p className="text-sm">{condition.description || diseaseInformation[condition.name]?.description || "No description available."}</p>
                            
                            <div className="pt-2">
                              <h5 className="text-sm font-medium mb-1">Dental Considerations:</h5>
                              <ul className="text-sm list-disc list-inside space-y-1">
                                {(condition.dentalConsiderations?.length > 0 
                                  ? condition.dentalConsiderations 
                                  : diseaseInformation[condition.name]?.dentalImplications || ['No specific considerations recorded'])
                                  .map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))
                                }
                              </ul>
                            </div>
                            
                            {((condition.medications && condition.medications.length > 0) || (diseaseInformation[condition.name]?.medications && diseaseInformation[condition.name]?.medications.length > 0)) && (
                              <div className="pt-1">
                                <h5 className="text-sm font-medium mb-1">Common Medications:</h5>
                                <ul className="text-sm list-disc list-inside space-y-1">
                                  {(condition.medications || diseaseInformation[condition.name]?.medications || [])
                                    .map((item, i) => (
                                      <li key={i}>{item}</li>
                                    ))
                                  }
                                </ul>
                              </div>
                            )}
                            
                            {diseaseInformation[condition.name]?.contraindications?.length > 0 && (
                              <div className="pt-1">
                                <h5 className="text-sm font-medium mb-1 text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Contraindications:
                                </h5>
                                <ul className="text-sm list-disc list-inside space-y-1 text-amber-700">
                                  {diseaseInformation[condition.name]?.contraindications?.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="text-xs text-muted-foreground pt-2">
                              Added: {format(condition.dateAdded, "MMM d, yyyy")}
                              {condition.lastUpdated && (
                                <> • Updated: {format(condition.lastUpdated, "MMM d, yyyy")}</>
                              )}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                      
                      {!readOnly && onRemove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(condition.name)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {condition.description || diseaseInformation[condition.name]?.description || "No description available."}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 pt-1">
                    {condition.implications?.slice(0, 3).map((implication, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                        {implication}
                      </Badge>
                    ))}
                    {condition.implications?.length > 3 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Badge variant="secondary" className="text-xs font-normal cursor-pointer">
                            +{condition.implications.length - 3} more
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <h4 className="font-medium mb-2">All Implications</h4>
                          <ul className="text-sm list-disc list-inside space-y-1">
                            {condition.implications.map((implication, idx) => (
                              <li key={idx}>{implication}</li>
                            ))}
                          </ul>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}