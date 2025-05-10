import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import crownBridgeRoutes from '../routes/crown-bridge.js';
import * as THREE from 'three';

const app = express();
app.use(bodyParser.json());
app.use('/api/crown-bridge', crownBridgeRoutes);

// Mock geometry for testing
const mockGeometry = new THREE.BufferGeometry();
const mockScan = { geometry: mockGeometry };
const mockSettings = {
  material: 'zirconia',
  designType: 'crown',
  marginType: 'chamfer',
  occlusionType: 'standard',
  minimumThickness: 1.0
};

describe('Crown & Bridge API', () => {
  describe('POST /api/crown-bridge/analyze', () => {
    it('should return analysis results for valid input', async () => {
      const response = await request(app)
        .post('/api/crown-bridge/analyze')
        .send({ scan: mockScan, settings: mockSettings });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recommendedMaterial');
      expect(response.body).toHaveProperty('recommendedDesign');
      expect(response.body).toHaveProperty('prepClearance');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('reasoning');
      expect(response.body).toHaveProperty('warnings');
      expect(response.body).toHaveProperty('suggestions');
    });

    it('should handle missing required parameters', async () => {
      const response = await request(app)
        .post('/api/crown-bridge/analyze')
        .send({ scan: mockScan });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/crown-bridge/generate', () => {
    it('should return a valid STL file', async () => {
      const response = await request(app)
        .post('/api/crown-bridge/generate')
        .send({ scan: mockScan, settings: mockSettings });
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/octet-stream');
      expect(response.headers['content-disposition']).toContain('crown-bridge.stl');
      expect(response.body.toString()).toBeTruthy();
    });

    it('should handle missing required settings', async () => {
      const response = await request(app)
        .post('/api/crown-bridge/generate')
        .send({ scan: mockScan, settings: {} });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/crown-bridge/validate', () => {
    const mockDesign = { geometry: mockGeometry };

    it('should return validation results', async () => {
      const response = await request(app)
        .post('/api/crown-bridge/validate')
        .send({ design: mockDesign, settings: mockSettings });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isValid');
    });

    it('should handle missing design data', async () => {
      const response = await request(app)
        .post('/api/crown-bridge/validate')
        .send({ settings: mockSettings });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/crown-bridge/export-pdf', () => {
    const mockDesign = { geometry: mockGeometry };

    it('should return a PDF file', async () => {
      const response = await request(app)
        .post('/api/crown-bridge/export-pdf')
        .send({ design: mockDesign, settings: mockSettings });
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('crown-bridge-report.pdf');
      expect(response.body.toString()).toBeTruthy();
    });

    it('should handle missing required data', async () => {
      const response = await request(app)
        .post('/api/crown-bridge/export-pdf')
        .send({ settings: mockSettings });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 