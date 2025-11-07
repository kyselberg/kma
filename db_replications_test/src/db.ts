import { Pool, PoolConfig } from 'pg';

export interface DatabaseConfig extends PoolConfig {
  label: string;
}

export class DatabaseConnection {
  private pool: Pool;
  public readonly label: string;

  constructor(config: DatabaseConfig) {
    this.label = config.label;
    const { label, ...poolConfig } = config;
    this.pool = new Pool(poolConfig);
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      return { result, duration };
    } catch (error: any) {
      const duration = Date.now() - start;
      // Don't log connection errors here - let caller handle them
      if (error.code !== 'ECONNREFUSED' && error.code !== 'ETIMEDOUT' && !error.message.includes('terminated unexpectedly')) {
        console.error(`[${this.label}] Query error:`, error.message);
      }
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

export const PhysicalTopology = {
  primary: new DatabaseConnection({
    label: 'Primary',
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    user: 'postgres',
    password: 'postgres',
    max: 20,
  }),
  standby: new DatabaseConnection({
    label: 'Standby',
    host: 'localhost',
    port: 5433,
    database: 'testdb',
    user: 'postgres',
    password: 'postgres',
    max: 20,
  }),
};

export const LogicalTopology = {
  nodeA: new DatabaseConnection({
    label: 'Node-A',
    host: 'localhost',
    port: 5434,
    database: 'testdb',
    user: 'postgres',
    password: 'postgres',
    max: 20,
  }),
  nodeB: new DatabaseConnection({
    label: 'Node-B',
    host: 'localhost',
    port: 5435,
    database: 'testdb',
    user: 'postgres',
    password: 'postgres',
    max: 20,
  }),
};
