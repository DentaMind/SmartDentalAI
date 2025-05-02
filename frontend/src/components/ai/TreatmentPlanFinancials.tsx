import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../ui/accordion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  DollarSign, 
  CreditCard, 
  CalendarClock, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  AlertCircle
} from 'lucide-react';

interface FinancialOption {
  name: string;
  description: string;
  total_patient_pays: number;
  savings: number;
  duration_months: number;
  monthly_payment: number;
  interest_rate: number;
  discount_rate: number;
  requires_credit_approval?: boolean;
}

interface InsuranceCoverage {
  has_insurance: boolean;
  insurance_company?: string;
  policy_number?: string;
  insurance_portion: number;
  patient_portion: number;
  deductible_applied: number;
}

interface TreatmentPlanFinancialsProps {
  treatmentPlanId: string;
  patientName: string;
  totalFee: number;
  insuranceVerified: boolean;
  insuranceCoverage: InsuranceCoverage;
  paymentOptions: FinancialOption[];
  insuranceNotes?: string;
  onPaymentOptionSelect?: (option: FinancialOption) => void;
}

export const TreatmentPlanFinancials: React.FC<TreatmentPlanFinancialsProps> = ({
  treatmentPlanId,
  patientName,
  totalFee,
  insuranceVerified,
  insuranceCoverage,
  paymentOptions,
  insuranceNotes,
  onPaymentOptionSelect
}) => {
  const [selectedOption, setSelectedOption] = useState<FinancialOption | null>(null);
  const [showAllOptions, setShowAllOptions] = useState(false);
  
  const handleOptionSelect = (option: FinancialOption) => {
    setSelectedOption(option);
    if (onPaymentOptionSelect) {
      onPaymentOptionSelect(option);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Show initial options or all options
  const displayOptions = showAllOptions ? paymentOptions : paymentOptions.slice(0, 2);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 text-primary mr-2" />
          Financial Information
        </CardTitle>
        <CardDescription>
          Treatment plan financial breakdown for {patientName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Insurance Overview */}
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-medium mb-2">Insurance Coverage</h3>
          
          {!insuranceVerified && (
            <div className="flex items-center text-amber-500 mb-4">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Insurance verification pending</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Treatment Cost</p>
              <p className="text-xl font-bold">{formatCurrency(totalFee)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Patient Responsibility</p>
              <p className="text-xl font-bold">{formatCurrency(insuranceCoverage.patient_portion)}</p>
            </div>
            
            {insuranceCoverage.has_insurance && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Insurance Covers</p>
                  <p className="text-lg">{formatCurrency(insuranceCoverage.insurance_portion)}</p>
                </div>
                
                {insuranceCoverage.deductible_applied > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deductible Applied</p>
                    <p className="text-lg">{formatCurrency(insuranceCoverage.deductible_applied)}</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {insuranceCoverage.has_insurance && (
            <div className="mt-4">
              <Badge variant="outline" className="mb-2">
                {insuranceCoverage.insurance_company} - {insuranceCoverage.policy_number}
              </Badge>
              
              {insuranceNotes && (
                <p className="text-sm text-muted-foreground mt-2">{insuranceNotes}</p>
              )}
            </div>
          )}
          
          {!insuranceCoverage.has_insurance && (
            <div className="mt-4">
              <Badge variant="outline" className="bg-amber-50">No active insurance</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Patient is responsible for the full treatment cost.
              </p>
            </div>
          )}
        </div>
        
        {/* Payment Options */}
        {paymentOptions.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Payment Options</h3>
            
            <div className="space-y-3">
              {displayOptions.map((option, index) => (
                <div
                  key={index}
                  className={`border rounded-md p-4 cursor-pointer transition-colors ${
                    selectedOption === option ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{option.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(option.monthly_payment)}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.duration_months === 1 ? 'One-time payment' : `per month for ${option.duration_months} months`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {option.discount_rate > 0 && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        {option.discount_rate}% discount
                      </Badge>
                    )}
                    
                    {option.interest_rate > 0 && (
                      <Badge variant="outline">
                        {option.interest_rate}% APR
                      </Badge>
                    )}
                    
                    {option.savings > 0 && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        Save {formatCurrency(option.savings)}
                      </Badge>
                    )}
                    
                    {option.requires_credit_approval && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Requires credit approval
                      </Badge>
                    )}
                  </div>
                  
                  {selectedOption === option && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Total you'll pay:</span>
                        <span className="font-medium">{formatCurrency(option.total_patient_pays)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {paymentOptions.length > 2 && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowAllOptions(!showAllOptions)}
                >
                  {showAllOptions ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show fewer options
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show all {paymentOptions.length} payment options
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Additional Financial Information */}
        <Accordion type="single" collapsible>
          <AccordionItem value="insurance-details">
            <AccordionTrigger className="text-sm">
              Detailed Insurance Coverage
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-sm space-y-2">
                <p>Insurance coverage is based on your current policy benefits, deductible status, and insurance maximum. Coverage estimates are not a guarantee of payment by your insurance carrier.</p>
                
                {insuranceCoverage.has_insurance && (
                  <div className="mt-2">
                    <div className="flex justify-between py-1">
                      <span>Insurance Company:</span>
                      <span>{insuranceCoverage.insurance_company}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Policy Number:</span>
                      <span>{insuranceCoverage.policy_number}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Deductible Applied:</span>
                      <span>{formatCurrency(insuranceCoverage.deductible_applied)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-medium">
                      <span>Insurance Portion:</span>
                      <span>{formatCurrency(insuranceCoverage.insurance_portion)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-medium">
                      <span>Patient Portion:</span>
                      <span>{formatCurrency(insuranceCoverage.patient_portion)}</span>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      
      <CardFooter>
        <div className="w-full flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4 inline-block mr-1" />
            Last updated: {new Date().toLocaleDateString()}
          </div>
          
          {selectedOption && (
            <Button>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Select {selectedOption.name}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}; 