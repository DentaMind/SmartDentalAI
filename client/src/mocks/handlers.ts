// Mock API handlers to simulate backend responses for development
import { http, HttpResponse } from 'msw';
import { v4 as uuidv4 } from 'uuid';

// Mock health check response
const healthResponse = {
  status: "healthy",
  components: {
    api: "online",
    database: "online", 
    storage: "online",
    inference: "mock"
  },
  model: {
    type: "mock",
    version: "1.0.0",
    mock: true
  },
  version: "1.0.0",
  environment: "development"
};

// Mock AI configuration
const mockConfig = {
  useMockData: true,
  modelType: "mock",
  maxConcurrentRequests: 5,
  confidenceThreshold: 0.7
};

// Mock metrics
const generateMockMetrics = () => {
  const dailyInferences: Record<string, number> = {};
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyInferences[dateStr] = Math.floor(Math.random() * 70) + 30; // 30-100 range
  }
  
  return {
    totalInferences: 1247,
    averageLatency: 342.5,
    successRate: 97.2,
    averageConfidence: 0.83,
    modelUsage: {
      'mock': 825,
      'onnx': 312,
      'pytorch': 110
    },
    feedbackSummary: {
      accepted: 562,
      modified: 87,
      rejected: 25
    },
    inferencesByType: {
      'panoramic': 425,
      'bitewing': 732,
      'periapical': 90
    },
    dailyInferences
  };
};

// Comprehensive mock diagnostic analysis response
const generateMockDiagnosticAnalysis = (imageType: string, patientId: string, patientName: string = 'Patient') => {
  // Generate different findings based on image type
  const mockFindings = [];
  const overallConfidence = 0.87;
  
  if (imageType === 'xray') {
    mockFindings.push({
      id: uuidv4(),
      type: "Dental Caries",
      description: "Interproximal caries detected on distal surface of tooth #14",
      location: "Tooth #14 (Upper Right First Molar)",
      confidence: 0.92,
      suggestedTreatments: [
        "Composite Restoration", 
        "Preventive Resin Restoration"
      ],
      evidence: {
        researchLinks: [
          { title: "Early Caries Detection", url: "https://pubmed.ncbi.nlm.nih.gov/example1" },
          { title: "Composite vs Amalgam", url: "https://pubmed.ncbi.nlm.nih.gov/example2" }
        ],
        clinicalGuidelines: "ADA recommends composite restorations for moderate caries with intact margins."
      },
      coordinates: { x: 230, y: 145, width: 25, height: 30 }
    });
    
    mockFindings.push({
      id: uuidv4(),
      type: "Periapical Radiolucency",
      description: "Early-stage periapical lesion indicating possible infection",
      location: "Tooth #22 (Upper Left Lateral Incisor)",
      confidence: 0.78,
      suggestedTreatments: [
        "Root Canal Therapy", 
        "Periapical Monitoring"
      ],
      evidence: {
        researchLinks: [
          { title: "Periapical Lesion Management", url: "https://pubmed.ncbi.nlm.nih.gov/example3" }
        ],
        clinicalGuidelines: "AAE recommends endodontic intervention for symptomatic periapical lesions."
      },
      coordinates: { x: 310, y: 130, width: 15, height: 20 }
    });
    
    mockFindings.push({
      id: uuidv4(),
      type: "Bone Loss",
      description: "Moderate horizontal bone loss detected in mandibular anterior region",
      location: "Lower Anterior (teeth #23-#26)",
      confidence: 0.85,
      suggestedTreatments: [
        "Scaling and Root Planing",
        "Periodontal Maintenance",
        "Oral Hygiene Instruction"
      ],
      evidence: {
        researchLinks: [
          { title: "Periodontal Disease Progression", url: "https://pubmed.ncbi.nlm.nih.gov/example4" }
        ],
        clinicalGuidelines: "AAP recommends non-surgical therapy as initial approach for moderate periodontitis."
      },
      coordinates: { x: 270, y: 320, width: 80, height: 40 }
    });
  } else if (imageType === 'photo') {
    mockFindings.push({
      id: uuidv4(),
      type: "Gingival Inflammation",
      description: "Moderate gingival inflammation with bleeding on probing",
      location: "Upper Right Quadrant (teeth #1-#8)",
      confidence: 0.88,
      suggestedTreatments: [
        "Prophylaxis", 
        "Oral Hygiene Instruction"
      ],
      evidence: {
        researchLinks: [
          { title: "Gingivitis Treatment", url: "https://pubmed.ncbi.nlm.nih.gov/example5" }
        ],
        clinicalGuidelines: "ADA recommends professional cleaning and improved home care."
      }
    });
  } else if (imageType === 'scan') {
    mockFindings.push({
      id: uuidv4(),
      type: "Occlusal Wear",
      description: "Moderate occlusal wear on first molars",
      location: "Teeth #3, #14, #19, #30",
      confidence: 0.84,
      suggestedTreatments: [
        "Occlusal Guard", 
        "Monitoring"
      ],
      evidence: {
        researchLinks: [
          { title: "Occlusal Guard Efficacy", url: "https://pubmed.ncbi.nlm.nih.gov/example6" }
        ]
      }
    });
  }
  
  // Treatment cost and insurance estimates
  const treatmentCosts = {
    "Composite Restoration": { cost: 250, insuranceCoverage: "80%", patientPortion: 50 },
    "Preventive Resin Restoration": { cost: 180, insuranceCoverage: "80%", patientPortion: 36 },
    "Root Canal Therapy": { cost: 900, insuranceCoverage: "70%", patientPortion: 270 },
    "Periapical Monitoring": { cost: 75, insuranceCoverage: "100%", patientPortion: 0 },
    "Scaling and Root Planing": { cost: 200, insuranceCoverage: "80%", patientPortion: 40 },
    "Periodontal Maintenance": { cost: 150, insuranceCoverage: "80%", patientPortion: 30 },
    "Oral Hygiene Instruction": { cost: 0, insuranceCoverage: "100%", patientPortion: 0 },
    "Prophylaxis": { cost: 120, insuranceCoverage: "100%", patientPortion: 0 },
    "Occlusal Guard": { cost: 450, insuranceCoverage: "50%", patientPortion: 225 },
    "Monitoring": { cost: 0, insuranceCoverage: "100%", patientPortion: 0 }
  };
  
  return {
    id: uuidv4(),
    imageType,
    findings: mockFindings,
    confidence: overallConfidence,
    timestamp: new Date().toISOString(),
    imageUrl: `https://example.com/analysis/${patientId}/${uuidv4()}.jpg`,
    processingTimeMs: Math.floor(Math.random() * 600) + 200,
    patientId,
    patientName,
    analysisSummary: `Found ${mockFindings.length} conditions requiring attention for ${patientName}.`,
    treatmentCosts
  };
};

