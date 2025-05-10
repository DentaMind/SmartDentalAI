import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Check,
  X
} from 'lucide-react';

// Define types based on backend schemas
type ContentType = 'article' | 'video' | 'pdf' | 'infographic' | 'link';
type ContentCategory = 
  | 'general'
  | 'oral_hygiene'
  | 'periodontal'
  | 'restorative'
  | 'endodontic'
  | 'surgical'
  | 'preventive'
  | 'orthodontic'
  | 'pediatric'
  | 'nutrition'
  | 'smoking_cessation'
  | 'diabetes';

type RiskFactor = 
  | 'smoking'
  | 'diabetes'
  | 'poor_hygiene'
  | 'heart_disease'
  | 'periodontal_disease'
  | 'caries_risk'
  | 'pregnancy'
  | 'high_blood_pressure'
  | 'immunocompromised'
  | 'dental_anxiety';

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content_type: ContentType;
  category: ContentCategory;
  content_url?: string;
  content_text?: string;
  thumbnail_url?: string;
  duration?: string;
  author?: string;
  source?: string;
  priority: number;
  is_featured: boolean;
  tags: string[];
  target_risk_factors: RiskFactor[];
  created_at: string;
  updated_at?: string;
  view_count: number;
  completion_rate: number;
}

interface EducationalContentFormData {
  title: string;
  description: string;
  content_type: ContentType;
  category: ContentCategory;
  content_url?: string;
  content_text?: string;
  thumbnail_url?: string;
  duration?: string;
  author?: string;
  source?: string;
  priority: number;
  is_featured: boolean;
  tags: string[];
  target_risk_factors: RiskFactor[];
}

