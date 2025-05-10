import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { TimeClockComponent } from "@/components/staff/time-clock";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CalendarClock, ClipboardList, Users, BarChart } from "lucide-react";

export default function TimeClockPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("my-timeclock");
  
  // Check if user has supervisor role (doctor or admin)
  const isSupervisor = user?.role === "doctor" || user?.role === "admin";
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2 rounded-md bg-primary/10">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Time Clock</h1>
        </div>
        <p className="text-muted-foreground">
          Track your work hours and view time reports
        </p>
      </header>
      
      <Tabs
        defaultValue="my-timeclock"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="my-timeclock" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>My Time Clock</span>
            </TabsTrigger>
            {isSupervisor && (
              <>
                <TabsTrigger value="team-timeclock" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Team Time Clock</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span>Reports</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>
        
        <TabsContent value="my-timeclock" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>My Time Clock</CardTitle>
              <CardDescription>
                Clock in and out to record your work hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimeClockComponent userId={user?.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {isSupervisor && (
          <TabsContent value="team-timeclock" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Team Time Clock</CardTitle>
                <CardDescription>
                  Monitor and manage your team's time records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeClockComponent supervisorView />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {isSupervisor && (
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Time Clock Reports</CardTitle>
                <CardDescription>
                  View and export time clock reports for payroll and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeClockComponent supervisorView />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}