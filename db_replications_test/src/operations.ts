import { v4 as uuidv4 } from 'uuid';
import { DatabaseConnection } from './db';

export interface WriteResult {
  id: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface ReadResult {
  records: any[];
  duration: number;
  timestamp: Date;
  count: number;
}

export class DatabaseOperations {
  constructor(private db: DatabaseConnection) {}

  async write(payload: any, sourceNode: string): Promise<WriteResult> {
    const id = uuidv4();
    const timestamp = new Date();

    try {
      const { result, duration } = await this.db.query(
        'INSERT INTO test_data (id, payload, source_node, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
        [id, JSON.stringify(payload), sourceNode, timestamp]
      );

      return {
        id: result.rows[0].id,
        duration,
        timestamp,
        success: true,
      };
    } catch (error: any) {
      return {
        id,
        duration: 0,
        timestamp,
        success: false,
        error: error.message,
      };
    }
  }

  async read(limit: number = 10): Promise<ReadResult> {
    const timestamp = new Date();

    try {
      const { result, duration } = await this.db.query(
        'SELECT id, payload, source_node, created_at FROM test_data ORDER BY created_at DESC LIMIT $1',
        [limit]
      );

      return {
        records: result.rows,
        duration,
        timestamp,
        count: result.rows.length,
      };
    } catch (error) {
      return {
        records: [],
        duration: 0,
        timestamp,
        count: 0,
      };
    }
  }

  async readAll(): Promise<ReadResult> {
    const timestamp = new Date();

    try {
      const { result, duration } = await this.db.query(
        'SELECT id, payload, source_node, created_at FROM test_data ORDER BY created_at DESC'
      );

      return {
        records: result.rows,
        duration,
        timestamp,
        count: result.rows.length,
      };
    } catch (error) {
      return {
        records: [],
        duration: 0,
        timestamp,
        count: 0,
      };
    }
  }

  async bulkWrite(count: number, sourceNode: string): Promise<WriteResult[]> {
    const results: WriteResult[] = [];

    for (let i = 0; i < count; i++) {
      const payload = {
        message: `Bulk write test ${i + 1}/${count}`,
        index: i,
        timestamp: new Date().toISOString(),
      };

      const result = await this.write(payload, sourceNode);
      results.push(result);
    }

    return results;
  }

  async getRecordCount(): Promise<number> {
    try {
      const { result } = await this.db.query('SELECT COUNT(*) as count FROM test_data');
      return parseInt(result.rows[0].count);
    } catch (error) {
      return 0;
    }
  }
}
