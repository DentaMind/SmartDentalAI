import React, { useState, useEffect } from 'react';
import { TaxOptimization } from "./tax-optimization";
import { RevenueCalculator } from "./revenue-calculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CircleDollarSign, 
  Calculator, 
  FileArchive, 
  PiggyBank, 
  FileText, 
  Scale,
  Building,
  Landmark,
  ScrollText,
  CircleHelp,
  BookOpen,
  LucideProps,
  Shield,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Type for the dashboard mode
type DashboardMode = 'tax' | 'revenue' | 'accounting' | 'legal';

// Interface for the props
interface FinancialDashboardProps {
  userId: number;
  initialTab?: DashboardMode;
}

// Custom icon for compliance icon
const ComplianceIcon = (props: LucideProps) => (
  <Shield {...props}>
    <path
      d="M12 17v.01M12 14a1 1 0 01.993.883L13 15v1a1 1 0 01-1.993.117L11 16v-1a1 1 0 01.883-.993L12 14zM7 8h10M7 12h4m0 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Shield>
);

export function FinancialDashboard({ userId, initialTab = 'tax' }: FinancialDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DashboardMode>(initialTab);
  const [userRole, setUserRole] = useState<string>('dentist'); // For access control
  const [, setLocation] = useLocation();
  
  // The blue screen issue was happening here, adding error handling to fix it
  useEffect(() => {
    try {
      // Simulate API call to get user role
      setTimeout(() => {
        setUserRole('dentist'); // Assume user is a dentist for demo purposes
      }, 100);
    } catch (error) {
      console.error("Error setting user role:", error);
      // Ensure we have a fallback role
      setUserRole('dentist');
    }
  }, [userId]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as DashboardMode);
  };

  // Navigate back to main AI hub
  const navigateToHub = () => {
    setLocation('/ai-hub');
  };

  // Function to render help content for each tab
  const renderHelpContent = (tab: DashboardMode) => {
    switch (tab) {
      case 'tax':
        return (
          <div className="space-y-2">
            <h3 className="font-medium">Tax Optimization</h3>
            <p className="text-sm text-muted-foreground">
              This AI-powered tool analyzes your practice's financial data to identify tax-saving opportunities, 
              optimize deductions, and help you prepare for tax season. It provides personalized recommendations 
              based on your specific practice structure and financial situation.
            </p>
            <div className="text-sm text-muted-foreground mt-2">
              <span className="font-medium">Key Features:</span>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Automated tax deduction identification</li>
                <li>Entity structure optimization</li>
                <li>Tax calendar with important deadlines</li>
                <li>Audit risk assessment</li>
              </ul>
            </div>
          </div>
        );
      case 'revenue':
        return (
          <div className="space-y-2">
            <h3 className="font-medium">Revenue & Overhead Calculator</h3>
            <p className="text-sm text-muted-foreground">
              Track and analyze your practice's revenue, expenses, and profitability metrics with this 
              comprehensive tool. It provides insights into procedure profitability, staff productivity, 
              and overhead optimization opportunities.
            </p>
            <div className="text-sm text-muted-foreground mt-2">
              <span className="font-medium">Key Features:</span>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Revenue trend analysis by procedure type</li>
                <li>Staff productivity metrics</li>
                <li>Overhead breakdown and benchmarking</li>
                <li>AI-powered efficiency recommendations</li>
              </ul>
            </div>
          </div>
        );
      case 'accounting':
        return (
          <div className="space-y-2">
            <h3 className="font-medium">Accounting System</h3>
            <p className="text-sm text-muted-foreground">
              Coming soon: Integrated accounting tools to automate bookkeeping, financial reporting, 
              and reconciliation tasks. This module will connect with popular accounting software 
              and provide real-time financial insights.
            </p>
          </div>
        );
      case 'legal':
        return (
          <div className="space-y-2">
            <h3 className="font-medium">Legal Compliance</h3>
            <p className="text-sm text-muted-foreground">
              Coming soon: AI-powered legal compliance tools to help you navigate regulations like 
              HIPAA, monitor changes in dental practice laws, and reduce legal risk through automated 
              documentation and compliance checks.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={navigateToHub} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CircleDollarSign className="h-6 w-6 text-primary" />
            Financial & Legal AI System
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          toast({
            title: "Documentation Downloaded",
            description: "Financial system documentation has been downloaded.",
          });
        }}>
          <BookOpen className="h-4 w-4 mr-2" />
          Documentation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Financial AI Navigator</CardTitle>
              <CardDescription>
                Access financial optimization tools
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="flex flex-col">
                <Button 
                  variant={activeTab === 'tax' ? "default" : "ghost"} 
                  className="justify-start rounded-none h-11"
                  onClick={() => setActiveTab('tax')}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Tax Optimization
                </Button>
                <Button 
                  variant={activeTab === 'revenue' ? "default" : "ghost"} 
                  className="justify-start rounded-none h-11"
                  onClick={() => setActiveTab('revenue')}
                >
                  <PiggyBank className="h-4 w-4 mr-2" />
                  Revenue Calculator
                </Button>
                <Button 
                  variant={activeTab === 'accounting' ? "default" : "ghost"} 
                  className="justify-start rounded-none h-11"
                  onClick={() => setActiveTab('accounting')}
                  disabled
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Accounting System
                  <span className="ml-auto text-xs opacity-70">Coming soon</span>
                </Button>
                <Button 
                  variant={activeTab === 'legal' ? "default" : "ghost"} 
                  className="justify-start rounded-none h-11"
                  onClick={() => setActiveTab('legal')}
                  disabled
                >
                  <Scale className="h-4 w-4 mr-2" />
                  Legal Compliance
                  <span className="ml-auto text-xs opacity-70">Coming soon</span>
                </Button>
              </nav>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CircleHelp className="h-4 w-4 text-primary" />
                Help & Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderHelpContent(activeTab)}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" disabled={activeTab === 'accounting' || activeTab === 'legal'}>
                <FileArchive className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled={activeTab === 'accounting' || activeTab === 'legal'}>
                <Building className="h-4 w-4 mr-2" />
                Consult with CPA
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled={activeTab === 'accounting' || activeTab === 'legal'}>
                <Landmark className="h-4 w-4 mr-2" />
                Submit to Accounting
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled={activeTab === 'accounting' || activeTab === 'legal'}>
                <ScrollText className="h-4 w-4 mr-2" />
                Tax Calendar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4">
          {userRole !== 'dentist' && activeTab !== 'accounting' ? (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center p-6">
                <div className="mb-4 text-amber-500">
                  <Shield className="h-16 w-16 mx-auto" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Restricted Access</h2>
                <p className="text-muted-foreground mb-6">
                  Financial information is only available to practice owners and dentists.
                </p>
                <Button variant="default">
                  Request Access
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeTab === 'tax' && (
                <TaxOptimization userId={userId} />
              )}
              
              {activeTab === 'revenue' && (
                <RevenueCalculator userId={userId} />
              )}
              
              {activeTab === 'accounting' && (
                <Card className="h-[600px] flex items-center justify-center">
                  <CardContent className="text-center max-w-md p-6">
                    <div className="mb-4 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Accounting System Coming Soon</h2>
                    <p className="text-muted-foreground mb-6">
                      Our AI-powered accounting system is currently in development and will be available in the next update.
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Features will include automated bookkeeping, real-time financial reporting, QuickBooks and Xero integration, 
                      and AI-powered financial forecasting.
                    </p>
                    <Button variant="outline">
                      Join Waitlist
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === 'legal' && (
                <Card className="h-[600px] flex items-center justify-center">
                  <CardContent className="text-center max-w-md p-6">
                    <div className="mb-4 text-muted-foreground">
                      <Scale className="h-16 w-16 mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Legal Compliance System Coming Soon</h2>
                    <p className="text-muted-foreground mb-6">
                      Our AI-powered legal compliance system is currently in development and will be available in the next update.
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Features will include HIPAA compliance monitoring, automated legal documentation, regulation updates, 
                      and risk assessment for dental practices.
                    </p>
                    <Button variant="outline">
                      Join Waitlist
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}