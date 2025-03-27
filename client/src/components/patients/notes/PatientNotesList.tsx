import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import AutoNotesManager from '@/components/patients/notes/AutoNotesManager';
import { 
  Clock, FileText, Check, X, Edit, MoreHorizontal, Lock, Tag, User, Eye, EyeOff, Filter, 
  PenTool, SortAsc, SortDesc, Trash, RefreshCw, CornerUpRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface PatientNote {
  id: number;
  patientId: number;
  doctorId: number;
  content: string;
  noteType: string | null;
  category: string | null;
  private: boolean;
  aiGenerated: boolean;
  status: 'draft' | 'final' | 'archived';
  createdAt: string;
  updatedAt: string;
  signedAt: string | null;
  signedBy: number | null;
  version: number;
  tags: string[] | null;
  previousVersionId?: number | null;
}

interface PatientNotesListProps {
  patientId: number;
  patientName?: string;
  currentUserId: number;
  userRole: string;
}

const PatientNotesList: React.FC<PatientNotesListProps> = ({ 
  patientId,
  patientName = 'Patient',
  currentUserId,
  userRole
}) => {
  const [selectedNote, setSelectedNote] = useState<PatientNote | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentTab, setCurrentTab] = useState('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all notes for this patient
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['patient-notes', patientId],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/notes`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient notes');
      }
      return response.json() as Promise<PatientNote[]>;
    }
  });

  // Mutation for updating a note
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, updates }: { noteId: number, updates: any }) => {
      const response = await fetch(`/api/patients/${patientId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notes', patientId] });
      toast({
        title: 'Note Updated',
        description: 'The note has been successfully updated.',
        variant: 'default'
      });
      setIsEditDialogOpen(false);
    }
  });

  // Mutation for deleting a note
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`/api/patients/${patientId}/notes/${noteId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notes', patientId] });
      toast({
        title: 'Note Deleted',
        description: 'The note has been successfully deleted.',
        variant: 'success'
      });
      setIsDeleteDialogOpen(false);
      setSelectedNote(null);
    }
  });

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get note type label
  const getNoteTypeLabel = (type: string | null) => {
    if (!type) return 'General';
    const typeMap: { [key: string]: string } = {
      soap: 'SOAP Note',
      procedure: 'Procedure Note',
      followup: 'Follow-up Note',
      consultation: 'Consultation',
      general: 'General Note'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'final':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  // Open view dialog
  const handleViewNote = (note: PatientNote) => {
    setSelectedNote(note);
    setIsViewDialogOpen(true);
  };

  // Open edit dialog
  const handleEditNote = (note: PatientNote) => {
    setSelectedNote(note);
    setEditedContent(note.content);
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteNote = (note: PatientNote) => {
    setSelectedNote(note);
    setIsDeleteDialogOpen(true);
  };

  // Handle note update
  const handleUpdateNote = () => {
    if (!selectedNote) return;
    
    updateNoteMutation.mutate({
      noteId: selectedNote.id,
      updates: {
        content: editedContent
      }
    });
  };

  // Handle note deletion
  const handleConfirmDelete = () => {
    if (!selectedNote) return;
    deleteNoteMutation.mutate(selectedNote.id);
  };

  // Handle finalizing a note
  const handleFinalizeNote = (note: PatientNote) => {
    updateNoteMutation.mutate({
      noteId: note.id,
      updates: {
        status: 'final'
      }
    });
  };

  // Apply filters and sorting to notes
  const filteredNotes = notes.filter(note => {
    // Filter by status
    if (filterStatus !== 'all' && note.status !== filterStatus) {
      return false;
    }
    
    // Filter by type
    if (filterType !== 'all' && note.noteType !== filterType) {
      return false;
    }
    
    // Filter by tab
    if (currentTab === 'mine' && note.doctorId !== currentUserId) {
      return false;
    } else if (currentTab === 'private' && !note.private) {
      return false;
    } else if (currentTab === 'ai' && !note.aiGenerated) {
      return false;
    }
    
    return true;
  });

  // Sort notes by date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Check permissions
  const canEdit = (note: PatientNote) => {
    // User can edit if they created the note or if they're an admin
    // Also, final notes can't be edited directly
    return (note.doctorId === currentUserId || userRole === 'admin') && note.status !== 'final';
  };

  const canDelete = (note: PatientNote) => {
    // Only drafts can be deleted, and only by the author or an admin
    return note.status === 'draft' && (note.doctorId === currentUserId || userRole === 'admin');
  };

  const canFinalize = (note: PatientNote) => {
    // Only drafts can be finalized, and only by the author or an admin
    return note.status === 'draft' && (note.doctorId === currentUserId || userRole === 'admin');
  };

  // Toggle sorting order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32 text-red-500">
            <p>Error loading notes: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Clinical Notes
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="flex items-center gap-1"
              >
                {sortOrder === 'desc' ? (
                  <>
                    <SortDesc className="h-4 w-4" /> Newest
                  </>
                ) : (
                  <>
                    <SortAsc className="h-4 w-4" /> Oldest
                  </>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Filter className="h-4 w-4" /> Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Status</p>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Drafts</SelectItem>
                        <SelectItem value="final">Finalized</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Note Type</p>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="soap">SOAP Notes</SelectItem>
                        <SelectItem value="procedure">Procedure Notes</SelectItem>
                        <SelectItem value="followup">Follow-up Notes</SelectItem>
                        <SelectItem value="consultation">Consultations</SelectItem>
                        <SelectItem value="general">General Notes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardDescription>
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} for {patientName}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Notes</TabsTrigger>
              <TabsTrigger value="mine">My Notes</TabsTrigger>
              <TabsTrigger value="private">Private</TabsTrigger>
              <TabsTrigger value="ai">AI Generated</TabsTrigger>
            </TabsList>
            
            <TabsContent value={currentTab} className="mt-0">
              {sortedNotes.length > 0 ? (
                <div className="space-y-4">
                  {sortedNotes.map(note => (
                    <Card key={note.id} className={`${note.private ? 'border-amber-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-2">
                            <div>
                              <h4 className="font-medium text-base flex items-center gap-2">
                                {note.noteType && (
                                  <Badge variant="outline" className="mr-2">
                                    {getNoteTypeLabel(note.noteType)}
                                  </Badge>
                                )}
                                {note.category && (
                                  <Badge variant="outline" className="bg-slate-100">
                                    {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                                  </Badge>
                                )}
                                {note.version > 1 && (
                                  <Badge className="bg-purple-100 text-purple-800 ml-2">
                                    v{note.version}
                                  </Badge>
                                )}
                              </h4>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{formatDate(note.updatedAt)}</span>
                                {note.status === 'final' && note.signedAt && (
                                  <div className="flex items-center ml-3">
                                    <Lock className="w-3 h-3 mr-1" />
                                    <span>Signed {formatDate(note.signedAt)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusBadgeVariant(note.status)}>
                              {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                            </Badge>
                            
                            {note.private && (
                              <Badge variant="outline" className="bg-amber-50">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Private
                              </Badge>
                            )}
                            
                            {note.aiGenerated && (
                              <Badge variant="outline" className="bg-blue-50">
                                AI Assisted
                              </Badge>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewNote(note)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                
                                {canEdit(note) && (
                                  <DropdownMenuItem onClick={() => handleEditNote(note)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                
                                {canFinalize(note) && (
                                  <DropdownMenuItem onClick={() => handleFinalizeNote(note)}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Finalize
                                  </DropdownMenuItem>
                                )}
                                
                                {note.status === 'final' && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      updateNoteMutation.mutate({
                                        noteId: note.id,
                                        updates: { 
                                          createNewVersion: true,
                                          content: note.content
                                        }
                                      });
                                    }}
                                  >
                                    <PenTool className="w-4 h-4 mr-2" />
                                    New Version
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator />
                                
                                {canDelete(note) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteNote(note)}
                                    className="text-red-600"
                                  >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm">
                          <p className="whitespace-pre-wrap">
                            {truncateContent(note.content)}
                          </p>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="w-3 h-3 mr-1" />
                            <span>Provider ID: {note.doctorId}</span>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewNote(note)}
                          >
                            View Full Note
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-20" />
                  <p>No notes found matching the current filters</p>
                  {filterStatus !== 'all' || filterType !== 'all' || currentTab !== 'all' ? (
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterType('all');
                        setCurrentTab('all');
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  ) : null}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add AutoNotesManager component */}
      <AutoNotesManager patientId={patientId} />
      
      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedNote?.noteType ? getNoteTypeLabel(selectedNote.noteType) : 'Note'} 
              {selectedNote?.status === 'final' && (
                <Badge className="bg-green-100 text-green-800 ml-2">Finalized</Badge>
              )}
              {selectedNote?.version && selectedNote.version > 1 && (
                <Badge className="bg-purple-100 text-purple-800 ml-2">
                  Version {selectedNote.version}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center">
                <span className="font-medium mr-2">Created:</span>
                {selectedNote?.createdAt ? formatDate(selectedNote.createdAt) : 'N/A'}
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Updated:</span>
                {selectedNote?.updatedAt ? formatDate(selectedNote.updatedAt) : 'N/A'}
              </div>
              {selectedNote?.status === 'final' && (
                <div className="flex items-center">
                  <span className="font-medium mr-2">Signed:</span>
                  {selectedNote?.signedAt ? formatDate(selectedNote.signedAt) : 'N/A'}
                </div>
              )}
              <div className="flex items-center">
                <span className="font-medium mr-2">Provider ID:</span>
                {selectedNote?.doctorId || 'N/A'}
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Category:</span>
                {selectedNote?.category ? 
                  selectedNote.category.charAt(0).toUpperCase() + selectedNote.category.slice(1) : 
                  'Uncategorized'
                }
              </div>
            </div>
            
            <div className="border rounded-md p-4 whitespace-pre-wrap">
              {selectedNote?.content || ''}
            </div>
            
            <div className="flex justify-between">
              <div className="flex space-x-2">
                {selectedNote?.previousVersionId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Fetch and show previous version
                      fetch(`/api/patients/${patientId}/notes/${selectedNote.previousVersionId}`)
                        .then(response => response.json())
                        .then(note => {
                          setSelectedNote(note);
                        })
                        .catch(err => {
                          toast({
                            title: 'Error',
                            description: 'Failed to fetch previous version',
                            variant: 'destructive'
                          });
                        });
                    }}
                  >
                    <CornerUpRight className="h-4 w-4 mr-1" />
                    Previous Version
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                {selectedNote && canEdit(selectedNote) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditNote(selectedNote);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                
                {selectedNote && canFinalize(selectedNote) && (
                  <Button
                    variant="default"
                    onClick={() => {
                      handleFinalizeNote(selectedNote);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Finalize
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          
          <div className="py-2">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[300px]"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateNote}
              disabled={updateNoteMutation.isPending}
            >
              {updateNoteMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this note? This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteNoteMutation.isPending}
            >
              {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientNotesList;