import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { crownBridgeRoutes } from '../routes/crown-bridge.js';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/crown-bridge', crownBridgeRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

export { app }; 