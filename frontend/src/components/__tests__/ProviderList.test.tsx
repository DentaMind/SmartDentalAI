import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProviderList } from '../ProviderList';
import { calendarService } from '../../services/calendarService';

// Mock the calendar service
jest.mock('../../services/calendarService');

describe('ProviderList', () => {
  const mockProviders = [
    {
      id: 1,
      name: 'Dr. Smith',
      specialty: 'Dentist',
      email: 'dr.smith@example.com',
      phone: '123-456-7890',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Dr. Johnson',
      specialty: 'Orthodontist',
      email: 'dr.johnson@example.com',
      phone: '987-654-3210',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    (calendarService.getProviders as jest.Mock).mockResolvedValue(mockProviders);
  });

  it('should render the list of providers', async () => {
    render(<ProviderList />);

    // Wait for the providers to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
    });

    // Check if specialties are displayed
    expect(screen.getByText('Dentist')).toBeInTheDocument();
    expect(screen.getByText('Orthodontist')).toBeInTheDocument();

    // Check if emails are displayed
    expect(screen.getByText('dr.smith@example.com')).toBeInTheDocument();
    expect(screen.getByText('dr.johnson@example.com')).toBeInTheDocument();
  });

  it('should open the add provider dialog when clicking the add button', async () => {
    render(<ProviderList />);

    // Wait for the providers to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click the add button
    fireEvent.click(screen.getByText('Add Provider'));

    // Check if the dialog is opened
    expect(screen.getByText('Add Provider')).toBeInTheDocument();
  });

  it('should open the edit provider dialog when clicking the edit button', async () => {
    render(<ProviderList />);

    // Wait for the providers to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click the edit button
    const editButtons = screen.getAllByLabelText('edit');
    fireEvent.click(editButtons[0]);

    // Check if the dialog is opened with the correct title
    expect(screen.getByText('Edit Provider')).toBeInTheDocument();
  });

  it('should delete a provider when clicking the delete button', async () => {
    render(<ProviderList />);

    // Wait for the providers to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Mock the delete function
    (calendarService.deleteProvider as jest.Mock).mockResolvedValue(undefined);

    // Click the delete button
    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    // Check if the provider was deleted
    await waitFor(() => {
      expect(calendarService.deleteProvider).toHaveBeenCalledWith(1);
    });
  });

  it('should show an error message when fetching providers fails', async () => {
    // Mock the getProviders function to throw an error
    (calendarService.getProviders as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch providers')
    );

    render(<ProviderList />);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch providers')).toBeInTheDocument();
    });
  });

  it('should show an error message when creating a provider fails', async () => {
    render(<ProviderList />);

    // Wait for the providers to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click the add button
    fireEvent.click(screen.getByText('Add Provider'));

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Dr. New' }
    });
    fireEvent.change(screen.getByLabelText('Specialty'), {
      target: { value: 'Dentist' }
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'dr.new@example.com' }
    });

    // Mock the createProvider function to throw an error
    (calendarService.createProvider as jest.Mock).mockRejectedValue(
      new Error('Failed to create provider')
    );

    // Submit the form
    fireEvent.click(screen.getByText('Add'));

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to create provider')).toBeInTheDocument();
    });
  });

  it('should show an error message when updating a provider fails', async () => {
    render(<ProviderList />);

    // Wait for the providers to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click the edit button
    const editButtons = screen.getAllByLabelText('edit');
    fireEvent.click(editButtons[0]);

    // Change the name
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Dr. Smith Jr.' }
    });

    // Mock the updateProvider function to throw an error
    (calendarService.updateProvider as jest.Mock).mockRejectedValue(
      new Error('Failed to update provider')
    );

    // Submit the form
    fireEvent.click(screen.getByText('Update'));

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to update provider')).toBeInTheDocument();
    });
  });

  it('should show an error message when deleting a provider fails', async () => {
    render(<ProviderList />);

    // Wait for the providers to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Mock the deleteProvider function to throw an error
    (calendarService.deleteProvider as jest.Mock).mockRejectedValue(
      new Error('Failed to delete provider')
    );

    // Click the delete button
    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to delete provider')).toBeInTheDocument();
    });
  });
}); 