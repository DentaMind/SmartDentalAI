import { setupUploadXrayRoutes } from './routes/upload-xray-routes';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const baseDir = dirname(__filename);
const uploadDir = path.join(baseDir, '../../attached_assets/xrays');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

export function setupUploadXrayRoutes(app: express.Express) {
  app.post('/api/xrays/upload', upload.single('xray'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.status(200).json({
      message: 'X-ray uploaded successfully',
      filename: req.file.filename
    });
  });
}
