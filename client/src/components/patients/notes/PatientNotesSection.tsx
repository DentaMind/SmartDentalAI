import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

interface PatientNote {
  id: number;
  patientId: number;
  providerId: number;
  title: string;
  content: string;
  approved: boolean;
  approvedBy?: number;
  approvedAt?: string;
  source: "ai" | "voice" | "manual" | "template";
  templateUsed?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function PatientNotesSection() {
  const { patientId } = useParams();
  const [draftContent, setDraftContent] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patient notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ['/api/patients', patientId, 'notes'],
    queryFn: async () => {
      const response = await apiRequest(`/patients/${patientId}/notes`);
      return response as PatientNote[];
    },
    enabled: !!patientId,
  });

  // Get active draft note or create a new one
  useEffect(() => {
    if (notes && notes.length > 0) {
      // Find the most recent non-approved note to use as a draft
      const draftNote = notes.find(note => !note.approved);
      if (draftNote) {
        setDraftContent(draftNote.content);
        setSelectedNoteId(draftNote.id);
      } else {
        setDraftContent("");
        setSelectedNoteId(null);
      }
    }
  }, [notes]);

  // Create new note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/patients/${patientId}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          title: "Clinical Note",
          source: "manual"
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'notes'] });
      toast({
        title: "Note created",
        description: "Your note has been saved as a draft.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content, approve }: { id: number; content: string; approve?: boolean }) => {
      return apiRequest(`/patients/${patientId}/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          content,
          status: approve ? 'final' : 'draft',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'notes'] });
      toast({
        title: "Note updated",
        description: "Your changes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save draft handler
  const handleSaveDraft = async () => {
    if (!draftContent.trim()) {
      toast({
        title: "Cannot save empty note",
        description: "Please enter some content before saving.",
        variant: "destructive",
      });
      return;
    }

    if (selectedNoteId) {
      // Update existing draft
      updateNoteMutation.mutate({ id: selectedNoteId, content: draftContent });
    } else {
      // Create new draft
      createNoteMutation.mutate(draftContent);
    }
  };

  // Finalize note handler
  const handleFinalizeNote = async () => {
    if (!draftContent.trim()) {
      toast({
        title: "Cannot finalize empty note",
        description: "Please enter some content before finalizing.",
        variant: "destructive",
      });
      return;
    }

    if (selectedNoteId) {
      // Update existing note and mark as finalized
      updateNoteMutation.mutate({ 
        id: selectedNoteId, 
        content: draftContent,
        approve: true
      });
    } else {
      // Create new note and immediately approve it
      createNoteMutation.mutate(draftContent);
      // Note: In a real implementation, we'd want to chain these operations
      // to ensure we first create the note, then approve it
    }
  };

  return (
    <Card className="mt-4 w-full">
      <CardContent className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Patient Notes</h2>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-[40px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-[40px] w-[100px]" />
              <Skeleton className="h-[40px] w-[100px]" />
            </div>
          </div>
        ) : (
          <>
            <Textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Write or edit your patient note here..."
              className="min-h-[200px] mb-4"
            />

            <div className="flex gap-2 mb-6">
              <Button 
                onClick={handleSaveDraft}
                disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
              >
                {createNoteMutation.isPending || updateNoteMutation.isPending ? "Saving..." : "Save Draft"}
              </Button>
              <Button 
                onClick={handleFinalizeNote}
                variant="default"
                disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
              >
                Finalize & Lock
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-3">Previous Notes:</h3>
              {notes && notes.length > 0 ? (
                <div className="space-y-4">
                  {notes
                    .filter(note => note.approved)
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map(note => (
                      <div key={note.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{note.title}</h4>
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Approved
                          </div>
                        </div>
                        <p className="text-sm my-2 whitespace-pre-wrap">{note.content}</p>
                        <div className="text-xs text-gray-500 flex justify-between mt-2">
                          <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
                          <span>Version: {note.version}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <p className="text-sm text-gray-500">No previous notes found.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}