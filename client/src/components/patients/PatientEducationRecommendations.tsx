import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { BookOpen, Video, FileText, ExternalLink, Bookmark, Info, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Define types for the recommendations API response
interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content_type: 'article' | 'video' | 'pdf' | 'infographic' | 'link';
  category: string;
  content_url?: string;
  content_text?: string;
  thumbnail_url?: string;
  duration?: string;
  author?: string;
  source?: string;
  tags?: string[];
  relevance_score: number;
  recommendation_reason: string;
}

interface EducationalRecommendationsResponse {
  patient_id: string;
  recommendations: EducationalContent[];
  risk_factors_identified: string[];
}

interface PatientEducationRecommendationsProps {
  patientId: string;
  onClose?: () => void;
}

const PatientEducationRecommendations: React.FC<PatientEducationRecommendationsProps> = ({ 
  patientId,
  onClose
}) => {
  const [savedContentIds, setSavedContentIds] = useState<string[]>([]);

  // Fetch education recommendations for the patient
  const { data, isLoading, error } = useQuery<EducationalRecommendationsResponse>({
    queryKey: [`/api/educational-content/recommendations/patient/${patientId}`],
    queryFn: async () => {
      try {
        const res = await axios.get(`/api/educational-content/recommendations/patient/${patientId}`);
        return res.data;
      } catch (err) {
        console.error('Error fetching educational recommendations:', err);
        throw err;
      }
    },
    enabled: !!patientId,
  });

  // Save content to patient's saved resources
  const handleSaveContent = async (contentId: string) => {
    try {
      await axios.post('/api/content-engagement/save', {
        content_id: contentId,
        patient_id: patientId
      });
      
      toast({
        title: "Content Saved",
        description: "This educational content has been saved to your library",
      });
      
      setSavedContentIds(prev => [...prev, contentId]);
    } catch (err) {
      console.error('Error saving content:', err);
      toast({
        title: "Error",
        description: "Could not save the content. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Fetch initially saved content
  useEffect(() => {
    const checkSavedContent = async () => {
      try {
        // Get content IDs from recommendations
        if (data && data.recommendations) {
          const contentIds = data.recommendations.map(content => content.id);
          
          // For each content, check if it's saved
          const savedIds: string[] = [];
          
          for (const contentId of contentIds) {
            const response = await axios.get(`/api/content-engagement/is-saved/${contentId}/${patientId}`);
            if (response.data.is_saved) {
              savedIds.push(contentId);
            }
          }
          
          setSavedContentIds(savedIds);
        }
      } catch (error) {
        console.error("Error checking saved content:", error);
      }
    };
    
    if (patientId && data?.recommendations) {
      checkSavedContent();
    }
  }, [patientId, data]);

  // Record content view
  const recordContentView = async (contentId: string) => {
    try {
      // Record the view
      await axios.post('/api/content-engagement/view', {
        content_id: contentId,
        patient_id: patientId
      });
      
      // After some time, update with completion data
      setTimeout(async () => {
        try {
          const viewResponse = await axios.post('/api/content-engagement/view', {
            content_id: contentId,
            patient_id: patientId
          });
          
          // Update with 100% completion (simulating they read/viewed it)
          if (viewResponse.data.id) {
            await axios.put(`/api/content-engagement/update/${viewResponse.data.id}`, {
              view_duration_seconds: 300, // 5 minutes
              completion_percentage: 100
            });
          }
        } catch (error) {
          console.error("Error updating completion:", error);
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error recording content view:', err);
    }
  };

  // Get appropriate icon for content type
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'infographic':
        return <FileText className="h-4 w-4" />;
      case 'link':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  // Format risk factor for display
  const formatRiskFactor = (factor: string): string => {
    return factor
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get background color class based on relevance score
  const getRelevanceClass = (score: number): string => {
    if (score >= 0.7) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 0.4) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  // Get button text based on content type
  const getActionButtonText = (type: string): string => {
    switch (type) {
      case 'video':
        return 'Watch Video';
      case 'pdf':
        return 'View PDF';
      case 'link':
        return 'Visit Link';
      case 'infographic':
        return 'View Infographic';
      default:
        return 'Read Article';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-12">
            <LoadingAnimation />
            <p className="ml-3 text-muted-foreground">Loading educational recommendations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="text-lg font-medium mb-2">Failed to load recommendations</h3>
            <p className="text-muted-foreground mb-4">There was an error loading educational content.</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { recommendations, risk_factors_identified } = data;

  // If no recommendations available
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Educational Resources</CardTitle>
          <CardDescription>Personalized educational content for this patient</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <Info className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No personalized recommendations available</h3>
            <p className="text-muted-foreground mb-4">
              We don't have specific educational content for this patient's risk profile yet.
            </p>
            <Button asChild>
              <a href="/education-library" target="_blank">Browse General Resources</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Educational Resources</CardTitle>
        <CardDescription>
          Personalized educational content based on patient risk factors
        </CardDescription>
        
        {risk_factors_identified.length > 0 && (
          <div className="mt-2">
            <p className="text-sm mb-1.5">Identified risk factors:</p>
            <div className="flex flex-wrap gap-1.5">
              {risk_factors_identified.map((factor) => (
                <Badge key={factor} variant="outline">
                  {formatRiskFactor(factor)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="articles">Articles & PDFs</TabsTrigger>
          </TabsList>
          
          {/* All Resources Tab */}
          <TabsContent value="all">
            <div className="space-y-4">
              {recommendations.map((content) => (
                <Card key={content.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {content.thumbnail_url && (
                      <div className="sm:w-1/4 h-32 sm:h-full bg-muted">
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <p className="text-muted-foreground">Thumbnail</p>
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex-1 ${content.thumbnail_url ? 'sm:w-3/4' : 'w-full'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              {getContentTypeIcon(content.content_type)}
                              <CardTitle className="text-base">{content.title}</CardTitle>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              {content.duration && <span className="mr-2">{content.duration}</span>}
                              {content.source && <span>Source: {content.source}</span>}
                            </div>
                          </div>
                          <Badge 
                            className={getRelevanceClass(content.relevance_score)}
                            variant="outline"
                          >
                            {Math.round(content.relevance_score * 100)}% Match
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <p className="text-sm mb-2">{content.description}</p>
                        <p className="text-xs text-muted-foreground italic">
                          {content.recommendation_reason}
                        </p>
                      </CardContent>
                      
                      <div className="px-6 pb-4 flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSaveContent(content.id)}
                          disabled={savedContentIds.includes(content.id)}
                        >
                          <Bookmark className="h-4 w-4 mr-2" />
                          {savedContentIds.includes(content.id) ? 'Saved' : 'Save'}
                        </Button>
                        
                        <Button 
                          size="sm" 
                          asChild
                          onClick={() => recordContentView(content.id)}
                        >
                          <a 
                            href={content.content_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {getActionButtonText(content.content_type)}
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="space-y-4">
              {recommendations
                .filter(content => content.content_type === 'video')
                .map((content) => (
                  <Card key={content.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {content.thumbnail_url && (
                        <div className="sm:w-1/4 h-32 sm:h-full bg-muted relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="h-10 w-10 text-muted-foreground opacity-50" />
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex-1 ${content.thumbnail_url ? 'sm:w-3/4' : 'w-full'}`}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{content.title}</CardTitle>
                              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                {content.duration && <span className="mr-2">{content.duration}</span>}
                                {content.source && <span>Source: {content.source}</span>}
                              </div>
                            </div>
                            <Badge 
                              className={getRelevanceClass(content.relevance_score)}
                              variant="outline"
                            >
                              {Math.round(content.relevance_score * 100)}% Match
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <p className="text-sm">{content.description}</p>
                        </CardContent>
                        
                        <div className="px-6 pb-4 flex justify-end">
                          <Button 
                            size="sm" 
                            asChild
                            onClick={() => recordContentView(content.id)}
                          >
                            <a 
                              href={content.content_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              Watch Video
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {recommendations.filter(content => content.content_type === 'video').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No video resources available for this patient.
                  </div>
                )}
            </div>
          </TabsContent>
          
          {/* Articles Tab */}
          <TabsContent value="articles">
            <div className="space-y-4">
              {recommendations
                .filter(content => ['article', 'pdf'].includes(content.content_type))
                .map((content) => (
                  <Card key={content.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            {getContentTypeIcon(content.content_type)}
                            <CardTitle className="text-base">{content.title}</CardTitle>
                          </div>
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            {content.duration && <span className="mr-2">{content.duration}</span>}
                            {content.source && <span>Source: {content.source}</span>}
                          </div>
                        </div>
                        <Badge 
                          className={getRelevanceClass(content.relevance_score)}
                          variant="outline"
                        >
                          {Math.round(content.relevance_score * 100)}% Match
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm mb-3">{content.description}</p>
                      {content.tags && content.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {content.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground italic">
                        {content.recommendation_reason}
                      </p>
                    </CardContent>
                    
                    <div className="px-6 pb-4 flex justify-end">
                      <Button 
                        size="sm" 
                        asChild
                        onClick={() => recordContentView(content.id)}
                      >
                        <a 
                          href={content.content_url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {content.content_type === 'pdf' ? 'View PDF' : 'Read Article'}
                        </a>
                      </Button>
                    </div>
                  </Card>
                ))}
                
                {recommendations.filter(content => ['article', 'pdf'].includes(content.content_type)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No articles or PDFs available for this patient.
                  </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PatientEducationRecommendations; 