import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateManager from '../TemplateManager';
import { templateService } from '../../services/templateService';
import { MessageCategory, CommunicationIntent } from '../../types/communication';

// Mock the template service
jest.mock('../../services/templateService');

const mockTemplates = [
  {
    id: '1',
    name: 'Appointment Confirmation',
    subject: 'Appointment Confirmation - {date}',
    body: 'Dear {patient_name},\nYour appointment is confirmed for {date} at {time}.',
    category: MessageCategory.APPOINTMENT,
    intent: CommunicationIntent.BOOK_APPOINTMENT,
    variables: {
      patient_name: 'string',
      date: 'date',
      time: 'time'
    },
    is_active: true
  },
  {
    id: '2',
    name: 'Payment Reminder',
    subject: 'Payment Due: {amount}',
    body: 'Dear {patient_name},\nYour payment of {amount} is due by {due_date}.',
    category: MessageCategory.PAYMENT,
    intent: CommunicationIntent.PAYMENT_REQUEST,
    variables: {
      patient_name: 'string',
      amount: 'decimal',
      due_date: 'date'
    },
    is_active: false
  }
];

describe('TemplateManager', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the template service methods
    (templateService.getTemplates as jest.Mock).mockResolvedValue(mockTemplates);
    (templateService.createTemplate as jest.Mock).mockResolvedValue(mockTemplates[0]);
    (templateService.updateTemplate as jest.Mock).mockResolvedValue(mockTemplates[0]);
    (templateService.deleteTemplate as jest.Mock).mockResolvedValue(undefined);
    (templateService.activateTemplate as jest.Mock).mockResolvedValue(undefined);
    (templateService.deactivateTemplate as jest.Mock).mockResolvedValue(undefined);
    (templateService.renderTemplate as jest.Mock).mockResolvedValue({
      subject: 'Rendered Subject',
      body: 'Rendered Body'
    });
  });

  it('renders loading state initially', () => {
    render(<TemplateManager />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays templates after loading', async () => {
    render(<TemplateManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Payment Reminder')).toBeInTheDocument();
    });
  });

  it('shows error message when fetching templates fails', async () => {
    (templateService.getTemplates as jest.Mock).mockRejectedValue(new Error('Fetch failed'));
    
    render(<TemplateManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch templates')).toBeInTheDocument();
    });
  });

  it('opens create template dialog when clicking new template button', async () => {
    render(<TemplateManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Template'));
    
    expect(screen.getByText('New Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('creates a new template', async () => {
    render(<TemplateManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Template'));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Template' } });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Subject {variable}' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Body {variable}' } });
    
    // Select category and intent
    fireEvent.mouseDown(screen.getByLabelText('Category'));
    fireEvent.click(screen.getByText(MessageCategory.APPOINTMENT));
    
    fireEvent.mouseDown(screen.getByLabelText('Intent'));
    fireEvent.click(screen.getByText(CommunicationIntent.BOOK_APPOINTMENT));
    
    // Submit the form
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(templateService.createTemplate).toHaveBeenCalled();
      expect(screen.getByText('Template created successfully')).toBeInTheDocument();
    });
  });

  it('edits an existing template', async () => {
    render(<TemplateManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    });

    // Click edit button for the first template
    const editButtons = screen.getAllByTestId('EditIcon');
    fireEvent.click(editButtons[0]);
    
    // Change the name
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Name' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(templateService.updateTemplate).toHaveBeenCalled();
      expect(screen.getByText('Template updated successfully')).toBeInTheDocument();
    });
  });

  it('deletes a template', async () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    render(<TemplateManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    });

    // Click delete button for the first template
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(templateService.deleteTemplate).toHaveBeenCalledWith('1');
      expect(screen.getByText('Template deleted successfully')).toBeInTheDocument();
    });
  });

  it('toggles template status', async () => {
    render(<TemplateManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    });

    // Click toggle button for the first template
    const toggleButtons = screen.getAllByTestId('ToggleOnIcon');
    fireEvent.click(toggleButtons[0]);
    
    await waitFor(() => {
      expect(templateService.deactivateTemplate).toHaveBeenCalledWith('1');
      expect(screen.getByText('Template deactivated successfully')).toBeInTheDocument();
    });
  });

  it('previews a template', async () => {
    render(<TemplateManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    });

    // Click preview button for the first template
    const previewButtons = screen.getAllByTestId('PreviewIcon');
    fireEvent.click(previewButtons[0]);
    
    // Wait for preview dialog to open
    await waitFor(() => {
      expect(screen.getByText('Preview Template')).toBeInTheDocument();
    });

    // Fill in variables
    const variableInputs = screen.getAllByRole('textbox');
    fireEvent.change(variableInputs[0], { target: { value: 'John Doe' } });
    fireEvent.change(variableInputs[1], { target: { value: '2024-03-21' } });
    fireEvent.change(variableInputs[2], { target: { value: '10:00 AM' } });
    
    // Check if preview is rendered
    await waitFor(() => {
      expect(screen.getByText('Rendered Subject')).toBeInTheDocument();
      expect(screen.getByText('Rendered Body')).toBeInTheDocument();
    });
  });

  it('handles preview rendering error', async () => {
    (templateService.renderTemplate as jest.Mock).mockRejectedValue(new Error('Render failed'));
    
    render(<TemplateManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    });

    // Click preview button for the first template
    const previewButtons = screen.getAllByTestId('PreviewIcon');
    fireEvent.click(previewButtons[0]);
    
    // Wait for preview dialog to open
    await waitFor(() => {
      expect(screen.getByText('Preview Template')).toBeInTheDocument();
    });

    // Fill in variables
    const variableInputs = screen.getAllByRole('textbox');
    fireEvent.change(variableInputs[0], { target: { value: 'John Doe' } });
    
    // Check if error is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to render preview')).toBeInTheDocument();
    });
  });
}); 