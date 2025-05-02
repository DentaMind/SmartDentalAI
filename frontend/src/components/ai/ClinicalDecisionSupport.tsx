import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter 
} from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { BookOpen, AlertCircle, CheckCircle, X, ArrowRight, Award } from 'lucide-react';

interface ClinicalDecisionSupportProps {
  findingId?: string;
  patientId?: string;
}

const ClinicalDecisionSupport: React.FC<ClinicalDecisionSupportProps> = ({ 
  findingId, 
  patientId 
}) => {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [treatmentPlan, setTreatmentPlan] = useState<any>(null);
  const [procedureDetails, setProcedureDetails] = useState<any>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);

  useEffect(() => {
    if (findingId) {
      fetchRecommendations(findingId);
    }
    if (patientId) {
      fetchTreatmentPlan(patientId);
    }
  }, [findingId, patientId]);

  const fetchRecommendations = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the API
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setRecommendations({
        finding_id: id,
        status: "recommendations_available",
        diagnosis: "Moderate Dental Caries",
        tooth_number: 19,
        treatments: [
          {
            name: "Dental Filling",
            description: "Removal of decay and restoration with composite or amalgam filling",
            priority: "high",
            procedure_steps: [
              "Administer local anesthesia",
              "Remove decayed material with high-speed handpiece",
              "Prepare cavity according to material requirements",
              "Apply bonding agent if using composite",
              "Place filling material and cure/set",
              "Check and adjust occlusion"
            ],
            estimated_time: "30-45 minutes",
            followup: "Evaluation in 6 months"
          }
        ],
        references: [
          {
            title: "Management of Dental Caries",
            source: "Journal of the American Dental Association",
            year: 2023,
            url: "https://example.com/caries-management"
          }
        ],
        related_conditions: [
          {condition: "Pulpitis", relationship: "Progression of untreated caries"},
          {condition: "Periapical Abscess", relationship: "End-stage complication"}
        ],
        notes: "Recommendations are based on clinical guidelines and should be verified by the provider"
      });
    } catch (err) {
      setError('Failed to load recommendations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTreatmentPlan = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the API
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setTreatmentPlan({
        patient_id: id,
        status: "plan_available",
        treatment_count: 5,
        treatment_plan: {
          urgent_treatments: [
            {
              finding_id: "finding-001",
              diagnosis: "Periapical Abscess",
              tooth_number: 19,
              treatment: "Root Canal Treatment",
              description: "Endodontic treatment to remove infected pulp and seal the canal",
              priority: "urgent"
            }
          ],
          high_priority_treatments: [
            {
              finding_id: "finding-002",
              diagnosis: "Moderate Dental Caries",
              tooth_number: 14,
              treatment: "Dental Filling",
              description: "Removal of decay and restoration with composite or amalgam filling",
              priority: "high"
            },
            {
              finding_id: "finding-003",
              diagnosis: "Moderate Gingivitis",
              tooth_number: null,
              treatment: "Professional Dental Cleaning",
              description: "Removal of plaque and calculus",
              priority: "high"
            }
          ],
          medium_priority_treatments: [
            {
              finding_id: "finding-004",
              diagnosis: "Mild Dental Caries",
              tooth_number: 2,
              treatment: "Fluoride Treatment",
              description: "Professional fluoride application to strengthen enamel",
              priority: "medium"
            }
          ],
          low_priority_treatments: [
            {
              finding_id: "finding-005",
              diagnosis: "Gingivitis",
              tooth_number: null,
              treatment: "Oral Hygiene Instruction",
              description: "Education on proper brushing and flossing techniques",
              priority: "low"
            }
          ]
        },
        estimated_visits: 3,
        notes: "Treatment plan is generated based on current diagnoses and should be reviewed by the provider"
      });
    } catch (err) {
      setError('Failed to load treatment plan');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProcedureGuidance = async (treatmentName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the API
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcedureDetails({
        status: "guidance_available",
        treatment: treatmentName,
        name: treatmentName,
        equipment: [
          "High-speed handpiece", "Low-speed handpiece", "Dental burs",
          "Excavators", "Composite or amalgam material", "Bonding system",
          "Curing light", "Articulating paper"
        ],
        steps: [
          {
            step: 1,
            description: "Administer local anesthesia",
            details: "Use appropriate anesthetic based on procedure length and patient history"
          },
          {
            step: 2,
            description: "Isolate the tooth with dental dam",
            details: "Ensures dry field and prevents contamination"
          },
          {
            step: 3,
            description: "Remove decayed material",
            details: "Use high-speed handpiece with appropriate bur size"
          },
          {
            step: 4,
            description: "Prepare cavity according to material requirements",
            details: "Follow material-specific preparation guidelines"
          },
          {
            step: 5,
            description: "Apply bonding agent if using composite",
            details: "Follow manufacturer's instructions for the specific bonding system"
          },
          {
            step: 6,
            description: "Place filling material and cure/set",
            details: "Apply in incremental layers if using composite"
          },
          {
            step: 7,
            description: "Check and adjust occlusion",
            details: "Use articulating paper to identify high spots"
          },
          {
            step: 8,
            description: "Polish the restoration",
            details: "Use appropriate polishing system for the material used"
          }
        ],
        estimated_time: "30-45 minutes",
        references: [
          {
            title: "Clinical Technique for Dental Fillings",
            source: "Journal of Operative Dentistry",
            year: 2022,
            url: "https://example.com/filling-technique"
          }
        ]
      });
      
      setSelectedTreatment(treatmentName);
      setActiveTab('procedures');
    } catch (err) {
      setError('Failed to load procedure guidance');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !recommendations && !treatmentPlan) {
    return (
      <div className="p-4 flex justify-center items-center">
        <div className="animate-pulse">Loading recommendations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center">
        <BookOpen className="mr-2" />
        Clinical Decision Support
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="treatmentPlan">Treatment Plan</TabsTrigger>
          <TabsTrigger value="procedures">Procedure Guidance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommendations">
          {recommendations ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 text-green-600" />
                  {recommendations.diagnosis}
                </CardTitle>
                <CardDescription>
                  {recommendations.tooth_number ? `Tooth #${recommendations.tooth_number}` : 'General Diagnosis'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recommended Treatments</h3>
                  {recommendations.treatments.map((treatment, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{treatment.name}</h4>
                          <p className="text-sm text-gray-600">{treatment.description}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          treatment.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          treatment.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                          treatment.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {treatment.priority === 'urgent' ? 'Urgent' :
                           treatment.priority === 'high' ? 'High Priority' :
                           treatment.priority === 'medium' ? 'Medium Priority' :
                           'Low Priority'}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        <div className="flex justify-between">
                          <span>Estimated time: {treatment.estimated_time}</span>
                          <span>Follow-up: {treatment.followup}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => fetchProcedureGuidance(treatment.name)}
                      >
                        View Procedure Details
                      </Button>
                    </div>
                  ))}
                  
                  {recommendations.related_conditions && recommendations.related_conditions.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold">Related Conditions to Monitor</h3>
                      <ul className="mt-2 space-y-2">
                        {recommendations.related_conditions.map((item, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                            <div>
                              <span className="font-medium">{item.condition}</span>
                              <span className="text-gray-600"> - {item.relationship}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {recommendations.references && recommendations.references.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="text-lg font-semibold">Clinical References</h3>
                      <ul className="mt-2 space-y-2">
                        {recommendations.references.map((ref, index) => (
                          <li key={index} className="text-sm">
                            <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {ref.title}
                            </a>
                            <span className="text-gray-600"> - {ref.source}, {ref.year}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500 border-t pt-4">
                {recommendations.notes}
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  {findingId 
                    ? "No recommendations available for this finding" 
                    : "Select a diagnostic finding to view recommendations"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="treatmentPlan">
          {treatmentPlan ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2" />
                  Comprehensive Treatment Plan
                </CardTitle>
                <CardDescription>
                  {treatmentPlan.treatment_count} treatments • Estimated {treatmentPlan.estimated_visits} visits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {treatmentPlan.treatment_plan.urgent_treatments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold flex items-center text-red-700 mb-2">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        Urgent Treatments
                      </h3>
                      <div className="space-y-2">
                        {treatmentPlan.treatment_plan.urgent_treatments.map((treatment, index) => (
                          <div key={index} className="border-l-4 border-red-500 pl-3 py-2">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{treatment.treatment}</h4>
                                <p className="text-sm text-gray-600">
                                  {treatment.diagnosis} {treatment.tooth_number ? `• Tooth #${treatment.tooth_number}` : ''}
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => fetchProcedureGuidance(treatment.treatment)}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {treatmentPlan.treatment_plan.high_priority_treatments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-amber-700 mb-2">High Priority Treatments</h3>
                      <div className="space-y-2">
                        {treatmentPlan.treatment_plan.high_priority_treatments.map((treatment, index) => (
                          <div key={index} className="border-l-4 border-amber-500 pl-3 py-2">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{treatment.treatment}</h4>
                                <p className="text-sm text-gray-600">
                                  {treatment.diagnosis} {treatment.tooth_number ? `• Tooth #${treatment.tooth_number}` : ''}
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => fetchProcedureGuidance(treatment.treatment)}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {treatmentPlan.treatment_plan.medium_priority_treatments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-700 mb-2">Medium Priority Treatments</h3>
                      <div className="space-y-2">
                        {treatmentPlan.treatment_plan.medium_priority_treatments.map((treatment, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{treatment.treatment}</h4>
                                <p className="text-sm text-gray-600">
                                  {treatment.diagnosis} {treatment.tooth_number ? `• Tooth #${treatment.tooth_number}` : ''}
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => fetchProcedureGuidance(treatment.treatment)}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {treatmentPlan.treatment_plan.low_priority_treatments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-2">Low Priority Treatments</h3>
                      <div className="space-y-2">
                        {treatmentPlan.treatment_plan.low_priority_treatments.map((treatment, index) => (
                          <div key={index} className="border-l-4 border-green-500 pl-3 py-2">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{treatment.treatment}</h4>
                                <p className="text-sm text-gray-600">
                                  {treatment.diagnosis} {treatment.tooth_number ? `• Tooth #${treatment.tooth_number}` : ''}
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => fetchProcedureGuidance(treatment.treatment)}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500 border-t pt-4">
                {treatmentPlan.notes}
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  {patientId 
                    ? "No treatment plan available for this patient" 
                    : "Select a patient to view treatment plan"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="procedures">
          {procedureDetails ? (
            <Card>
              <CardHeader>
                <CardTitle>{procedureDetails.name}</CardTitle>
                <CardDescription>Estimated time: {procedureDetails.estimated_time}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Required Equipment</h3>
                    <div className="flex flex-wrap gap-2">
                      {procedureDetails.equipment.map((item, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 text-sm rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Procedure Steps</h3>
                    <div className="space-y-3">
                      {procedureDetails.steps.map((step, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-3 py-2">
                          <h4 className="font-medium">Step {step.step}: {step.description}</h4>
                          <p className="text-sm text-gray-600">{step.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {procedureDetails.references && procedureDetails.references.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="text-lg font-semibold">Clinical References</h3>
                      <ul className="mt-2 space-y-2">
                        {procedureDetails.references.map((ref, index) => (
                          <li key={index} className="text-sm">
                            <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {ref.title}
                            </a>
                            <span className="text-gray-600"> - {ref.source}, {ref.year}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  Select a treatment to view procedure details
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClinicalDecisionSupport; 