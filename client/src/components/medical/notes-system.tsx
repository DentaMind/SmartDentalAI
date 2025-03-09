import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Pencil, FileSignature, FileText, Plus, Search, Lock, Edit, ChevronDown, ChevronRight, Microphone } from 'lucide-react';

// Types for medical notes
export interface MedicalNote {
  id?: number;
  patientId: number;
  doctorId: number;
  content: string;
  category: 'general' | 'periodontal' | 'endodontic' | 'orthodontic' | 'restorative' | 'surgical' | 'prosthodontic' | 'pediatric' | null;
  createdAt: Date;
  updatedAt: Date;
  signedAt: Date | null;
  signedBy: number | null;
  signedByName: string | null;
  attachments: string[] | null;
  visibility: 'private' | 'team' | 'patient';
  tags: string[] | null;
  followUpRequired: boolean;
  followUpDate: Date | null;
  aiAnalysis: Record<string, any> | null;
  treatmentPlanId: number | null;
  medicationRecommendations: string[] | null;
  contraindicationDetected: boolean;
  contraindicationDetails: string | null;
}

// Schema for form validation
const medicalNoteSchema = z.object({
  content: z.string().min(1, { message: "Note content is required" }),
  category: z.enum(['general', 'periodontal', 'endodontic', 'orthodontic', 'restorative', 'surgical', 'prosthodontic', 'pediatric']),
  visibility: z.enum(['private', 'team', 'patient']).default('team'),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  medicationRecommendations: z.array(z.string()).optional(),
});

// Category options for the dropdown
const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'periodontal', label: 'Periodontal' },
  { value: 'endodontic', label: 'Endodontic' },
  { value: 'orthodontic', label: 'Orthodontic' },
  { value: 'restorative', label: 'Restorative' },
  { value: 'surgical', label: 'Surgical' },
  { value: 'prosthodontic', label: 'Prosthodontic' },
  { value: 'pediatric', label: 'Pediatric' },
];

// Common medical note templates
const noteTemplates = {
  periodontal: `Patient presents with signs of periodontal disease. Observed bleeding upon probing in quadrants 1 and 2. Probing depths range from 3-5mm. Recommended scaling and root planing.

Treatment plan: 
- Full mouth debridement
- Re-evaluation in 4-6 weeks
- Maintenance plan with 3-month recall

Home care instructions:
- Electric toothbrush recommended
- Daily flossing
- Antimicrobial rinse twice daily`,

  restorative: `Examination reveals dental caries on tooth #30 (occlusal surface). Tooth is tender to percussion. Radiographs show carious lesion approaching pulp.

Treatment plan:
- Composite restoration for tooth #30
- Consider possible need for endodontic treatment if symptoms persist

Post-operative instructions:
- Avoid chewing on treated side for 24 hours
- Sensitivity may occur and should subside within 1-2 weeks
- Return if persistent pain occurs`,

  general: `Routine examination completed. Patient reports no specific concerns. Oral hygiene status is satisfactory.

Recommendations:
- Continue current oral hygiene regimen
- Regular 6-month recall appointment
- Fluoride treatment completed today`,
};

// Voice recognition templates for mock implementation
const voiceRecognitionTemplates = [
  "Patient reports mild pain in lower right quadrant. Visual examination reveals inflammation around tooth #30. Percussion test positive. Radiograph shows periapical radiolucency. Diagnosis: acute periapical periodontitis. Treatment plan: root canal therapy on tooth #30.",
  "New patient examination completed. Moderate generalized gingivitis present. No caries detected. Full mouth series radiographs taken and reviewed. Recommended professional cleaning and improved home care techniques.",
  "Follow-up for recent extraction of tooth #8. Healing is progressing as expected. No signs of infection. Discussed restorative options including implant, fixed bridge, and removable partial denture. Patient leaning toward implant option.",
];

