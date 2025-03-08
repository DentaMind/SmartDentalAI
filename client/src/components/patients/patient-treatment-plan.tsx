import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { 
  Brain, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Download, 
  FilePlus2, 
  GitBranchPlus, 
  History, 
  Pen, 
  PlusCircle, 
  Printer, 
  Share2 
} from "lucide-react";

interface PatientTreatmentPlanProps {
  patientId: number;
}

interface Treatment {
  id: number;
  title: string;
  description: string;
  status: "planned" | "in-progress" | "completed" | "cancelled";
  cost: number;
  startDate?: string;
  endDate?: string;
  insuranceCoverage?: number;
  procedureCode?: string;
  priority: "high" | "medium" | "low";
  assignedToId?: number;
  assignedToName?: string;
  notes?: string;
  sequence?: number;
  dependencies?: number[];
  alternativeOptions?: {
    description: string;
    cost: number;
    pros: string[];
    cons: string[];
  }[];
}

interface TreatmentPlan {
  id: number;
  patientId: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "completed" | "cancelled";
  estimatedCost: number;
  insuranceEstimate: number;
  treatments: Treatment[];
  notes?: string;
  createdById: number;
  createdByName: string;
}

export function PatientTreatmentPlan({ patientId }: PatientTreatmentPlanProps) {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);

  const { data: treatmentPlans, isLoading } = useQuery<TreatmentPlan[]>({
    queryKey: ["/api/treatment-plans", patientId],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/patients/${patientId}/treatment-plans`);
        return res.json();
      } catch (error) {
        console.error("Failed to fetch treatment plans:", error);
        return [];
      }
    },
  });

  const activePlan = treatmentPlans?.find(plan => plan.status === "active");
  const completedPlans = treatmentPlans?.filter(plan => plan.status === "completed");

  // AI-powered alternative treatment generator (mock function)
  const generateAlternatives = async () => {
    // In a real app, this would call an API to generate alternatives
    console.log("Generating treatment alternatives...");
    // Implementation would involve AI analysis of the current plan
  };

  const renderTreatmentList = (treatments: Treatment[]) => {
    if (!treatments || treatments.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          No treatments added to this plan yet.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {treatments.map((treatment) => (
          <div 
            key={treatment.id} 
            className="p-4 border rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{treatment.title}</h4>
                  <Badge variant={
                    treatment.status === "completed" ? "success" : 
                    treatment.status === "in-progress" ? "default" : 
                    treatment.status === "cancelled" ? "destructive" : 
                    "outline"
                  }>
                    {treatment.status}
                  </Badge>
                  {treatment.priority === "high" && (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                      Priority
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {treatment.description}
                </p>
              </div>
              <div className="text-right">
                <div className="font-medium">${treatment.cost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  {treatment.procedureCode && `Code: ${treatment.procedureCode}`}
                </div>
              </div>
            </div>
            
            {treatment.assignedToName && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <span>Assigned to: {treatment.assignedToName}</span>
              </div>
            )}

            {treatment.status === "in-progress" && treatment.startDate && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <Clock className="h-3 w-3" />
                <span>Started on {new Date(treatment.startDate).toLocaleDateString()}</span>
              </div>
            )}

            {treatment.status === "completed" && treatment.endDate && (
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Completed on {new Date(treatment.endDate).toLocaleDateString()}</span>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Pen className="h-3 w-3 mr-1" />
                Edit
              </Button>
              {treatment.status !== "completed" && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mark Complete
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <PlusCircle className="h-3 w-3 mr-1" />
                Add Note
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingAnimation />
        <p className="mt-4 text-muted-foreground">Loading treatment plans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Treatment Plans</h2>
          <p className="text-muted-foreground">Manage and track patient treatments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Plan
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share with Patient
          </Button>
          <Button className="gap-2">
            <FilePlus2 className="h-4 w-4" />
            New Treatment Plan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="current">
            Current Plan
          </TabsTrigger>
          <TabsTrigger value="history">
            Treatment History
          </TabsTrigger>
          <TabsTrigger value="alternatives">
            AI Alternatives
          </TabsTrigger>
          <TabsTrigger value="financials">
            Financial View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {activePlan ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{activePlan.title}</h3>
                    <p className="text-sm text-muted-foreground">{activePlan.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge>Active</Badge>
                      <span className="text-sm text-muted-foreground">
                        Created {new Date(activePlan.createdAt).toLocaleDateString()} by {activePlan.createdByName}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${activePlan.estimatedCost.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Estimated total cost</div>
                    <div className="text-sm text-green-600 mt-1">
                      ${activePlan.insuranceEstimate.toFixed(2)} covered by insurance
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Treatment Progress
                  </h4>
                  
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary-100">
                          In Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-primary">
                          {activePlan.treatments.filter(t => t.status === "completed").length} / {activePlan.treatments.length} Treatments
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100">
                      <div 
                        style={{ 
                          width: `${(activePlan.treatments.filter(t => t.status === "completed").length / activePlan.treatments.length) * 100}%` 
                        }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      ></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Treatments</h4>
                  {renderTreatmentList(activePlan.treatments)}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" className="gap-2">
                    <History className="h-4 w-4" />
                    View Revisions
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export as PDF
                  </Button>
                  <Button className="gap-2">
                    <Pen className="h-4 w-4" />
                    Edit Plan
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border shadow-sm text-center">
              <div className="py-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FilePlus2 className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No Active Treatment Plan</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  There is no active treatment plan for this patient. Create a new treatment plan to get started.
                </p>
                <Button className="mt-4 gap-2">
                  <FilePlus2 className="h-4 w-4" />
                  Create Treatment Plan
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-6">
            {completedPlans && completedPlans.length > 0 ? (
              completedPlans.map((plan) => (
                <Card key={plan.id} className="mb-6">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.title}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">Completed</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(plan.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPlan(plan)}>
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Cost</div>
                        <div className="font-semibold">${plan.estimatedCost.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Insurance Coverage</div>
                        <div className="font-semibold">${plan.insuranceEstimate.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Treatments</div>
                        <div className="font-semibold">{plan.treatments.length} procedures</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg border shadow-sm text-center">
                <div className="py-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No Treatment History</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mt-2">
                    This patient has no completed treatment plans in their history.
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alternatives">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI-Generated Treatment Alternatives
              </CardTitle>
              <CardDescription>
                Our AI can analyze the current treatment plan and suggest alternative approaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-primary-50 p-4 rounded-md mb-6 flex items-start gap-4">
                <div className="p-2 bg-primary-100 rounded-full text-primary">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-medium">How it works</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The AI will analyze the current treatment plan, patient history, and latest evidence-based 
                    dentistry to suggest personalized alternative treatment approaches that may be more 
                    affordable, less invasive, or better suited to the patient's specific needs.
                  </p>
                </div>
              </div>

              <div className="text-center py-8">
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GitBranchPlus className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Generate Alternative Treatment Options</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  Click the button below to have our AI generate alternative treatment approaches based on 
                  the current plan.
                </p>
                <Button className="mt-4 gap-2" onClick={generateAlternatives}>
                  <Brain className="h-4 w-4" />
                  Generate Alternatives
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Financial Summary
                </CardTitle>
                <CardDescription>
                  Cost breakdown and payment options for treatment plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activePlan ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="text-sm text-muted-foreground mb-1">Total Treatment Cost</div>
                        <div className="text-2xl font-bold">${activePlan.estimatedCost.toFixed(2)}</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <div className="text-sm text-muted-foreground mb-1">Insurance Coverage</div>
                        <div className="text-2xl font-bold text-green-700">${activePlan.insuranceEstimate.toFixed(2)}</div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <div className="text-sm text-muted-foreground mb-1">Patient Responsibility</div>
                        <div className="text-2xl font-bold text-blue-700">
                          ${(activePlan.estimatedCost - activePlan.insuranceEstimate).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Treatment Cost Breakdown</h4>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Treatment
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cost
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Insurance
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Patient Pays
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {activePlan.treatments.map((treatment) => (
                              <tr key={treatment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {treatment.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                  ${treatment.cost.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                                  ${(treatment.insuranceCoverage || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-right">
                                  ${(treatment.cost - (treatment.insuranceCoverage || 0)).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Totals
                              </td>
                              <td className="px-6 py-3 text-right text-xs font-medium text-gray-900">
                                ${activePlan.estimatedCost.toFixed(2)}
                              </td>
                              <td className="px-6 py-3 text-right text-xs font-medium text-green-600">
                                ${activePlan.insuranceEstimate.toFixed(2)}
                              </td>
                              <td className="px-6 py-3 text-right text-xs font-medium text-blue-600">
                                ${(activePlan.estimatedCost - activePlan.insuranceEstimate).toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Payment Options</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                          <h5 className="font-medium">Pay in Full</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            Pay the entire amount and receive a 5% discount
                          </p>
                          <div className="mt-3 text-lg font-semibold text-green-700">
                            ${(
                              (activePlan.estimatedCost - activePlan.insuranceEstimate) * 0.95
                            ).toFixed(2)}
                          </div>
                          <Button size="sm" className="mt-2 w-full">Select</Button>
                        </div>

                        <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                          <h5 className="font-medium">3-Month Plan</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            Split payments over 3 months with no interest
                          </p>
                          <div className="mt-3 text-lg font-semibold">
                            ${(
                              (activePlan.estimatedCost - activePlan.insuranceEstimate) / 3
                            ).toFixed(2)}/mo
                          </div>
                          <Button size="sm" className="mt-2 w-full" variant="outline">Select</Button>
                        </div>

                        <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                          <h5 className="font-medium">Care Credit</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            No interest if paid in full within 12 months
                          </p>
                          <div className="mt-3 text-lg font-semibold">
                            ${(
                              (activePlan.estimatedCost - activePlan.insuranceEstimate) / 12
                            ).toFixed(2)}/mo
                          </div>
                          <Button size="sm" className="mt-2 w-full" variant="outline">Select</Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print Estimate
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Email to Patient
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No active treatment plan to display financial information.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}