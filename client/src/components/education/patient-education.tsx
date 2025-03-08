import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search, FilePlus2, Heart, Smile, AlertCircle } from "lucide-react";

interface EducationResource {
  title: string;
  description: string;
  type: "video" | "article" | "interactive";
  length: string;
}

interface EducationResourcesMap {
  preventive: EducationResource[];
  restorative: EducationResource[];
  periodontal: EducationResource[];
  emergency: EducationResource[];
  [key: string]: EducationResource[]; // Index signature
}

interface CategoryItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export function PatientEducation() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock education categories
  const categories: CategoryItem[] = [
    { id: "preventive", label: "Preventive Care", icon: <FilePlus2 className="h-4 w-4 mr-2" /> },
    { id: "restorative", label: "Restorative", icon: <Smile className="h-4 w-4 mr-2" /> },
    { id: "periodontal", label: "Periodontal", icon: <Heart className="h-4 w-4 mr-2" /> },
    { id: "emergency", label: "Emergency Care", icon: <AlertCircle className="h-4 w-4 mr-2" /> },
  ];

  // Mock education resources 
  const educationResources: EducationResourcesMap = {
    preventive: [
      {
        title: "Proper Brushing Techniques",
        description: "Learn the correct way to brush your teeth to prevent cavities and maintain oral health.",
        type: "video",
        length: "4 minutes",
      },
      {
        title: "Importance of Regular Dental Checkups",
        description: "Why seeing your dentist regularly is crucial for preventing serious dental issues.",
        type: "article",
        length: "3 min read",
      },
      {
        title: "Flossing 101: A Comprehensive Guide",
        description: "Everything you need to know about flossing properly to maintain gum health.",
        type: "interactive",
        length: "5 minutes",
      },
    ],
    restorative: [
      {
        title: "Understanding Dental Implants",
        description: "What you need to know about dental implants as a long-term solution for missing teeth.",
        type: "article",
        length: "5 min read",
      },
      {
        title: "The Crown Procedure Explained",
        description: "Step-by-step explanation of what happens during a dental crown procedure.",
        type: "video",
        length: "7 minutes",
      },
      {
        title: "Caring for Your New Fillings",
        description: "How to properly care for new dental fillings to ensure they last as long as possible.",
        type: "article",
        length: "4 min read",
      },
    ],
    periodontal: [
      {
        title: "Warning Signs of Gum Disease",
        description: "Learn to recognize the early symptoms of periodontal disease before it progresses.",
        type: "interactive",
        length: "6 minutes",
      },
      {
        title: "Deep Cleaning: Scaling and Root Planing",
        description: "What to expect during a deep cleaning procedure for treating gum disease.",
        type: "video",
        length: "8 minutes",
      },
      {
        title: "Living with Receding Gums",
        description: "Tips and treatment options for managing receding gums and preventing further regression.",
        type: "article",
        length: "6 min read",
      },
    ],
    emergency: [
      {
        title: "Handling a Knocked-Out Tooth",
        description: "Emergency steps to take if you or someone else has a tooth knocked out.",
        type: "article",
        length: "2 min read",
      },
      {
        title: "Managing Severe Dental Pain",
        description: "Temporary relief measures for severe tooth pain until you can see a dentist.",
        type: "video",
        length: "5 minutes",
      },
      {
        title: "What Constitutes a Dental Emergency?",
        description: "How to determine if your dental issue requires immediate emergency attention.",
        type: "article",
        length: "3 min read",
      },
    ],
  };

  // Filter resources based on search query
  const filterResources = (resources: EducationResource[]): EducationResource[] => {
    if (!searchQuery) return resources;
    return resources.filter(
      (resource) =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Render resource card
  const ResourceCard = ({ resource }: { resource: EducationResource }) => (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{resource.title}</CardTitle>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {resource.type}
          </span>
        </div>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {resource.length}
          </span>
          <button className="text-sm font-medium text-primary hover:underline">
            View Resource
          </button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search educational resources..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="preventive" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center">
              {category.icon}
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(educationResources).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterResources(educationResources[category]).map((resource, index) => (
                <ResourceCard key={index} resource={resource} />
              ))}
            </div>
            {filterResources(educationResources[category]).length === 0 && (
              <div className="text-center py-10">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No resources found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search query to find what you're looking for.
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}