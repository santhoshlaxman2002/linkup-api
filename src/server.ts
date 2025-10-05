import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils';
import router from './routes/baseRouter';

// Load environment variables
dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '5000');

// JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Basic logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use(router.getRouter());

app.listen(port, () => {
  logger.info(`🚀 API server running on port ${port}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});