import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { BenefitsWidget } from '../';
import { mockBenefitsData } from '../mockData';

// Mock the fetch function
const mockFetch = (mockData: any) =>
  jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockData),
    })
  );

describe('BenefitsWidget', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <BenefitsWidget patientId="123" />
      </SWRConfig>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders benefits data correctly', async () => {
    global.fetch = mockFetch(mockBenefitsData);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <BenefitsWidget patientId="123" />
      </SWRConfig>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check if benefits are rendered
    expect(screen.getByText('Annual Maximum')).toBeInTheDocument();
    expect(screen.getByText(/Used: \$750/)).toBeInTheDocument();
    expect(screen.getByText(/Remaining: \$1,250/)).toBeInTheDocument();

    // Check if coverage alerts are rendered
    expect(screen.getByText('D2740 - Crown - Porcelain/Ceramic')).toBeInTheDocument();
    expect(screen.getByText('Coverage: 50%')).toBeInTheDocument();
  });

  it('calls onPreAuthRequired when procedures need pre-auth', async () => {
    const onPreAuthRequired = jest.fn();
    global.fetch = mockFetch(mockBenefitsData);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <BenefitsWidget patientId="123" onPreAuthRequired={onPreAuthRequired} />
      </SWRConfig>
    );

    await waitFor(() => {
      expect(onPreAuthRequired).toHaveBeenCalledWith(['D2740']);
    });
  });

  it('handles error state correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Failed to fetch'))
    );

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <BenefitsWidget patientId="123" />
      </SWRConfig>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load benefits data')).toBeInTheDocument();
    });

    // Check if retry button is present
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();

    // Click retry and check if fetch is called again
    fireEvent.click(retryButton);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('handles empty benefits data correctly', async () => {
    global.fetch = mockFetch({ benefits: [], coverage: [] });

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <BenefitsWidget patientId="123" />
      </SWRConfig>
    );

    await waitFor(() => {
      expect(screen.getByText('No benefits information available')).toBeInTheDocument();
    });
  });

  it('formats currency values correctly', async () => {
    const data = {
      benefits: [{
        type: 'Test Benefit',
        used: 1000000,
        remaining: 2000000,
        total: 3000000,
        nextRenewal: '2025-01-01'
      }],
      coverage: []
    };
    
    global.fetch = mockFetch(data);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <BenefitsWidget patientId="123" />
      </SWRConfig>
    );

    await waitFor(() => {
      expect(screen.getByText(/\$1,000,000/)).toBeInTheDocument();
      expect(screen.getByText(/\$2,000,000/)).toBeInTheDocument();
      expect(screen.getByText(/\$3,000,000/)).toBeInTheDocument();
    });
  });
}); 