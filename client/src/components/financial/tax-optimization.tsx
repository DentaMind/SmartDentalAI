import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BarChart4, FileCheck, Lightbulb, ShieldAlert, DollarSign, Calculator, TrendingUp, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import axios from 'axios';

interface TaxOptimizationProps {
  doctorId: number;
  year: number;
}

interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  potential_savings: number;
  implementation_difficulty: 'easy' | 'moderate' | 'complex';
  implementation_steps: string[];
  risk_level: 'low' | 'medium' | 'high';
  risk_description: string;
  deadline: string;
  tax_code_reference?: string;
}

export function TaxOptimization({ doctorId, year = new Date().getFullYear() }: TaxOptimizationProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [strategies, setStrategies] = useState<OptimizationStrategy[]>([]);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
  const [currentGrossIncome, setCurrentGrossIncome] = useState<number>(850000);
  const [currentTaxableIncome, setCurrentTaxableIncome] = useState<number>(650000);
  const [currentTaxRate, setCurrentTaxRate] = useState<number>(35);
  const [currentTaxBurden, setCurrentTaxBurden] = useState<number>(227500);
  
  // Only dentists/owners can access tax features
  const hasAccess = user?.role === 'doctor' || user?.role === 'admin';
  
  const generateOptimizationStrategies = async () => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would make an API call to the server
      // which would use the FINANCIAL_AI_KEY to get AI-powered tax optimization strategies
      
      // Example API call (commented out)
      // const response = await axios.post('/api/finance/tax-optimization', {
      //   doctorId,
      //   year,
      //   grossIncome: currentGrossIncome,
      //   taxableIncome: currentTaxableIncome,
      //   taxRate: currentTaxRate
      // });
      // setStrategies(response.data.strategies);
      
      // Instead, we'll simulate an API response after a delay
      await new Promise(resolver => setTimeout(resolver, 2500));
      
      // Sample strategies (in a real app, these would come from the AI API)
      const sampleStrategies: OptimizationStrategy[] = [
        {
          id: "s1",
          name: "Maximize Retirement Contributions",
          description: "Maximize contributions to your defined benefit plan and 401(k) to reduce taxable income while building retirement savings.",
          potential_savings: 62000,
          implementation_difficulty: "easy",
          implementation_steps: [
            "Increase 401(k) contributions to reach the annual limit of $22,500 (plus $7,500 catch-up if over 50)",
            "Consider setting up and funding a defined benefit plan which can allow for much larger deductions",
            "Consult with your financial advisor to set up automatic contributions"
          ],
          risk_level: "low",
          risk_description: "Low risk as these are well-established tax deductions. Ensure you have sufficient cash flow to maintain contributions.",
          deadline: "December 31st for 401(k), plan establishment; April 15th for some contributions"
        },
        {
          id: "s2",
          name: "Business Entity Optimization",
          description: "Restructuring from sole proprietorship to S-Corporation can reduce self-employment taxes while maintaining pass-through taxation benefits.",
          potential_savings: 15000,
          implementation_difficulty: "complex",
          implementation_steps: [
            "Consult with a tax attorney about proper S-Corp election",
            "Establish reasonable salary vs. distribution ratio (typically 60% salary, 40% distribution)",
            "File Form 2553 with the IRS",
            "Set up proper payroll processing for the S-Corporation"
          ],
          risk_level: "medium",
          risk_description: "The IRS scrutinizes S-Corps that pay unreasonably low salaries to owners. Must maintain proper corporate formalities.",
          deadline: "March 15th for current year S-Corp election",
          tax_code_reference: "IRC Section 1362"
        },
        {
          id: "s3",
          name: "Section 179 Equipment Deduction",
          description: "Immediately expense qualifying equipment purchases instead of depreciating them over several years.",
          potential_savings: 28500,
          implementation_difficulty: "easy",
          implementation_steps: [
            "Identify planned equipment purchases for the practice",
            "Ensure equipment is placed in service before December 31st",
            "Document business use percentage (must be >50%)",
            "Complete Form 4562 with your tax return"
          ],
          risk_level: "low",
          risk_description: "Well-established deduction with clear guidelines. Recapture provisions apply if business use drops below 50%.",
          deadline: "Equipment must be placed in service by December 31st",
          tax_code_reference: "IRC Section 179"
        },
        {
          id: "s4",
          name: "Cost Segregation Study",
          description: "Accelerate depreciation deductions by identifying components of your dental office that can be depreciated over shorter time periods.",
          potential_savings: 42000,
          implementation_difficulty: "moderate",
          implementation_steps: [
            "Hire a qualified cost segregation specialist",
            "Have them analyze your office building or recent renovations",
            "Implement their recommendations on your tax return",
            "Consider bonus depreciation options for qualified improvements"
          ],
          risk_level: "medium",
          risk_description: "Requires professional expertise to implement correctly. May trigger AMT considerations for some taxpayers.",
          deadline: "Can be implemented retroactively through Form 3115",
          tax_code_reference: "IRC Section 168"
        },
        {
          id: "s5",
          name: "Qualified Business Income Deduction",
          description: "Maximize your Section 199A deduction, which allows eligible dental practices to deduct up to 20% of qualified business income.",
          potential_savings: 37500,
          implementation_difficulty: "moderate",
          implementation_steps: [
            "Review your practice structure to ensure it qualifies",
            "Consider W-2 wage optimization strategies if your income exceeds threshold limits",
            "Evaluate the benefits of aggregating multiple business entities",
            "Document all business assets for the UBIA calculation"
          ],
          risk_level: "low",
          risk_description: "Well-established deduction, but complex qualification rules for high-income dentists.",
          deadline: "Strategies must be implemented before year-end",
          tax_code_reference: "IRC Section 199A"
        }
      ];
      
      setStrategies(sampleStrategies);
      toast({
        title: "AI Analysis Complete",
        description: "Tax optimization strategies have been generated for your practice.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not generate tax optimization strategies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleStrategySelection = (id: string) => {
    if (selectedStrategyIds.includes(id)) {
      setSelectedStrategyIds(selectedStrategyIds.filter(sid => sid !== id));
    } else {
      setSelectedStrategyIds([...selectedStrategyIds, id]);
    }
  };
  
  const getImplementationColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return "text-green-600";
      case 'moderate':
        return "text-amber-600";
      case 'complex':
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return "text-green-600 bg-green-50 border-green-200";
      case 'medium':
        return "text-amber-600 bg-amber-50 border-amber-200";
      case 'high':
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };
  
  // Calculate optimized values based on selected strategies
  const calculateOptimizedValues = () => {
    const selectedStrategies = strategies.filter(s => selectedStrategyIds.includes(s.id));
    const totalSavings = selectedStrategies.reduce((sum, strategy) => sum + strategy.potential_savings, 0);
    
    const optimizedTaxableIncome = currentTaxableIncome - totalSavings;
    const optimizedTaxBurden = Math.round(optimizedTaxableIncome * (currentTaxRate / 100));
    const taxSavings = currentTaxBurden - optimizedTaxBurden;
    
    return {
      optimizedTaxableIncome,
      optimizedTaxBurden,
      taxSavings,
      savingsPercentage: (taxSavings / currentTaxBurden) * 100
    };
  };
  
  const { optimizedTaxableIncome, optimizedTaxBurden, taxSavings, savingsPercentage } = 
    strategies.length > 0 ? calculateOptimizedValues() : { optimizedTaxableIncome: currentTaxableIncome, optimizedTaxBurden: currentTaxBurden, taxSavings: 0, savingsPercentage: 0 };
  
  if (!hasAccess) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Restricted Access
          </CardTitle>
          <CardDescription>
            Tax optimization tools are only accessible to dentists and practice owners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section contains sensitive financial information and tax strategies. Please contact your practice administrator for access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          AI-Powered Tax Optimization
        </CardTitle>
        <CardDescription>
          Generate personalized tax strategies using artificial intelligence to maximize deductions and reduce your tax burden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="optimization" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="optimization">Tax Strategies</TabsTrigger>
            <TabsTrigger value="summary">Financial Impact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="optimization">
            <div className="space-y-6">
              {/* Current financial summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Gross Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${currentGrossIncome.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Taxable Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${currentTaxableIncome.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Effective Tax Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentTaxRate}%</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Current Tax Burden</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${currentTaxBurden.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>
              
              {strategies.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Recommended Tax Strategies</h3>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={generateOptimizationStrategies}
                      disabled={isProcessing}
                      className="flex items-center gap-1"
                    >
                      <BarChart4 className="h-4 w-4" />
                      Refresh Analysis
                    </Button>
                  </div>
                  
                  {strategies.map((strategy) => (
                    <Card 
                      key={strategy.id} 
                      className={`border-l-4 ${selectedStrategyIds.includes(strategy.id) ? "border-l-primary" : "border-l-muted"}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`strategy-${strategy.id}`}
                              checked={selectedStrategyIds.includes(strategy.id)}
                              onChange={() => toggleStrategySelection(strategy.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div>
                              <label 
                                htmlFor={`strategy-${strategy.id}`}
                                className="text-base font-medium cursor-pointer"
                              >
                                {strategy.name}
                              </label>
                              <CardDescription className="mt-0.5">
                                {strategy.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              ${strategy.potential_savings.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Potential Savings
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                              <FileCheck className="h-4 w-4" />
                              Implementation 
                              <span className={`ml-1 ${getImplementationColor(strategy.implementation_difficulty)}`}>
                                ({strategy.implementation_difficulty})
                              </span>
                            </h4>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                              {strategy.implementation_steps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                              <ShieldAlert className="h-4 w-4" />
                              Risk Consideration
                            </h4>
                            <div className="flex items-center gap-1 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded border ${getRiskColor(strategy.risk_level)}`}>
                                {strategy.risk_level.charAt(0).toUpperCase() + strategy.risk_level.slice(1)} Risk
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {strategy.risk_description}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Timing & Details</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Deadline:</strong> {strategy.deadline}</p>
                              {strategy.tax_code_reference && (
                                <p><strong>Reference:</strong> {strategy.tax_code_reference}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {selectedStrategyIds.length} of {strategies.length} strategies selected
                      </span>
                    </div>
                    <Button 
                      variant="default" 
                      className="flex items-center gap-1"
                      onClick={() => {
                        toast({
                          title: "Tax Plan Saved",
                          description: `Your tax optimization plan with ${selectedStrategyIds.length} strategies has been saved.`,
                          variant: "default",
                        });
                      }}
                    >
                      <FileCheck className="h-4 w-4" />
                      Save Tax Plan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Tax Strategies Generated Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mt-2">
                    Use our AI-powered tax optimization engine to generate personalized tax saving strategies for your dental practice.
                  </p>
                  <Button 
                    onClick={generateOptimizationStrategies}
                    disabled={isProcessing}
                    className="mt-6"
                  >
                    {isProcessing ? 
                      "Analyzing Your Practice Finances..." : 
                      "Generate Tax Optimization Strategies"
                    }
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="summary">
            {strategies.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before optimization */}
                  <Card className="bg-background">
                    <CardHeader>
                      <CardTitle className="text-lg">Without Optimization</CardTitle>
                      <CardDescription>Your current tax situation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Taxable Income</Label>
                        <div className="text-2xl font-bold">${currentTaxableIncome.toLocaleString()}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Rate</Label>
                        <div className="text-2xl font-bold">{currentTaxRate}%</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Burden</Label>
                        <div className="text-2xl font-bold text-destructive">${currentTaxBurden.toLocaleString()}</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* After optimization */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">With Selected Strategies</CardTitle>
                      <CardDescription>Your optimized tax situation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Optimized Taxable Income</Label>
                        <div className="text-2xl font-bold">${optimizedTaxableIncome.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {(currentTaxableIncome - optimizedTaxableIncome).toLocaleString()} reduction in taxable income
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Effective Tax Rate</Label>
                        <div className="text-2xl font-bold">{currentTaxRate}%</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Optimized Tax Burden</Label>
                        <div className="text-2xl font-bold text-primary">${optimizedTaxBurden.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          ${taxSavings.toLocaleString()} total savings ({savingsPercentage.toFixed(1)}%)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Tax Savings Impact */}
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Tax Savings Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-green-700">${taxSavings.toLocaleString()}</h3>
                        <p className="text-sm text-green-600">Total Tax Savings</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-green-700">{savingsPercentage.toFixed(1)}%</h3>
                        <p className="text-sm text-green-600">Reduction in Tax Burden</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-green-700">${(taxSavings / 12).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</h3>
                        <p className="text-sm text-green-600">Monthly Savings</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-green-700">Implementation Progress</Label>
                      <Progress value={0} className="h-2 bg-green-200" />
                      <p className="text-xs text-green-600">Not started - Save your plan to begin implementing strategies</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Custom financial inputs */}
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-4">Customize Financial Data</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gross-income">Gross Income</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="gross-income"
                          type="number"
                          value={currentGrossIncome}
                          onChange={(e) => setCurrentGrossIncome(Number(e.target.value))}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="taxable-income">Taxable Income</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="taxable-income"
                          type="number"
                          value={currentTaxableIncome}
                          onChange={(e) => setCurrentTaxableIncome(Number(e.target.value))}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                      <div className="relative">
                        <Input
                          id="tax-rate"
                          type="number"
                          value={currentTaxRate}
                          onChange={(e) => setCurrentTaxRate(Number(e.target.value))}
                          min={0}
                          max={100}
                          step={0.1}
                          className="pl-2"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tax-burden">Current Tax Burden</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="tax-burden"
                          type="number"
                          value={currentTaxBurden}
                          onChange={(e) => setCurrentTaxBurden(Number(e.target.value))}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setCurrentTaxableIncome(Math.round(currentGrossIncome * 0.75));
                        setCurrentTaxBurden(Math.round(currentTaxableIncome * (currentTaxRate / 100)));
                      }}
                      className="flex items-center gap-1"
                    >
                      <Calculator className="h-4 w-4" />
                      Recalculate
                    </Button>
                  </div>
                </div>
                
                {/* Disclaimer */}
                <div className="text-xs text-muted-foreground p-4 border rounded-md">
                  <strong>Disclaimer:</strong> These tax calculations are estimates based on the information provided and 
                  selected optimization strategies. Actual tax savings may vary based on your specific situation, 
                  implementation quality, and changes in tax laws. Always consult with a qualified tax professional 
                  before implementing any tax strategy.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart4 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Financial Impact Data Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  Please generate tax optimization strategies first to see their potential financial impact.
                </p>
                <Button 
                  onClick={() => {
                    // Switch to optimization tab and generate strategies
                    document.querySelector('[data-value="optimization"]')?.click();
                    setTimeout(() => {
                      generateOptimizationStrategies();
                    }, 100);
                  }}
                  className="mt-6"
                >
                  Generate Tax Strategies
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
        This tax optimization tool utilizes FINANCIAL_AI_KEY to analyze practice data and generate personalized tax strategies.
      </CardFooter>
    </Card>
  );
}