// Component for managing medical notes
const NotesSystem: React.FC<{
  patientId: number;
  doctorId: number;
  doctorName: string;
  defaultCategory?: string;
  onNoteAdded?: (note: MedicalNote) => void;
}> = ({ 
  patientId, 
  doctorId, 
  doctorName, 
  defaultCategory = 'general',
  onNoteAdded
}) => {
  // State for UI management
  const [selectedTab, setSelectedTab] = useState<string>('view');
  const [currentTemplate, setCurrentTemplate] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [editNoteId, setEditNoteId] = useState<number | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [noteToSign, setNoteToSign] = useState<MedicalNote | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [voiceToTextResult, setVoiceToTextResult] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Setup form with validation
  const form = useForm<z.infer<typeof medicalNoteSchema>>({
    resolver: zodResolver(medicalNoteSchema),
    defaultValues: {
      content: '',
      category: defaultCategory as any,
      visibility: 'team',
      followUpRequired: false,
      followUpDate: '',
      tags: [],
      medicationRecommendations: [],
    },
  });

  // Query to fetch medical notes
  const { data: notes, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/medical-notes`],
    queryFn: async () => await apiRequest<MedicalNote[]>(`/api/patients/${patientId}/medical-notes`),
  });

  // Mutation to add a new medical note
  const addNoteMutation = useMutation({
    mutationFn: async (data: Partial<MedicalNote>) => {
      return await apiRequest<MedicalNote>(`/api/patients/${patientId}/medical-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medical-notes`] });
      toast({
        title: 'Note added',
        description: 'Medical note has been successfully added.',
      });
      if (onNoteAdded) {
        onNoteAdded(data);
      }
      form.reset({
        content: '',
        category: defaultCategory as any,
        visibility: 'team',
        followUpRequired: false,
        followUpDate: '',
        tags: [],
        medicationRecommendations: [],
      });
      setSelectedTab('view');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error adding note',
        description: 'There was an error adding the medical note. Please try again.',
      });
      console.error('Error adding medical note:', error);
    },
  });

  // Mutation to update a medical note
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<MedicalNote> }) => {
      return await apiRequest<MedicalNote>(`/api/patients/${patientId}/medical-notes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medical-notes`] });
      toast({
        title: 'Note updated',
        description: 'Medical note has been successfully updated.',
      });
      setEditNoteId(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error updating note',
        description: 'There was an error updating the medical note. Please try again.',
      });
      console.error('Error updating medical note:', error);
    },
  });

  // Mutation to sign a medical note
  const signNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest<MedicalNote>(`/api/patients/${patientId}/medical-notes/${id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doctorId, doctorName }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medical-notes`] });
      toast({
        title: 'Note signed',
        description: 'Medical note has been successfully signed and locked.',
      });
      setSignDialogOpen(false);
      setNoteToSign(null);
      setConfirmationText('');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error signing note',
        description: 'There was an error signing the medical note. Please try again.',
      });
      console.error('Error signing medical note:', error);
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof medicalNoteSchema>) => {
    // Convert follow-up date to proper format if it exists
    const followUpDate = values.followUpRequired && values.followUpDate
      ? new Date(values.followUpDate).toISOString()
      : null;
    
    // Prepare data for API call
    const noteData: Partial<MedicalNote> = {
      patientId,
      doctorId,
      content: values.content,
      category: values.category,
      visibility: values.visibility,
      followUpRequired: values.followUpRequired,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      tags: values.tags?.length ? values.tags : null,
      medicationRecommendations: values.medicationRecommendations?.length ? values.medicationRecommendations : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      signedAt: null,
      signedBy: null,
      signedByName: null,
      attachments: null,
      aiAnalysis: null,
      treatmentPlanId: null,
      contraindicationDetected: false,
      contraindicationDetails: null,
    };
    
    // If editing, update note; otherwise add new note
    if (editNoteId) {
      updateNoteMutation.mutate({ id: editNoteId, data: noteData });
    } else {
      addNoteMutation.mutate(noteData);
    }
  };

  // Handle template selection
  const handleTemplateChange = (templateKey: string) => {
    setCurrentTemplate(templateKey);
    const templateContent = noteTemplates[templateKey as keyof typeof noteTemplates] || '';
    form.setValue('content', templateContent);
    
    // Also set the category based on template
    if (templateKey === 'periodontal') {
      form.setValue('category', 'periodontal');
    } else if (templateKey === 'restorative') {
      form.setValue('category', 'restorative');
    } else {
      form.setValue('category', 'general');
    }
  };

  // Handle voice recognition
  const handleVoiceRecognition = () => {
    setIsListening(true);
    
    // Simulate voice recognition with a random template (in a real app, this would use the Web Speech API)
    const randomIndex = Math.floor(Math.random() * voiceRecognitionTemplates.length);
    const recognizedText = voiceRecognitionTemplates[randomIndex];
    
    // Simulate processing delay
    setTimeout(() => {
      setVoiceToTextResult(recognizedText);
      form.setValue('content', recognizedText);
      setIsListening(false);
      
      toast({
        title: 'Voice transcription complete',
        description: 'Your dictation has been successfully transcribed.',
      });
    }, 2000);
  };

  // Handle note editing
  const handleEditNote = (note: MedicalNote) => {
    // Can't edit signed notes
    if (note.signedAt) {
      toast({
        variant: 'destructive',
        title: 'Cannot edit signed note',
        description: 'This note has been signed and cannot be modified.',
      });
      return;
    }
    
    setEditNoteId(note.id || null);
    form.reset({
      content: note.content,
      category: note.category || 'general',
      visibility: note.visibility || 'team',
      followUpRequired: note.followUpRequired || false,
      followUpDate: note.followUpDate ? new Date(note.followUpDate).toISOString().split('T')[0] : '',
      tags: note.tags || [],
      medicationRecommendations: note.medicationRecommendations || [],
    });
    setSelectedTab('create');
  };

  // Handle note signing
  const handleSignNote = (note: MedicalNote) => {
    setNoteToSign(note);
    setSignDialogOpen(true);
  };

  // Confirm note signing
  const confirmSignNote = () => {
    if (noteToSign && confirmationText === 'sign') {
      signNoteMutation.mutate(noteToSign.id as number);
    } else {
      toast({
        variant: 'destructive',
        title: 'Confirmation failed',
        description: 'Please type "sign" to confirm.',
      });
    }
  };

  // Toggle note expansion in the list view
  const toggleNoteExpansion = (noteId: number) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  // Filter notes based on category and search query
  const filteredNotes = notes?.filter(note => {
    const matchesCategory = filterCategory === 'all' || note.category === filterCategory;
    const matchesSearch = searchQuery === '' || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    return matchesCategory && matchesSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Medical Notes</CardTitle>
          <CardDescription>
            Manage patient medical notes and documentation
          </CardDescription>
        </CardHeader>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <CardContent>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="view">
                <FileText className="h-4 w-4 mr-2" />
                View Notes
              </TabsTrigger>
              <TabsTrigger value="create">
                <Plus className="h-4 w-4 mr-2" />
                {editNoteId ? 'Edit Note' : 'Add Note'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="view" className="space-y-4">
              <div className="flex justify-between mb-4">
                <div className="flex space-x-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search notes..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button onClick={() => { setSelectedTab('create'); setEditNoteId(null); form.reset(); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add New Note
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotes && filteredNotes.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotes.map((note) => (
                    <Card key={note.id} className={`overflow-hidden ${note.contraindicationDetected ? 'border-red-300' : ''}`}>
                      <div className="border-l-4 pl-4 py-4 pr-6 flex justify-between items-start" style={{ borderLeftColor: note.contraindicationDetected ? '#f87171' : '#e2e8f0' }}>
                        <div className="flex-grow">
                          <div className="flex items-center mb-2">
                            <button 
                              onClick={() => toggleNoteExpansion(note.id as number)}
                              className="mr-2 text-gray-500 hover:text-gray-700"
                            >
                              {expandedNotes.has(note.id as number) ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </button>
                            <div className="text-base font-medium">
                              {note.category && note.category.charAt(0).toUpperCase() + note.category.slice(1)} Note
                            </div>
                            <div className="ml-3 text-sm text-gray-500">
                              {formatDate(note.createdAt)}
                            </div>
                            {note.signedAt && (
                              <Badge variant="outline" className="ml-3 flex items-center text-green-600 border-green-200 bg-green-50">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Signed
                              </Badge>
                            )}
                            {note.contraindicationDetected && (
                              <Badge variant="destructive" className="ml-3">
                                <AlertTriangle className="mr-1 h-3 w-3" /> Contraindication
                              </Badge>
                            )}
                            {note.followUpRequired && (
                              <Badge variant="outline" className="ml-3 flex items-center text-amber-600 border-amber-200 bg-amber-50">
                                Follow-up: {formatDate(note.followUpDate as Date)}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Preview of note content, limited to first 100 characters if not expanded */}
                          <div className="text-sm">
                            {expandedNotes.has(note.id as number) 
                              ? note.content 
                              : `${note.content.slice(0, 100)}${note.content.length > 100 ? '...' : ''}`}
                          </div>
                          
                          {/* Show additional information when expanded */}
                          {expandedNotes.has(note.id as number) && (
                            <div className="mt-4 space-y-3">
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {note.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {note.medicationRecommendations && note.medicationRecommendations.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium">Medication Recommendations:</div>
                                  <ul className="list-disc list-inside text-sm ml-2">
                                    {note.medicationRecommendations.map((med, index) => (
                                      <li key={index}>{med}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {note.contraindicationDetected && note.contraindicationDetails && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-md">
                                  <div className="text-sm font-medium text-red-700 flex items-center">
                                    <AlertTriangle className="h-4 w-4 mr-1" /> Contraindication Detected:
                                  </div>
                                  <div className="text-sm text-red-600 ml-5">
                                    {note.contraindicationDetails}
                                  </div>
                                </div>
                              )}
                              
                              {note.signedAt && (
                                <div className="mt-2 text-sm text-gray-500">
                                  Signed by {note.signedByName} on {formatDate(note.signedAt)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {!note.signedAt && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditNote(note)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {!note.signedAt && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSignNote(note)}
                            >
                              <FileSignature className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md bg-gray-50">
                  <FileText className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No notes found</h3>
                  <p className="text-gray-500 mb-4">
                    {filterCategory !== 'all' || searchQuery !== '' 
                      ? 'No notes match your current filters.' 
                      : 'There are no medical notes for this patient yet.'}
                  </p>
                  <Button onClick={() => setSelectedTab('create')}>
                    <Plus className="h-4 w-4 mr-2" /> Add First Note
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="create">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoryOptions.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select visibility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="private">Private (Provider Only)</SelectItem>
                              <SelectItem value="team">Team (All Providers)</SelectItem>
                              <SelectItem value="patient">Patient Visible</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel>Template</FormLabel>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant={currentTemplate === 'general' ? 'default' : 'outline'} 
                        onClick={() => handleTemplateChange('general')}
                      >
                        General
                      </Button>
                      <Button 
                        type="button" 
                        variant={currentTemplate === 'periodontal' ? 'default' : 'outline'} 
                        onClick={() => handleTemplateChange('periodontal')}
                      >
                        Periodontal
                      </Button>
                      <Button 
                        type="button" 
                        variant={currentTemplate === 'restorative' ? 'default' : 'outline'} 
                        onClick={() => handleTemplateChange('restorative')}
                      >
                        Restorative
                      </Button>
                    </div>
                    <FormDescription>
                      Select a template or start typing your note below
                    </FormDescription>
                  </div>
                  
                  <div className="relative">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note Content</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Textarea 
                                placeholder="Enter detailed clinical notes here..." 
                                className="min-h-[200px]"
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="absolute right-2 bottom-2"
                                onClick={handleVoiceRecognition}
                                disabled={isListening}
                              >
                                {isListening ? (
                                  <>
                                    <div className="animate-pulse rounded-full h-3 w-3 bg-red-500 mr-2"></div>
                                    Recording...
                                  </>
                                ) : (
                                  <>
                                    <Microphone className="h-4 w-4 mr-2" /> Voice Dictation
                                  </>
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {voiceToTextResult && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <div className="text-sm text-blue-700">
                          <div className="font-medium mb-1">Transcription Result:</div>
                          {voiceToTextResult}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="followUpRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Follow-up Required</FormLabel>
                            <FormDescription>
                              Schedule a follow-up for this note
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch('followUpRequired') && (
                      <FormField
                        control={form.control}
                        name="followUpDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Follow-up Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedTab('view');
                        setEditNoteId(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addNoteMutation.isPending || updateNoteMutation.isPending}>
                      {addNoteMutation.isPending || updateNoteMutation.isPending
                        ? 'Saving...'
                        : editNoteId ? 'Update Note' : 'Save Note'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="text-sm text-gray-500 border-t pt-6">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <p>
              Notes are analyzed by AI for potential contraindications and medication interactions.
              Once signed, notes cannot be modified for HIPAA compliance.
            </p>
          </div>
        </CardFooter>
      </Card>
      
      {/* Sign Note Dialog */}
      <AlertDialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Medical Note</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to digitally sign this medical note. Once signed, the note cannot be modified.
              This action is equivalent to a legal signature and will be recorded with a timestamp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="border rounded-md p-4 mt-2 mb-4 bg-gray-50 text-sm">
            <div className="font-medium mb-1">
              {noteToSign?.category && noteToSign.category.charAt(0).toUpperCase() + noteToSign.category.slice(1)} Note
            </div>
            <div>Created on: {noteToSign ? formatDate(noteToSign.createdAt) : ''}</div>
            <div className="mt-2 text-gray-700">{noteToSign?.content}</div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="text-sm font-medium">Type "sign" to confirm:</div>
            <Input 
              value={confirmationText} 
              onChange={(e) => setConfirmationText(e.target.value)} 
              placeholder="sign"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSignDialogOpen(false);
                setNoteToSign(null);
                setConfirmationText('');
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmSignNote();
              }}
              disabled={confirmationText !== 'sign' || signNoteMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {signNoteMutation.isPending ? 'Signing...' : 'Sign Note'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotesSystem;