import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import diagnosisRouter from '../routes/diagnosis.js';
import { MemStorage } from '../storage.js';

describe('Diagnosis Routes', () => {
  let app: express.Application;
  let storage: MemStorage;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/diagnosis', diagnosisRouter);
    storage = new MemStorage();
  });

  describe('GET /suggestions/:patientId', () => {
    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .get('/api/diagnosis/suggestions/1');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No authorization header');
    });

    it('should return suggestions with valid authorization', async () => {
      const response = await request(app)
        .get('/api/diagnosis/suggestions/1')
        .set('Authorization', 'Bearer 1'); // Using user ID 1 as token for demo
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /feedback/:patientId', () => {
    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .post('/api/diagnosis/feedback/1')
        .send({
          suggestionId: 1,
          correct: true,
          feedback: 'Accurate diagnosis',
          providerId: 1
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No authorization header');
    });

    it('should submit feedback with valid authorization', async () => {
      const response = await request(app)
        .post('/api/diagnosis/feedback/1')
        .set('Authorization', 'Bearer 1')
        .send({
          suggestionId: 1,
          correct: true,
          feedback: 'Accurate diagnosis',
          providerId: 1
        });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Feedback submitted successfully');
    });
  });

  describe('POST /submit/:patientId', () => {
    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .post('/api/diagnosis/submit/1')
        .send({
          diagnosis: 'Caries',
          notes: 'Requires filling'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No authorization header');
    });

    it('should submit diagnosis with valid authorization', async () => {
      const response = await request(app)
        .post('/api/diagnosis/submit/1')
        .set('Authorization', 'Bearer 1')
        .send({
          diagnosis: 'Caries',
          notes: 'Requires filling'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Diagnosis submitted successfully');
    });
  });

  describe('GET /audit-logs/:patientId', () => {
    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .get('/api/diagnosis/audit-logs/1');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No authorization header');
    });

    it('should return audit logs with valid authorization', async () => {
      const response = await request(app)
        .get('/api/diagnosis/audit-logs/1')
        .set('Authorization', 'Bearer 1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
}); 