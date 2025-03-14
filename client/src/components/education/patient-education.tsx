import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  BookOpen, 
  Video, 
  FileText, 
  Image, 
  Star, 
  Clock, 
  ArrowDownToLine, 
  Share2, 
  Printer, 
  Bookmark,
  PlayCircle
} from 'lucide-react';

export function PatientEducation() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock educational resources
  const resources = [
    {
      id: 1,
      title: 'Understanding Dental X-Rays: Safety and Benefits',
      type: 'article',
      thumbnail: '/images/xray-education.jpg',
      duration: '5 min read',
      category: 'diagnostics',
      featured: true,
      description: 'Learn about the safety of dental x-rays, radiation exposure levels, and why they are essential diagnostic tools.',
      tags: ['x-rays', 'radiation', 'safety', 'diagnostics']
    },
    {
      id: 2,
      title: 'Root Canal Treatment: What to Expect',
      type: 'video',
      thumbnail: '/images/root-canal.jpg',
      duration: '3:45',
      category: 'endodontics',
      featured: true,
      description: 'A visual guide to root canal treatment, explaining the procedure steps and recovery process.',
      tags: ['root canal', 'endodontics', 'procedure', 'pain management']
    },
    {
      id: 3,
      title: 'Proper Brushing and Flossing Techniques',
      type: 'video',
      thumbnail: '/images/brushing.jpg',
      duration: '4:12',
      category: 'oral hygiene',
      featured: false,
      description: 'Learn the correct techniques for brushing and flossing to maintain optimal oral health.',
      tags: ['brushing', 'flossing', 'oral hygiene', 'prevention']
    },
    {
      id: 4,
      title: 'Understanding Periodontal Disease',
      type: 'article',
      thumbnail: '/images/perio-disease.jpg',
      duration: '7 min read',
      category: 'periodontics',
      featured: false,
      description: 'An in-depth look at gum disease causes, symptoms, treatments, and prevention strategies.',
      tags: ['periodontal', 'gum disease', 'bleeding gums', 'gingivitis']
    },
    {
      id: 5,
      title: 'Dental Implants: The Modern Solution for Missing Teeth',
      type: 'pdf',
      thumbnail: '/images/implants.jpg',
      duration: '3 pages',
      category: 'restorative',
      featured: false,
      description: 'Comprehensive guide to dental implant procedures, benefits, and care instructions.',
      tags: ['implants', 'missing teeth', 'prosthetics', 'surgery']
    },
    {
      id: 6,
      title: 'Managing Dental Anxiety',
      type: 'article',
      thumbnail: '/images/dental-anxiety.jpg',
      duration: '4 min read',
      category: 'patient comfort',
      featured: false,
      description: 'Techniques and strategies to help patients overcome fear and anxiety related to dental visits.',
      tags: ['anxiety', 'fear', 'relaxation', 'sedation']
    }
  ];
  
  const categories = [
    { id: 'all', name: 'All Resources' },
    { id: 'diagnostics', name: 'Diagnostics' },
    { id: 'endodontics', name: 'Root Canal Treatment' },
    { id: 'oral hygiene', name: 'Oral Hygiene' },
    { id: 'periodontics', name: 'Periodontal Care' },
    { id: 'restorative', name: 'Restorative Procedures' },
    { id: 'orthodontics', name: 'Orthodontics' },
    { id: 'pediatric', name: 'Pediatric Dentistry' }
  ];
  
  const filteredResources = searchQuery 
    ? resources.filter(resource => 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : resources;
  
  const featuredResources = resources.filter(resource => resource.featured);
  
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };
  
  const getDurationIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <Clock className="h-4 w-4 mr-1 text-muted-foreground" />;
      case 'video':
        return <PlayCircle className="h-4 w-4 mr-1 text-muted-foreground" />;
      case 'pdf':
        return <FileText className="h-4 w-4 mr-1 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 mr-1 text-muted-foreground" />;
    }
  };
  
  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'diagnostics':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'endodontics':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'oral hygiene':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'periodontics':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'restorative':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'patient comfort':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Patient Education Library</h2>
          <p className="text-muted-foreground">
            Resources to help patients understand dental procedures and oral health
          </p>
        </div>
        
        <div className="relative w-full md:w-[300px]">
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
      
      <Tabs defaultValue="featured" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="all">
              <BookOpen className="h-4 w-4 mr-2" />
              All Resources
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="articles">
              <FileText className="h-4 w-4 mr-2" />
              Articles
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="featured" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredResources.map(resource => (
              <Card key={resource.id} className="overflow-hidden">
                <div className="h-40 bg-muted flex items-center justify-center">
                  {resource.type === 'video' && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <PlayCircle className="h-12 w-12 text-white" />
                      </div>
                      <p className="text-muted-foreground">Video Thumbnail</p>
                    </div>
                  )}
                  {resource.type !== 'video' && (
                    <div className="text-center">
                      {getResourceIcon(resource.type)}
                      <p className="text-sm text-muted-foreground mt-2">Resource Image</p>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryBadgeStyle(resource.category)}>
                      {resource.category}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      {getDurationIcon(resource.type)}
                      <span>{resource.duration}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {resource.description}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm">
                    {resource.type === 'video' ? (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Play
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4 mr-2" />
                        View
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <div className="flex overflow-x-auto pb-2 mb-4 gap-2">
            {categories.map(category => (
              <Button 
                key={category.id} 
                variant={category.id === 'all' ? 'default' : 'outline'} 
                size="sm"
              >
                {category.name}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map(resource => (
              <Card key={resource.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-primary/10 p-2 rounded">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                      <div className="flex items-center mt-1">
                        {getDurationIcon(resource.type)}
                        <span className="text-xs text-muted-foreground">{resource.duration}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getCategoryBadgeStyle(resource.category)}>
                    {resource.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <ArrowDownToLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button size="sm">
                    {resource.type === 'video' ? 'Watch Video' : 'Read More'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="videos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources
              .filter(resource => resource.type === 'video')
              .map(resource => (
                <Card key={resource.id} className="overflow-hidden">
                  <div className="h-40 bg-muted flex items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <PlayCircle className="h-12 w-12 text-white" />
                      </div>
                      <p className="text-muted-foreground">Video Thumbnail</p>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <div className="flex items-center justify-between">
                      <Badge className={getCategoryBadgeStyle(resource.category)}>
                        {resource.category}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <PlayCircle className="h-4 w-4 mr-1" />
                        <span>{resource.duration}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch Video
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="articles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources
              .filter(resource => resource.type === 'article' || resource.type === 'pdf')
              .map(resource => (
                <Card key={resource.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      {getResourceIcon(resource.type)}
                    </div>
                    <CardDescription>
                      <div className="flex items-center mt-1">
                        {getDurationIcon(resource.type)}
                        <span>{resource.duration}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className={`${getCategoryBadgeStyle(resource.category)} mb-2`}>
                      {resource.category}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {resource.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read Article
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}