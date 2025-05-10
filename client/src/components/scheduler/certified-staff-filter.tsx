import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Filter } from 'lucide-react';

interface CertifiedStaffFilterProps {
  onFilterChange: (filters: any) => void;
  totalStaff?: number;
  certifiedCount?: number;
  uncertifiedCount?: number;
}

export function CertifiedStaffFilter({
  onFilterChange,
  totalStaff = 0,
  certifiedCount = 0,
  uncertifiedCount = 0
}: CertifiedStaffFilterProps) {
  const [showCertified, setShowCertified] = useState(true);
  const [showUncertified, setShowUncertified] = useState(true);
  const [showHipaaCertified, setShowHipaaCertified] = useState(true);
  const [showOshaCertified, setShowOshaCertified] = useState(true);
  const [showAdaCertified, setShowAdaCertified] = useState(true);
  
  // Apply filters when they change
  useEffect(() => {
    onFilterChange({
      showCertified,
      showUncertified,
      showHipaaCertified,
      showOshaCertified,
      showAdaCertified
    });
  }, [showCertified, showUncertified, showHipaaCertified, showOshaCertified, showAdaCertified, onFilterChange]);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium">Filter Schedule</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2">
              <span>Total Staff:</span>
              <span className="font-semibold">{totalStaff}</span>
            </Badge>
            
            <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2 bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Certified:</span>
              <span className="font-semibold">{certifiedCount}</span>
            </Badge>
            
            <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2 bg-red-50 border-red-200 text-red-700">
              <XCircle className="h-3.5 w-3.5" />
              <span>Incomplete:</span> 
              <span className="font-semibold">{uncertifiedCount}</span>
            </Badge>
          </div>
        </div>
        
        <div className="border-t mt-4 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-certified" 
              checked={showCertified}
              onCheckedChange={(checked) => {
                setShowCertified(checked === true);
              }}
            />
            <label
              htmlFor="show-certified"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
            >
              <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
              Show Certified Staff
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-uncertified" 
              checked={showUncertified}
              onCheckedChange={(checked) => {
                setShowUncertified(checked === true);
              }}
            />
            <label
              htmlFor="show-uncertified"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
            >
              <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
              Show Uncertified Staff
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-hipaa" 
              checked={showHipaaCertified}
              onCheckedChange={(checked) => {
                setShowHipaaCertified(checked === true);
              }}
            />
            <label
              htmlFor="show-hipaa"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              HIPAA Certified
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-osha" 
              checked={showOshaCertified}
              onCheckedChange={(checked) => {
                setShowOshaCertified(checked === true);
              }}
            />
            <label
              htmlFor="show-osha"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              OSHA Certified
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-ada" 
              checked={showAdaCertified}
              onCheckedChange={(checked) => {
                setShowAdaCertified(checked === true);
              }}
            />
            <label
              htmlFor="show-ada"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              ADA Certified
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}