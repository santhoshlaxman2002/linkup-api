import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils';

export class DatabaseConnection {
  private static pool: Pool;

  private static initializePool(): void {
    if (!DatabaseConnection.pool) {
      const config: PoolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'linkup_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

      DatabaseConnection.pool = new Pool(config);

      DatabaseConnection.pool.on('error', (err) => {
        logger.error('Unexpected error on idle PostgreSQL client', { error: err });
      });
    }
  }

  public static async connect(): Promise<void> {
    DatabaseConnection.initializePool();
    try {
      const client = await DatabaseConnection.pool.connect();
      logger.info('📊 Connected to PostgreSQL database');
      client.release();
    } catch (error) {
      logger.error('Database connection error', { error });
      throw error;
    }
  }

  public static async query(text: string, params?: any[]): Promise<any> {
    DatabaseConnection.initializePool();
    logger.debug('Executing query', { text, params });
    try {
      const result = await DatabaseConnection.pool.query(text, params);
      logger.debug('Query successful', { rowCount: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error', { error, text, params });
      throw error;
    }
  }

  public static async close(): Promise<void> {
    if (DatabaseConnection.pool) {
      try {
        await DatabaseConnection.pool.end();
        logger.info('📊 Database connection closed');
        DatabaseConnection.pool = undefined as any;
      } catch (error) {
        logger.error('Error closing database connection', { error });
        throw error;
      }
    }
  }

  public static getPool(): Pool {
    DatabaseConnection.initializePool();
    logger.debug('Returning PostgreSQL pool instance');
    return DatabaseConnection.pool;
  }
}