// Helper function to get content type icon
const getContentTypeIcon = (type: ContentType) => {
  switch (type) {
    case 'article':
      return <FileText className="h-4 w-4" />;
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'pdf':
      return <FileText className="h-4 w-4" />;
    case 'infographic':
      return <ImageIcon className="h-4 w-4" />;
    case 'link':
      return <LinkIcon className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
};

// Format category or risk factor for display
const formatEnumForDisplay = (value: string): string => {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function EducationalContentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);
  
  // Default form data for new content
  const defaultFormData: EducationalContentFormData = {
    title: '',
    description: '',
    content_type: 'article',
    category: 'general',
    content_url: '',
    content_text: '',
    thumbnail_url: '',
    duration: '',
    author: '',
    source: '',
    priority: 0,
    is_featured: false,
    tags: [],
    target_risk_factors: [],
  };
  
  const [formData, setFormData] = useState<EducationalContentFormData>(defaultFormData);
  const [tagInput, setTagInput] = useState<string>('');
  
  // Fetch educational content
  const { data: contentList, isLoading, error } = useQuery<EducationalContent[]>({
    queryKey: ['/api/educational-content'],
    queryFn: async () => {
      const response = await axios.get('/api/educational-content');
      return response.data;
    },
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: EducationalContentFormData) => {
      const response = await axios.post('/api/educational-content', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/educational-content'] });
      toast({
        title: 'Success',
        description: 'Educational content created successfully',
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EducationalContentFormData }) => {
      const response = await axios.put(`/api/educational-content/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/educational-content'] });
      toast({
        title: 'Success',
        description: 'Educational content updated successfully',
      });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/educational-content/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/educational-content'] });
      toast({
        title: 'Success',
        description: 'Educational content deleted successfully',
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Reset form to default values
  const resetForm = () => {
    setFormData(defaultFormData);
    setTagInput('');
  };
  
  // Handle opening edit dialog with selected content
  const handleEditClick = (content: EducationalContent) => {
    setSelectedContent(content);
    setFormData({
      title: content.title,
      description: content.description,
      content_type: content.content_type,
      category: content.category,
      content_url: content.content_url,
      content_text: content.content_text,
      thumbnail_url: content.thumbnail_url,
      duration: content.duration,
      author: content.author,
      source: content.source,
      priority: content.priority,
      is_featured: content.is_featured,
      tags: [...content.tags],
      target_risk_factors: [...content.target_risk_factors],
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle opening delete confirmation dialog
  const handleDeleteClick = (content: EducationalContent) => {
    setSelectedContent(content);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };
  
  // Handle toggle of risk factor
  const handleToggleRiskFactor = (factor: RiskFactor) => {
    if (formData.target_risk_factors.includes(factor)) {
      setFormData((prev) => ({
        ...prev,
        target_risk_factors: prev.target_risk_factors.filter((f) => f !== factor),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        target_risk_factors: [...prev.target_risk_factors, factor],
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditDialogOpen && selectedContent) {
      updateMutation.mutate({ id: selectedContent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedContent) {
      deleteMutation.mutate(selectedContent.id);
    }
  };
  
  // Filter content based on active tab and search query
  const filteredContent = contentList?.filter((content) => {
    const matchesSearchQuery =
      searchQuery === '' ||
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'all') {
      return matchesSearchQuery;
    }
    
    if (activeTab === 'featured') {
      return content.is_featured && matchesSearchQuery;
    }
    
    // Content type tabs
    return content.content_type === activeTab && matchesSearchQuery;
  });
  
  return (
    <div className="flex h-screen bg-background dark:text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Educational Content Manager</h1>
              <p className="text-muted-foreground mt-1">
                Manage educational resources for patients based on risk factors
              </p>
            </div>
            
            <Button 
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <Tabs 
              defaultValue="all" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="featured">Featured</TabsTrigger>
                <TabsTrigger value="article">Articles</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
                <TabsTrigger value="pdf">PDFs</TabsTrigger>
                <TabsTrigger value="infographic">Infographics</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search resources..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Card className="mt-4">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingAnimation />
                  <span className="ml-2">Loading educational content...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 text-destructive">
                  <p>Error loading content</p>
                  <p className="text-sm text-muted-foreground">Please try again later</p>
                </div>
              ) : filteredContent?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p>No educational content found</p>
                  {searchQuery ? (
                    <p className="text-sm">Try adjusting your search terms</p>
                  ) : (
                    <p className="text-sm">Start by adding some educational resources</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Risk Factors</TableHead>
                      <TableHead className="text-center">Featured</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent?.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="p-2">
                          <div className="bg-primary/10 p-2 rounded-full">
                            {getContentTypeIcon(content.content_type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{content.title}</div>
                            <div className="text-xs text-muted-foreground">{content.description.substring(0, 60)}...</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatEnumForDisplay(content.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {content.target_risk_factors.slice(0, 2).map((factor) => (
                              <Badge key={factor} variant="secondary" className="text-xs">
                                {formatEnumForDisplay(factor)}
                              </Badge>
                            ))}
                            {content.target_risk_factors.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{content.target_risk_factors.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {content.is_featured ? (
                            <Check className="h-4 w-4 mx-auto text-green-500" />
                          ) : (
                            <X className="h-4 w-4 mx-auto text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">{content.view_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(content)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(content)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Add/Edit Content Dialog */}
      <Dialog 
        open={isAddDialogOpen || isEditDialogOpen} 
        onOpenChange={(open) => {
          if (isAddDialogOpen) setIsAddDialogOpen(open);
          if (isEditDialogOpen) setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit Educational Content' : 'Add New Educational Content'}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? 'Update this educational resource for patients'
                : 'Create a new educational resource for patients based on risk factors'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => handleSelectChange('content_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="infographic">Infographic</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value as ContentCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="oral_hygiene">Oral Hygiene</SelectItem>
                    <SelectItem value="periodontal">Periodontal</SelectItem>
                    <SelectItem value="restorative">Restorative</SelectItem>
                    <SelectItem value="endodontic">Endodontic</SelectItem>
                    <SelectItem value="surgical">Surgical</SelectItem>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="orthodontic">Orthodontic</SelectItem>
                    <SelectItem value="pediatric">Pediatric</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="smoking_cessation">Smoking Cessation</SelectItem>
                    <SelectItem value="diabetes">Diabetes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (0-10)</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.priority}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            {formData.content_type === 'article' ? (
              <div className="space-y-2">
                <Label htmlFor="content_text">Article Content</Label>
                <Textarea
                  id="content_text"
                  name="content_text"
                  value={formData.content_text}
                  onChange={handleInputChange}
                  rows={10}
                  placeholder="Enter HTML content for article"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="content_url">Content URL</Label>
                <Input
                  id="content_url"
                  name="content_url"
                  value={formData.content_url}
                  onChange={handleInputChange}
                  placeholder={`Enter URL for ${formData.content_type}`}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleInputChange}
                  placeholder="Image URL for thumbnail"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., '5 min read' or '3:45'"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleCheckboxChange}
                className="rounded border-input"
              />
              <Label htmlFor="is_featured">Featured content (shown prominently)</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Target Risk Factors</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                {(Object.values(RiskFactor) as RiskFactor[]).map((factor) => (
                  <div
                    key={factor}
                    className={`px-3 py-2 rounded-md cursor-pointer text-sm border transition-colors
                      ${
                        formData.target_risk_factors.includes(factor)
                          ? 'bg-primary/10 border-primary'
                          : 'border-input hover:bg-accent hover:text-accent-foreground'
                      }`}
                    onClick={() => handleToggleRiskFactor(factor)}
                  >
                    {formatEnumForDisplay(factor)}
                  </div>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isAddDialogOpen) setIsAddDialogOpen(false);
                  if (isEditDialogOpen) setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <LoadingAnimation className="mr-2" />
                    Saving...
                  </>
                ) : isEditDialogOpen ? (
                  'Update Content'
                ) : (
                  'Add Content'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this educational content?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedContent && (
            <div className="py-4">
              <p className="font-medium">{selectedContent.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedContent.description.substring(0, 100)}...</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <LoadingAnimation className="mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 