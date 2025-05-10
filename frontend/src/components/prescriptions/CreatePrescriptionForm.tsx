import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from '../ui/card';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from '../ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { PlusCircle, MinusCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the form schema using Zod
const medicationItemSchema = z.object({
  medication_name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  form: z.string().min(1, "Form is required"),
  route: z.string().min(1, "Route is required"),
  frequency: z.string().min(1, "Frequency is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  days_supply: z.coerce.number().optional(),
  refills: z.coerce.number().min(0, "Refills cannot be negative"),
  dispense_as_written: z.boolean().default(false),
  notes: z.string().optional(),
});

const prescriptionFormSchema = z.object({
  patient_id: z.string(),
  provider_id: z.string().optional(),
  prescription_date: z.string(), // ISO date string
  notes: z.string().optional(),
  items: z.array(medicationItemSchema).min(1, "At least one medication is required"),
  treatment_plan_id: z.string().optional(),
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

interface MedicationOption {
  id: string;
  name: string;
  common_forms: string[];
  common_routes: string[];
  common_dosages: string[];
  common_frequencies: string[];
}

interface CreatePrescriptionFormProps {
  patientId: string;
  patientName: string;
  providerId?: string;
  providerName?: string;
  treatmentPlanId?: string;
  treatmentPlanName?: string;
  onSubmit: (data: PrescriptionFormValues) => void;
  onCancel: () => void;
}

export const CreatePrescriptionForm: React.FC<CreatePrescriptionFormProps> = ({
  patientId,
  patientName,
  providerId = "",
  providerName = "",
  treatmentPlanId,
  treatmentPlanName,
  onSubmit,
  onCancel
}) => {
  const [medications, setMedications] = useState<MedicationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Setup react-hook-form
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      patient_id: patientId,
      provider_id: providerId,
      prescription_date: new Date().toISOString().split('T')[0],
      notes: '',
      items: [
        {
          medication_name: '',
          dosage: '',
          form: '',
          route: '',
          frequency: '',
          quantity: 0,
          days_supply: undefined,
          refills: 0,
          dispense_as_written: false,
          notes: '',
        }
      ],
      treatment_plan_id: treatmentPlanId,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch medications on component mount
  useEffect(() => {
    fetchMedications();
  }, []);

  // Fetch medications
  const fetchMedications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/medications');
      if (!response.ok) throw new Error('Failed to fetch medications');
      
      const data = await response.json();
      setMedications(data);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast({
        title: "Error",
        description: "Failed to load medications list",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (values: PrescriptionFormValues) => {
    onSubmit(values);
  };

  // Add a new medication item to the form
  const addMedicationItem = () => {
    append({
      medication_name: '',
      dosage: '',
      form: '',
      route: '',
      frequency: '',
      quantity: 0,
      days_supply: undefined,
      refills: 0,
      dispense_as_written: false,
      notes: '',
    });
  };

  // Get medication options for a field when a medication is selected
  const getMedicationOptions = (fieldIndex: number, optionType: 'form' | 'route' | 'dosage' | 'frequency') => {
    const medicationName = form.getValues(`items.${fieldIndex}.medication_name`);
    const selectedMedication = medications.find(m => m.name === medicationName);
    
    if (!selectedMedication) return [];
    
    switch (optionType) {
      case 'form':
        return selectedMedication.common_forms;
      case 'route':
        return selectedMedication.common_routes;
      case 'dosage':
        return selectedMedication.common_dosages;
      case 'frequency':
        return selectedMedication.common_frequencies;
      default:
        return [];
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-xl">Create New Prescription</CardTitle>
        <CardDescription>
          Create a prescription for {patientName}
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Basic Prescription Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Patient</FormLabel>
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="font-medium">{patientName}</p>
                  <p className="text-sm text-muted-foreground">ID: {patientId}</p>
                </div>
              </div>
              
              <div>
                <FormLabel>Provider</FormLabel>
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="font-medium">{providerName}</p>
                  <p className="text-sm text-muted-foreground">ID: {providerId}</p>
                </div>
              </div>
            </div>
            
            {/* Treatment Plan Reference */}
            {treatmentPlanId && (
              <div className="bg-muted p-3 rounded-md">
                <FormLabel>Related Treatment Plan</FormLabel>
                <p className="mt-1 font-medium">{treatmentPlanName || treatmentPlanId}</p>
              </div>
            )}
            
            {/* Prescription Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescription Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any general notes for this prescription..." 
                      className="h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Medications Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Medications</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addMedicationItem}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Medication #{index + 1}</h4>
                    {index > 0 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusCircle className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medication Name */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.medication_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medication Name</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select medication" />
                              </SelectTrigger>
                              <SelectContent>
                                {medications.map(medication => (
                                  <SelectItem key={medication.id} value={medication.name}>
                                    {medication.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Dosage */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.dosage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosage</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select dosage" />
                              </SelectTrigger>
                              <SelectContent>
                                {getMedicationOptions(index, 'dosage').map((dosage, i) => (
                                  <SelectItem key={i} value={dosage}>
                                    {dosage}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Form */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.form`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Form</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select form" />
                              </SelectTrigger>
                              <SelectContent>
                                {getMedicationOptions(index, 'form').map((form, i) => (
                                  <SelectItem key={i} value={form}>
                                    {form}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Route */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.route`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select route" />
                              </SelectTrigger>
                              <SelectContent>
                                {getMedicationOptions(index, 'route').map((route, i) => (
                                  <SelectItem key={i} value={route}>
                                    {route}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Frequency */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.frequency`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                {getMedicationOptions(index, 'frequency').map((frequency, i) => (
                                  <SelectItem key={i} value={frequency}>
                                    {frequency}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Days Supply */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.days_supply`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days Supply</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Refills */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.refills`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refills</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dispense As Written */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.dispense_as_written`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Dispense As Written</FormLabel>
                            <FormDescription>
                              Requires exact medication as prescribed
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Medication Notes */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medication Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter any notes for this medication..." 
                            className="h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Prescription"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}; 