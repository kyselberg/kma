import { ClickHouseClient } from "@clickhouse/client";
import * as fs from "fs";
import * as path from "path";

export interface QueryStats {
  executionTimeMs: number;
  memoryUsageBefore: number;
  memoryUsageAfter: number;
  memoryDelta: number;
  rowsRead: number;
  bytesRead: number;
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
  client: ClickHouseClient,
  query: string,
): Promise<QueryStats> {
  const memoryBefore = process.memoryUsage();

  const startTime = process.hrtime.bigint();

  try {
    await client.exec({
      query: "SET send_logs_level = 'debug'",
    });

    const result = await client.query({ query });
    const data = await result.json();

    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;

    const memoryAfter = process.memoryUsage();

    const statsResult = await client.query({
      query: `
        SELECT
          read_rows,
          read_bytes,
          result_rows,
          memory_usage
        FROM system.query_log
        WHERE type = 'QueryFinish'
        ORDER BY event_time DESC
        LIMIT 1
      `,
    });

    const stats = (await statsResult.json()) as unknown as any[];
    const queryStats = stats[0] || {};

    const rowsRead = queryStats.read_rows || 0;

    const queryStatsResult: QueryStats = {
      executionTimeMs,
      memoryUsageBefore: memoryBefore.heapUsed,
      memoryUsageAfter: memoryAfter.heapUsed,
      memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed,
      rowsRead,
      bytesRead: queryStats.read_bytes || 0,
      resultRows: queryStats.result_rows || 0,
    };

    if (rowsRead > 0) {
      queryStatsResult.throughput = rowsRead / (executionTimeMs / 1000);
    }

    return queryStatsResult;
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;

    console.error(`Query failed after ${executionTimeMs.toFixed(2)}ms:`, error);
    throw error;
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
  console.log(`Data Read: ${formatBytes(stats.bytesRead)}`);
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
  dbType: string = "clickhouse",
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
      bytesRead: stats.bytesRead,
      resultRows: stats.resultRows,
      throughput: stats.throughput,
    },
    formatted: {
      executionTime: `${stats.executionTimeMs.toFixed(2)}ms`,
      memoryBefore: formatBytes(stats.memoryUsageBefore),
      memoryAfter: formatBytes(stats.memoryUsageAfter),
      memoryDelta: formatBytes(stats.memoryDelta),
      rowsRead: stats.rowsRead.toLocaleString(),
      dataRead: formatBytes(stats.bytesRead),
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
  client: ClickHouseClient,
  query: string,
  showReport: boolean = true,
  queryName?: string,
  saveToFile: boolean = true,
): Promise<{ result: T; stats: QueryStats }> {
  // Measure memory before query
  const memoryBefore = process.memoryUsage();
  const startTime = process.hrtime.bigint();

  try {
    await client.exec({
      query: "SET send_logs_level = 'debug'",
    });

    const result = await client.query({ query });
    const data = (await result.json()) as T;

    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;
    const memoryAfter = process.memoryUsage();

    const statsResult = await client.query({
      query: `
        SELECT
          read_rows,
          read_bytes,
          result_rows,
          memory_usage
        FROM system.query_log
        WHERE type = 'QueryFinish'
        ORDER BY event_time DESC
        LIMIT 1
      `,
    });

    const statsData = (await statsResult.json()) as unknown as any[];
    const queryStats = statsData[0] || {};

    const rowsRead = queryStats.read_rows || 0;

    const stats: QueryStats = {
      executionTimeMs,
      memoryUsageBefore: memoryBefore.heapUsed,
      memoryUsageAfter: memoryAfter.heapUsed,
      memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed,
      rowsRead,
      bytesRead: queryStats.read_bytes || 0,
      resultRows: queryStats.result_rows || 0,
    };

    if (rowsRead > 0) {
      stats.throughput = rowsRead / (executionTimeMs / 1000);
    }

    if (showReport) {
      printPerformanceReport(stats, query);
    }

    if (saveToFile) {
      savePerformanceReport(stats, query, queryName || "query", "clickhouse");
    }

    return { result: data, stats };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;

    console.error(`Query failed after ${executionTimeMs.toFixed(2)}ms:`, error);
    throw error;
  }
}
