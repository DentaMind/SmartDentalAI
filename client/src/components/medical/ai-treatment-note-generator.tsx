import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2, Mic, Edit, FileText, Loader2, X, Check, Save } from 'lucide-react';
import { commonProcedures, isolationMethods, anesthesiaTypes, commonMaterials } from '@/services/ai-treatment-note-generator';

// Define schema for the treatment note form
const treatmentNoteSchema = z.object({
  procedure: z.string().min(1, { message: "Procedure is required" }),
  teeth: z.array(z.string()).min(1, { message: "At least one tooth number is required" }),
  materials: z.array(z.string()).optional(),
  isolation: z.string().optional(),
  anesthesia: z.string().optional(),
  additionalDetails: z.string().optional(),
  patientResponse: z.string().optional(),
});

type TreatmentNoteFormValues = z.infer<typeof treatmentNoteSchema>;

interface AiTreatmentNoteGeneratorProps {
  patientId: number;
  doctorId: number;
  doctorName: string;
  onNoteGenerated: (note: string, category: string) => void;
  existingNote?: string;
}

export function AiTreatmentNoteGenerator({
  patientId,
  doctorId,
  doctorName,
  onNoteGenerated,
  existingNote = "",
}: AiTreatmentNoteGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState(existingNote);
  const [editableNote, setEditableNote] = useState(existingNote);
  const [activeTab, setActiveTab] = useState("form");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<string>("");
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);

  // Form setup
  const form = useForm<TreatmentNoteFormValues>({
    resolver: zodResolver(treatmentNoteSchema),
    defaultValues: {
      procedure: "",
      teeth: [],
      materials: [],
      isolation: "",
      anesthesia: "",
      additionalDetails: "",
      patientResponse: "",
    },
  });

  // Watch for procedure changes to update available materials
  const watchedProcedure = form.watch("procedure");
  useEffect(() => {
    if (watchedProcedure) {
      setSelectedProcedure(watchedProcedure);
      
      // Find materials for this procedure or related category
      let materials: string[] = [];
      
      for (const [category, categoryMaterials] of Object.entries(commonMaterials)) {
        if (watchedProcedure.toLowerCase().includes(category.toLowerCase())) {
          materials = categoryMaterials;
          break;
        }
      }
      
      // Fallback to common materials if none matched
      if (materials.length === 0) {
        if (watchedProcedure.toLowerCase().includes("crown")) {
          materials = commonMaterials["Crown"];
        } else if (watchedProcedure.toLowerCase().includes("root canal")) {
          materials = commonMaterials["Root Canal Therapy"];
        } else if (watchedProcedure.toLowerCase().includes("composite")) {
          materials = commonMaterials["Composite Restoration"];
        } else {
          // Default to composite materials
          materials = commonMaterials["Composite Restoration"];
        }
      }
      
      setAvailableMaterials(materials);
    }
  }, [watchedProcedure]);

  // Simulate voice recording for dictation
  const startVoiceRecording = () => {
    setIsRecording(true);
    
    // Simulating voice recording and transcription
    setTimeout(() => {
      const additionalDetails = form.getValues("additionalDetails") || "";
      const detailsUpdate = additionalDetails + 
        (additionalDetails ? "\n\n" : "") + 
        "Patient tolerated procedure well. Bite was checked and adjusted. Patient was satisfied with the result.";
      
      form.setValue("additionalDetails", detailsUpdate);
      setIsRecording(false);
      
      toast({
        title: "Voice dictation complete",
        description: "Your dictation has been transcribed and added to the note.",
      });
    }, 2000);
  };

  // Generate treatment note based on form data
  const generateTreatmentNote = async (data: TreatmentNoteFormValues) => {
    setIsGenerating(true);
    try {
      // Format date for the note
      const today = new Date().toLocaleDateString();
      
      // Create the structured note
      const teethList = data.teeth.join(', ');
      const materials = data.materials?.join(', ') || 'standard materials';
      
      let note = `${today}: ${data.procedure} performed on tooth/teeth ${teethList}.\n`;
      
      if (data.isolation) {
        note += `Isolation: ${data.isolation}.\n`;
      }
      
      if (data.anesthesia) {
        note += `Anesthesia: ${data.anesthesia}.\n`;
      }
      
      note += `Materials used: ${materials}.\n`;
      
      if (data.additionalDetails) {
        note += `\nProcedure details: ${data.additionalDetails}\n`;
      }
      
      if (data.patientResponse) {
        note += `\nPatient response: ${data.patientResponse}\n`;
      }
      
      // Set the generated note
      setGeneratedNote(note);
      setEditableNote(note);
      setActiveTab("review");
      
      // Simulate a delay for "AI generation"
      await new Promise(resolve => setTimeout(resolve, 800));

    } catch (error) {
      console.error("Error generating treatment note:", error);
      toast({
        variant: "destructive",
        title: "Error generating note",
        description: "There was a problem generating the treatment note.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit edited note to parent component
  const submitEditedNote = () => {
    // Find the closest matching category based on the procedure
    let category = "general";
    if (selectedProcedure.toLowerCase().includes("perio") || selectedProcedure.toLowerCase().includes("scaling")) {
      category = "periodontal";
    } else if (selectedProcedure.toLowerCase().includes("root canal") || selectedProcedure.toLowerCase().includes("pulp")) {
      category = "endodontic";
    } else if (selectedProcedure.toLowerCase().includes("ortho")) {
      category = "orthodontic";
    } else if (selectedProcedure.toLowerCase().includes("composite") || selectedProcedure.toLowerCase().includes("crown") || selectedProcedure.toLowerCase().includes("bridge")) {
      category = "restorative";
    } else if (selectedProcedure.toLowerCase().includes("extract") || selectedProcedure.toLowerCase().includes("surgery")) {
      category = "surgical";
    } else if (selectedProcedure.toLowerCase().includes("prosth") || selectedProcedure.toLowerCase().includes("denture")) {
      category = "prosthodontic";
    } else if (selectedProcedure.toLowerCase().includes("child") || selectedProcedure.toLowerCase().includes("pediatric")) {
      category = "pediatric";
    }
    
    onNoteGenerated(editableNote, category);
    setOpen(false);
    
    toast({
      title: "Note added to form",
      description: "The treatment note has been added to the form. You can now submit it.",
    });
  };

  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
    form.reset();
    setGeneratedNote("");
    setEditableNote("");
    setActiveTab("form");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => setOpen(true)}
        >
          <Wand2 className="h-4 w-4" />
          AI Treatment Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>AI Treatment Note Generator</DialogTitle>
          <DialogDescription>
            Generate detailed treatment notes automatically based on procedure information
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" disabled={isGenerating}>
              <FileText className="h-4 w-4 mr-2" />
              Procedure Details
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!generatedNote}>
              <Edit className="h-4 w-4 mr-2" />
              Review & Edit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(generateTreatmentNote)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="procedure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedure</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select procedure type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonProcedures.map((procedure) => (
                            <SelectItem key={procedure} value={procedure}>
                              {procedure}
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
                  name="teeth"
                  render={() => (
                    <FormItem>
                      <FormLabel>Teeth Involved (comma separated)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 2, 3, 4 or 18" 
                          onChange={(e) => {
                            const teethArray = e.target.value
                              .split(',')
                              .map(t => t.trim())
                              .filter(Boolean);
                            form.setValue('teeth', teethArray);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter tooth numbers using the FDI notation system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isolation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Isolation Method</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select isolation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isolationMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
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
                    name="anesthesia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anesthesia</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select anesthesia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {anesthesiaTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="materials"
                  render={() => (
                    <FormItem>
                      <FormLabel>Materials Used</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {availableMaterials.map((material) => (
                          <div key={material} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`material-${material}`}
                              onCheckedChange={(checked) => {
                                const currentMaterials = form.getValues('materials') || [];
                                
                                if (checked) {
                                  form.setValue('materials', [...currentMaterials, material]);
                                } else {
                                  form.setValue(
                                    'materials', 
                                    currentMaterials.filter(m => m !== material)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`material-${material}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {material}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalDetails"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Additional Procedure Details</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="h-8 gap-1"
                          onClick={startVoiceRecording}
                          disabled={isRecording}
                        >
                          {isRecording ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Recording...
                            </>
                          ) : (
                            <>
                              <Mic className="h-3 w-3" />
                              Dictate
                            </>
                          )}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter procedure details, techniques used, outcomes, etc."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patientResponse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Response</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How did the patient respond to the procedure?"
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isGenerating}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate Note
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="review">
            <div className="space-y-4">
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Generated Treatment Note</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                    AI Generated
                  </Badge>
                </div>
                <Textarea 
                  value={editableNote} 
                  onChange={(e) => setEditableNote(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("form")}
                  disabled={isGenerating}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="gap-1"
                  onClick={submitEditedNote}
                  disabled={!editableNote}
                >
                  <Save className="h-4 w-4" />
                  Use Note
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            Notes are editable after generation and before signing
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}