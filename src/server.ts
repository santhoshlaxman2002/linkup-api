import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils';
import router from './routes/baseRouter';
import { DatabaseConnection } from './database/DatabaseConnection';
import { startNotificationWorker } from './queues/notificationQueue';

// Load environment variables
dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '5000');

// JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Basic logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use(router.getRouter());

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    await DatabaseConnection.connect();
    logger.info('📊 Database connected successfully');

    // Start notification worker
    startNotificationWorker();
    logger.info('🔔 Notification worker started');

    // Start server
    app.listen(port, () => {
      logger.info(`🚀 API server running on port ${port}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await DatabaseConnection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await DatabaseConnection.close();
  process.exit(0);
});