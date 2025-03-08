import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Brain, 
  Check, 
  CheckCircle, 
  Download, 
  Edit, 
  FileText, 
  Filter, 
  Mic, 
  Plus, 
  Search,
  Share2, 
  Trash2, 
  X
} from "lucide-react";

interface PatientNotesProps {
  patientId: number;
}

interface Note {
  id: number;
  patientId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  createdByName: string;
  type: "clinical" | "procedure" | "followup" | "lab" | "general";
  status?: "draft" | "pending" | "signed";
  tags?: string[];
  aiGenerated?: boolean;
  aiSummary?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    type: string;
    url: string;
  }>;
}

export function PatientNotes({ patientId }: PatientNotesProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [newNoteType, setNewNoteType] = useState<"clinical" | "procedure" | "followup" | "lab" | "general">("clinical");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Fetch patient notes
  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes", patientId],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/patients/${patientId}/notes`);
        return res.json();
      } catch (error) {
        console.error("Failed to fetch patient notes:", error);
        return [];
      }
    },
  });

  // Sample notes data for demonstration
  const sampleNotes: Note[] = [
    {
      id: 1,
      patientId,
      title: "Initial Examination",
      content: "Patient presented with pain in the lower right quadrant, specifically around tooth #30. Examination revealed deep caries on the distal surface. Recommended root canal treatment followed by crown. Patient agreed to the treatment plan.",
      createdAt: "2025-02-15T10:30:00Z",
      updatedAt: "2025-02-15T10:45:00Z",
      createdById: 1,
      createdByName: "Dr. Johnson",
      type: "clinical",
      status: "signed",
      tags: ["examination", "caries", "treatment plan"],
      aiGenerated: false
    },
    {
      id: 2,
      patientId,
      title: "Root Canal Procedure - Tooth #30",
      content: "Performed root canal therapy on tooth #30. Local anesthesia administered (2% lidocaine with 1:100,000 epinephrine). Accessed through occlusal surface, located 3 canals (MB, ML, D). Working length established with apex locator and confirmed radiographically. Canals instrumented with rotary files and irrigated with 5.25% NaOCl. Obturated with gutta percha using lateral condensation. Temporary filling placed. Patient tolerated procedure well.",
      createdAt: "2025-02-20T14:15:00Z",
      updatedAt: "2025-02-20T15:30:00Z",
      createdById: 1,
      createdByName: "Dr. Johnson",
      type: "procedure",
      status: "signed",
      tags: ["root canal", "endodontic", "tooth #30"],
      aiGenerated: false
    },
    {
      id: 3,
      patientId,
      title: "Follow-up Appointment",
      content: "Patient returned for follow-up after root canal treatment on tooth #30. Reports no pain or discomfort. Clinical examination shows good healing. Temporary filling intact. Discussed permanent restoration options (crown). Patient scheduled for crown preparation next week.",
      createdAt: "2025-02-27T11:00:00Z",
      updatedAt: "2025-02-27T11:15:00Z",
      createdById: 2,
      createdByName: "Dr. Smith",
      type: "followup",
      status: "signed",
      tags: ["post-op", "evaluation", "crown"],
      aiGenerated: false
    },
    {
      id: 4,
      patientId,
      title: "AI-Generated Clinical Summary",
      content: "Based on today's appointment, the patient presented with sensitivity to cold in upper left quadrant, particularly tooth #14. Examination revealed early enamel demineralization on the mesial surface. Applied fluoride varnish and recommended increased fluoride exposure through prescription toothpaste (5000 ppm). Patient also inquired about teeth whitening options, which were discussed in detail.",
      createdAt: "2025-03-05T09:45:00Z",
      updatedAt: "2025-03-05T10:00:00Z",
      createdById: 1,
      createdByName: "Dr. Johnson",
      type: "clinical",
      status: "pending",
      tags: ["sensitivity", "prevention", "fluoride treatment"],
      aiGenerated: true,
      aiSummary: "Tooth #14 showing early demineralization; fluoride treatment applied; patient interested in whitening"
    }
  ];

  // Use the real data if available, otherwise use sample data
  const displayNotes = notes || sampleNotes;

  // Filter notes based on active tab and search query
  const filteredNotes = displayNotes
    .filter(note => 
      activeTab === "all" || 
      activeTab === "ai-generated" && note.aiGenerated || 
      note.type === activeTab
    )
    .filter(note => 
      searchQuery === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.createdByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

  // Function to create a new note
  const createNewNote = async () => {
    // In a real app, this would call an API to create a new note
    console.log("Creating new note:", {
      patientId,
      title: newNoteTitle,
      content: newNoteContent,
      type: newNoteType
    });
    
    // Reset form and close dialog
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowNewNoteDialog(false);
  };

  // Function to simulate AI transcription and analysis of voice notes
  const processVoiceRecording = async () => {
    // In a real app, this would process the recorded audio and call an AI API
    setIsRecording(false);
    
    // Simulate new AI-generated note
    console.log("Processing voice recording and generating note...");
    
    // Show loading state, etc.
  };

  // Function to toggle voice recording
  const toggleRecording = () => {
    if (isRecording) {
      processVoiceRecording();
    } else {
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  // Function to sign a note (in real app, this would require verification)
  const signNote = (noteId: number) => {
    console.log("Signing note:", noteId);
    // In a real app, this would call an API to update the note status
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Patient Notes</h2>
          <p className="text-muted-foreground">View and manage clinical documentation</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isRecording ? "destructive" : "outline"}
            className="gap-2" 
            onClick={toggleRecording}
          >
            {isRecording ? (
              <>
                <X className="h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Voice Note
              </>
            )}
          </Button>

          <Dialog open={showNewNoteDialog} onOpenChange={setShowNewNoteDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Clinical Note</DialogTitle>
                <DialogDescription>
                  Add a new note to the patient's record
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <label htmlFor="noteTitle" className="text-sm font-medium">
                      Note Title
                    </label>
                    <Input
                      id="noteTitle"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="Enter a title for this note"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="noteType" className="text-sm font-medium">
                      Note Type
                    </label>
                    <select
                      id="noteType"
                      value={newNoteType}
                      onChange={(e) => setNewNoteType(e.target.value as any)}
                      className="w-full p-2 border rounded-md mt-1"
                    >
                      <option value="clinical">Clinical</option>
                      <option value="procedure">Procedure</option>
                      <option value="followup">Follow-up</option>
                      <option value="lab">Lab Results</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="noteContent" className="text-sm font-medium">
                    Note Content
                  </label>
                  <Textarea
                    id="noteContent"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Enter the clinical note details here..."
                    rows={10}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => setNewNoteContent("")}>
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      // In a real app, this would call an AI API to enhance the note
                      console.log("Enhancing note with AI...");
                    }}
                  >
                    <Brain className="h-4 w-4" />
                    Enhance with AI
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewNoteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createNewNote}>
                  Save Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Voice Recording Indicator */}
      {isRecording && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-red-700">Recording in progress...</span>
            <span className="text-red-600 font-mono">
              {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
              {(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600">
              AI is listening and will transcribe your voice note
            </span>
            <Button variant="destructive" size="sm" onClick={() => setIsRecording(false)}>
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Notes Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes by title, content, or tags..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 sm:w-auto w-full">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Notes List */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="procedure">Procedures</TabsTrigger>
          <TabsTrigger value="followup">Follow-ups</TabsTrigger>
          <TabsTrigger value="ai-generated">AI Generated</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-3"></div>
              <p className="text-muted-foreground">Loading patient notes...</p>
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <Card key={note.id} className={note.aiGenerated ? "border-primary/20 bg-primary/5" : ""}>
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle 
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => setSelectedNote(note)}
                        >
                          {note.aiGenerated && <Brain className="h-4 w-4 text-primary" />}
                          {note.title}
                        </CardTitle>
                        <CardDescription>
                          {new Date(note.createdAt).toLocaleString()} by {note.createdByName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {note.type && (
                          <Badge 
                            variant="outline" 
                            className={
                              note.type === "clinical" ? "border-blue-200 text-blue-800" :
                              note.type === "procedure" ? "border-green-200 text-green-800" :
                              note.type === "followup" ? "border-purple-200 text-purple-800" :
                              note.type === "lab" ? "border-amber-200 text-amber-800" :
                              "border-gray-200 text-gray-800"
                            }
                          >
                            {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                          </Badge>
                        )}
                        {note.status === "pending" && (
                          <Badge variant="outline" className="border-orange-200 text-orange-800">
                            Pending Signature
                          </Badge>
                        )}
                        {note.status === "signed" && (
                          <Badge variant="outline" className="border-green-200 text-green-800">
                            Signed
                          </Badge>
                        )}
                        {note.status === "draft" && (
                          <Badge variant="outline" className="border-gray-200 text-gray-800">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div 
                      className="prose prose-sm max-w-none line-clamp-3 cursor-pointer"
                      onClick={() => setSelectedNote(note)}
                    >
                      {note.content}
                    </div>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {note.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-3">
                      {note.status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => signNote(note.id)}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Sign Note
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="gap-1">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1">
                        <FileText className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg border">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No Notes Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                {searchQuery
                  ? `No notes match your search query "${searchQuery}". Try different keywords or clear the search.`
                  : "There are no notes in this category. Create a new note to get started."}
              </p>
              <Button 
                className="mt-4 gap-2"
                onClick={() => setShowNewNoteDialog(true)}
              >
                <Plus className="h-4 w-4" />
                New Note
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Note Detail Dialog */}
      {selectedNote && (
        <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
          <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedNote.aiGenerated && <Brain className="h-5 w-5 text-primary" />}
                    {selectedNote.title}
                  </DialogTitle>
                  <DialogDescription>
                    {new Date(selectedNote.createdAt).toLocaleString()} by {selectedNote.createdByName}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedNote.type && (
                    <Badge 
                      variant="outline" 
                      className={
                        selectedNote.type === "clinical" ? "border-blue-200 text-blue-800" :
                        selectedNote.type === "procedure" ? "border-green-200 text-green-800" :
                        selectedNote.type === "followup" ? "border-purple-200 text-purple-800" :
                        selectedNote.type === "lab" ? "border-amber-200 text-amber-800" :
                        "border-gray-200 text-gray-800"
                      }
                    >
                      {selectedNote.type.charAt(0).toUpperCase() + selectedNote.type.slice(1)}
                    </Badge>
                  )}
                  {selectedNote.status === "pending" && (
                    <Badge variant="outline" className="border-orange-200 text-orange-800">
                      Pending Signature
                    </Badge>
                  )}
                  {selectedNote.status === "signed" && (
                    <Badge variant="outline" className="border-green-200 text-green-800 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Signed
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* AI Summary if available */}
              {selectedNote.aiGenerated && selectedNote.aiSummary && (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
                  <div className="flex items-start gap-3">
                    <Brain className="h-6 w-6 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary mb-1">AI Summary</h4>
                      <p className="text-sm">{selectedNote.aiSummary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Note Content */}
              <div className="border-l-4 border-gray-200 pl-4 py-2 prose max-w-none">
                {selectedNote.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* Tags */}
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4">
                  {selectedNote.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-between w-full items-center">
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
                <div className="flex gap-2">
                  {selectedNote.status === "pending" && (
                    <Button 
                      variant="default" 
                      className="gap-2"
                      onClick={() => signNote(selectedNote.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Sign Note
                    </Button>
                  )}
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Note
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}