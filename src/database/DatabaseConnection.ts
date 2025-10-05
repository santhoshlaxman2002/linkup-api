import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils';

dotenv.config();

export class DatabaseConnection {
  private pool: Pool;

  constructor() {
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

    this.pool = new Pool(config);

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', { error: err });
    });
  }

  public async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      logger.info('📊 Connected to PostgreSQL database');
      client.release();
    } catch (error) {
      logger.error('Database connection error', { error });
      throw error;
    }
  }

  public async query(text: string, params?: any[]): Promise<any> {
    logger.debug('Executing query', { text, params });
    try {
      const result = await this.pool.query(text, params);
      logger.debug('Query successful', { rowCount: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error', { error, text, params });
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('📊 Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', { error });
      throw error;
    }
  }

  public getPool(): Pool {
    logger.debug('Returning PostgreSQL pool instance');
    return this.pool;
  }
}
