import { describe, it, expect, vi } from 'vitest';
import API from '../lib/api';
import { isAPIClient, APIClient } from '../types/api-types';
import { ensureValidApiClient } from '../hooks/useApi';

/**
 * API Client Tests
 * 
 * These tests validate that the API client is used correctly
 * and matches our interfaces.
 */
describe('API Client', () => {
  // Test the API client implementation
  it('should have the required API methods', () => {
    expect(typeof API.get).toBe('function');
    expect(typeof API.post).toBe('function');
    expect(typeof API.put).toBe('function');
    expect(typeof API.delete).toBe('function');
  });

  // Test the isAPIClient type guard
  it('should validate properly with isAPIClient type guard', () => {
    expect(isAPIClient(API)).toBe(true);
    
    // Test with incomplete objects
    expect(isAPIClient(null)).toBe(false);
    expect(isAPIClient({})).toBe(false);
    expect(isAPIClient({ get: () => {}, post: () => {} })).toBe(false);
  });

  // Test error handling
  it('should throw when API responses are not ok', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockImplementation((url) => {
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('{"error": "Server error"}')
      });
    });

    await expect(API.get('/test-endpoint')).rejects.toThrow();
  });

  // Test common misuse patterns
  it('should detect common API client misuse', () => {
    const invalidClient = { notAnApiClient: true };
    
    // This should throw
    expect(() => ensureValidApiClient(invalidClient)).toThrow();
    
    // While the real API client should pass
    expect(() => ensureValidApiClient(API)).not.toThrow();
  });

  // Test that we don't try to access .data on responses
  it('should not have .data property on responses', async () => {
    // Mock successful response
    global.fetch = vi.fn().mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ key: 'value' })
      });
    });

    const response = await API.get('/test-endpoint');
    
    // Response should be the direct data, not wrapped in .data
    expect(response).toEqual({ key: 'value' });
    
    // This line should correctly fail if the API client implementation changes to wrap responses
    // @ts-expect-error - response.data should not exist
    expect(response.data).toBeUndefined();
  });
}); 