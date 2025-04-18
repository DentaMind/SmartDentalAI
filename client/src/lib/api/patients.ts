export async function getPatient(id: number): Promise<Patient> {
  const response = await fetch(`/api/patients/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch patient");
  }
  const data = await response.json();
  return {
    ...data,
    patientIntakeForm: data.patientIntakeForm || null,
  };
}

export async function updatePatient(id: number, data: Partial<Patient>): Promise<Patient> {
  const response = await fetch(`/api/patients/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update patient");
  }

  const updatedPatient = await response.json();
  return {
    ...updatedPatient,
    patientIntakeForm: updatedPatient.patientIntakeForm || null,
  };
} 