// Mock reanalysis response
const mockReanalysis = (patientId: string, imageId: string, imageType: string) => {
  return {
    success: true,
    analysis_id: uuidv4(),
    patient_id: patientId,
    image_type: imageType,
    timestamp: new Date().toISOString(),
    processing_time_ms: Math.floor(Math.random() * 600) + 200, // 200-800ms
    model_version: "1.0.0",
    findings: {
      caries: [
        {
          tooth: "14",
          surface: "O",
          confidence: 0.92,
          severity: "moderate"
        },
        {
          tooth: "18",
          surface: "M",
          confidence: 0.85,
          severity: "mild"
        }
      ],
      periapical_lesions: [
        {
          tooth: "22",
          confidence: 0.78,
          diameter_mm: 3.5
        }
      ],
      restorations: [
        {
          tooth: "36",
          surface: "MOD",
          material: "amalgam",
          confidence: 0.94,
          condition: "good"
        }
      ]
    },
    reanalyzed: true,
    original_image_id: imageId
  };
};

// Mock patient data
const mockPatients = [
  {
    id: 'patient-1',
    name: 'John Smith',
    dob: '1982-03-15',
    gender: 'male',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, CA 94582',
    insurance: {
      provider: 'DentalCare Plus',
      memberId: 'DCP82736495',
      groupNumber: 'GRP29837',
      coverage: '80/20'
    },
    medicalHistory: {
      allergies: ['Penicillin'],
      conditions: ['Hypertension'],
      medications: ['Lisinopril 10mg']
    }
  },
  {
    id: 'patient-2',
    name: 'Jane Smith',
    dob: '1985-07-22',
    gender: 'female',
    email: 'jane.smith@example.com',
    phone: '(555) 987-6543',
    address: '456 Oak Ave, Anytown, CA 94582',
    insurance: {
      provider: 'BlueDental Complete',
      memberId: 'BDC87654321',
      groupNumber: 'GRP34567',
      coverage: '90/10'
    },
    medicalHistory: {
      allergies: ['Sulfa drugs'],
      conditions: ['Diabetes Type 2'],
      medications: ['Metformin 500mg']
    }
  },
  {
    id: 'patient-3',
    name: 'Robert Brown',
    dob: '1975-11-30',
    gender: 'male',
    email: 'robert.brown@example.com',
    phone: '(555) 456-7890',
    address: '789 Pine St, Anytown, CA 94582',
    insurance: {
      provider: 'Delta Dental Premier',
      memberId: 'DDP12345678',
      groupNumber: 'GRP56789',
      coverage: '70/30'
    },
    medicalHistory: {
      allergies: [],
      conditions: ['Arthritis'],
      medications: ['Ibuprofen 800mg']
    }
  }
];

