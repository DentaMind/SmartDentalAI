import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// This would be replaced with real data from API
const trainingData = [
  { id: 1, name: "Jane Doe", role: "Assistant", hipaa: 92, osha: 88, ada: 95, email: "jane.doe@dentamind.com", hipaaComplete: true, oshaComplete: false, adaComplete: true },
  { id: 2, name: "Dr. Smith", role: "Doctor", hipaa: 100, osha: 100, ada: 100, email: "dr.smith@dentamind.com", hipaaComplete: true, oshaComplete: true, adaComplete: true },
  { id: 3, name: "Mike Adams", role: "Hygienist", hipaa: 85, osha: 91, ada: 90, email: "mike.adams@dentamind.com", hipaaComplete: false, oshaComplete: true, adaComplete: true },
  { id: 4, name: "Lisa Tran", role: "Front Desk", hipaa: 95, osha: 89, ada: 91, email: "lisa.tran@dentamind.com", hipaaComplete: true, oshaComplete: false, adaComplete: true },
  { id: 5, name: "Carlos Vega", role: "Manager", hipaa: 100, osha: 100, ada: 100, email: "carlos.vega@dentamind.com", hipaaComplete: true, oshaComplete: true, adaComplete: true },
  { id: 6, name: "Sarah Johnson", role: "Assistant", hipaa: 78, osha: 82, ada: 88, email: "sarah.j@dentamind.com", hipaaComplete: false, oshaComplete: false, adaComplete: false },
  { id: 7, name: "Dr. Williams", role: "Doctor", hipaa: 94, osha: 97, ada: 100, email: "dr.williams@dentamind.com", hipaaComplete: true, oshaComplete: true, adaComplete: true },
  { id: 8, name: "Robert Chen", role: "Front Desk", hipaa: 86, osha: 79, ada: 84, email: "robert.c@dentamind.com", hipaaComplete: false, oshaComplete: false, adaComplete: false }
];

const roles = ["All", "Assistant", "Doctor", "Hygienist", "Front Desk", "Manager"];

