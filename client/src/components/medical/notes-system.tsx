import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Check, FileText, Clock, AlertCircle, Search, Mic, Download } from 'lucide-react';
import { AiTreatmentNoteGenerator } from './ai-treatment-note-generator';

// Define schema for the note form
const noteFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(1, { message: "Note content is required" }),
  category: z.string().min(1, { message: "Category is required" }),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

// Define Medical Note interface
interface MedicalNote {
  id: number;
  patientId: number;
  userId: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  signedBy?: number;
  signedAt?: string;
  signedByName?: string;
}

interface NotesSystemProps {
  patientId: number;
  userId: number; // Current user ID
  userRole: string; // 'doctor' or 'staff'
  doctorId?: number; // If staff creating note, need to assign to a doctor
  doctorName?: string; // Doctor's name for display
}

export function NotesSystem({
  patientId,
  userId,
  userRole,
  doctorId,
  doctorName,
}: NotesSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedNote, setSelectedNote] = useState<MedicalNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSigningNote, setIsSigningNote] = useState(false);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Fetch patient's medical notes
  const { data: notes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/patients', patientId, 'medical-notes'],
    queryFn: async () => {
      const data = await apiRequest(`/api/patients/${patientId}/medical-notes`);
      return data as MedicalNote[];
    },
  });

  // Create note form
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'general',
    },
  });

  // Create a new medical note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormValues) => {
      return await apiRequest(`/api/patients/${patientId}/medical-notes`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          userId,
          doctorId: userRole === 'doctor' ? userId : doctorId,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'medical-notes'] });
      toast({
        title: 'Note created',
        description: 'The medical note has been created successfully.',
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create note',
        description: 'There was a problem creating the medical note.',
      });
      console.error('Error creating note:', error);
    },
  });

  // Sign a medical note mutation
  const signNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return await apiRequest(`/api/patients/${patientId}/medical-notes/${noteId}/sign`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          signedByName: doctorName || 'Doctor',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'medical-notes'] });
      toast({
        title: 'Note signed',
        description: 'The medical note has been signed successfully.',
      });
      setIsSigningNote(false);
      setSelectedNote(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to sign note',
        description: 'There was a problem signing the medical note.',
      });
      console.error('Error signing note:', error);
      setIsSigningNote(false);
    },
  });

  // Update a medical note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async (data: { id: number; note: Partial<NoteFormValues> }) => {
      return await apiRequest(`/api/patients/${patientId}/medical-notes/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data.note),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'medical-notes'] });
      toast({
        title: 'Note updated',
        description: 'The medical note has been updated successfully.',
      });
      setIsEditing(false);
      setSelectedNote(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update note',
        description: 'There was a problem updating the medical note.',
      });
      console.error('Error updating note:', error);
    },
  });

  // Filter notes based on activeTab and search term
  const filteredNotes = notes.filter((note) => {
    const matchesTab = activeTab === 'all' || note.category === activeTab;
    const matchesSearch = 
      searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Handle note submission
  const onSubmit = (data: NoteFormValues) => {
    if (isEditing && selectedNote) {
      updateNoteMutation.mutate({ id: selectedNote.id, note: data });
    } else {
      createNoteMutation.mutate(data);
    }
  };

  // Handle note signing
  const handleSignNote = (note: MedicalNote) => {
    if (userRole !== 'doctor') {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'Only doctors can sign medical notes.',
      });
      return;
    }
    
    setIsSigningNote(true);
    signNoteMutation.mutate(note.id);
  };

  // Handle note editing
  const handleEditNote = (note: MedicalNote) => {
    setSelectedNote(note);
    setIsEditing(true);
    
    form.reset({
      title: note.title,
      content: note.content,
      category: note.category,
    });
  };

  // Handle voice dictation
  const startVoiceDictation = () => {
    setIsRecording(true);
    setShowVoiceTranscript(true);
    
    // Simulate voice dictation - in a real implementation, this would use the Web Speech API
    setTimeout(() => {
      const transcript = "Patient presented with symptoms of tooth sensitivity in the upper right quadrant. Clinical examination revealed deep occlusal caries on tooth 16. Advised composite restoration and provided oral hygiene instructions.";
      setVoiceTranscript(transcript);
      setIsRecording(false);
    }, 2000);
  };

  // Add voice transcript to note content
  const addTranscriptToNote = () => {
    const currentContent = form.getValues('content');
    form.setValue('content', currentContent + (currentContent ? '\n\n' : '') + voiceTranscript);
    setShowVoiceTranscript(false);
    setVoiceTranscript('');
    
    toast({
      title: 'Transcript added',
      description: 'Voice transcript has been added to your note.',
    });
  };

  // Handle note generation from AI
  const handleAiGeneratedNote = (noteContent: string, category: string) => {
    const titleSuggestion = `${category.charAt(0).toUpperCase() + category.slice(1)} Treatment Note - ${new Date().toLocaleDateString()}`;
    
    form.setValue('title', titleSuggestion);
    form.setValue('content', noteContent);
    form.setValue('category', category);
  };

  // Reset form when editing is cancelled
  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedNote(null);
    form.reset({
      title: '',
      content: '',
      category: 'general',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Medical Notes</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={startVoiceDictation}
              disabled={isRecording}
              className="gap-1"
            >
              <Mic className="h-4 w-4" />
              {isRecording ? 'Recording...' : 'Dictate'}
            </Button>
          )}
          {userRole === 'doctor' && !isEditing && (
            <AiTreatmentNoteGenerator
              patientId={patientId}
              doctorId={userId}
              doctorName={doctorName || ''}
              onNoteGenerated={handleAiGeneratedNote}
            />
          )}
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="periodontal">Periodontal</TabsTrigger>
          <TabsTrigger value="restorative">Restorative</TabsTrigger>
          <TabsTrigger value="endodontic">Endodontic</TabsTrigger>
          <TabsTrigger value="surgical">Surgical</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Note Editor */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Note' : 'New Note'}</CardTitle>
              <CardDescription>
                {isEditing 
                  ? 'Edit and update the existing medical note' 
                  : 'Create a new medical note for this patient'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Note title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="periodontal">Periodontal</SelectItem>
                            <SelectItem value="restorative">Restorative</SelectItem>
                            <SelectItem value="endodontic">Endodontic</SelectItem>
                            <SelectItem value="surgical">Surgical</SelectItem>
                            <SelectItem value="orthodontic">Orthodontic</SelectItem>
                            <SelectItem value="prosthodontic">Prosthodontic</SelectItem>
                            <SelectItem value="pediatric">Pediatric</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed note content here..."
                            className="min-h-[200px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include all relevant details about the procedure, findings, and recommendations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-2">
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={createNoteMutation.isPending || updateNoteMutation.isPending}>
                      {isEditing ? 'Update Note' : 'Save Note'}
                    </Button>
                  </div>
                </form>
              </Form>
              
              {showVoiceTranscript && (
                <div className="mt-4 border rounded-md p-3 bg-muted/20">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Voice Transcript</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                      {isRecording ? 'Recording...' : 'Ready to Add'}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{voiceTranscript || 'Waiting for transcript...'}</p>
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowVoiceTranscript(false);
                        setVoiceTranscript('');
                      }}
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={addTranscriptToNote}
                      disabled={!voiceTranscript || isRecording}
                    >
                      Add to Note
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes List */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle>Patient Notes History</CardTitle>
              <CardDescription>
                View and manage all medical notes for this patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <p>Loading notes...</p>
                </div>
              ) : isError ? (
                <div className="flex items-center justify-center p-8 text-red-500">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <p>Error loading notes. Please try again.</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No medical notes found.</p>
                  <p className="text-sm">Create a new note to get started.</p>
                </div>
              ) : (
                <ScrollArea className="h-[450px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotes.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell className="font-medium truncate max-w-[150px]" title={note.title}>
                            {note.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {note.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {note.signedBy ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      <Check className="h-3 w-3 mr-1" />
                                      Signed
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Signed by {note.signedByName} on {new Date(note.signedAt!).toLocaleDateString()}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedNote(note);
                                  setIsEditing(false);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              
                              {!note.signedBy && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditNote(note)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {!note.signedBy && userRole === 'doctor' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSignNote(note)}
                                  disabled={isSigningNote}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="icon"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
            
            {selectedNote && !isEditing && (
              <CardFooter className="flex-col items-start pt-0">
                <div className="w-full border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{selectedNote.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {selectedNote.category}
                      </Badge>
                      {selectedNote.signedBy && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Signed by {selectedNote.signedByName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Created: {new Date(selectedNote.createdAt).toLocaleString()}
                    {selectedNote.signedAt && (
                      <> | Signed: {new Date(selectedNote.signedAt).toLocaleString()}</>
                    )}
                  </div>
                  <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{selectedNote.content}</pre>
                  </ScrollArea>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedNote(null)}
                    >
                      Close
                    </Button>
                    {!selectedNote.signedBy && userRole === 'doctor' && (
                      <Button
                        size="sm"
                        onClick={() => handleSignNote(selectedNote)}
                        disabled={isSigningNote}
                      >
                        Sign Note
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </Tabs>
    </div>
  );
}