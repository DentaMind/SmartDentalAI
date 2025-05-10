# Contract Auto-Generation Guide

This guide explains how to use DentaMind's contract auto-generation system, which allows backend-first workflow by generating FastAPI route stubs from TypeScript contracts.

## Overview

DentaMind's contract auto-generation system enables a seamless workflow between frontend and backend development:

1. Frontend developers define TypeScript contracts with Zod schemas
2. OpenAPI specifications are generated from these contracts
3. Backend developers generate FastAPI route stubs from these contracts
4. Backend developers implement the business logic for these stubs

This approach ensures type safety across the entire application and accelerates development by eliminating boilerplate code.

## Backend-First Workflow

### 1. Generate Route Stubs

To generate route stubs from TypeScript contracts, use the following command:

```bash
cd backend
python scripts/generate_from_contracts.py
```

This will:

1. Load the OpenAPI schema generated from TypeScript contracts
2. Create route stubs in `backend/api/routers/generated/`
3. Create model stubs in `backend/api/routers/generated/models/`

### 2. Customize Route Implementation

Once the stubs are generated, you can implement the business logic:

```python
# backend/api/routers/generated/patients_router.py
@router.get("/patients")
async def get_all_patients(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None
):
    """
    Get all patients
    
    Returns a paginated list of patients
    """
    # TODO: Implement GET /patients
    
    # Your implementation
    patients = await patient_service.get_patients(page=page, limit=limit, search=search)
    
    return {
        "patients": patients,
        "totalCount": len(patients),
        "page": page,
        "limit": limit
    }
```

### 3. Register Generated Routers

Generated routers are automatically registered in the FastAPI app during development. You can also manually import and register them:

```python
from api.routers.generated.patients_router import router as patients_router
app.include_router(patients_router, tags=["Patients"])
```

## Command-Line Tool Options

The contract generation tool provides several options:

```bash
python scripts/generate_from_contracts.py --help
```

| Option | Description |
|--------|-------------|
| `--force` | Force regeneration even if files already exist |
| `--tag TAG` | Generate only routes for a specific tag |
| `--output-dir DIR` | Output directory for generated files |
| `--openapi-path PATH` | Path to the OpenAPI schema |
| `--verbose, -v` | Enable verbose output |

## Template Customization

The generated code is based on Jinja2 templates that you can customize:

1. Route templates: `backend/api/utils/templates/router.py.jinja`
2. Model templates: `backend/api/utils/templates/models.py.jinja`

Modify these templates to match your project's coding style and requirements.

## Best Practices

1. **Never edit generated files directly**. Instead, copy them to a permanent location before modifying.
2. **Use the `--tag` option** to generate only the routes you're working on.
3. **Review generated code** before implementing to ensure it matches your expectations.
4. **Keep frontend and backend contracts in sync** by running `validate-contracts` regularly.

## Integration with Contract Validation

The auto-generation system works seamlessly with the contract validation system:

1. Generate OpenAPI schemas from TypeScript contracts
2. Validate frontend and backend schemas for compatibility
3. Generate route stubs from TypeScript contracts
4. Implement business logic in the stubs
5. Test implementation against contract validation tests

## HIPAA Compliance

The generated stubs include placeholders for proper error handling and validation, which helps with HIPAA compliance. However, you must still implement appropriate access controls and data protection in your business logic.

## Troubleshooting

Common issues and solutions:

- **No routes generated**: Ensure the OpenAPI schema exists at the specified path
- **Import errors**: Check that the generated models are accessible from the routers
- **Validation errors**: Ensure your implementation matches the contract types
- **Router conflicts**: Check for duplicate route paths in your application 