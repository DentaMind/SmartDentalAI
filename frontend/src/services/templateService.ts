import axios from 'axios';
import { MessageCategory, CommunicationIntent } from '../types/communication';

export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: MessageCategory;
  intent?: CommunicationIntent;
  variables?: Record<string, string>;
  is_active: boolean;
}

export interface TemplateCreate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: MessageCategory;
  intent?: CommunicationIntent;
  variables?: Record<string, string>;
  is_active?: boolean;
}

export interface TemplateUpdate {
  name?: string;
  subject?: string;
  body?: string;
  category?: MessageCategory;
  intent?: CommunicationIntent;
  variables?: Record<string, string>;
  is_active?: boolean;
}

export interface RenderedTemplate {
  subject: string;
  body: string;
}

export interface TemplateRenderRequest {
  variables: Record<string, any>;
}

class TemplateService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/templates';
  }

  async getTemplates(
    category?: MessageCategory,
    intent?: CommunicationIntent,
    activeOnly: boolean = true
  ): Promise<Template[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (intent) params.append('intent', intent);
      params.append('active_only', activeOnly.toString());

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  async getTemplate(templateId: string): Promise<Template> {
    try {
      const response = await axios.get(`${this.baseUrl}/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  async createTemplate(template: TemplateCreate): Promise<Template> {
    try {
      const response = await axios.post(this.baseUrl, template);
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(templateId: string, template: TemplateUpdate): Promise<Template> {
    try {
      const response = await axios.put(`${this.baseUrl}/${templateId}`, template);
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${templateId}`);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<RenderedTemplate> {
    try {
      const response = await axios.post(`${this.baseUrl}/${templateId}/render`, { variables });
      return response.data;
    } catch (error) {
      console.error('Error rendering template:', error);
      throw error;
    }
  }

  async activateTemplate(templateId: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/${templateId}/activate`);
    } catch (error) {
      console.error('Error activating template:', error);
      throw error;
    }
  }

  async deactivateTemplate(templateId: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/${templateId}/deactivate`);
    } catch (error) {
      console.error('Error deactivating template:', error);
      throw error;
    }
  }

  // Helper method to extract variables from template text
  extractVariables(templateText: string): string[] {
    const variableRegex = /\{([^}]+)\}/g;
    const matches = templateText.matchAll(variableRegex);
    const variables = new Set<string>();
    
    for (const match of matches) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }

  // Helper method to validate variables against template
  validateVariables(template: Template, variables: Record<string, any>): string[] {
    const errors: string[] = [];
    const templateVars = template.variables || {};
    
    // Check for missing variables
    for (const [varName, varType] of Object.entries(templateVars)) {
      if (!(varName in variables)) {
        errors.push(`Missing required variable: ${varName}`);
        continue;
      }
      
      // Validate variable types
      const value = variables[varName];
      if (varType === 'string' && typeof value !== 'string') {
        errors.push(`Variable ${varName} must be a string`);
      } else if (varType === 'date' && !(value instanceof Date || typeof value === 'string')) {
        errors.push(`Variable ${varName} must be a date`);
      } else if (varType === 'time' && !(value instanceof Date || typeof value === 'string')) {
        errors.push(`Variable ${varName} must be a time`);
      } else if (varType === 'decimal' && typeof value !== 'number') {
        errors.push(`Variable ${varName} must be a number`);
      }
    }
    
    return errors;
  }
}

export const templateService = new TemplateService(); 