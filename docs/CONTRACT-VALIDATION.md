# API Contract Validation System

This document explains DentaMind's API contract validation system, which ensures type safety and consistency between the frontend and backend.

## Overview

DentaMind uses a robust contract validation system to:

1. Define API contracts with Zod schemas in TypeScript
2. Generate OpenAPI specifications from these contracts
3. Validate requests and responses at runtime
4. Check for contract violations in development and CI
5. Enforce type safety across the entire application

This system prevents breaking changes, ensures consistent data structures, and helps maintain HIPAA compliance.

## Key Components

### Frontend

- `client/src/types/apiContracts.ts`: Defines all API contracts with Zod schemas
- `client/src/services/apiClient.ts`: Type-safe API client that enforces contracts
- `client/hooks/useApi.ts`: React hook for using the API client with proper error handling
- `client/src/utils/zod-openapi.ts`: Converts Zod schemas to OpenAPI format
- `client/src/scripts/openapi-diff.ts`: Compares frontend and backend schemas
- `client/scripts/ci-validate-contracts.js`: CI integration for contract validation

### Backend

- `backend/api/utils/contract_sync.py`: Syncs backend with frontend contracts
- Middleware for runtime validation of requests and responses
- Development endpoints for contract violation reporting

## Using the Contract System

### Adding a New API Endpoint

1. **Define the contract in TypeScript:**

```typescript
// client/src/types/apiContracts.ts
import { z } from 'zod';

export const ApiContracts = {
  '/api/patients': {
    GET: {
      summary: 'Get all patients',
      tags: ['Patients'],
      request: {
        query: z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          search: z.string().optional()
        })
      },
      response: {
        200: z.object({
          patients: z.array(PatientSchema),
          totalCount: z.number(),
          page: z.number(),
          limit: z.number()
        })
      }
    },
    POST: {
      summary: 'Create a new patient',
      tags: ['Patients'],
      request: {
        body: PatientCreationSchema
      },
      response: {
        201: PatientSchema
      }
    }
  }
};
```

2. **Run the OpenAPI generator:**

```bash
npm run generate-openapi
```

3. **Implement the backend endpoint with FastAPI:**

```python
# backend/api/routers/patients.py
from fastapi import APIRouter, Depends, Query
from typing import List, Optional

router = APIRouter()

@router.get("/patients")
async def get_patients(
    page: Optional[int] = Query(1), 
    limit: Optional[int] = Query(10),
    search: Optional[str] = None
):
    # Implementation
    return {
        "patients": [...],
        "totalCount": 100,
        "page": page,
        "limit": limit
    }

@router.post("/patients", status_code=201)
async def create_patient(patient: PatientCreate):
    # Implementation
    return patient
```

4. **Use the API client in frontend components:**

```typescript
// Component using the API
import { useApi } from '../hooks/useApi';

function PatientList() {
  const api = useApi();
  const [patients, setPatients] = useState([]);
  
  useEffect(() => {
    const fetchPatients = async () => {
      const response = await api.get('/api/patients', { 
        query: { page: 1, limit: 10 } 
      });
      setPatients(response.patients);
    };
    
    fetchPatients();
  }, [api]);
  
  // Component rendering
}
```

### CI/CD Integration

Our GitHub Actions workflow automatically validates contracts on pull requests:

1. Generates OpenAPI schemas from frontend contracts
2. Fetches backend OpenAPI schema
3. Compares schemas for compatibility
4. Reports any discrepancies

## Development Tools

### Contract Violation Monitoring

Visit the following endpoints during development:

- `/api/_dev/contracts/violations`: View any contract violations
- `/api/_dev/contracts/missing-endpoints`: See endpoints defined in frontend but missing in backend

### OpenAPI Schema Viewer

- `/docs`: Swagger UI for backend API documentation
- `http://localhost:3000/_dev/contracts/browser`: Frontend API Contract Browser

## Best Practices

1. **Always define contracts first** before implementing endpoints
2. **Keep response structures minimal** - only return what's needed
3. **Use descriptive error responses** with proper status codes
4. **Run validation tests locally** before pushing changes
5. **Validate all user inputs** with Zod schemas

## Troubleshooting

Common issues and solutions:

- **Schema mismatch errors**: Run the diff tool to identify discrepancies
- **Runtime validation errors**: Check the contracts debug endpoint for details
- **Missing endpoints**: Ensure both frontend and backend implementations exist
- **Type errors**: Make sure your implementation matches the contract

## HIPAA Compliance

Our contract validation system helps maintain HIPAA compliance by:

- Ensuring PII is properly validated
- Preventing accidental exposure of sensitive data
- Tracking all data access patterns
- Providing audit trails through request validation

## Additional Resources

- [Zod Documentation](https://github.com/colinhacks/zod)
- [FastAPI Schema Validation](https://fastapi.tiangolo.com/tutorial/schema/)
- [OpenAPI Specification](https://swagger.io/specification/) 