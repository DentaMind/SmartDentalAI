import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  Save,
  FileText,
  Pencil,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  FileSignature,
  Trash2,
  Loader2,
  Volume2,
  FilePenLine,
  PanelLeft,
  WandSparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

// Define procedure template types
interface ProcedureTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: {
    name: string;
    type: 'text' | 'number' | 'select';
    options?: string[];
    default?: string;
  }[];
}

interface VoiceNotesGeneratorProps {
  patientId: number;
  patientName: string;
  appointmentId?: number;
  appointmentDate?: Date;
  readOnly?: boolean;
  initialNote?: string;
  onSave: (noteData: {
    content: string;
    procedureType?: string;
    procedureDetails?: Record<string, string>;
    doctorSignature: boolean;
    doctorSignatureDate?: Date;
    patientSignature?: boolean;
    patientSignatureDate?: Date;
    riskAcknowledgment?: boolean;
    financialResponsibility?: boolean;
  }) => void;
}

export function VoiceNotesGenerator({
  patientId,
  patientName,
  appointmentId,
  appointmentDate = new Date(),
  readOnly = false,
  initialNote = '',
  onSave
}: VoiceNotesGeneratorProps) {
  // State for note content and editing
  const [noteContent, setNoteContent] = useState(initialNote);
  const [isDirty, setIsDirty] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [procedureVariables, setProcedureVariables] = useState<Record<string, string>>({});
  const [recordingTime, setRecordingTime] = useState(0);
  const [doctorSignature, setDoctorSignature] = useState(false);
  const [patientSignature, setPatientSignature] = useState(false);
  const [riskAcknowledgment, setRiskAcknowledgment] = useState(false);
  const [financialResponsibility, setFinancialResponsibility] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  
  // Reference to recording timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string[]>([]);
  
  // For mock audio processing
  const mockRecognition = useRef<any>(null);
  
  // Auth and toast hooks
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Getting patient's medical history for context
  const { data: patientMedicalHistory } = useQuery({
    queryKey: [`/api/patients/${patientId}/medical-history`],
    enabled: !isNaN(patientId) && !readOnly,
  });

  // Mock procedure templates (in a real app these would come from the server)
  const procedureTemplates: ProcedureTemplate[] = [
    {
      id: "restorative-composite",
      name: "Composite Restoration",
      category: "Restorative",
      template: 
        "DATE: [DATE]\n" +
        "PROCEDURE: Composite restoration on tooth #[TOOTH_NUMBER]\n\n" +
        "ANESTHESIA: [ANESTHETIC_TYPE], [CARPULES] carpule(s), [EPI_STATUS]\n" +
        "ISOLATION: [ISOLATION_METHOD]\n\n" +
        "CLINICAL FINDINGS: [FINDINGS]\n\n" +
        "PROCEDURE DETAILS:\n" +
        "1. Anesthesia was administered and patient confirmed profound anesthesia before starting procedure\n" +
        "2. Removed existing restoration and/or decay, preserving healthy tooth structure\n" +
        "3. [PREPARATION_EXTENT] preparation was performed\n" +
        "4. Applied [BONDING_AGENT] bonding agent according to manufacturer instructions\n" +
        "5. Placed [COMPOSITE_SHADE] composite in incremental layers with adequate curing time\n" +
        "6. Checked and adjusted occlusion and proximal contacts\n" +
        "7. Polished restoration for optimal esthetics\n\n" +
        "POST-OPERATIVE INSTRUCTIONS:\n" +
        "- Patient instructed to avoid eating until anesthesia wears off\n" +
        "- Advised that sensitivity may occur for a few days but should diminish\n" +
        "- Patient will call if any issues or concerns arise\n\n" +
        "TREATMENT OUTCOMES: [OUTCOMES]\n\n" +
        "FOLLOW-UP RECOMMENDATIONS: [FOLLOWUP]\n\n" +
        "PROVIDER SIGNATURE: ______________________ DATE: [SIGNATURE_DATE]",
      variables: [
        { name: "DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") },
        { name: "TOOTH_NUMBER", type: "number" },
        { name: "ANESTHETIC_TYPE", type: "select", options: ["Lidocaine 2%", "Articaine 4%", "Mepivacaine 3%", "Prilocaine 4%", "None"] },
        { name: "CARPULES", type: "select", options: ["1", "1.5", "2", "2.5", "3"] },
        { name: "EPI_STATUS", type: "select", options: ["with epinephrine 1:100,000", "with epinephrine 1:200,000", "without epinephrine"] },
        { name: "ISOLATION_METHOD", type: "select", options: ["Rubber dam", "Cotton rolls", "Isolite", "DryShield", "Minimal"] },
        { name: "FINDINGS", type: "text", default: "Patient presented with occlusal decay on tooth" },
        { name: "PREPARATION_EXTENT", type: "select", options: ["Conservative", "Moderate", "Extensive"] },
        { name: "BONDING_AGENT", type: "select", options: ["5th generation", "7th generation", "Universal"] },
        { name: "COMPOSITE_SHADE", type: "text" },
        { name: "OUTCOMES", type: "text", default: "Restoration completed successfully with good retention and esthetics" },
        { name: "FOLLOWUP", type: "text", default: "Routine 6-month recall" },
        { name: "SIGNATURE_DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") }
      ]
    },
    {
      id: "endo-rct",
      name: "Root Canal Therapy",
      category: "Endodontics",
      template: 
        "DATE: [DATE]\n" +
        "PROCEDURE: Root Canal Therapy on tooth #[TOOTH_NUMBER]\n\n" +
        "PRE-OPERATIVE DIAGNOSIS: [DIAGNOSIS]\n" +
        "ANESTHESIA: [ANESTHETIC_TYPE], [CARPULES] carpule(s), [EPI_STATUS]\n\n" +
        "CLINICAL FINDINGS:\n" +
        "[FINDINGS]\n\n" +
        "RADIOGRAPHIC FINDINGS:\n" +
        "[RADIOGRAPHIC_FINDINGS]\n\n" +
        "PROCEDURE DETAILS:\n" +
        "1. Anesthesia administered and access prepared through [ACCESS_TYPE]\n" +
        "2. Working length established with apex locator and confirmed radiographically\n" +
        "   - [CANAL_DETAILS]\n" +
        "3. Canals instrumented using [INSTRUMENTATION_TECHNIQUE] technique\n" +
        "   - Master apical file sizes: [MASTER_FILES]\n" +
        "4. Irrigation protocol: [IRRIGATION_PROTOCOL]\n" +
        "5. Canals obturated using [OBTURATION_TECHNIQUE] with [SEALER_TYPE] sealer\n" +
        "6. [RESTORATION_TYPE] placed for temporary/final restoration\n\n" +
        "POST-OPERATIVE INSTRUCTIONS:\n" +
        "- Patient advised to take [MEDICATION] as needed for discomfort\n" +
        "- Informed that tooth may be sensitive for a few days\n" +
        "- Avoid chewing on treated tooth until permanent restoration is placed\n" +
        "- Call if severe pain, swelling, or other concerns develop\n\n" +
        "TREATMENT OUTCOMES: [OUTCOMES]\n\n" +
        "FOLLOW-UP RECOMMENDATIONS: [FOLLOWUP]\n\n" +
        "PROVIDER SIGNATURE: ______________________ DATE: [SIGNATURE_DATE]",
      variables: [
        { name: "DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") },
        { name: "TOOTH_NUMBER", type: "number" },
        { name: "DIAGNOSIS", type: "select", options: ["Irreversible pulpitis", "Necrotic pulp", "Previously initiated therapy", "Previously treated", "Normal pulp (elective)"] },
        { name: "ANESTHETIC_TYPE", type: "select", options: ["Lidocaine 2%", "Articaine 4%", "Mepivacaine 3%", "Prilocaine 4%", "Bupivacaine 0.5%"] },
        { name: "CARPULES", type: "select", options: ["1", "2", "3", "4"] },
        { name: "EPI_STATUS", type: "select", options: ["with epinephrine 1:100,000", "with epinephrine 1:200,000", "without epinephrine"] },
        { name: "FINDINGS", type: "text" },
        { name: "RADIOGRAPHIC_FINDINGS", type: "text" },
        { name: "ACCESS_TYPE", type: "text" },
        { name: "CANAL_DETAILS", type: "text" },
        { name: "INSTRUMENTATION_TECHNIQUE", type: "select", options: ["Step-back", "Crown-down", "Hybrid", "Rotary NiTi"] },
        { name: "MASTER_FILES", type: "text" },
        { name: "IRRIGATION_PROTOCOL", type: "select", options: ["5.25% NaOCl", "2.5% NaOCl with EDTA", "NaOCl, EDTA, and CHX"] },
        { name: "OBTURATION_TECHNIQUE", type: "select", options: ["Lateral condensation", "Warm vertical", "Single cone", "Carrier-based"] },
        { name: "SEALER_TYPE", type: "text" },
        { name: "RESTORATION_TYPE", type: "select", options: ["IRM", "Cavit", "Glass ionomer", "Composite", "Temporary crown"] },
        { name: "MEDICATION", type: "select", options: ["ibuprofen 600mg", "acetaminophen 500mg", "acetaminophen with codeine"] },
        { name: "OUTCOMES", type: "text", default: "Procedure completed without complications" },
        { name: "FOLLOWUP", type: "text", default: "Patient to return for final restoration in 2 weeks" },
        { name: "SIGNATURE_DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") }
      ]
    },
    {
      id: "perio-scaling",
      name: "Scaling and Root Planing",
      category: "Periodontics",
      template: 
        "DATE: [DATE]\n" +
        "PROCEDURE: Scaling and Root Planing, [QUADRANT]\n\n" +
        "ANESTHESIA: [ANESTHETIC_TYPE], [CARPULES] carpule(s), [EPI_STATUS]\n\n" +
        "PRE-TREATMENT ASSESSMENT:\n" +
        "- Periodontal diagnosis: [PERIO_DIAGNOSIS]\n" +
        "- Probing depths ranging from [PROBE_DEPTHS_MIN]-[PROBE_DEPTHS_MAX]mm in treated quadrant\n" +
        "- Bleeding on probing: [BOP_PERCENTAGE]% of sites\n" +
        "- Radiographic bone loss: [BONE_LOSS]\n\n" +
        "PROCEDURE DETAILS:\n" +
        "1. Anesthesia administered and confirmed prior to starting procedure\n" +
        "2. Scaling performed using [INSTRUMENT_TYPE]\n" +
        "3. Root planing completed to remove all detectable calculus and create smooth root surfaces\n" +
        "4. Irrigation with [IRRIGATION_SOLUTION]\n" +
        "5. [ADJUNCTIVE_THERAPY] applied as adjunctive therapy\n\n" +
        "HOME CARE INSTRUCTIONS:\n" +
        "- Continue regular brushing with modified technique demonstrated\n" +
        "- Daily flossing and interdental cleaning with [INTERDENTAL_DEVICE]\n" +
        "- [RINSE_INSTRUCTIONS]\n" +
        "- [MEDICATION_INSTRUCTIONS]\n\n" +
        "TREATMENT OUTCOMES: [OUTCOMES]\n\n" +
        "FOLLOW-UP RECOMMENDATIONS: [FOLLOWUP]\n\n" +
        "PROVIDER SIGNATURE: ______________________ DATE: [SIGNATURE_DATE]",
      variables: [
        { name: "DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") },
        { name: "QUADRANT", type: "select", options: ["Upper Right Quadrant", "Upper Left Quadrant", "Lower Right Quadrant", "Lower Left Quadrant", "Full Mouth"] },
        { name: "ANESTHETIC_TYPE", type: "select", options: ["Lidocaine 2%", "Articaine 4%", "Mepivacaine 3%", "Prilocaine 4%", "Topical only"] },
        { name: "CARPULES", type: "select", options: ["1", "1.5", "2", "2.5", "3"] },
        { name: "EPI_STATUS", type: "select", options: ["with epinephrine 1:100,000", "with epinephrine 1:200,000", "without epinephrine"] },
        { name: "PERIO_DIAGNOSIS", type: "select", options: ["Gingivitis", "Slight Periodontitis", "Moderate Periodontitis", "Severe Periodontitis"] },
        { name: "PROBE_DEPTHS_MIN", type: "select", options: ["3", "4", "5", "6", "7"] },
        { name: "PROBE_DEPTHS_MAX", type: "select", options: ["5", "6", "7", "8", "9", "10", "11", "12"] },
        { name: "BOP_PERCENTAGE", type: "select", options: ["0-25", "26-50", "51-75", "76-100"] },
        { name: "BONE_LOSS", type: "select", options: ["Minimal (<15%)", "Mild (15-30%)", "Moderate (31-50%)", "Severe (>50%)"] },
        { name: "INSTRUMENT_TYPE", type: "select", options: ["Hand instruments", "Ultrasonic", "Combination of hand and ultrasonic"] },
        { name: "IRRIGATION_SOLUTION", type: "select", options: ["Saline", "Chlorhexidine", "Povidone-iodine", "Water"] },
        { name: "ADJUNCTIVE_THERAPY", type: "select", options: ["None", "Locally delivered antibiotics", "Laser therapy", "Antimicrobial rinse"] },
        { name: "INTERDENTAL_DEVICE", type: "select", options: ["Interdental brushes", "Floss", "Water flosser", "Proxy brush"] },
        { name: "RINSE_INSTRUCTIONS", type: "select", options: [
          "Rinse with chlorhexidine twice daily for 2 weeks", 
          "Warm salt water rinses for 1 week", 
          "No special rinse needed"
        ]},
        { name: "MEDICATION_INSTRUCTIONS", type: "select", options: [
          "Take prescribed antibiotic as directed until complete", 
          "OTC pain medication as needed", 
          "No medications prescribed"
        ]},
        { name: "OUTCOMES", type: "text", default: "Procedure completed successfully with good patient tolerance" },
        { name: "FOLLOWUP", type: "text", default: "Periodontal reevaluation in 4-6 weeks" },
        { name: "SIGNATURE_DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") }
      ]
    },
    {
      id: "extraction-simple",
      name: "Simple Extraction",
      category: "Oral Surgery",
      template: 
        "DATE: [DATE]\n" +
        "PROCEDURE: Extraction of tooth #[TOOTH_NUMBER]\n\n" +
        "PRE-OPERATIVE DIAGNOSIS: [DIAGNOSIS]\n" +
        "ANESTHESIA: [ANESTHETIC_TYPE], [CARPULES] carpule(s), [EPI_STATUS]\n\n" +
        "CLINICAL FINDINGS:\n" +
        "[FINDINGS]\n\n" +
        "RADIOGRAPHIC FINDINGS:\n" +
        "[RADIOGRAPHIC_FINDINGS]\n\n" +
        "PROCEDURE DETAILS:\n" +
        "1. Anesthesia administered and confirmed\n" +
        "2. Periodontal ligament separated using [INSTRUMENTS]\n" +
        "3. Tooth elevated with [ELEVATOR_TYPE] elevator\n" +
        "4. Tooth extracted with [FORCEPS_TYPE] forceps\n" +
        "5. Socket debrided and irrigated with sterile saline\n" +
        "6. Hemostasis achieved with [HEMOSTASIS_METHOD]\n" +
        "7. [SUTURE_DETAILS]\n\n" +
        "PATIENT TOLERANCE: [PATIENT_TOLERANCE]\n\n" +
        "POST-OPERATIVE INSTRUCTIONS:\n" +
        "- Bite on gauze for 30-45 minutes\n" +
        "- No rinsing, spitting, or drinking through straws for 24 hours\n" +
        "- Soft diet for 24-48 hours\n" +
        "- Apply ice packs to face, 20 minutes on, 20 minutes off for first day\n" +
        "- Take [MEDICATION] as prescribed for pain\n" +
        "- Call if excessive bleeding, pain, or swelling occurs\n\n" +
        "TREATMENT OUTCOMES: [OUTCOMES]\n\n" +
        "FOLLOW-UP RECOMMENDATIONS: [FOLLOWUP]\n\n" +
        "PROVIDER SIGNATURE: ______________________ DATE: [SIGNATURE_DATE]",
      variables: [
        { name: "DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") },
        { name: "TOOTH_NUMBER", type: "number" },
        { name: "DIAGNOSIS", type: "select", options: ["Non-restorable caries", "Periodontal disease", "Fracture", "Orthodontic treatment", "Prosthetic considerations", "Infection"] },
        { name: "ANESTHETIC_TYPE", type: "select", options: ["Lidocaine 2%", "Articaine 4%", "Mepivacaine 3%", "Prilocaine 4%", "Bupivacaine 0.5%"] },
        { name: "CARPULES", type: "select", options: ["1", "2", "3", "4"] },
        { name: "EPI_STATUS", type: "select", options: ["with epinephrine 1:100,000", "with epinephrine 1:200,000", "without epinephrine"] },
        { name: "FINDINGS", type: "text" },
        { name: "RADIOGRAPHIC_FINDINGS", type: "text", default: "No significant pathology noted" },
        { name: "INSTRUMENTS", type: "select", options: ["Periosteal elevator", "Straight elevator", "Periotome", "Scalpel"] },
        { name: "ELEVATOR_TYPE", type: "select", options: ["Straight", "Apical", "Cryer", "Potts", "None needed"] },
        { name: "FORCEPS_TYPE", type: "select", options: ["150", "151", "Universal upper", "Universal lower", "Cowhorn", "#23", "#17", "88R", "88L"] },
        { name: "HEMOSTASIS_METHOD", type: "select", options: ["Pressure", "Gauze", "Gelfoam", "Surgicel"] },
        { name: "SUTURE_DETAILS", type: "select", options: [
          "No sutures placed", 
          "Simple interrupted sutures placed using 3-0 chromic gut", 
          "Simple interrupted sutures placed using 3-0 silk", 
          "Figure-8 suture placed using 3-0 chromic gut"
        ]},
        { name: "PATIENT_TOLERANCE", type: "select", options: ["Excellent", "Good", "Fair", "Poor"] },
        { name: "MEDICATION", type: "select", options: [
          "ibuprofen 600mg", 
          "acetaminophen 500mg", 
          "acetaminophen with codeine", 
          "amoxicillin 500mg for 7 days"
        ]},
        { name: "OUTCOMES", type: "text", default: "Extraction completed without complications" },
        { name: "FOLLOWUP", type: "text", default: "Return as needed" },
        { name: "SIGNATURE_DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") }
      ]
    },
    {
      id: "crown-preparation",
      name: "Crown Preparation",
      category: "Prosthodontics",
      template: 
        "DATE: [DATE]\n" +
        "PROCEDURE: Crown preparation for tooth #[TOOTH_NUMBER]\n\n" +
        "CROWN TYPE: [CROWN_TYPE]\n" +
        "ANESTHESIA: [ANESTHETIC_TYPE], [CARPULES] carpule(s), [EPI_STATUS]\n\n" +
        "CLINICAL FINDINGS:\n" +
        "[FINDINGS]\n\n" +
        "PROCEDURE DETAILS:\n" +
        "1. Anesthesia administered and confirmed\n" +
        "2. Initial occlusal clearance made ensuring [OCCLUSAL_CLEARANCE]mm reduction\n" +
        "3. Axial reduction completed with [MARGIN_DESIGN] margin design\n" +
        "4. [BUILDUP_DETAILS]\n" +
        "5. Final preparation refined with [FINISH_BUR]\n" +
        "6. [RETRACTION_METHOD] used for tissue management\n" +
        "7. Final impression made using [IMPRESSION_MATERIAL]\n" +
        "8. Bite registration taken with [BITE_MATERIAL]\n" +
        "9. Provisional crown fabricated using [PROVISIONAL_MATERIAL] and cemented with [TEMP_CEMENT]\n" +
        "10. Occlusion checked and adjusted as needed\n\n" +
        "SHADE SELECTION: [SHADE]\n\n" +
        "LAB INSTRUCTIONS:\n" +
        "[LAB_INSTRUCTIONS]\n\n" +
        "POST-OPERATIVE INSTRUCTIONS:\n" +
        "- Avoid sticky foods and flossing around provisional crown\n" +
        "- Call if provisional becomes loose or uncomfortable\n" +
        "- Return in [RETURN_TIMEFRAME] for final crown delivery\n\n" +
        "TREATMENT OUTCOMES: [OUTCOMES]\n\n" +
        "FOLLOW-UP RECOMMENDATIONS: [FOLLOWUP]\n\n" +
        "PROVIDER SIGNATURE: ______________________ DATE: [SIGNATURE_DATE]",
      variables: [
        { name: "DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") },
        { name: "TOOTH_NUMBER", type: "number" },
        { name: "CROWN_TYPE", type: "select", options: ["PFM", "Full gold", "Zirconia", "e.max", "Layered zirconia"] },
        { name: "ANESTHETIC_TYPE", type: "select", options: ["Lidocaine 2%", "Articaine 4%", "Mepivacaine 3%", "Prilocaine 4%"] },
        { name: "CARPULES", type: "select", options: ["1", "1.5", "2", "2.5", "3"] },
        { name: "EPI_STATUS", type: "select", options: ["with epinephrine 1:100,000", "with epinephrine 1:200,000", "without epinephrine"] },
        { name: "FINDINGS", type: "text" },
        { name: "OCCLUSAL_CLEARANCE", type: "select", options: ["1.5", "2.0", "2.5"] },
        { name: "MARGIN_DESIGN", type: "select", options: ["Chamfer", "Shoulder", "Feather", "Deep chamfer"] },
        { name: "BUILDUP_DETAILS", type: "select", options: [
          "Core buildup completed with composite", 
          "Core buildup completed with glass ionomer", 
          "Amalgam core under preparation", 
          "Post and core buildup completed", 
          "No buildup needed"
        ]},
        { name: "FINISH_BUR", type: "select", options: ["Fine diamond", "Extra-fine diamond", "Carbide finishing bur"] },
        { name: "RETRACTION_METHOD", type: "select", options: ["Retraction cord", "Expasyl", "Laser tissue management", "Diode laser", "Retraction paste"] },
        { name: "IMPRESSION_MATERIAL", type: "select", options: ["PVS", "Digital scan", "Polyether", "PVS bite registration material"] },
        { name: "BITE_MATERIAL", type: "select", options: ["PVS bite material", "Wax", "Digital bite scan"] },
        { name: "PROVISIONAL_MATERIAL", type: "select", options: ["Bis-acryl", "PMMA", "Composite", "Pre-fabricated crown"] },
        { name: "TEMP_CEMENT", type: "select", options: ["TempBond", "TempBond NE", "Temp-Bond Clear", "ZOE cement"] },
        { name: "SHADE", type: "text" },
        { name: "LAB_INSTRUCTIONS", type: "text" },
        { name: "RETURN_TIMEFRAME", type: "select", options: ["2 weeks", "3 weeks", "4 weeks"] },
        { name: "OUTCOMES", type: "text", default: "Preparation and provisional completed successfully with good marginal fit" },
        { name: "FOLLOWUP", type: "text", default: "Return in 2-3 weeks for final crown delivery" },
        { name: "SIGNATURE_DATE", type: "text", default: format(new Date(), "MM/dd/yyyy") }
      ]
    }
  ];
  
  // Clear timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mockRecognition.current) {
        mockRecognition.current.stop();
      }
    };
  }, []);
  
  // Initialize speech recognition (mock version for demo)
  const initializeSpeechRecognition = () => {
    // In a real app, you would use the Web Speech API or a dedicated speech recognition service
    // This is a mock implementation for demo purposes
    const mockSpeechRecognition = {
      isStarted: false,
      transcript: '',
      onresult: null as any,
      onend: null as any,
      onerror: null as any,
      
      start() {
        this.isStarted = true;
        
        // Simulate transcription events with mock data
        setTimeout(() => {
          if (this.onresult) {
            // Simulate getting some initial words
            this.transcript = "Patient arrived with pain on tooth";
            this.onresult({
              results: [[{ transcript: this.transcript }]]
            });
          }
        }, 2000);
        
        setTimeout(() => {
          if (this.onresult && this.isStarted) {
            // Add more words to simulate ongoing transcription
            this.transcript += " number 19. Performed clinical and radiographic examination.";
            this.onresult({
              results: [[{ transcript: this.transcript }]]
            });
          }
        }, 5000);
        
        setTimeout(() => {
          if (this.onresult && this.isStarted) {
            // Add more words to simulate ongoing transcription
            this.transcript += " Found deep caries extending to pulp. Recommended root canal treatment.";
            this.onresult({
              results: [[{ transcript: this.transcript }]]
            });
          }
        }, 8000);
      },
      
      stop() {
        this.isStarted = false;
        if (this.onend) this.onend();
      }
    };
    
    return mockSpeechRecognition;
  };
  
  // Start recording
  const startRecording = () => {
    if (isRecording) return;
    
    setIsRecording(true);
    setRecordingTime(0);
    transcriptRef.current = [];
    
    // Start recording timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Initialize mock speech recognition
    mockRecognition.current = initializeSpeechRecognition();
    mockRecognition.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      transcriptRef.current.push(transcript);
      
      // Update note content with latest transcript
      setNoteContent(prev => {
        if (prev.trim() === '') return transcript;
        return prev + ' ' + transcript;
      });
    };
    
    mockRecognition.current.onend = () => {
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    
    mockRecognition.current.onerror = (event: any) => {
      toast({
        title: "Recording Error",
        description: `Error occurred: ${event.error}`,
        variant: "destructive",
      });
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    
    mockRecognition.current.start();
  };
  
  // Stop recording
  const stopRecording = () => {
    if (!isRecording) return;
    
    if (mockRecognition.current) {
      mockRecognition.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    
    // In a real app, you would process the transcription further
    toast({
      title: "Recording Stopped",
      description: "Voice recording has been processed and added to notes.",
      variant: "default",
    });
  };
  
  // Process notes with AI
  const processWithAI = async () => {
    setIsProcessing(true);
    
    try {
      // In a real app, this would be an API call using CHAT_AI_KEY to process notes
      // For demo purposes, we'll simulate processing with a timeout
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Add some AI-generated content to demonstrate the feature
      const currentDate = format(new Date(), "MM/dd/yyyy");
      const aiEnhancedNote = `DATE: ${currentDate}\n\nPATIENT VISIT SUMMARY:\n${noteContent}\n\nAI-ENHANCED CLINICAL OBSERVATIONS:\n- Patient presented with pain on tooth #19\n- Clinical examination revealed deep caries extending to pulp\n- Radiographic examination confirmed caries close to pulp chamber\n- Treatment plan discussed with patient: root canal therapy followed by crown\n- Patient agreed to proceed with recommended treatment\n\nASSESSMENT & RECOMMENDATIONS:\n- Diagnosis: Irreversible pulpitis on tooth #19\n- Recommended RCT and full coverage restoration\n- Patient informed of all risks, benefits, and alternatives\n- Patient scheduled for treatment next week\n\nNEXT STEPS:\n- RCT appointment scheduled\n- Patient to take ibuprofen 600mg for pain as needed\n- Patient to call if symptoms worsen`;
      
      setNoteContent(aiEnhancedNote);
      setIsDirty(true);
      
      toast({
        title: "AI Processing Complete",
        description: "Notes have been enhanced with AI-generated clinical observations.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "AI Processing Failed",
        description: "Could not process notes with AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Apply procedure template
  const applyTemplate = (templateId: string) => {
    const template = procedureTemplates.find(t => t.id === templateId);
    
    if (!template) return;
    
    setSelectedProcedure(templateId);
    
    // Initialize template variables with defaults
    const initialVariables: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v.default) initialVariables[v.name] = v.default;
      else if (v.type === 'select' && v.options && v.options.length > 0) {
        initialVariables[v.name] = v.options[0];
      } else {
        initialVariables[v.name] = '';
      }
    });
    
    setProcedureVariables(initialVariables);
    
    // Apply template with variables
    let templateText = template.template;
    
    Object.entries(initialVariables).forEach(([key, value]) => {
      templateText = templateText.replace(`[${key}]`, value);
    });
    
    setNoteContent(templateText);
    setIsDirty(true);
    setShowTemplates(false);
  };
  
  // Update template variable
  const updateTemplateVariable = (name: string, value: string) => {
    setProcedureVariables(prev => {
      const updated = { ...prev, [name]: value };
      
      // Also update the note content
      if (selectedProcedure) {
        const template = procedureTemplates.find(t => t.id === selectedProcedure);
        if (template) {
          let templateText = template.template;
          
          Object.entries(updated).forEach(([key, val]) => {
            templateText = templateText.replace(`[${key}]`, val);
          });
          
          setNoteContent(templateText);
        }
      }
      
      return updated;
    });
  };
  
  // Save note
  const handleSave = () => {
    if (readOnly) return;
    
    const noteData = {
      content: noteContent,
      procedureType: selectedProcedure || undefined,
      procedureDetails: selectedProcedure ? procedureVariables : undefined,
      doctorSignature,
      doctorSignatureDate: doctorSignature ? new Date() : undefined,
      patientSignature,
      patientSignatureDate: patientSignature ? new Date() : undefined,
      riskAcknowledgment,
      financialResponsibility
    };
    
    onSave(noteData);
    setIsDirty(false);
    
    toast({
      title: "Note Saved",
      description: "Clinical note has been saved successfully.",
      variant: "default",
    });
  };
  
  // Discard changes
  const handleDiscard = () => {
    setNoteContent(initialNote);
    setIsDirty(false);
    setSelectedProcedure(null);
    setProcedureVariables({});
    
    toast({
      title: "Changes Discarded",
      description: "All changes have been discarded.",
      variant: "default",
    });
  };
  
  // Add template variable panel
  const renderVariableEditor = () => {
    if (!selectedProcedure) return null;
    
    const template = procedureTemplates.find(t => t.id === selectedProcedure);
    if (!template) return null;
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Template Variables for {template.name}
          </CardTitle>
          <CardDescription>
            Customize these fields to update the template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {template.variables.map(variable => (
              <div key={variable.name} className="space-y-1">
                <Label htmlFor={`var-${variable.name}`} className="text-xs font-medium">
                  {variable.name.replace(/_/g, ' ')}
                </Label>
                
                {variable.type === 'select' && variable.options ? (
                  <Select
                    value={procedureVariables[variable.name] || ''}
                    onValueChange={(value) => updateTemplateVariable(variable.name, value)}
                  >
                    <SelectTrigger id={`var-${variable.name}`} className="w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {variable.options.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : variable.type === 'number' ? (
                  <Input
                    id={`var-${variable.name}`}
                    type="number"
                    value={procedureVariables[variable.name] || ''}
                    onChange={(e) => updateTemplateVariable(variable.name, e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <Input
                    id={`var-${variable.name}`}
                    type="text"
                    value={procedureVariables[variable.name] || ''}
                    onChange={(e) => updateTemplateVariable(variable.name, e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Add signature dialog
  const renderSignatureDialog = () => {
    return (
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Clinical Note</DialogTitle>
            <DialogDescription>
              This note requires your signature before it can be saved to the patient's record.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="doctor-signature" 
                  checked={doctorSignature} 
                  onCheckedChange={(checked) => setDoctorSignature(checked as boolean)} 
                />
                <label
                  htmlFor="doctor-signature"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I, {user?.firstName} {user?.lastName}, confirm that this note accurately represents the care provided.
                </label>
              </div>
              
              {doctorSignature && (
                <div className="text-sm text-muted-foreground pl-6">
                  Electronic signature created on: {format(new Date(), "MM/dd/yyyy hh:mm a")}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="patient-signature" 
                  checked={patientSignature} 
                  onCheckedChange={(checked) => setPatientSignature(checked as boolean)} 
                />
                <label
                  htmlFor="patient-signature"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Patient signature obtained for treatment plan consent
                </label>
              </div>
              
              {patientSignature && (
                <div className="text-sm text-muted-foreground pl-6">
                  Patient signature recorded on: {format(new Date(), "MM/dd/yyyy hh:mm a")}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="risk-acknowledgment" 
                  checked={riskAcknowledgment} 
                  onCheckedChange={(checked) => setRiskAcknowledgment(checked as boolean)} 
                />
                <label
                  htmlFor="risk-acknowledgment"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Patient acknowledges all risks associated with treatment
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="financial-responsibility" 
                  checked={financialResponsibility} 
                  onCheckedChange={(checked) => setFinancialResponsibility(checked as boolean)} 
                />
                <label
                  htmlFor="financial-responsibility"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Patient accepts financial responsibility for treatment
                </label>
              </div>
            </div>
            
            {!doctorSignature && (
              <div className="text-sm text-amber-600 flex items-center gap-1 mt-2">
                <AlertTriangle className="h-4 w-4" />
                Doctor signature is required before saving this note
              </div>
            )}
            
            <div className="border-t pt-4 text-xs text-muted-foreground">
              <p className="mb-2">
                <strong>PROVIDER RESPONSIBILITY:</strong> By signing this clinical note, the provider 
                acknowledges that all information is accurate to the best of their knowledge. The provider 
                is solely responsible for the accuracy and completeness of this note.
              </p>
              <p>
                <strong>PATIENT SIGNATURE:</strong> Patient signature indicates consent to the recommended 
                treatment plan, acknowledgment of all risks, benefits and alternatives discussed, and acceptance 
                of financial responsibility.
              </p>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSignatureDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowSignatureDialog(false);
                handleSave();
              }}
              disabled={!doctorSignature}
            >
              <FileSignature className="h-4 w-4 mr-2" />
              Sign and Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <FilePenLine className="h-5 w-5 text-primary" />
              Clinical Notes
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {!readOnly && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTemplates(!showTemplates)}
                          className="gap-1"
                        >
                          <ListChecks className="h-4 w-4" />
                          Templates
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Choose from procedure templates</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isRecording ? "destructive" : "outline"}
                          size="sm"
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={readOnly}
                          className="gap-1"
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="h-4 w-4" />
                              {formatTime(recordingTime)}
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4" />
                              Voice
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isRecording ? "Stop voice recording" : "Start voice recording"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={processWithAI}
                          disabled={isProcessing || noteContent.trim() === '' || readOnly}
                          className="gap-1"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <WandSparkles className="h-4 w-4" />
                              AI Enhance
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enhance notes with AI processing</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              
              <Badge variant={isDirty ? "default" : "outline"}>
                {readOnly ? "Read Only" : isDirty ? "Unsaved Changes" : "Saved"}
              </Badge>
            </div>
          </div>
          <CardDescription>
            {patientName || 'Patient'}'s clinical notes from {format(appointmentDate, "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Template selection panel */}
          {showTemplates && !readOnly && (
            <Card className="mb-4 border-dashed">
              <CardHeader className="py-3">
                <CardTitle className="text-base">Procedure Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="restorative">Restorative</TabsTrigger>
                    <TabsTrigger value="endodontics">Endodontics</TabsTrigger>
                    <TabsTrigger value="periodontics">Periodontics</TabsTrigger>
                    <TabsTrigger value="surgery">Oral Surgery</TabsTrigger>
                    <TabsTrigger value="prosthodontics">Prosthodontics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="m-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {procedureTemplates.map(template => (
                        <Button
                          key={template.id}
                          variant="outline"
                          className="justify-start gap-2 h-auto py-2"
                          onClick={() => applyTemplate(template.id)}
                        >
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <div className="text-left">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">{template.category}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="restorative" className="m-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {procedureTemplates
                        .filter(t => t.category === 'Restorative')
                        .map(template => (
                          <Button
                            key={template.id}
                            variant="outline"
                            className="justify-start gap-2 h-auto py-2"
                            onClick={() => applyTemplate(template.id)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground">{template.category}</div>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="endodontics" className="m-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {procedureTemplates
                        .filter(t => t.category === 'Endodontics')
                        .map(template => (
                          <Button
                            key={template.id}
                            variant="outline"
                            className="justify-start gap-2 h-auto py-2"
                            onClick={() => applyTemplate(template.id)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground">{template.category}</div>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="periodontics" className="m-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {procedureTemplates
                        .filter(t => t.category === 'Periodontics')
                        .map(template => (
                          <Button
                            key={template.id}
                            variant="outline"
                            className="justify-start gap-2 h-auto py-2"
                            onClick={() => applyTemplate(template.id)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground">{template.category}</div>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="surgery" className="m-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {procedureTemplates
                        .filter(t => t.category === 'Oral Surgery')
                        .map(template => (
                          <Button
                            key={template.id}
                            variant="outline"
                            className="justify-start gap-2 h-auto py-2"
                            onClick={() => applyTemplate(template.id)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground">{template.category}</div>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="prosthodontics" className="m-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {procedureTemplates
                        .filter(t => t.category === 'Prosthodontics')
                        .map(template => (
                          <Button
                            key={template.id}
                            variant="outline"
                            className="justify-start gap-2 h-auto py-2"
                            onClick={() => applyTemplate(template.id)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground">{template.category}</div>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
          
          {/* Template variables editor */}
          {selectedProcedure && !readOnly && renderVariableEditor()}
          
          {/* Main editor */}
          <div className="space-y-4">
            <Textarea
              placeholder="Enter or dictate clinical notes here..."
              value={noteContent}
              onChange={(e) => {
                setNoteContent(e.target.value);
                setIsDirty(true);
              }}
              disabled={readOnly || isRecording}
              className="min-h-[300px] font-mono text-sm"
            />
            
            {isRecording && (
              <div className="flex items-center gap-2 text-sm">
                <Mic className="h-4 w-4 text-red-500 animate-pulse" />
                <span className="text-muted-foreground">Recording in progress ({formatTime(recordingTime)})</span>
              </div>
            )}
            
            {doctorSignature && (
              <div className="text-sm text-primary flex items-center gap-1 border-t pt-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Signed by: Dr. {user?.firstName} {user?.lastName} on {format(new Date(), "MM/dd/yyyy")}
                </span>
              </div>
            )}
            
            {patientSignature && (
              <div className="text-sm text-primary flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Patient signature obtained on {format(new Date(), "MM/dd/yyyy")}
                </span>
              </div>
            )}
            
            {riskAcknowledgment && (
              <div className="text-sm text-primary flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Patient acknowledged all risks associated with treatment
                </span>
              </div>
            )}
            
            {financialResponsibility && (
              <div className="text-sm text-primary flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Patient accepted financial responsibility for treatment
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        {!readOnly && (
          <CardFooter className="flex justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={handleDiscard}
              disabled={!isDirty}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Discard Changes
            </Button>
            
            <div className="flex items-center gap-2">
              {isRecording ? (
                <Button
                  variant="destructive"
                  onClick={stopRecording}
                  className="gap-1"
                >
                  <MicOff className="h-4 w-4" />
                  Stop Recording
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowSignatureDialog(true)}
                    disabled={noteContent.trim() === ''}
                    className="gap-1"
                  >
                    <FileSignature className="h-4 w-4" />
                    Sign & Save
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={!isDirty || noteContent.trim() === ''}
                    className="gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Save Draft
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Signature dialog */}
      {renderSignatureDialog()}
    </div>
  );
}