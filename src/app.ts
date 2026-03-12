import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import filamentRoutes from './presentation/controllers/FilamentController';
import productRoutes from './presentation/controllers/ProductController';
import configurationRoutes from './presentation/controllers/ConfigurationController';
import { errorHandler } from './presentation/middlewares/errorHandler';

// Create Express application
const app: Application = express();

// CORS middleware
app.use(cors());

// JSON parser middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Base API route placeholder
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: '3D Printing Cost Control API',
    version: '1.0.0',
  });
});

// API routes
app.use('/api/filaments', filamentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/configuration', configurationRoutes);

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Global error handler middleware
app.use(errorHandler);

export default app;
