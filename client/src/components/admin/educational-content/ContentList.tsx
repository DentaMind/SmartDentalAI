import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import {
  BookOpen,
  Video,
  FileText,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  Filter,
  ExternalLink,
  Image,
} from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content_type: "article" | "video" | "pdf" | "infographic" | "link";
  category: string;
  content_url?: string;
  content_text?: string;
  thumbnail_url?: string;
  duration?: string;
  author?: string;
  source?: string;
  tags?: string[];
  priority: number;
  is_featured: boolean;
  target_risk_factors: string[];
  view_count: number;
  completion_rate: number;
  created_at: string;
  updated_at?: string;
}

const ContentList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contentType, setContentType] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [riskFactor, setRiskFactor] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery<EducationalContent[]>({
    queryKey: ["educational-content", page, limit, searchQuery, contentType, category, riskFactor],
    queryFn: async () => {
      let url = `/api/educational-content?skip=${(page - 1) * limit}&limit=${limit}`;
      
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (contentType) url += `&content_type=${encodeURIComponent(contentType)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (riskFactor) url += `&risk_factor=${encodeURIComponent(riskFactor)}`;
      
      const response = await axios.get(url);
      return response.data;
    },
    enabled: true,
  });

  const deleteContent = async (id: string) => {
    try {
      await axios.delete(`/api/educational-content/${id}`);
      toast({
        title: "Content deleted",
        description: "The educational content has been successfully deleted.",
      });
      refetch();
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        title: "Error",
        description: "Failed to delete the content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "infographic":
        return <Image className="h-4 w-4" />;
      case "link":
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingAnimation />
        <span className="ml-2">Loading educational content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-destructive">
        <p>Error loading content: {(error as any).message}</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search content..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="article">Articles</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="infographic">Infographics</SelectItem>
              <SelectItem value="link">Links</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={riskFactor} onValueChange={setRiskFactor}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by risk factor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All risk factors</SelectItem>
              <SelectItem value="smoking">Smoking</SelectItem>
              <SelectItem value="diabetes">Diabetes</SelectItem>
              <SelectItem value="poor_hygiene">Poor Hygiene</SelectItem>
              <SelectItem value="heart_disease">Heart Disease</SelectItem>
              <SelectItem value="periodontal_disease">Periodontal Disease</SelectItem>
              <SelectItem value="caries_risk">Caries Risk</SelectItem>
              <SelectItem value="pregnancy">Pregnancy</SelectItem>
              <SelectItem value="high_blood_pressure">High Blood Pressure</SelectItem>
              <SelectItem value="dental_anxiety">Dental Anxiety</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Risk Factors</TableHead>
              <TableHead>Views</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        {getContentTypeIcon(content.content_type)}
                      </div>
                      <div>
                        <div>{content.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-md">
                          {content.description}
                        </div>
                        {content.is_featured && (
                          <Badge className="mt-1" variant="outline">Featured</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {content.content_type.charAt(0).toUpperCase() + content.content_type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {content.target_risk_factors.map((factor, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {factor.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{content.view_count}</div>
                    <div className="text-xs text-muted-foreground">
                      {content.completion_rate}% completion
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => window.location.href = `/admin/educational-content/edit/${content.id}`}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(content.content_url || `#/content/${content.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Content
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setConfirmDelete(content.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No educational content found. Add some content to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing <span className="font-medium">{data?.length || 0}</span> of{" "}
          <span className="font-medium">many</span> results
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive={page === 1} onClick={(e) => {
                e.preventDefault();
                setPage(1);
              }}>
                1
              </PaginationLink>
            </PaginationItem>
            {page > 3 && <PaginationEllipsis />}
            {page > 2 && (
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => {
                  e.preventDefault();
                  setPage(page - 1);
                }}>
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            )}
            {page > 1 && page < 10 && (
              <PaginationItem>
                <PaginationLink href="#" isActive={true} onClick={(e) => {
                  e.preventDefault();
                }}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink href="#" onClick={(e) => {
                e.preventDefault();
                setPage(page + 1);
              }}>
                {page + 1}
              </PaginationLink>
            </PaginationItem>
            <PaginationEllipsis />
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Educational Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this educational content? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteContent(confirmDelete)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentList; 