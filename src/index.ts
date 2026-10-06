import express from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

//Test route
app.post('/api/test-post', (req, res) => {
  console.log('--- ТЕСТОВЫЙ POST ЗАПРОС ДОШЕЛ ДО EXPRESS! ---', req.body);
  res.status(200).json({ success: true, received: req.body });
});

// Start server with auto-migration
app.listen(config.port, async () => {
  console.log(`🚀 EcoTracker Backend running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API: http://localhost:${config.port}/api`);
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

export default app;
