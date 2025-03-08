import { useAuth } from "@/hooks/use-auth";
import { TimeClockComponent } from "@/components/staff/time-clock";
import { Sidebar } from "@/components/layout/sidebar";
import { AIAssistant } from "@/components/ui/ai-assistant";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarCheck, Clock, HelpCircle } from "lucide-react";

export default function TimeClockPage() {
  const { user } = useAuth();
  const isStaffOrDoctor = user?.role === 'staff' || user?.role === 'doctor';

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Clock className="mr-2 h-6 w-6" />
                Employee Time Clock
              </h1>
              <div className="text-sm text-gray-600 flex items-center">
                <CalendarCheck className="mr-1 h-4 w-4" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {!isStaffOrDoctor && (
              <Alert className="mb-6">
                <HelpCircle className="h-4 w-4" />
                <AlertTitle>Access Restricted</AlertTitle>
                <AlertDescription>
                  The time clock system is only available for staff and providers. If you need access, please contact your administrator.
                </AlertDescription>
              </Alert>
            )}

            {isStaffOrDoctor && (
              <div className="grid gap-6">
                <TimeClockComponent userId={user?.id} />
              </div>
            )}
          </div>
        </main>
      </div>
      
      <AIAssistant contextType="staff" initialSuggestions={[
        "How do I use the time clock system?",
        "What happens if I forget to clock out?",
        "How are my work hours calculated?"
      ]} />
    </div>
  );
}