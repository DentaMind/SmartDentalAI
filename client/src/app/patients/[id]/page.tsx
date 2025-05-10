import { BUIntakeForm } from "@/components/patients/bu-intake-form";
// ... existing imports ...

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  // ... existing code ...

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Patient Profile</h1>
        <Button onClick={() => setShowEditModal(true)}>Edit Profile</Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
          <TabsTrigger value="intake">Intake Form</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* ... existing overview content ... */}
        </TabsContent>

        <TabsContent value="appointments">
          {/* ... existing appointments content ... */}
        </TabsContent>

        <TabsContent value="treatment">
          {/* ... existing treatment content ... */}
        </TabsContent>

        <TabsContent value="intake">
          <Card>
            <CardHeader>
              <CardTitle>Boston University Dental Intake Form</CardTitle>
            </CardHeader>
            <CardContent>
              {patient ? (
                <BUIntakeForm
                  patientId={patient.id}
                  initialData={patient.patientIntakeForm}
                />
              ) : (
                <div className="text-center py-4">Loading intake form...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ... existing modals ... */}
    </div>
  );
} 