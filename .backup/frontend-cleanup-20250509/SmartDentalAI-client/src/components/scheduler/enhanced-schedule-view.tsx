import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CertifiedStaffFilter } from './certified-staff-filter';
import { CertificationAlerts } from './certification-alerts';
import { CertificationBadge } from '../training/certification-badge';
import { CheckCircle, XCircle, ChevronRight, Calendar, User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define certification types enum that matches our schema
type CertificationType = 'hipaa' | 'osha' | 'ada' | 'cpr' | 'infection_control' | 'emergency_protocols' | 'custom';

interface ScheduleSlot {
  time: string;
  patient: string;
  staff: string;
  appointmentType?: string;
  duration?: number;
}

interface StaffCertification {
  hipaa: number;
  osha: number;
  ada: number;
  cpr?: number;
  infection_control?: number;
  emergency_protocols?: number;
}

interface EnhancedScheduleViewProps {
  scheduleData: ScheduleSlot[];
  certificationData: Record<string, StaffCertification>;
  onViewStaffProfile?: (staffName: string) => void;
  onSendReminder?: (staffName: string) => Promise<void>;
  passingScore?: number;
  showAlerts?: boolean;
  date?: Date;
}

export default function EnhancedScheduleView({
  scheduleData,
  certificationData,
  onViewStaffProfile,
  onSendReminder,
  passingScore = 90,
  showAlerts = true,
  date = new Date()
}: EnhancedScheduleViewProps) {
  const { toast } = useToast();
  const [filteredSchedule, setFilteredSchedule] = useState(scheduleData);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Determine certification status for each staff member
  const enhancedSchedule = scheduleData.map(slot => {
    const status = certificationData[slot.staff] || { hipaa: 0, osha: 0, ada: 0 };
    const isCertified = isCertificationComplete(status, passingScore);
    
    // Calculate missing certifications
    const missingCertifications = getMissingCertifications(status, passingScore);
    
    return {
      ...slot,
      isCertified,
      certificationStatus: status,
      missingCertifications
    };
  });

  // Stats for filter display
  const totalStaff = new Set(enhancedSchedule.map(slot => slot.staff)).size;
  const certifiedStaff = new Set(
    enhancedSchedule
      .filter(slot => slot.isCertified)
      .map(slot => slot.staff)
  ).size;
  const uncertifiedStaff = totalStaff - certifiedStaff;

  // Apply filters when they change
  const handleFilterChange = (filters: any) => {
    let filtered = [...enhancedSchedule];
    
    // Filter by certification status
    if (!filters.showCertified) {
      filtered = filtered.filter(slot => !slot.isCertified);
    }
    
    if (!filters.showUncertified) {
      filtered = filtered.filter(slot => slot.isCertified);
    }
    
    // Filter by specific certifications
    if (!filters.showHipaaCertified) {
      filtered = filtered.filter(slot => {
        const status = slot.certificationStatus;
        return !status || status.hipaa < passingScore;
      });
    }
    
    if (!filters.showOshaCertified) {
      filtered = filtered.filter(slot => {
        const status = slot.certificationStatus;
        return !status || status.osha < passingScore;
      });
    }
    
    if (!filters.showAdaCertified) {
      filtered = filtered.filter(slot => {
        const status = slot.certificationStatus;
        return !status || status.ada < passingScore;
      });
    }
    
    setFilteredSchedule(filtered);
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'all') {
      setFilteredSchedule(enhancedSchedule);
    } else if (value === 'certified') {
      setFilteredSchedule(enhancedSchedule.filter(slot => slot.isCertified));
    } else if (value === 'uncertified') {
      setFilteredSchedule(enhancedSchedule.filter(slot => !slot.isCertified));
    }
  };

  // Send certification reminder
  const sendReminder = async (staffName: string) => {
    if (onSendReminder) {
      await onSendReminder(staffName);
    } else {
      // Mock implementation if no handler provided
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          toast({
            title: "Reminder sent",
            description: `Training reminder sent to ${staffName}`,
          });
          resolve();
        }, 1000);
      });
    }
  };

  // View staff training profile
  const viewStaffTraining = (staffName: string) => {
    if (onViewStaffProfile) {
      onViewStaffProfile(staffName);
    } else {
      toast({
        title: "View Profile",
        description: `Viewing ${staffName}'s training profile`,
      });
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if all certifications meet the passing score
  function isCertificationComplete(certStatus: StaffCertification, passingScore: number): boolean {
    return (
      certStatus.hipaa >= passingScore &&
      certStatus.osha >= passingScore &&
      certStatus.ada >= passingScore
    );
  }

  // Get list of missing certifications
  function getMissingCertifications(certStatus: StaffCertification, passingScore: number): string[] {
    const missing = [];
    
    if (certStatus.hipaa < passingScore) missing.push('HIPAA');
    if (certStatus.osha < passingScore) missing.push('OSHA');
    if (certStatus.ada < passingScore) missing.push('ADA');
    if (certStatus.cpr !== undefined && certStatus.cpr < passingScore) missing.push('CPR');
    if (certStatus.infection_control !== undefined && certStatus.infection_control < passingScore) missing.push('Infection Control');
    if (certStatus.emergency_protocols !== undefined && certStatus.emergency_protocols < passingScore) missing.push('Emergency Protocols');
    
    return missing;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daily Schedule</h1>
          <p className="text-gray-500 flex items-center gap-1 mt-1">
            <Calendar className="h-4 w-4" />
            {formatDate(date)}
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="certified">Certified</TabsTrigger>
            <TabsTrigger value="uncertified">Incomplete</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {showAlerts && (
        <CertificationAlerts 
          scheduleData={enhancedSchedule}
          onSendReminder={sendReminder}
          onViewTraining={viewStaffTraining}
        />
      )}
      
      <CertifiedStaffFilter 
        onFilterChange={handleFilterChange}
        totalStaff={totalStaff}
        certifiedCount={certifiedStaff}
        uncertifiedCount={uncertifiedStaff}
      />

      <div className="grid gap-4">
        {filteredSchedule.length > 0 ? (
          filteredSchedule.map((slot, idx) => {
            const certStatus = slot.certificationStatus;
            const isCertified = slot.isCertified;
            
            return (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Time section */}
                    <div className="bg-gray-50 p-4 lg:w-48 flex items-center lg:justify-center">
                      <div className="text-center lg:text-left">
                        <div className="text-lg font-semibold flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          {slot.time}
                        </div>
                        {slot.duration && (
                          <div className="text-sm text-gray-500">
                            {slot.duration} min
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Content section */}
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        {/* Patient info */}
                        <div>
                          <h3 className="font-medium text-lg mb-1">{slot.patient}</h3>
                          {slot.appointmentType && (
                            <Badge variant="outline" className="mb-2">
                              {slot.appointmentType}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Staff info with certification status */}
                        <div className="flex flex-col items-start sm:items-end">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{slot.staff}</span>
                            {isCertified ? (
                              <Badge className="bg-green-600 text-white">Certified ✓</Badge>
                            ) : (
                              <Badge className="bg-red-600 text-white">Incomplete ✗</Badge>
                            )}
                          </div>
                          
                          {/* Certification badges */}
                          <div className="flex gap-2 flex-wrap">
                            {certStatus && (
                              <>
                                <CertificationBadge 
                                  certType="hipaa"
                                  status={certStatus.hipaa >= passingScore ? 'completed' : 'not_started'}
                                  progress={certStatus.hipaa}
                                  size="sm"
                                />
                                <CertificationBadge 
                                  certType="osha"
                                  status={certStatus.osha >= passingScore ? 'completed' : 'not_started'}
                                  progress={certStatus.osha}
                                  size="sm"
                                />
                                <CertificationBadge 
                                  certType="ada"
                                  status={certStatus.ada >= passingScore ? 'completed' : 'not_started'}
                                  progress={certStatus.ada}
                                  size="sm"
                                />
                                {certStatus.cpr !== undefined && (
                                  <CertificationBadge 
                                    certType="cpr"
                                    status={certStatus.cpr >= passingScore ? 'completed' : 'not_started'}
                                    progress={certStatus.cpr}
                                    size="sm"
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      {!isCertified && (
                        <div className="mt-4 pt-3 border-t flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewStaffTraining(slot.staff)}
                          >
                            View Training Status
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => sendReminder(slot.staff)}
                          >
                            Send Reminder
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No appointments match the current filters</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setActiveTab('all');
                setFilteredSchedule(enhancedSchedule);
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}