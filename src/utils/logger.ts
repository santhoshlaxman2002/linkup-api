import winston from 'winston';
import { logger } from './loggerConfig';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Create the logger with custom levels
const customLogger = winston.createLogger({
  level: logger.level,
  levels,
  format: logger.format,
  transports: logger.transports,
  exitOnError: false,
});

export default customLogger;