// Define mock handlers for all our API endpoints
export const handlers = [
  // Health check
  http.get('/health', () => {
    return HttpResponse.json(healthResponse);
  }),
  
  // API health check
  http.get('/api/health', () => {
    return HttpResponse.json(healthResponse);
  }),

  // Patient endpoints
  http.get('/patients/:id', ({ params }) => {
    const { id } = params;
    const patient = mockPatients.find(p => p.id === id);
    
    if (patient) {
      return HttpResponse.json(patient);
    }
    
    return new HttpResponse(null, { status: 404, statusText: 'Patient not found' });
  }),
  
  http.get('/patients', () => {
    return HttpResponse.json(mockPatients);
  }),

  // Add handler for /api/patients endpoint
  http.get('/api/patients', () => {
    // Format patient data to match what the PatientsPage component expects
    const formattedPatients = mockPatients.map(patient => ({
      id: patient.id,
      name: patient.name,
      dob: patient.dob,
      lastVisit: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
      status: Math.random() > 0.2 ? 'Active' : 'Inactive',
      treatmentStatus: ['Completed', 'In Progress', 'Scheduled', 'Pending'][Math.floor(Math.random() * 4)],
      email: patient.email,
      phone: patient.phone
    }));
    
    return HttpResponse.json(formattedPatients);
  }),

  // Add handler for individual patient via API
  http.get('/api/patients/:id', ({ params }) => {
    const { id } = params;
    const patient = mockPatients.find(p => p.id === id);
    
    if (patient) {
      // Format the patient data with additional fields needed for patient detail page
      const patientDetail = {
        ...patient,
        lastVisit: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
        status: Math.random() > 0.2 ? 'Active' : 'Inactive',
        treatmentStatus: ['Completed', 'In Progress', 'Scheduled', 'Pending'][Math.floor(Math.random() * 4)],
        appointments: [
          {
            id: 'appt-1',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'Check-up',
            notes: 'Regular 6-month check-up'
          }
        ],
        treatments: [
          {
            id: 'treat-1',
            name: 'Composite Filling',
            tooth: '14',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Completed'
          }
        ]
      };
      
      return HttpResponse.json(patientDetail);
    }
    
    return new HttpResponse(null, { status: 404, statusText: 'Patient not found' });
  }),

  // Add handler for new patient page - just returns a success to avoid errors
  http.get('/api/patients/new', () => {
    return HttpResponse.json({
      success: true,
      message: 'New patient form ready',
      template: {
        name: '',
        dob: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        insurance: {
          provider: '',
          memberId: '',
          groupNumber: '',
          coverage: ''
        }
      }
    });
  }),

  // Add handler for creating a new patient
  http.post('/api/patients', async ({ request }) => {
    const patientData = await request.json();
    
    // Generate a new patient ID
    const newPatientId = `patient-${mockPatients.length + 1}`;
    
    // In a real implementation, you would save this to a database
    const newPatient = {
      id: newPatientId,
      ...patientData,
      created: new Date().toISOString()
    };
    
    return HttpResponse.json({
      success: true,
      message: 'Patient created successfully',
      patient: newPatient
    }, { status: 201 });
  }),

  // Add handler for patient intake form submission
  http.post('/api/patients/intake', async ({ request }) => {
    const formData = await request.json();
    
    // Generate a new patient ID
    const newPatientId = `patient-${mockPatients.length + 1}`;
    
    // Create a new patient record from the intake form data
    const newPatient = {
      id: newPatientId,
      name: `${formData.firstName} ${formData.lastName}`,
      dob: formData.dateOfBirth,
      gender: formData.gender,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      insurance: {
        provider: formData.hasInsurance ? formData.insuranceProvider : null,
        memberId: formData.hasInsurance ? formData.insuranceMemberId : null,
        groupNumber: formData.hasInsurance ? formData.insuranceGroupNumber : null,
        coverage: formData.hasInsurance ? formData.insurancePlanType : null
      },
      medicalHistory: {
        allergies: formData.allergies ? formData.allergies.split(',').map((a: string) => a.trim()) : [],
        conditions: formData.medicalConditions ? formData.medicalConditions.split(',').map((c: string) => c.trim()) : [],
        medications: formData.medications ? formData.medications.split(',').map((m: string) => m.trim()) : []
      },
      dentalHistory: {
        lastVisit: formData.lastDentalVisit,
        previousWork: formData.previousDentalWork,
        concerns: formData.currentDentalConcerns
      },
      emergencyContact: {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relationship: formData.emergencyContactRelationship
      },
      created: new Date().toISOString(),
      lastVisit: null,
      status: 'Active',
      treatmentStatus: 'Pending'
    };
    
    // In a real implementation, you would save this to a database
    // For mock purposes, we could add it to our mockPatients array
    // mockPatients.push(newPatient);
    
    return HttpResponse.json({
      success: true,
      message: "Patient intake form submitted successfully",
      patient: {
        id: newPatientId,
        name: newPatient.name
      }
    }, { status: 201 });
  }),

  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    try {
      const body = await request.json();
      const { email, password } = body;
      
      // Simple validation for demo user 
      if (email === 'demo@dentamind.com' && password === 'password123') {
        return HttpResponse.json({
          token: 'mock-jwt-token',
          user: {
            id: 'user-1',
            email: 'demo@dentamind.com',
            name: 'Dr. Demo User',
            role: 'doctor',
            is_active: true
          }
        });
      }

      // Default success case for any credentials during development
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: 'user-1',
          email: email || 'doctor@example.com',
          name: 'Dr. Example',
          role: 'doctor',
          is_active: true
        }
      });
    } catch (error) {
      console.error('Error handling login request:', error);
      return new HttpResponse(null, { status: 400, statusText: 'Bad Request' });
    }
  }),

  http.get('/api/auth/profile', () => {
    return HttpResponse.json({
      id: 'user-1',
      email: 'demo@dentamind.com',
      name: 'Dr. Demo User',
      role: 'doctor',
      is_active: true
    });
  }),

  // Admin endpoints
  http.get('/api/admin/ai-config', () => {
    return HttpResponse.json(mockConfig);
  }),
  
  http.post('/api/admin/ai-config', async ({ request }) => {
    const config = await request.json();
    return HttpResponse.json({
      success: true,
      message: "Configuration updated successfully",
      config
    });
  }),
  
  http.get('/api/admin/ai-metrics', () => {
    return HttpResponse.json(generateMockMetrics());
  }),
  
  // Diagnostics endpoints
  http.post('/diagnostics/analyze', async ({ request }) => {
    // Simulate processing delay for realistic API behavior
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Parse the FormData from the request
    const data = await request.formData();
    const imageType = data.get('imageType') as string || 'xray';
    const patientId = data.get('patientId') as string || 'patient-1';
    
    // Find the patient to include their info
    const patient = mockPatients.find(p => p.id === patientId);
    
    // Generate a realistic diagnostic analysis with patient context
    return HttpResponse.json(
      generateMockDiagnosticAnalysis(imageType, patientId, patient?.name || 'Unknown Patient')
    );
  }),
  
  http.post('/api/diagnostics/reanalyze', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      mockReanalysis(
        body.patientId, 
        body.imageId, 
        body.imageType
      )
    );
  }),
  
  http.post('/diagnostics/save', async ({ request }) => {
    const body = await request.json();
    
    // In a real implementation, this would save to a database
    return HttpResponse.json({
      success: true,
      message: "Diagnostic results saved successfully",
      savedDiagnosticId: body.analysisId,
      timestamp: new Date().toISOString(),
      patientId: body.patientId,
    });
  }),
  
  // Treatment endpoints based on diagnostics
  http.get('/patients/:patientId/treatments', ({ params }) => {
    const { patientId } = params;
    const patient = mockPatients.find(p => p.id === patientId);
    
    if (!patient) {
      return new HttpResponse(null, { status: 404, statusText: 'Patient not found' });
    }
    
    // Generate mock treatment data
    const mockTreatments = [
      {
        id: 'treat-1',
        name: 'Composite Filling',
        tooth: '14',
        surfaces: ['MO'],
        status: 'scheduled',
        cost: 220,
        insuranceCoverage: 176,
        patientPortion: 44,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
      },
      {
        id: 'treat-2',
        name: 'Root Canal',
        tooth: '19',
        surfaces: [],
        status: 'recommended',
        cost: 950,
        insuranceCoverage: 665,
        patientPortion: 285,
        date: null
      }
    ];
    
    return HttpResponse.json(mockTreatments);
  }),
  
  // Treatment feedback endpoint
  http.post('/api/treatments/feedback', async () => {
    return HttpResponse.json({
      success: true,
      message: "Feedback recorded successfully",
      feedback_id: uuidv4()
    });
  }),
]; 