import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface Provider {
  id: string;
  name: string;
  specialty?: string;
  email?: string;
  role?: string;
  feedbackCount?: number;
}

/**
 * Service for user and provider operations
 */
class UserService {
  /**
   * Get all providers in the system
   * 
   * @returns Promise with list of providers
   */
  async getAllProviders(): Promise<Provider[]> {
    const response = await axios.get(`${API_BASE_URL}/users/providers`);
    return response.data;
  }

  /**
   * Get providers who have submitted treatment or evidence feedback
   * 
   * @returns Promise with list of providers and their feedback counts
   */
  async getProvidersWithFeedback(): Promise<Provider[]> {
    const response = await axios.get(`${API_BASE_URL}/ai-feedback/providers-with-feedback`);
    return response.data;
  }

  /**
   * Get a specific provider by ID
   * 
   * @param providerId - Provider ID
   * @returns Promise with provider details
   */
  async getProviderById(providerId: string): Promise<Provider> {
    const response = await axios.get(`${API_BASE_URL}/users/providers/${providerId}`);
    return response.data;
  }

  /**
   * Get the currently logged in user's profile
   * 
   * @returns Promise with user profile information
   */
  async getCurrentUserProfile(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/users/me`);
    return response.data;
  }
}

const userService = new UserService();
export default userService; 