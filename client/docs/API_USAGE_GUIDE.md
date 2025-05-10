# DentaMind API Usage Guide

## Overview

This guide provides best practices and examples for using the API client in the DentaMind application.

## API Client

The main API client is located at `client/src/lib/api.ts`. This file exports several important utilities:

- `API` - The main API client with methods for GET, POST, PUT, DELETE operations
- `AuthAPI` - Authentication-specific API methods
- `HealthAPI` - Health check methods
- `TypedAPI` - Type-safe wrappers for specific API endpoints

## Correct Usage Pattern

### 1. Import the API client directly

```typescript
import API from '../../lib/api';
```

**NOT** (this is incorrect):
```typescript
import { useApi } from '../../hooks/useApi';
const api = useApi();
```

### 2. Call methods directly on the API object

```typescript
const response = await API.get('/api/endpoint');
```

### 3. Access the response data directly

The API client does NOT wrap responses in a `data` property. The response is the actual data.

```typescript
// CORRECT
const response = await API.get('/api/admin/ai-metrics');
setMetrics(response);

// INCORRECT - this would cause "response.data is undefined" errors
const response = await API.get('/api/admin/ai-metrics');
setMetrics(response.data); // ❌ Wrong!
```

## TypeScript Support

The API client now includes proper TypeScript typing to help prevent errors:

```typescript
// Generic usage
const response = await API.get<UserProfile>('/api/users/me');
// response is now typed as UserProfile

// Using typed API methods
const metrics = await TypedAPI.admin.getAIMetrics({
  start_date: '2023-01-01', 
  end_date: '2023-12-31'
});
// metrics is automatically typed as AIMetricsResponse
```

## ESLint Rules

The codebase includes custom ESLint rules to prevent common API usage errors:

1. `no-restricted-imports`: Prevents direct imports of the `useApi` hook
2. `no-restricted-properties`: Prevents accessing `.data` on API responses

These rules will produce errors during development to help catch misuse early.

## Type Guards

You can use the `isAPIClient` type guard to check if an object is a valid API client:

```typescript
import { isAPIClient } from '../types/api-types';

if (isAPIClient(someObject)) {
  // It's a valid API client
  const data = await someObject.get('/api/endpoint');
} else {
  // Not a valid API client
  console.error('Invalid API client');
}
```

## Example Usage

### Fetching Data

```typescript
const fetchMetrics = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Prepare any query parameters
    const params = new URLSearchParams();
    params.append('start_date', startDate.toISOString().split('T')[0]);
    
    // Use the API client directly
    const response = await API.get(`/api/admin/ai-metrics?${params.toString()}`);
    
    // Set the response data directly
    setMetrics(response);
  } catch (err) {
    console.error('Error fetching metrics:', err);
    setError('Unable to load metrics');
  } finally {
    setLoading(false);
  }
};
```

### Sending Data

```typescript
const saveConfig = async (config) => {
  try {
    setSubmitting(true);
    const response = await API.post('/api/admin/config', config);
    setSuccess(true);
    return response;
  } catch (err) {
    console.error('Error saving config:', err);
    setError('Failed to save configuration');
    throw err;
  } finally {
    setSubmitting(false);
  }
};
```

## Error Handling

Always wrap API calls in try/catch blocks and handle errors appropriately:

```typescript
try {
  const response = await API.get('/api/endpoint');
  // Process successful response
} catch (err) {
  console.error('API request failed:', err);
  // Handle error (set error state, show user message, etc.)
} finally {
  // Clean up (stop loading indicators, etc.)
}
```

## Authentication

The API client automatically includes the authentication token from localStorage. You don't need to explicitly pass authentication headers.

## useApi Hook (Legacy)

The `useApi` hook is now marked as deprecated and will show a console warning when used. It should be avoided for new components as it adds complexity and has been a source of bugs with data access patterns.

If you need to use a hook for API calls, use React Query's `useQuery` instead, which provides caching, refetching, and other advanced features.

## Testing API Endpoints

You can test endpoints using the API test page at `/api-test.html` which provides a simple interface for testing API endpoints directly.

## Unit Tests

The project includes unit tests that verify correct API client usage. Run the tests with:

```bash
npm test
```

These tests validate:
- The API client has the correct methods
- Type guards work as expected
- Error handling works correctly
- Common misuse patterns are detected 