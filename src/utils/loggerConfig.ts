import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logger configuration interface
interface LoggerConfig {
  level: string;
  format: winston.Logform.Format;
  transports: winston.transport[];
}

// Get log level based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? 'warn' : 'debug';
};

// Create custom format
const createFormat = (): winston.Logform.Format => {
  return winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );
};

// Create console format for development
const createConsoleFormat = (): winston.Logform.Format => {
  return winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
    )
  );
};

// Create transports based on environment
const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];
  
  // Always add console transport
  transports.push(
    new winston.transports.Console({
      format: createConsoleFormat(),
    })
  );

  // Add file transports
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: createFormat(),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: createFormat(),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Add HTTP request log file in development
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'http.log'),
        level: 'http',
        format: createFormat(),
        maxsize: 5242880, // 5MB
        maxFiles: 3,
      })
    );
  }

  return transports;
};

// Logger configuration
export const loggerConfig: LoggerConfig = {
  level: getLogLevel(),
  format: createFormat(),
  transports: createTransports(),
};

// Create the logger instance
export const createLogger = (): winston.Logger => {
  return winston.createLogger({
    level: loggerConfig.level,
    format: loggerConfig.format,
    transports: loggerConfig.transports,
    exitOnError: false,
  });
};

// Export default logger instance
export const logger = createLogger();
