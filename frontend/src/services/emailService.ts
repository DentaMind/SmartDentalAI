import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface EmailStats {
  unread: number;
  sent: number;
  drafts: number;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  category: string;
  priority: string;
  attachments: string[];
}

class EmailService {
  private baseUrl = `${API_BASE_URL}/api/email`;

  async sendEmail(formData: FormData): Promise<void> {
    const response = await axios.post(`${this.baseUrl}/send`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getEmails(page: number = 1, limit: number = 20): Promise<{ emails: Email[]; total: number }> {
    const response = await axios.get(`${this.baseUrl}/list`, {
      params: { page, limit },
    });
    return response.data;
  }

  async getEmail(id: string): Promise<Email> {
    const response = await axios.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async markAsRead(id: string): Promise<void> {
    await axios.patch(`${this.baseUrl}/${id}/read`);
  }

  async toggleStar(id: string): Promise<void> {
    await axios.patch(`${this.baseUrl}/${id}/star`);
  }

  async deleteEmail(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`);
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    const response = await axios.get(`${this.baseUrl}/templates`);
    return response.data;
  }

  async getTemplate(id: string): Promise<EmailTemplate> {
    const response = await axios.get(`${this.baseUrl}/templates/${id}`);
    return response.data;
  }

  async createTemplate(template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate> {
    const response = await axios.post(`${this.baseUrl}/templates`, template);
    return response.data;
  }

  async updateTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const response = await axios.put(`${this.baseUrl}/templates/${id}`, template);
    return response.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/templates/${id}`);
  }

  async getStats(): Promise<EmailStats> {
    const response = await axios.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  async searchEmails(query: string): Promise<Email[]> {
    const response = await axios.get(`${this.baseUrl}/search`, {
      params: { q: query },
    });
    return response.data;
  }

  async filterEmails(category?: string, priority?: string): Promise<Email[]> {
    const response = await axios.get(`${this.baseUrl}/filter`, {
      params: { category, priority },
    });
    return response.data;
  }

  async getAttachment(id: string, attachmentId: string): Promise<Blob> {
    const response = await axios.get(`${this.baseUrl}/${id}/attachments/${attachmentId}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const emailService = new EmailService(); 