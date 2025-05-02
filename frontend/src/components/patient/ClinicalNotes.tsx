import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '../ui/card';
import { Button } from '../ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { 
  FileText, 
  PencilLine, 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FilePlus, 
  FileEdit, 
  RotateCcw 
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import ReactMarkdown from 'react-markdown';

type NoteStatus = 'draft' | 'final' | 'amended' | 'deleted';
type NoteType = 'examination' | 'findings' | 'procedure' | 'treatment_plan' | 'followup' | 'general';

interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  created_at: string;
  updated_at?: string;
  status: NoteStatus;
  approved_by?: string;
  approved_at?: string;
  is_ai_generated: boolean;
}

interface ClinicalNotesProps {
  patientId: string;
  patientName: string;
  canEdit?: boolean;
}

export function ClinicalNotes({ patientId, patientName, canEdit = true }: ClinicalNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NoteType | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [patientId]);

  // Fetch notes from API
  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clinical-notes/patient/${patientId}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clinical notes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a single note by ID
  const fetchNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/clinical-notes/${noteId}`);
      if (!response.ok) throw new Error('Failed to fetch note');
      
      const data = await response.json();
      setSelectedNote(data);
      setEditedContent(data.content);
    } catch (error) {
      console.error('Error fetching note:', error);
      toast({
        title: 'Error',
        description: 'Failed to load note details',
        variant: 'destructive',
      });
    }
  };

  // Approve a note
  const approveNote = async (noteId: string, edits?: { content?: string }) => {
    try {
      const response = await fetch(`/api/clinical-notes/${noteId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: 'Current Provider', // Would come from auth context in real app
          edits: edits,
        }),
      });

      if (!response.ok) throw new Error('Failed to approve note');
      
      const updatedNote = await response.json();
      
      // Update notes list
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      
      // Update selected note if it's open
      if (selectedNote?.id === updatedNote.id) {
        setSelectedNote(updatedNote);
      }
      
      toast({
        title: 'Success',
        description: 'Note approved successfully',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error approving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve note',
        variant: 'destructive',
      });
    }
  };

  // Update a note's content
  const updateNote = async (noteId: string, content: string) => {
    try {
      const response = await fetch(`/api/clinical-notes/${noteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) throw new Error('Failed to update note');
      
      const updatedNote = await response.json();
      
      // Update notes list
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      
      // Update selected note
      setSelectedNote(updatedNote);
      
      toast({
        title: 'Success',
        description: 'Note updated successfully',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
    }
  };

  // Create a new note
  const createNote = async (noteData: Partial<Note>) => {
    try {
      const response = await fetch('/api/clinical-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          title: noteData.title || 'New Note',
          content: noteData.content || '',
          type: noteData.type || 'general',
        }),
      });

      if (!response.ok) throw new Error('Failed to create note');
      
      const newNote = await response.json();
      
      // Add new note to list
      setNotes([newNote, ...notes]);
      
      toast({
        title: 'Success',
        description: 'Note created successfully',
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to create note',
        variant: 'destructive',
      });
    }
  };

  // Handle view note
  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setEditedContent(note.content);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Handle editing note
  const handleEditNote = () => {
    setIsEditing(true);
  };

  // Handle saving edits
  const handleSaveEdits = () => {
    if (!selectedNote) return;
    
    updateNote(selectedNote.id, editedContent);
  };

  // Handle approving note
  const handleApproveNote = () => {
    if (!selectedNote) return;
    
    // If we're editing, save the edits as we approve
    if (isEditing && selectedNote.content !== editedContent) {
      approveNote(selectedNote.id, { content: editedContent });
    } else {
      approveNote(selectedNote.id);
    }
  };

  // Handle creating new note
  const handleCreateNote = () => {
    // This would open a form dialog in a real implementation
    createNote({
      title: 'Manual Progress Note',
      content: `# Progress Note\n\nPatient: ${patientName}\nDate: ${new Date().toLocaleDateString()}\n\n## Observations\n\n## Assessment\n\n## Plan\n`,
      type: 'general',
    });
  };

  // Filter notes based on active tab
  const filteredNotes = activeTab === 'all' 
    ? notes 
    : notes.filter(note => note.type === activeTab);

  // Get icon based on note type
  const getNoteTypeIcon = (type: NoteType) => {
    switch (type) {
      case 'examination':
        return <FileText className="h-4 w-4" />;
      case 'findings':
        return <AlertTriangle className="h-4 w-4" />;
      case 'procedure':
        return <PencilLine className="h-4 w-4" />;
      case 'treatment_plan':
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString;
    }
  };

  // Get status badge for a note
  const getStatusBadge = (status: NoteStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock className="h-3 w-3" /> Draft</Badge>;
      case 'final':
        return <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Final</Badge>;
      case 'amended':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Amended</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clinical Notes</h2>
        {canEdit && (
          <Button onClick={handleCreateNote}>
            <FilePlus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as NoteType | 'all')}>
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="examination">Exams</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="procedure">Procedures</TabsTrigger>
          <TabsTrigger value="treatment_plan">Treatment Plans</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No clinical notes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map(note => (
                <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewNote(note)}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getNoteTypeIcon(note.type)}
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                      </div>
                      {note.is_ai_generated && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">AI Generated</Badge>
                      )}
                    </div>
                    <CardDescription>{formatDate(note.created_at)}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="line-clamp-2 text-sm opacity-70">
                      {note.content.substring(0, 150)}...
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    {getStatusBadge(note.status)}
                    {note.approved_by && (
                      <span className="text-xs text-gray-500">
                        Approved by {note.approved_by}
                      </span>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Note detail dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNote && getNoteTypeIcon(selectedNote.type)}
              {selectedNote?.title}
              {selectedNote?.is_ai_generated && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 ml-2">AI Generated</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {selectedNote && getStatusBadge(selectedNote.status)}
              <span className="text-sm text-gray-500">
                Created: {selectedNote && formatDate(selectedNote.created_at)}
              </span>
            </div>
            {selectedNote?.approved_by && (
              <span className="text-sm text-gray-500">
                Approved by {selectedNote.approved_by} on {formatDate(selectedNote.approved_at || '')}
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-auto border rounded-md p-4">
            {isEditing ? (
              <Textarea 
                value={editedContent} 
                onChange={(e) => setEditedContent(e.target.value)} 
                className="w-full h-full min-h-[300px] font-mono text-sm" 
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{selectedNote?.content || ''}</ReactMarkdown>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
              
              {canEdit && selectedNote?.status !== 'final' && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false);
                        setEditedContent(selectedNote?.content || '');
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdits}>
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={handleEditNote}>
                      <FileEdit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  
                  <Button onClick={handleApproveNote}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve & Finalize
                  </Button>
                </div>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 