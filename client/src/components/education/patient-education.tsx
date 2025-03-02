
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, Share2 } from 'lucide-react';

interface EducationMaterial {
  id: string;
  title: string;
  category: string;
  description: string;
  contentType: 'video' | 'article' | 'illustration';
  content: string;
  thumbnailUrl?: string;
}

const EDUCATION_CATEGORIES = [
  'Preventive Care',
  'Periodontal Disease',
  'Endodontics',
  'Restorative',
  'Prosthodontics',
  'Oral Surgery',
  'Pediatric Dentistry',
  'Orthodontics'
];

export function PatientEducation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [materials, setMaterials] = useState<EducationMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<EducationMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fetching education materials
  useEffect(() => {
    // In a real implementation, replace with API call
    setTimeout(() => {
      const dummyMaterials: EducationMaterial[] = [
        {
          id: '1',
          title: 'Understanding Periodontal Disease',
          category: 'Periodontal Disease',
          description: 'Learn about the causes, symptoms, and treatments for gum disease.',
          contentType: 'video',
          content: 'https://example.com/videos/periodontal-disease.mp4',
          thumbnailUrl: 'https://example.com/thumbnails/perio.jpg'
        },
        {
          id: '2',
          title: 'Root Canal Therapy Explained',
          category: 'Endodontics',
          description: 'A detailed explanation of what happens during root canal treatment.',
          contentType: 'article',
          content: 'Root canal therapy is a treatment used to repair and save a tooth that is badly decayed or infected...'
        },
        {
          id: '3',
          title: 'Proper Brushing Techniques',
          category: 'Preventive Care',
          description: 'Step-by-step guide to effective tooth brushing.',
          contentType: 'illustration',
          content: 'https://example.com/illustrations/brushing.png'
        },
        {
          id: '4',
          title: 'Dental Implant Process',
          category: 'Prosthodontics',
          description: 'The complete guide to dental implant procedure and recovery.',
          contentType: 'video',
          content: 'https://example.com/videos/implant-process.mp4',
          thumbnailUrl: 'https://example.com/thumbnails/implant.jpg'
        },
        {
          id: '5',
          title: 'Wisdom Teeth Extraction',
          category: 'Oral Surgery',
          description: 'Information about wisdom teeth removal procedure and aftercare.',
          contentType: 'article',
          content: 'Wisdom teeth extraction is a surgical procedure to remove one or more wisdom teeth...'
        }
      ];
      
      setMaterials(dummyMaterials);
      setFilteredMaterials(dummyMaterials);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter materials based on category and search query
  useEffect(() => {
    let filtered = materials;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredMaterials(filtered);
  }, [searchQuery, activeCategory, materials]);

  // Render content based on type
  const renderContent = (material: EducationMaterial) => {
    switch (material.contentType) {
      case 'video':
        return (
          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
            {material.thumbnailUrl ? (
              <img src={material.thumbnailUrl} alt={material.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">Video Preview</span>
              </div>
            )}
          </div>
        );
      case 'article':
        return (
          <div className="prose prose-sm max-w-none">
            <p className="line-clamp-3">{material.content}</p>
            <Button variant="link" className="p-0">Read more</Button>
          </div>
        );
      case 'illustration':
        return (
          <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">Illustration</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Patient Education Library</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search materials..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All Categories</TabsTrigger>
          {EDUCATION_CATEGORIES.map(category => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeCategory} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="opacity-70 animate-pulse">
                  <CardHeader className="h-24 bg-gray-100"></CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-4 bg-gray-100 rounded mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredMaterials.map(material => (
                <Card key={material.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-100 text-primary-800">
                      {material.category}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{material.description}</p>
                    {renderContent(material)}
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No education materials found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
