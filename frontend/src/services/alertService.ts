import axios from 'axios';

interface AlertConfig {
  email: boolean;
  sms: boolean;
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export const alertService = {
  async updateAlertConfig(config: AlertConfig) {
    try {
      await axios.post('/api/alerts/config', config);
    } catch (error) {
      console.error('Error updating alert config:', error);
      throw error;
    }
  },

  async getAlertConfig(): Promise<AlertConfig> {
    try {
      const response = await axios.get('/api/alerts/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching alert config:', error);
      throw error;
    }
  },

  async sendTestAlert(type: 'email' | 'sms') {
    try {
      await axios.post(`/api/alerts/test/${type}`);
    } catch (error) {
      console.error(`Error sending test ${type} alert:`, error);
      throw error;
    }
  }
}; 