import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

export interface QueryStats {
  executionTimeMs: number;
  memoryUsageBefore: number;
  memoryUsageAfter: number;
  memoryDelta: number;
  rowsRead: number;
  resultRows: number;
  throughput?: number;
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export async function measureQueryPerformance(
  pool: Pool,
  query: string,
  params: any[] = [],
): Promise<QueryStats> {
  const memoryBefore = process.memoryUsage();
  const startTime = process.hrtime.bigint();

  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;
    const memoryAfter = process.memoryUsage();

    const stats: QueryStats = {
      executionTimeMs,
      memoryUsageBefore: memoryBefore.heapUsed,
      memoryUsageAfter: memoryAfter.heapUsed,
      memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed,
      rowsRead: result.rowCount || 0,
      resultRows: result.rowCount || 0,
    };

    if (result.rowCount && result.rowCount > 0) {
      stats.throughput = result.rowCount / (executionTimeMs / 1000);
    }

    return stats;
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;

    console.error(`Query failed after ${executionTimeMs.toFixed(2)}ms:`, error);
    throw error;
  } finally {
    client.release();
  }
}

export function printPerformanceReport(stats: QueryStats, query: string): void {
  console.log("\n=== Query Performance Report ===");
  console.log(`Query: ${query}`);
  console.log(`Execution Time: ${stats.executionTimeMs.toFixed(2)}ms`);
  console.log(`Memory Before: ${formatBytes(stats.memoryUsageBefore)}`);
  console.log(`Memory After: ${formatBytes(stats.memoryUsageAfter)}`);
  console.log(`Memory Delta: ${formatBytes(stats.memoryDelta)}`);
  console.log(`Rows Read: ${stats.rowsRead.toLocaleString()}`);
  console.log(`Result Rows: ${stats.resultRows.toLocaleString()}`);

  if (stats.throughput) {
    console.log(`Throughput: ${stats.throughput.toFixed(0)} rows/sec`);
  }

  console.log("================================\n");
}

export function savePerformanceReport(
  stats: QueryStats,
  query: string,
  queryName: string = "query",
  dbType: string = "postgresql",
): string {
  const resultsDir = path.join(process.cwd(), "query-results");

  // Create directory if it doesn't exist
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${dbType}_${queryName}_${timestamp}.json`;
  const filepath = path.join(resultsDir, filename);

  const report = {
    timestamp: new Date().toISOString(),
    dbType,
    queryName,
    query,
    stats: {
      executionTimeMs: stats.executionTimeMs,
      memoryUsageBefore: stats.memoryUsageBefore,
      memoryUsageAfter: stats.memoryUsageAfter,
      memoryDelta: stats.memoryDelta,
      rowsRead: stats.rowsRead,
      resultRows: stats.resultRows,
      throughput: stats.throughput,
    },
    formatted: {
      executionTime: `${stats.executionTimeMs.toFixed(2)}ms`,
      memoryBefore: formatBytes(stats.memoryUsageBefore),
      memoryAfter: formatBytes(stats.memoryUsageAfter),
      memoryDelta: formatBytes(stats.memoryDelta),
      rowsRead: stats.rowsRead.toLocaleString(),
      resultRows: stats.resultRows.toLocaleString(),
      throughput: stats.throughput
        ? `${stats.throughput.toFixed(0)} rows/sec`
        : "N/A",
    },
  };

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`Performance report saved to: ${filepath}`);

  return filepath;
}

export async function executeQueryWithStats<T = any>(
  pool: Pool,
  query: string,
  params: any[] = [],
  showReport: boolean = true,
  queryName?: string,
  saveToFile: boolean = true,
): Promise<{ result: T; stats: QueryStats }> {
  // Measure memory before query
  const memoryBefore = process.memoryUsage();
  const startTime = process.hrtime.bigint();

  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;
    const memoryAfter = process.memoryUsage();

    const stats: QueryStats = {
      executionTimeMs,
      memoryUsageBefore: memoryBefore.heapUsed,
      memoryUsageAfter: memoryAfter.heapUsed,
      memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed,
      rowsRead: result.rowCount || 0,
      resultRows: result.rowCount || 0,
    };

    if (result.rowCount && result.rowCount > 0) {
      stats.throughput = result.rowCount / (executionTimeMs / 1000);
    }

    if (showReport) {
      printPerformanceReport(stats, query);
    }

    if (saveToFile) {
      savePerformanceReport(stats, query, queryName || "query", "postgresql");
    }

    return { result: result as T, stats };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;

    console.error(`Query failed after ${executionTimeMs.toFixed(2)}ms:`, error);
    throw error;
  } finally {
    client.release();
  }
}
