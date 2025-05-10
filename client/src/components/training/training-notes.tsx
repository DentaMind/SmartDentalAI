import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, PlusCircle, BookOpen, Edit, Trash2, Share2, Eye, EyeOff, Tag, MessageSquare, Lightbulb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

// Define the Note schema for validation
const noteSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Note content must be at least 10 characters"),
  moduleId: z.number(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().default(true),
  keyInsights: z.array(z.string()).optional()
});

// Type for the notes from API
interface TrainingNote {
  id: number;
  title: string;
  content: string;
  moduleId: number;
  moduleName: string;
  moduleType: string;
  tags: string[];
  isPrivate: boolean;
  keyInsights: string[];
  createdAt: string;
  updatedAt: string;
}

// Type for the modules from API
interface TrainingModule {
  id: number;
  title: string;
  description: string;
  moduleType: string;
  isActive: boolean;
}

export default function TrainingNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("my-notes");
  const [selectedNote, setSelectedNote] = useState<TrainingNote | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [newInsight, setNewInsight] = useState("");
  const [newTag, setNewTag] = useState("");

  // Initialize form for adding/editing notes
  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
      moduleId: 0,
      tags: [],
      isPrivate: true,
      keyInsights: []
    }
  });

  // Fetch user's notes
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['/api/training/notes'],
    queryFn: () => apiRequest('/api/training/notes'),
    enabled: !!user
  });

  // Fetch training modules for the dropdown
  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/certifications/modules'],
    queryFn: () => apiRequest('/api/certifications/modules'),
    enabled: !!user
  });

  // Fetch shared notes (if admin/manager)
  const { data: sharedNotes, isLoading: sharedNotesLoading } = useQuery({
    queryKey: ['/api/training/notes/shared'],
    queryFn: () => apiRequest('/api/training/notes/shared'),
    enabled: !!user && (user.role === 'admin' || user.role === 'manager' || user.role === 'doctor') 
  });

  // Mutation for adding a new note
  const addNoteMutation = useMutation({
    mutationFn: (data: z.infer<typeof noteSchema>) => 
      apiRequest('/api/training/notes', {
        method: 'POST',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/notes'] });
      toast({
        title: "Note added successfully",
        description: "Your training note has been saved",
        variant: "success"
      });
      setShowAddNoteDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add note",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating a note
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<z.infer<typeof noteSchema>> }) => 
      apiRequest(`/api/training/notes/${id}`, {
        method: 'PATCH',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/notes'] });
      toast({
        title: "Note updated successfully",
        description: "Your changes have been saved",
        variant: "success"
      });
      if (selectedNote) {
        // Refresh the selected note
        const updatedNote = notes.find((note: TrainingNote) => note.id === selectedNote.id);
        if (updatedNote) {
          setSelectedNote(updatedNote);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update note",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting a note
  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/training/notes/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/notes'] });
      toast({
        title: "Note deleted successfully",
        description: "The note has been removed",
        variant: "success"
      });
      setViewMode("list");
      setSelectedNote(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete note",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle form submission for new note
  const onSubmit = (data: z.infer<typeof noteSchema>) => {
    addNoteMutation.mutate(data);
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !form.getValues().tags?.includes(newTag.trim())) {
      const currentTags = form.getValues().tags || [];
      form.setValue("tags", [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues().tags || [];
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };

  // Handle adding a new key insight
  const handleAddInsight = () => {
    if (newInsight.trim() && !form.getValues().keyInsights?.includes(newInsight.trim())) {
      const currentInsights = form.getValues().keyInsights || [];
      form.setValue("keyInsights", [...currentInsights, newInsight.trim()]);
      setNewInsight("");
    }
  };

  // Handle removing a key insight
  const handleRemoveInsight = (insight: string) => {
    const currentInsights = form.getValues().keyInsights || [];
    form.setValue("keyInsights", currentInsights.filter(i => i !== insight));
  };

  // Handle adding a tag to existing note
  const handleAddTagToNote = () => {
    if (newTag.trim() && selectedNote && !selectedNote.tags.includes(newTag.trim())) {
      const updatedTags = [...(selectedNote.tags || []), newTag.trim()];
      updateNoteMutation.mutate({
        id: selectedNote.id,
        data: { tags: updatedTags }
      });
      setNewTag("");
    }
  };

  // Handle adding an insight to existing note
  const handleAddInsightToNote = () => {
    if (newInsight.trim() && selectedNote && !selectedNote.keyInsights.includes(newInsight.trim())) {
      const updatedInsights = [...(selectedNote.keyInsights || []), newInsight.trim()];
      updateNoteMutation.mutate({
        id: selectedNote.id,
        data: { keyInsights: updatedInsights }
      });
      setNewInsight("");
    }
  };

  // Handle toggling note privacy
  const handleTogglePrivacy = () => {
    if (selectedNote) {
      updateNoteMutation.mutate({
        id: selectedNote.id,
        data: { isPrivate: !selectedNote.isPrivate }
      });
    }
  };

  // Reset form when opening the add note dialog
  const openAddNoteDialog = () => {
    form.reset({
      title: "",
      content: "",
      moduleId: modules?.[0]?.id || 0,
      tags: [],
      isPrivate: true,
      keyInsights: []
    });
    setShowAddNoteDialog(true);
  };

  // View a note in detail
  const viewNoteDetail = (note: TrainingNote) => {
    setSelectedNote(note);
    setViewMode("detail");
  };

  // Return to list view
  const returnToList = () => {
    setViewMode("list");
    setSelectedNote(null);
  };

  // Groups notes by module type
  const groupNotesByModuleType = (notesArray: TrainingNote[] = []) => {
    const grouped: Record<string, TrainingNote[]> = {};
    
    notesArray.forEach(note => {
      const type = note.moduleType || 'other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(note);
    });
    
    return grouped;
  };

  // Track if user just completed a certification
  const [recentCertification, setRecentCertification] = useState<string | null>(
    sessionStorage.getItem('recentCertification')
  );

  // Clear the recent certification flag when component unmounts
  React.useEffect(() => {
    return () => {
      sessionStorage.removeItem('recentCertification');
    };
  }, []);

  // Helper function to create a new note template for a certification
  const createCertificationNote = (certType: string) => {
    const moduleId = modules?.find(m => m.title?.includes(certType))?.id || modules?.[0]?.id || 0;
    
    form.reset({
      title: `${certType} Certification Completion Notes`,
      content: `My key takeaways from the ${certType} certification training:

1. 
2. 
3. 

Concepts I want to remember:

• 
• 
•

Questions I still have:

• 
• 
      `,
      moduleId,
      tags: [certType, "certification", "compliance"],
      isPrivate: true,
      keyInsights: []
    });
    
    setShowAddNoteDialog(true);
    // Clear the recent certification once used
    setRecentCertification(null);
    sessionStorage.removeItem('recentCertification');
  };

  // Render list of notes
  const renderNotesList = (notesArray: TrainingNote[] = []) => {
    // Special UI for recently certified users
    if (recentCertification) {
      return (
        <div className="text-center p-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <h3 className="text-lg font-medium">Congratulations on Your {recentCertification} Certification!</h3>
            <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto">
              Document what you've learned to reinforce your knowledge and create a valuable reference for future use.
            </p>
            <Button 
              onClick={() => createCertificationNote(recentCertification)}
              className="bg-green-600 hover:bg-green-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Document My {recentCertification} Learning
            </Button>
          </div>
        </div>
      );
    }
    
    if (notesArray.length === 0) {
      return (
        <div className="text-center p-8">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium">No notes found</h3>
          <p className="text-sm text-gray-500 mb-4">
            Start capturing your training insights
          </p>
          <Button onClick={openAddNoteDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create your first note
          </Button>
        </div>
      );
    }

    const groupedNotes = groupNotesByModuleType(notesArray);

    return (
      <div className="space-y-6">
        {Object.entries(groupedNotes).map(([moduleType, notes]) => (
          <div key={moduleType} className="space-y-3">
            <h3 className="text-lg font-medium capitalize">
              {moduleType.replace('_', ' ')} Notes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map(note => (
                <Card 
                  key={note.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => viewNoteDetail(note)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{note.title}</CardTitle>
                      {!note.isPrivate && (
                        <Badge variant="outline" className="text-xs">
                          <Share2 className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {format(new Date(note.createdAt), 'MMM d, yyyy')} • {note.moduleName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3">
                      {note.content}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.slice(0, 3).map(tag => (
                          <Badge variant="secondary" key={tag} className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{note.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render detail view of a note
  const renderNoteDetail = () => {
    if (!selectedNote) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={returnToList} className="mb-4">
            &larr; Back to notes
          </Button>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="private-mode"
                checked={!selectedNote.isPrivate}
                onCheckedChange={() => handleTogglePrivacy()}
              />
              <Label htmlFor="private-mode" className="text-sm cursor-pointer">
                {selectedNote.isPrivate ? (
                  <span className="flex items-center">
                    <EyeOff className="h-4 w-4 mr-1" />
                    Private
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Share2 className="h-4 w-4 mr-1" />
                    Shared
                  </span>
                )}
              </Label>
            </div>
            <Button variant="destructive" size="sm" onClick={() => deleteNoteMutation.mutate(selectedNote.id)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="mb-2">
                  {selectedNote.moduleType.replace('_', ' ')}
                </Badge>
                <CardTitle>{selectedNote.title}</CardTitle>
                <CardDescription>
                  Module: {selectedNote.moduleName} • Created: {format(new Date(selectedNote.createdAt), 'PPP')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{selectedNote.content}</p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium flex items-center mb-2">
                <Lightbulb className="h-4 w-4 mr-1" />
                Key Insights
              </h4>
              <div className="space-y-2">
                {selectedNote.keyInsights?.length > 0 ? (
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    {selectedNote.keyInsights.map((insight, i) => (
                      <li key={i} className="text-sm">{insight}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No key insights added yet</p>
                )}
                
                <div className="flex items-center mt-2">
                  <Input
                    placeholder="Add a key insight..."
                    value={newInsight}
                    onChange={(e) => setNewInsight(e.target.value)}
                    className="text-sm mr-2"
                  />
                  <Button size="sm" onClick={handleAddInsightToNote}>Add</Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium flex items-center mb-2">
                <Tag className="h-4 w-4 mr-1" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedNote.tags?.length > 0 ? (
                  selectedNote.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No tags added yet</p>
                )}
              </div>
              <div className="flex items-center">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="text-sm mr-2"
                />
                <Button size="sm" onClick={handleAddTagToNote}>Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Notes</h1>
          <p className="text-muted-foreground">
            Capture and organize your insights from training modules
          </p>
        </div>
        <Button onClick={openAddNoteDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-notes" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            <span>My Notes</span>
          </TabsTrigger>
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'doctor') && (
            <TabsTrigger value="shared-notes" className="flex items-center">
              <Share2 className="mr-2 h-4 w-4" />
              <span>Shared Notes</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="my-notes" className="space-y-4 pt-4">
          {notesLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-pulse">Loading notes...</div>
            </div>
          ) : viewMode === "list" ? (
            renderNotesList(notes)
          ) : (
            renderNoteDetail()
          )}
        </TabsContent>
        
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'doctor') && (
          <TabsContent value="shared-notes" className="space-y-4 pt-4">
            {sharedNotesLoading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-pulse">Loading shared notes...</div>
              </div>
            ) : (
              renderNotesList(sharedNotes)
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog for creating a new note */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Training Note</DialogTitle>
            <DialogDescription>
              Capture your insights and learnings from training modules
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
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
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Training Module</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          value={field.value}
                        >
                          {modulesLoading ? (
                            <option value={0}>Loading modules...</option>
                          ) : (
                            modules?.map((module: TrainingModule) => (
                              <option key={module.id} value={module.id}>
                                {module.title}
                              </option>
                            ))
                          )}
                        </select>
                      </FormControl>
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
                          placeholder="Enter your notes and insights here..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel htmlFor="tags-input">Tags</FormLabel>
                    <div className="flex items-center mt-1 mb-2">
                      <Input
                        id="tags-input"
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="mr-2"
                      />
                      <Button type="button" onClick={handleAddTag}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.getValues().tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-xs"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <FormLabel htmlFor="insights-input">Key Insights</FormLabel>
                    <div className="flex items-center mt-1 mb-2">
                      <Input
                        id="insights-input"
                        placeholder="Add key insight..."
                        value={newInsight}
                        onChange={(e) => setNewInsight(e.target.value)}
                        className="mr-2"
                      />
                      <Button type="button" onClick={handleAddInsight}>Add</Button>
                    </div>
                    <div className="mt-2 space-y-1">
                      {form.getValues().keyInsights?.map((insight, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-sm mr-2">• {insight}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveInsight(insight)}
                            className="text-xs text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">
                        {field.value ? (
                          <span className="flex items-center">
                            <EyeOff className="h-4 w-4 mr-1" /> 
                            Keep this note private
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Share2 className="h-4 w-4 mr-1" /> 
                            Share with team
                          </span>
                        )}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={addNoteMutation.isPending}>
                  {addNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}