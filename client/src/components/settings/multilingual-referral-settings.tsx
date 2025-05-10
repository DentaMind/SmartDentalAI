import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Languages,
  FileText, 
  Settings,
  UserPlus,
  Search,
  Plus,
  Edit,
  Trash,
  Phone,
  Mail,
  MapPin,
  Check,
  Save,
  ArrowUpRight,
  FileSpreadsheet,
  Pencil,
  UserCheck,
  ThumbsUp,
  Star,
  Link,
  MessageSquare
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';

// Define types
interface Language {
  code: string;
  name: string;
  active: boolean;
  translationProgress: number;
  autoTranslate: boolean;
}

interface ReferralDoctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  address: string;
  preferredLanguage: string;
  notes: string;
  active: boolean;
  referralsSent: number;
  referralsReceived: number;
  rating: number;
}

interface ReferralTemplate {
  id: string;
  name: string;
  specialty: string;
  content: string;
  language: string;
  lastUsed?: string;
}

interface ReferralTrackingItem {
  id: string;
  patientName: string;
  patientId: string;
  referredTo: string;
  specialty: string;
  date: string;
  status: 'sent' | 'received' | 'completed' | 'cancelled';
  notes?: string;
}

export function MultilingualReferralSettings() {
  const [activeTab, setActiveTab] = useState('languages');
  const [languages, setLanguages] = useState<Language[]>([
    { code: 'en', name: 'English', active: true, translationProgress: 100, autoTranslate: false },
    { code: 'es', name: 'Spanish', active: true, translationProgress: 95, autoTranslate: true },
    { code: 'fr', name: 'French', active: false, translationProgress: 78, autoTranslate: true },
    { code: 'zh', name: 'Chinese', active: true, translationProgress: 85, autoTranslate: true },
    { code: 'vi', name: 'Vietnamese', active: false, translationProgress: 60, autoTranslate: true },
    { code: 'ar', name: 'Arabic', active: false, translationProgress: 50, autoTranslate: true },
    { code: 'ru', name: 'Russian', active: false, translationProgress: 45, autoTranslate: true },
    { code: 'hi', name: 'Hindi', active: false, translationProgress: 30, autoTranslate: true },
  ]);
  
  const [referralDoctors, setReferralDoctors] = useState<ReferralDoctor[]>([
    {
      id: '1',
      name: 'Dr. Emily Chen',
      specialty: 'Orthodontist',
      email: 'emily.chen@example.com',
      phone: '(555) 123-4567',
      address: '123 Medical Way, Suite 200, Anytown, CA 94321',
      preferredLanguage: 'en',
      notes: 'Prefers digital referrals. Available for emergency consults.',
      active: true,
      referralsSent: 42,
      referralsReceived: 15,
      rating: 5
    },
    {
      id: '2',
      name: 'Dr. Michael Rodriguez',
      specialty: 'Oral Surgeon',
      email: 'michael.rodriguez@example.com',
      phone: '(555) 987-6543',
      address: '456 Healthcare Blvd, Anytown, CA 94321',
      preferredLanguage: 'es',
      notes: 'Specializes in complex extractions and implant placement.',
      active: true,
      referralsSent: 28,
      referralsReceived: 36,
      rating: 4
    },
    {
      id: '3',
      name: 'Dr. Sarah Johnson',
      specialty: 'Endodontist',
      email: 'sarah.johnson@example.com',
      phone: '(555) 456-7890',
      address: '789 Dental Street, Suite 300, Anytown, CA 94321',
      preferredLanguage: 'en',
      notes: 'Microscopically enhanced endodontic treatment. Accepts emergency cases.',
      active: true,
      referralsSent: 63,
      referralsReceived: 8,
      rating: 5
    },
    {
      id: '4',
      name: 'Dr. Wei Zhang',
      specialty: 'Periodontist',
      email: 'wei.zhang@example.com',
      phone: '(555) 789-0123',
      address: '321 Floss Avenue, Anytown, CA 94321',
      preferredLanguage: 'zh',
      notes: 'Specializes in implant placement and periodontal surgery.',
      active: true,
      referralsSent: 19,
      referralsReceived: 27,
      rating: 4
    }
  ]);
  
  const [referralTemplates, setReferralTemplates] = useState<ReferralTemplate[]>([
    {
      id: '1',
      name: 'Orthodontic Consultation',
      specialty: 'Orthodontist',
      content: 'Dear Dr. {{PROVIDER_NAME}},\n\nI am referring {{PATIENT_NAME}}, DOB: {{PATIENT_DOB}}, for orthodontic consultation. The patient presents with {{CONDITION}}.\n\nRelevant records attached include:\n- {{ATTACHMENTS}}\n\nPlease evaluate and advise on treatment options. Thank you for your expertise.\n\nSincerely,\nDr. {{CURRENT_PROVIDER}}',
      language: 'en',
      lastUsed: '2025-03-01'
    },
    {
      id: '2',
      name: 'Surgical Extraction',
      specialty: 'Oral Surgeon',
      content: 'Dear Dr. {{PROVIDER_NAME}},\n\nI am referring {{PATIENT_NAME}}, DOB: {{PATIENT_DOB}}, for evaluation and possible extraction of {{TOOTH_NUMBERS}}.\n\nClinical findings: {{CLINICAL_FINDINGS}}\n\nRadiographic findings: {{RADIOGRAPHIC_FINDINGS}}\n\nPlease contact me if you need any additional information.\n\nSincerely,\nDr. {{CURRENT_PROVIDER}}',
      language: 'en',
      lastUsed: '2025-02-15'
    },
    {
      id: '3',
      name: 'Consulta Ortodóncica',
      specialty: 'Orthodontist',
      content: 'Estimado/a Dr. {{PROVIDER_NAME}},\n\nLe refiero a {{PATIENT_NAME}}, fecha de nacimiento: {{PATIENT_DOB}}, para consulta ortodóncica. El/la paciente presenta {{CONDITION}}.\n\nLos registros relevantes adjuntos incluyen:\n- {{ATTACHMENTS}}\n\nPor favor, evalúe y asesore sobre las opciones de tratamiento. Gracias por su experiencia.\n\nAtentamente,\nDr. {{CURRENT_PROVIDER}}',
      language: 'es'
    },
    {
      id: '4',
      name: 'Root Canal Treatment',
      specialty: 'Endodontist',
      content: 'Dear Dr. {{PROVIDER_NAME}},\n\nI am referring {{PATIENT_NAME}}, DOB: {{PATIENT_DOB}}, for evaluation and endodontic treatment of tooth #{{TOOTH_NUMBER}}.\n\nDiagnosis: {{DIAGNOSIS}}\n\nSymptoms: {{SYMPTOMS}}\n\nTesting results: {{TESTING_RESULTS}}\n\nThank you for seeing this patient.\n\nSincerely,\nDr. {{CURRENT_PROVIDER}}',
      language: 'en',
      lastUsed: '2025-03-10'
    }
  ]);
  
  const [referralTracking, setReferralTracking] = useState<ReferralTrackingItem[]>([
    {
      id: '1',
      patientName: 'John Smith',
      patientId: 'P10023',
      referredTo: 'Dr. Emily Chen',
      specialty: 'Orthodontist',
      date: '2025-03-05',
      status: 'completed',
      notes: 'Patient scheduled for braces placement next month.'
    },
    {
      id: '2',
      patientName: 'Maria Garcia',
      patientId: 'P10045',
      referredTo: 'Dr. Michael Rodriguez',
      specialty: 'Oral Surgeon',
      date: '2025-03-08',
      status: 'sent',
      notes: 'Wisdom teeth extraction referral.'
    },
    {
      id: '3',
      patientName: 'David Johnson',
      patientId: 'P10067',
      referredTo: 'Dr. Sarah Johnson',
      specialty: 'Endodontist',
      date: '2025-03-10',
      status: 'received',
      notes: 'Root canal treatment for tooth #30.'
    },
    {
      id: '4',
      patientName: 'Linda Chen',
      patientId: 'P10089',
      referredTo: 'Dr. Wei Zhang',
      specialty: 'Periodontist',
      date: '2025-03-12',
      status: 'completed',
      notes: 'Gum grafting procedure completed successfully.'
    },
    {
      id: '5',
      patientName: 'Robert Wilson',
      patientId: 'P10092',
      referredTo: 'Dr. Emily Chen',
      specialty: 'Orthodontist',
      date: '2025-03-14',
      status: 'sent',
      notes: 'Clear aligner consultation.'
    }
  ]);
  
  const [newLanguage, setNewLanguage] = useState({ code: '', name: '' });
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [isAddReferralDoctorOpen, setIsAddReferralDoctorOpen] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [newReferralDoctor, setNewReferralDoctor] = useState<Partial<ReferralDoctor>>({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    address: '',
    preferredLanguage: 'en',
    notes: '',
    active: true
  });
  const [newTemplate, setNewTemplate] = useState<Partial<ReferralTemplate>>({
    name: '',
    specialty: '',
    content: '',
    language: 'en'
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Available languages for adding
  const availableLanguages = [
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'th', name: 'Thai' },
    { code: 'uk', name: 'Ukrainian' }
  ];
  
  // Handle adding a new language
  const handleAddLanguage = () => {
    if (!newLanguage.code || !newLanguage.name) {
      toast({
        title: "Missing information",
        description: "Please select a language to add.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if language already exists
    if (languages.some(lang => lang.code === newLanguage.code)) {
      toast({
        title: "Language already exists",
        description: `${newLanguage.name} is already in your language list.`,
        variant: "destructive"
      });
      return;
    }
    
    const updatedLanguages = [
      ...languages,
      {
        code: newLanguage.code,
        name: newLanguage.name,
        active: true,
        translationProgress: 0,
        autoTranslate: true
      }
    ];
    
    setLanguages(updatedLanguages);
    setNewLanguage({ code: '', name: '' });
    setIsAddLanguageOpen(false);
    
    toast({
      title: "Language added",
      description: `${newLanguage.name} has been added to your supported languages.`,
      variant: "default"
    });
  };
  
  // Handle adding a new referral doctor
  const handleAddReferralDoctor = () => {
    if (!newReferralDoctor.name || !newReferralDoctor.specialty || !newReferralDoctor.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const newDoctor: ReferralDoctor = {
      id: `${referralDoctors.length + 1}`,
      name: newReferralDoctor.name || '',
      specialty: newReferralDoctor.specialty || '',
      email: newReferralDoctor.email || '',
      phone: newReferralDoctor.phone || '',
      address: newReferralDoctor.address || '',
      preferredLanguage: newReferralDoctor.preferredLanguage || 'en',
      notes: newReferralDoctor.notes || '',
      active: true,
      referralsSent: 0,
      referralsReceived: 0,
      rating: 0
    };
    
    setReferralDoctors([...referralDoctors, newDoctor]);
    setNewReferralDoctor({
      name: '',
      specialty: '',
      email: '',
      phone: '',
      address: '',
      preferredLanguage: 'en',
      notes: '',
      active: true
    });
    setIsAddReferralDoctorOpen(false);
    
    toast({
      title: "Referral doctor added",
      description: `${newDoctor.name} has been added to your referral network.`,
      variant: "default"
    });
  };
  
  // Handle adding a new template
  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.specialty || !newTemplate.content) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const newTempl: ReferralTemplate = {
      id: `${referralTemplates.length + 1}`,
      name: newTemplate.name || '',
      specialty: newTemplate.specialty || '',
      content: newTemplate.content || '',
      language: newTemplate.language || 'en'
    };
    
    setReferralTemplates([...referralTemplates, newTempl]);
    setNewTemplate({
      name: '',
      specialty: '',
      content: '',
      language: 'en'
    });
    setIsAddTemplateOpen(false);
    
    toast({
      title: "Template added",
      description: `${newTempl.name} template has been created.`,
      variant: "default"
    });
  };
  
  // Handle updating a language's active state
  const handleLanguageToggle = (code: string, active: boolean) => {
    const updatedLanguages = languages.map(lang => 
      lang.code === code ? { ...lang, active } : lang
    );
    setLanguages(updatedLanguages);
    
    toast({
      title: active ? "Language activated" : "Language deactivated",
      description: `${languages.find(l => l.code === code)?.name} is now ${active ? 'active' : 'inactive'}.`,
      variant: "default"
    });
  };
  
  // Handle updating a language's auto-translate state
  const handleAutoTranslateToggle = (code: string, autoTranslate: boolean) => {
    const updatedLanguages = languages.map(lang => 
      lang.code === code ? { ...lang, autoTranslate } : lang
    );
    setLanguages(updatedLanguages);
  };
  
  // Handle deleting a referral doctor
  const handleDeleteReferralDoctor = (id: string) => {
    const updatedDoctors = referralDoctors.filter(doctor => doctor.id !== id);
    setReferralDoctors(updatedDoctors);
    
    toast({
      title: "Referral doctor removed",
      description: "The referral doctor has been removed from your network.",
      variant: "default"
    });
  };
  
  // Get selected template
  const getSelectedTemplate = () => {
    return referralTemplates.find(template => template.id === selectedTemplateId);
  };
  
  // Generate flag emoji for language code
  const getLanguageFlag = (code: string): string => {
    const flagEmojis: Record<string, string> = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ru': '🇷🇺',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
      'vi': '🇻🇳',
      'th': '🇹🇭',
      'uk': '🇺🇦',
      'tl': '🇵🇭'
    };

    return flagEmojis[code] || '🌐';
  };
  
  // Get language name by code
  const getLanguageName = (code: string): string => {
    const language = languages.find(lang => lang.code === code);
    return language ? language.name : code;
  };
  
  // Function to translate content to different languages
  const translateContent = (content: string, targetLanguage: string) => {
    if (targetLanguage === 'en') return content;
    
    // This is a placeholder. In a real application, 
    // this would call a translation API service.
    toast({
      title: "Translation requested",
      description: `Content would be translated to ${getLanguageName(targetLanguage)} in a real environment.`,
      variant: "default"
    });
    
    return content;
  };
  
  // Handle saving language preferences globally
  const handleSaveLanguagePreferences = () => {
    toast({
      title: "Languages updated",
      description: "Your language preferences have been saved successfully.",
      variant: "default"
    });
  };
  
  // Status badge component to display referral status
  const StatusBadge = ({ status }: { status: string }) => {
    let className = '';
    switch (status) {
      case 'sent':
        className = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'received':
        className = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'completed':
        className = 'bg-green-50 text-green-700 border-green-200';
        break;
      case 'cancelled':
        className = 'bg-red-50 text-red-700 border-red-200';
        break;
      default:
        className = 'bg-gray-50 text-gray-700 border-gray-200';
    }
    
    return <Badge className={className}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Communication Settings</h2>
          <p className="text-muted-foreground">
            Manage multilingual support and referral network
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="languages">
            <Globe className="h-4 w-4 mr-2" />
            Languages
          </TabsTrigger>
          <TabsTrigger value="referral-network">
            <UserPlus className="h-4 w-4 mr-2" />
            Referral Network
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="languages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Supported Languages</h3>
            
            <Dialog open={isAddLanguageOpen} onOpenChange={setIsAddLanguageOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Language
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Language</DialogTitle>
                  <DialogDescription>
                    Add a new language to your supported languages list.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="language-select">Select Language</Label>
                    <Select 
                      value={newLanguage.code}
                      onValueChange={(code) => {
                        const selectedLang = availableLanguages.find(lang => lang.code === code);
                        if (selectedLang) {
                          setNewLanguage({ code, name: selectedLang.name });
                        }
                      }}
                    >
                      <SelectTrigger id="language-select">
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {getLanguageFlag(lang.code)} {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-translate" defaultChecked />
                      <label
                        htmlFor="auto-translate"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enable auto-translation
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically translate content using AI for this language
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddLanguageOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLanguage}>
                    Add Language
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Translation</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {languages.map(language => (
                    <TableRow key={language.code}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl" aria-hidden="true">
                            {getLanguageFlag(language.code)}
                          </span>
                          <span className="font-medium">{language.name}</span>
                          {language.code === 'en' && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={language.active}
                            onCheckedChange={(checked) => handleLanguageToggle(language.code, checked)}
                            disabled={language.code === 'en'}
                          />
                          <span>{language.active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={language.autoTranslate}
                            onCheckedChange={(checked) => handleAutoTranslateToggle(language.code, checked)}
                            disabled={language.code === 'en'}
                          />
                          <span>{language.autoTranslate ? 'Auto' : 'Manual'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-xs">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${language.translationProgress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs whitespace-nowrap">{language.translationProgress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          {language.code !== 'en' && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Translations</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient-Facing Content</CardTitle>
                <CardDescription>Configure multilingual content for patients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Patient Portal</Label>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      3 languages active
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {languages
                      .filter(l => l.active)
                      .map(language => (
                        <Badge 
                          key={language.code} 
                          variant="outline"
                          className="flex items-center"
                        >
                          <span className="mr-1">{getLanguageFlag(language.code)}</span>
                          {language.name}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Appointment Reminders</Label>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      3 languages active
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {languages
                      .filter(l => l.active)
                      .map(language => (
                        <Badge 
                          key={language.code} 
                          variant="outline"
                          className="flex items-center"
                        >
                          <span className="mr-1">{getLanguageFlag(language.code)}</span>
                          {language.name}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Treatment Plans</Label>
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                      2 languages active
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {languages
                      .filter(l => l.active && ['en', 'es'].includes(l.code))
                      .map(language => (
                        <Badge 
                          key={language.code} 
                          variant="outline"
                          className="flex items-center"
                        >
                          <span className="mr-1">{getLanguageFlag(language.code)}</span>
                          {language.name}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Educational Materials</Label>
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                      1 language active
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {languages
                      .filter(l => l.active && ['en'].includes(l.code))
                      .map(language => (
                        <Badge 
                          key={language.code} 
                          variant="outline"
                          className="flex items-center"
                        >
                          <span className="mr-1">{getLanguageFlag(language.code)}</span>
                          {language.name}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveLanguagePreferences} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Update Language Settings
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Global Preferences</CardTitle>
                <CardDescription>Configure default language settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="default-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(language => (
                        <SelectItem key={language.code} value={language.code}>
                          <span className="flex items-center">
                            <span className="mr-2">{getLanguageFlag(language.code)}</span>
                            {language.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language-detection">Language Detection</Label>
                  <Select defaultValue="browser">
                    <SelectTrigger id="language-detection">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">Browser Language</SelectItem>
                      <SelectItem value="patient">Patient Preference</SelectItem>
                      <SelectItem value="geo">Geo-Location</SelectItem>
                      <SelectItem value="none">No Auto-Detection</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How to determine user's preferred language automatically
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="language-switch" defaultChecked />
                    <label
                      htmlFor="language-switch"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show language switcher to patients
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Display language selector in patient portal
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="translate-ai" defaultChecked />
                    <label
                      htmlFor="translate-ai"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Use AI for translation
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically translate content using AI for missing translations
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="prefer-patient" defaultChecked />
                    <label
                      htmlFor="prefer-patient"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Honor patient language preference
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Override default settings with patient's recorded preference
                  </p>
                </div>
                
                <div className="pt-4">
                  <div className="p-3 border rounded-md bg-amber-50 border-amber-200">
                    <div className="flex gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <Globe className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-amber-800">Language Coverage</h4>
                        <p className="text-xs text-amber-700">
                          Your practice currently supports 3 active languages, covering approximately 75% of your patient 
                          population based on recorded preferences.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="referral-network" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Referral Network</h3>
            
            <Dialog open={isAddReferralDoctorOpen} onOpenChange={setIsAddReferralDoctorOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Referral Doctor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[540px]">
                <DialogHeader>
                  <DialogTitle>Add Referral Doctor</DialogTitle>
                  <DialogDescription>
                    Add a new doctor to your referral network
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="doctor-name">Doctor Name *</Label>
                      <Input 
                        id="doctor-name" 
                        placeholder="Dr. John Smith"
                        value={newReferralDoctor.name}
                        onChange={(e) => setNewReferralDoctor({ ...newReferralDoctor, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="specialty">Specialty *</Label>
                      <Select
                        value={newReferralDoctor.specialty}
                        onValueChange={(value) => setNewReferralDoctor({ ...newReferralDoctor, specialty: value })}
                      >
                        <SelectTrigger id="specialty">
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Orthodontist">Orthodontist</SelectItem>
                          <SelectItem value="Oral Surgeon">Oral Surgeon</SelectItem>
                          <SelectItem value="Endodontist">Endodontist</SelectItem>
                          <SelectItem value="Periodontist">Periodontist</SelectItem>
                          <SelectItem value="Pediatric Dentist">Pediatric Dentist</SelectItem>
                          <SelectItem value="Prosthodontist">Prosthodontist</SelectItem>
                          <SelectItem value="Oral Pathologist">Oral Pathologist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="doctor@example.com"
                      value={newReferralDoctor.email}
                      onChange={(e) => setNewReferralDoctor({ ...newReferralDoctor, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        placeholder="(555) 123-4567"
                        value={newReferralDoctor.phone}
                        onChange={(e) => setNewReferralDoctor({ ...newReferralDoctor, phone: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="language">Preferred Language</Label>
                      <Select
                        value={newReferralDoctor.preferredLanguage}
                        onValueChange={(value) => setNewReferralDoctor({ ...newReferralDoctor, preferredLanguage: value })}
                      >
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map(language => (
                            <SelectItem key={language.code} value={language.code}>
                              <span className="flex items-center">
                                <span className="mr-2">{getLanguageFlag(language.code)}</span>
                                {language.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      placeholder="123 Medical Center Dr, Suite 100"
                      value={newReferralDoctor.address}
                      onChange={(e) => setNewReferralDoctor({ ...newReferralDoctor, address: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Special considerations, referral preferences, etc."
                      value={newReferralDoctor.notes}
                      onChange={(e) => setNewReferralDoctor({ ...newReferralDoctor, notes: e.target.value })}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddReferralDoctorOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddReferralDoctor}>
                    Add to Network
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralDoctors.map(doctor => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div className="font-medium">{doctor.name}</div>
                      </TableCell>
                      <TableCell>{doctor.specialty}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{doctor.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{doctor.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{getLanguageFlag(doctor.preferredLanguage)}</span>
                          <span>{getLanguageName(doctor.preferredLanguage)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Sent:</span>
                            <span className="font-medium">{doctor.referralsSent}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Received:</span>
                            <span className="font-medium">{doctor.referralsReceived}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit Referral Doctor</DialogTitle>
                              <DialogDescription>
                                Update information for {doctor.name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-4">
                              <p className="text-center text-muted-foreground">
                                Edit form would appear here in a real implementation
                              </p>
                            </div>
                            
                            <DialogFooter>
                              <Button variant="outline">Cancel</Button>
                              <Button>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReferralDoctor(doctor.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Referral Tracking</CardTitle>
                <CardDescription>
                  Track the status of patient referrals
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Referred To</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralTracking.map(referral => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-medium">{referral.patientName}</TableCell>
                        <TableCell>
                          <div>
                            <div>{referral.referredTo}</div>
                            <div className="text-xs text-muted-foreground">{referral.specialty}</div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(referral.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <StatusBadge status={referral.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Send Message</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Update Status</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Referral Analytics</CardTitle>
                <CardDescription>
                  Performance metrics for referrals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Referrals Sent (30 days)</Label>
                    <span className="text-xl font-bold">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Referrals Received (30 days)</Label>
                    <span className="text-xl font-bold">18</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Top Referral Specialties</Label>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Orthodontist</span>
                        <span>42%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "42%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Oral Surgeon</span>
                        <span>28%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "28%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Endodontist</span>
                        <span>18%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "18%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="pt-2">
                  <Button variant="outline" className="w-full">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Referral Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Referral Templates</h3>
            
            <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                  <DialogTitle>Create Referral Template</DialogTitle>
                  <DialogDescription>
                    Create a new template for sending referrals
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="template-name">Template Name *</Label>
                      <Input 
                        id="template-name" 
                        placeholder="e.g., Orthodontic Consultation"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="template-specialty">Specialty *</Label>
                      <Select
                        value={newTemplate.specialty}
                        onValueChange={(value) => setNewTemplate({...newTemplate, specialty: value})}
                      >
                        <SelectTrigger id="template-specialty">
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Orthodontist">Orthodontist</SelectItem>
                          <SelectItem value="Oral Surgeon">Oral Surgeon</SelectItem>
                          <SelectItem value="Endodontist">Endodontist</SelectItem>
                          <SelectItem value="Periodontist">Periodontist</SelectItem>
                          <SelectItem value="Pediatric Dentist">Pediatric Dentist</SelectItem>
                          <SelectItem value="Prosthodontist">Prosthodontist</SelectItem>
                          <SelectItem value="Oral Pathologist">Oral Pathologist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="template-language">Language</Label>
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={newTemplate.language}
                          onValueChange={(value) => setNewTemplate({...newTemplate, language: value})}
                        >
                          <SelectTrigger id="template-language" className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages
                              .filter(l => l.active)
                              .map(language => (
                                <SelectItem key={language.code} value={language.code}>
                                  <span className="flex items-center">
                                    <span className="mr-2">{getLanguageFlag(language.code)}</span>
                                    {language.name}
                                  </span>
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label htmlFor="template-content">Template Content *</Label>
                      <div className="text-xs text-muted-foreground">
                        Use {'{{VARIABLE}}'} for dynamic content
                      </div>
                    </div>
                    <Textarea 
                      id="template-content" 
                      rows={12}
                      placeholder="Dear Dr. {{PROVIDER_NAME}},

I am referring {{PATIENT_NAME}}, DOB: {{PATIENT_DOB}}, for evaluation.

Clinical findings:
{{CLINICAL_FINDINGS}}

Thank you for your expertise.

Sincerely,
Dr. {{CURRENT_PROVIDER}}"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                    />
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Available Variables</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <Badge variant="outline">{"{{PROVIDER_NAME}}"}</Badge>
                      <Badge variant="outline">{"{{PATIENT_NAME}}"}</Badge>
                      <Badge variant="outline">{"{{PATIENT_DOB}}"}</Badge>
                      <Badge variant="outline">{"{{CURRENT_PROVIDER}}"}</Badge>
                      <Badge variant="outline">{"{{CLINICAL_FINDINGS}}"}</Badge>
                      <Badge variant="outline">{"{{TOOTH_NUMBERS}}"}</Badge>
                      <Badge variant="outline">{"{{ATTACHMENTS}}"}</Badge>
                      <Badge variant="outline">{"{{CONDITION}}"}</Badge>
                      <Badge variant="outline">{"{{RADIOGRAPHIC_FINDINGS}}"}</Badge>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddTemplateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTemplate}>
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Template Library</CardTitle>
                  <CardDescription>
                    Select a template to view or edit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {referralTemplates.map(template => (
                    <div 
                      key={template.id}
                      className={`
                        flex justify-between items-center p-3 rounded-md cursor-pointer hover:bg-muted
                        ${selectedTemplateId === template.id ? 'bg-muted' : ''}
                      `}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>{template.specialty}</span>
                          <span className="mx-1">•</span>
                          <span className="flex items-center">
                            {getLanguageFlag(template.language)}
                            <span className="ml-1">{getLanguageName(template.language)}</span>
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                  <Button variant="outline" onClick={() => setIsAddTemplateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Template Analytics</CardTitle>
                  <CardDescription>
                    Usage statistics for templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Orthodontic Consultation</span>
                        <span>42%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "42%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Surgical Extraction</span>
                        <span>28%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "28%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Root Canal Treatment</span>
                        <span>18%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "18%" }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              {selectedTemplateId ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{getSelectedTemplate()?.name}</CardTitle>
                        <CardDescription>
                          {getSelectedTemplate()?.specialty} • 
                          <span className="ml-1 flex items-center inline-flex">
                            {getLanguageFlag(getSelectedTemplate()?.language || 'en')}
                            <span className="ml-1">{getLanguageName(getSelectedTemplate()?.language || 'en')}</span>
                          </span>
                        </CardDescription>
                      </div>
                      
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Languages className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Translate Template</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-md bg-muted/30 whitespace-pre-line">
                        {getSelectedTemplate()?.content}
                      </div>
                      
                      {getSelectedTemplate()?.language !== 'en' && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">English Version</h4>
                          <div className="p-4 border rounded-md bg-muted/30 whitespace-pre-line">
                            {/* This would be the English version in a real implementation */}
                            Dear Dr. {"{{PROVIDER_NAME}}"},

                            I am referring {"{{PATIENT_NAME}}"}, DOB: {"{{PATIENT_DOB}}"}, for evaluation.

                            Clinical findings:
                            {"{{CLINICAL_FINDINGS}}"}

                            Thank you for your expertise.

                            Sincerely,
                            Dr. {"{{CURRENT_PROVIDER}}"}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <Button>
                          <Pencil className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                        <Button variant="outline">
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Preview with Patient Data
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Select a Template</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a template from the library to view or edit
                    </p>
                    <Button variant="outline" onClick={() => setIsAddTemplateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Template
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}