export default function TrainingDashboardPage() {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const { toast } = useToast();

  // Filter data based on role and search query
  const filteredData = trainingData
    .filter(user => filter === "All" || user.role === filter)
    .filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Calculate compliance statistics
  const complianceStats = {
    total: trainingData.length,
    compliant: trainingData.filter(u => u.hipaa >= 90 && u.osha >= 90 && u.ada >= 90).length,
    hipaaCompliant: trainingData.filter(u => u.hipaa >= 90).length,
    oshaCompliant: trainingData.filter(u => u.osha >= 90).length,
    adaCompliant: trainingData.filter(u => u.ada >= 90).length
  };

  // Toggle staff selection for bulk actions
  const toggleStaffSelection = (id: number) => {
    setSelectedStaff(prev => 
      prev.includes(id) 
        ? prev.filter(staffId => staffId !== id) 
        : [...prev, id]
    );
  };

  // Select all visible staff
  const selectAllVisible = () => {
    if (selectedStaff.length === filteredData.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(filteredData.map(staff => staff.id));
    }
  };

  // Generate and download CSV report
  const exportToCsv = () => {
    // Create CSV header
    const csvHeader = ['Name', 'Role', 'Email', 'HIPAA Score', 'OSHA Score', 'ADA Score', 'Compliance Status'].join(',');
    
    // Create CSV rows from data
    const csvRows = filteredData.map(user => {
      const status = user.hipaa >= 90 && user.osha >= 90 && user.ada >= 90 ? 'Compliant' : 'Non-Compliant';
      return [
        user.name,
        user.role,
        user.email,
        user.hipaa,
        user.osha,
        user.ada,
        status
      ].join(',');
    });
    
    // Combine header and rows
    const csvContent = [csvHeader, ...csvRows].join('\\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `training_compliance_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Report Downloaded",
      description: "Training compliance report has been exported to CSV",
    });
  };

  // Send reminder emails to selected staff
  const sendReminders = () => {
    if (selectedStaff.length === 0) {
      toast({
        title: "No staff selected",
        description: "Please select staff members to send reminders",
        variant: "destructive"
      });
      return;
    }
    
    // This would connect to an API endpoint to send actual emails
    toast({
      title: "Reminders Sent",
      description: `Training reminders sent to ${selectedStaff.length} staff members`,
    });
  };

  return (
    <>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Staff Training Compliance Dashboard</h1>
        
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff Details</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-4 bg-green-50 border-green-200">
                <h3 className="text-lg font-semibold mb-2">Overall Compliance</h3>
                <div className="text-4xl font-bold text-green-600">
                  {Math.round((complianceStats.compliant / complianceStats.total) * 100)}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {complianceStats.compliant} of {complianceStats.total} staff fully compliant
                </p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Module Completion</h3>
                <div className="flex justify-between items-center mb-2">
                  <span>HIPAA:</span>
                  <span className="font-medium">{complianceStats.hipaaCompliant} / {complianceStats.total}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>OSHA:</span>
                  <span className="font-medium">{complianceStats.oshaCompliant} / {complianceStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ADA:</span>
                  <span className="font-medium">{complianceStats.adaCompliant} / {complianceStats.total}</span>
                </div>
              </Card>
              
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <h3 className="text-lg font-semibold mb-2">Attention Required</h3>
                <div className="text-4xl font-bold text-yellow-600">
                  {complianceStats.total - complianceStats.compliant}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Staff members need to complete training
                </p>
                <Button className="mt-3 w-full" onClick={sendReminders}>
                  Send Reminders
                </Button>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="staff">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                {roles.map((r) => (
                  <Button
                    key={r}
                    variant={filter === r ? "default" : "outline"}
                    onClick={() => setFilter(r)}
                    size="sm"
                  >
                    {r}
                  </Button>
                ))}
              </div>
              
              <div className="w-64">
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllVisible}
              >
                {selectedStaff.length === filteredData.length ? "Deselect All" : "Select All"}
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={sendReminders}
                  disabled={selectedStaff.length === 0}
                >
                  Send Reminders
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={exportToCsv}
                >
                  Export CSV
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-md border">
              <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b text-sm">
                <div className="col-span-1">Select</div>
                <div className="col-span-2">Staff Member</div>
                <div className="col-span-1">HIPAA</div>
                <div className="col-span-1">OSHA</div>
                <div className="col-span-1">ADA</div>
                <div className="col-span-1">Status</div>
              </div>
              
              {filteredData.map((user) => (
                <div key={user.id} className="grid grid-cols-7 gap-4 p-4 border-b hover:bg-gray-50 items-center text-sm">
                  <div className="col-span-1">
                    <input 
                      type="checkbox" 
                      checked={selectedStaff.includes(user.id)}
                      onChange={() => toggleStaffSelection(user.id)}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-gray-500 text-xs">{user.role} • {user.email}</div>
                  </div>
                  <div className="col-span-1">
                    <span className={user.hipaa >= 90 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {user.hipaa}%
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={user.osha >= 90 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {user.osha}%
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={user.ada >= 90 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {user.ada}%
                    </span>
                  </div>
                  <div className="col-span-1">
                    {user.hipaa >= 90 && user.osha >= 90 && user.ada >= 90 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Certified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ✗ Incomplete
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="reports">
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Training Compliance Reports</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <h4 className="font-medium">Full Staff Compliance Report</h4>
                      <p className="text-sm text-gray-600">Detailed report of all staff training status</p>
                    </div>
                    <Button onClick={exportToCsv}>Export CSV</Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <h4 className="font-medium">Non-Compliance Report</h4>
                      <p className="text-sm text-gray-600">Staff requiring training attention</p>
                    </div>
                    <Button variant="outline">Generate</Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <h4 className="font-medium">Certificate Tracking</h4>
                      <p className="text-sm text-gray-600">List of all issued compliance certificates</p>
                    </div>
                    <Button variant="outline">Generate</Button>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input type="checkbox" id="autoRemind" className="mr-2 h-4 w-4" defaultChecked />
                    <label htmlFor="autoRemind">Automatically send reminders to non-compliant staff</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input type="checkbox" id="expiryAlert" className="mr-2 h-4 w-4" defaultChecked />
                    <label htmlFor="expiryAlert">Send alerts for expiring certifications (30 days prior)</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input type="checkbox" id="adminDigest" className="mr-2 h-4 w-4" defaultChecked />
                    <label htmlFor="adminDigest">Weekly admin digest of compliance status</label>
                  </div>
                  
                  <Button className="mt-2">Save Settings</Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}