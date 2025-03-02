
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaxReporting } from '@/components/financial/tax-reporting';
import { InsuranceClaimTracker } from '@/components/financial/insurance-claim-tracker';

export default function FinancialDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-4xl font-bold mb-8">Financial Dashboard</h1>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="claims">Insurance Claims</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="tax">Tax Reporting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue (YTD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$248,670.00</div>
                <p className="text-xs text-muted-foreground">+12.3% from last year</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Outstanding Claims
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$42,890.00</div>
                <p className="text-xs text-muted-foreground">32 claims pending</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Patient Receivables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$18,450.00</div>
                <p className="text-xs text-muted-foreground">15 patients with balance</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Collections Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.2%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last year</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>
                  Revenue breakdown for the current year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">Revenue chart will appear here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Distribution by payment method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">Payment methods chart will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center">
                  <p className="text-muted-foreground">Recent transactions will appear here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Insurance Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center">
                  <p className="text-muted-foreground">Upcoming insurance payments will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="claims" className="mt-6">
          <InsuranceClaimTracker />
        </TabsContent>
        
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>
                Manage patient payments and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] flex items-center justify-center">
                <p className="text-muted-foreground">Payment management interface will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate and view financial reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] flex items-center justify-center">
                <p className="text-muted-foreground">Financial reports interface will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tax" className="mt-6">
          <TaxReporting />
        </TabsContent>
      </Tabs>
    </div>
  );
}
