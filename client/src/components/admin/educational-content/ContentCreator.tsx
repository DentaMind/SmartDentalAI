import React, { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, FileUp, Link, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingAnimation } from "@/components/ui/loading-animation";

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  content_type: z.enum(["article", "video", "pdf", "infographic", "link"]),
  category: z.string(),
  content_url: z.string().optional(),
  content_text: z.string().optional(),
  thumbnail_url: z.string().optional(),
  duration: z.string().optional(),
  author: z.string().optional(),
  source: z.string().optional(),
  priority: z.number().int().min(0).max(100).default(0),
  is_featured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  target_risk_factors: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

const riskFactors = [
  { id: "smoking", label: "Smoking" },
  { id: "diabetes", label: "Diabetes" },
  { id: "poor_hygiene", label: "Poor Hygiene" },
  { id: "heart_disease", label: "Heart Disease" },
  { id: "periodontal_disease", label: "Periodontal Disease" },
  { id: "caries_risk", label: "Caries Risk" },
  { id: "pregnancy", label: "Pregnancy" },
  { id: "high_blood_pressure", label: "High Blood Pressure" },
  { id: "dental_anxiety", label: "Dental Anxiety" },
  { id: "immunocompromised", label: "Immunocompromised" },
];

const categories = [
  { id: "general", label: "General" },
  { id: "oral_hygiene", label: "Oral Hygiene" },
  { id: "periodontal", label: "Periodontal" },
  { id: "restorative", label: "Restorative" },
  { id: "endodontic", label: "Endodontic" },
  { id: "surgical", label: "Surgical" },
  { id: "preventive", label: "Preventive" },
  { id: "orthodontic", label: "Orthodontic" },
  { id: "pediatric", label: "Pediatric" },
  { id: "nutrition", label: "Nutrition" },
  { id: "smoking_cessation", label: "Smoking Cessation" },
  { id: "diabetes", label: "Diabetes" },
];

const ContentCreator: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentFilePreview, setContentFilePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      content_type: "article",
      category: "general",
      content_url: "",
      content_text: "",
      thumbnail_url: "",
      duration: "",
      author: "",
      source: "",
      priority: 0,
      is_featured: false,
      tags: [],
      target_risk_factors: [],
    },
  });

  // Content type affects required fields
  const contentType = form.watch("content_type");

  // Handle tag input
  const handleTagsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        const newTags = [...tags, tagInput.trim()];
        setTags(newTags);
        form.setValue("tags", newTags);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  // Handle file uploads
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setContentFile(file);
      
      // For PDF preview, we'll just show the filename
      setContentFilePreview(file.name);
    }
  };

  // Upload files to server/storage
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  // Form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Handle file uploads if needed
      if (thumbnailFile) {
        const thumbnailUrl = await uploadFile(thumbnailFile);
        values.thumbnail_url = thumbnailUrl;
      }
      
      if (contentFile && (contentType === "pdf" || contentType === "infographic")) {
        const contentUrl = await uploadFile(contentFile);
        values.content_url = contentUrl;
      }
      
      // Set tags
      values.tags = tags;
      
      // Send data to API
      await axios.post("/api/educational-content", values);
      
      // Show success message
      toast({
        title: "Content Created",
        description: "Your educational content has been successfully created.",
      });
      
      // Reset form
      form.reset();
      setTags([]);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setContentFile(null);
      setContentFilePreview(null);
      
    } catch (error) {
      console.error("Error creating content:", error);
      toast({
        title: "Error",
        description: "Failed to create content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 dark:text-white">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Title of the educational content" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the content" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="content_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select 
                      defaultValue={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="infographic">Infographic</SelectItem>
                        <SelectItem value="link">External Link</SelectItem>
                      </SelectContent>
                    </Select>
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
                      defaultValue={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Content author" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Content source" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. '5 min read' or '3:45'" {...field} />
                    </FormControl>
                    <FormDescription>
                      Length of content (time to read/watch)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (0-100)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Higher values are shown first
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Featured Content</FormLabel>
                    <FormDescription>
                      Featured content appears prominently in the education library
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-6">
            {/* Content based on type */}
            {contentType === "article" && (
              <FormField
                control={form.control}
                name="content_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter article content (HTML supported)" 
                        rows={10} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      You can use HTML tags for formatting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {(contentType === "video" || contentType === "link") && (
              <FormField
                control={form.control}
                name="content_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input 
                          placeholder={
                            contentType === "video" 
                              ? "Enter video URL (YouTube, Vimeo, etc.)" 
                              : "Enter external link URL"
                          } 
                          {...field} 
                        />
                        {field.value && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(field.value, '_blank')}
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {(contentType === "pdf" || contentType === "infographic") && (
              <FormItem>
                <FormLabel>Upload File</FormLabel>
                <FormControl>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contentType === "pdf" ? "PDF" : "Image"} (MAX 10MB)
                          </p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept={contentType === "pdf" ? ".pdf" : "image/*"} 
                          onChange={handleContentFileChange}
                        />
                      </label>
                    </div>
                    {contentFilePreview && (
                      <div className="mt-2 p-2 border rounded flex items-center justify-between">
                        <span className="text-sm truncate">{contentFilePreview}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setContentFile(null);
                            setContentFilePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  {contentType === "pdf" 
                    ? "Upload a PDF document" 
                    : "Upload an infographic image"
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
            
            {/* Thumbnail */}
            <div>
              <FormLabel>Thumbnail Image (Optional)</FormLabel>
              <div className="mt-2">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted/50">
                    {thumbnailPreview ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <img 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          className="w-full h-full object-cover" 
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setThumbnailFile(null);
                            setThumbnailPreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG or GIF (MAX 5MB)
                        </p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleThumbnailChange}
                    />
                  </label>
                </div>
              </div>
              <FormDescription className="mt-2">
                Add a thumbnail image to make the content more appealing
              </FormDescription>
            </div>
            
            {/* Tags */}
            <div>
              <FormLabel>Tags</FormLabel>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <Input 
                    type="text" 
                    placeholder="Add tags and press Enter" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagsKeyDown}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (tagInput && !tags.includes(tagInput.trim())) {
                        const newTags = [...tags, tagInput.trim()];
                        setTags(newTags);
                        form.setValue("tags", newTags);
                        setTagInput("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              <FormDescription className="mt-2">
                Add relevant tags to help with content discovery
              </FormDescription>
            </div>
            
            {/* Risk Factors */}
            <FormField
              control={form.control}
              name="target_risk_factors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Risk Factors</FormLabel>
                  <div className="mt-2 space-y-3">
                    {riskFactors.map((riskFactor) => (
                      <div key={riskFactor.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`risk-${riskFactor.id}`}
                          checked={field.value?.includes(riskFactor.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, riskFactor.id]);
                            } else {
                              field.onChange(field.value.filter((id) => id !== riskFactor.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`risk-${riskFactor.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {riskFactor.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormDescription>
                    Select the patient risk factors this content targets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingAnimation className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Content'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ContentCreator; 