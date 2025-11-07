import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import { from as copyFrom } from 'pg-copy-streams';

type CliOptions = {
  dsn: string;
  table: string;
  out?: string;
  from?: string; // YYYY-MM
  to?: string;   // YYYY-MM (inclusive)
  perMonth?: number; // rows per month when from/to provided
  tenants?: number; // number of distinct tenant_ids to sample from
  rows?: number; // fallback: total rows when monthly options are not provided
};

function parseArgs(argv: string[]): CliOptions {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = val;
    }
  }

  const dsn = args.dsn || process.env.DSN || '';
  const table = args.table || process.env.TABLE || '';
  const out = args.out || process.env.OUT;
  const from = args.from || process.env.FROM;
  const to = args.to || process.env.TO;
  const perMonth = args['per-month'] ? Number(args['per-month']) : (process.env.PER_MONTH ? Number(process.env.PER_MONTH) : undefined);
  const tenants = args.tenants ? Number(args.tenants) : (process.env.TENANTS ? Number(process.env.TENANTS) : undefined);
  const rows = args.rows ? Number(args.rows) : (process.env.ROWS ? Number(process.env.ROWS) : undefined);

  if (!dsn) throw new Error('Missing --dsn');
  if (!table) throw new Error('Missing --table');

  return { dsn, table, out, from, to, perMonth, tenants, rows };
}

function formatCsvLine(fields: string[]): string {
  const encoded = fields.map((v) => {
    if (v.includes('"') || v.includes(',') || v.includes('\n') || v.includes('\r')) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  });
  return encoded.join(',') + '\n';
}

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function generateCsvRandomLastYear(filePath: string, totalRows: number, tenantPoolSize: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
    stream.on('error', reject);

    const tenants: string[] = Array.from({ length: tenantPoolSize }, () => randomUUID());
    let i = 0;
    function writeChunk() {
      let ok = true;
      while (ok && i < totalRows) {
        const id = randomUUID();
        const tenantId = tenants[randomInt(tenantPoolSize)];
        const daysAgo = randomInt(365);
        const hoursAgo = randomInt(24);
        const minutesAgo = randomInt(60);
        const nowMs = Date.now();
        const msPerMinute = 60 * 1000;
        const msPerHour = 60 * msPerMinute;
        const msPerDay = 24 * msPerHour;
        const occurredAtMs = nowMs - daysAgo * msPerDay - hoursAgo * msPerHour - minutesAgo * msPerMinute;
        const occurredAt = new Date(occurredAtMs).toISOString();
        const payloadObj = { type: 'event', n: i, ok: true };
        const payload = JSON.stringify(payloadObj);
        const line = formatCsvLine([id, tenantId, occurredAt, payload]);
        ok = stream.write(line, 'utf8');
        i++;
      }
      if (i >= totalRows) {
        stream.end();
      } else if (ok === false) {
        stream.once('drain', writeChunk);
      }
    }

    stream.on('finish', () => resolve());
    writeChunk();
  });
}

type MonthSpec = { start: Date; endExclusive: Date; count: number };

function* monthsBetweenInclusive(fromYm: string, toYm: string): Generator<{ year: number; month: number }> {
  const [fy, fm] = fromYm.split('-').map((s) => Number(s));
  const [ty, tm] = toYm.split('-').map((s) => Number(s));
  if (!fy || !fm || !ty || !tm) throw new Error('Invalid --from/--to, expected YYYY-MM');
  let y = fy;
  let m = fm;
  // iterate until (y, m) > (ty, tm)
  while (y < ty || (y === ty && m <= tm)) {
    yield { year: y, month: m };
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
}

function startOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

function endOfMonthExclusive(year: number, month: number): Date {
  // first day of next month UTC
  return new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1, 0, 0, 0, 0));
}

function generateCsvByMonths(filePath: string, months: MonthSpec[], tenantPoolSize: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
    stream.on('error', reject);

    const tenants: string[] = Array.from({ length: tenantPoolSize }, () => randomUUID());

    let monthIndex = 0;
    let generatedInMonth = 0;

    function randTimestampInRange(start: Date, endExclusive: Date): string {
      const startMs = start.getTime();
      const span = endExclusive.getTime() - startMs - 1;
      const offset = Math.floor(Math.random() * span);
      return new Date(startMs + offset).toISOString();
    }

    function writeChunk() {
      let ok = true;
      while (ok && monthIndex < months.length) {
        const spec = months[monthIndex];
        if (generatedInMonth >= spec.count) {
          monthIndex++;
          generatedInMonth = 0;
          continue;
        }
        const id = randomUUID();
        const tenantId = tenants[randomInt(tenantPoolSize)];
        const occurredAt = randTimestampInRange(spec.start, spec.endExclusive);
        const payloadObj = { type: 'event', month: `${spec.start.getUTCFullYear()}-${String(spec.start.getUTCMonth() + 1).padStart(2, '0')}` };
        const payload = JSON.stringify(payloadObj);
        const line = formatCsvLine([id, tenantId, occurredAt, payload]);
        ok = stream.write(line, 'utf8');
        generatedInMonth++;
      }
      if (monthIndex >= months.length) {
        stream.end();
      } else if (ok === false) {
        stream.once('drain', writeChunk);
      }
    }

    stream.on('finish', () => resolve());
    writeChunk();
  });
}

async function fileExistsNonEmpty(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

async function copyCsvIntoTable(dsn: string, table: string, filePath: string): Promise<void> {
  const client = new Client({ connectionString: dsn });
  await client.connect();
  try {
    const copySql = `COPY ${table} (id, tenant_id, occurred_at, payload) FROM STDIN WITH (FORMAT csv)`;
    const dbStream = client.query(copyFrom(copySql));
    const fileStream = fs.createReadStream(filePath);

    await new Promise<void>((resolve, reject) => {
      fileStream.on('error', reject);
      dbStream.on('error', reject);
      dbStream.on('finish', () => resolve());
      fileStream.pipe(dbStream);
    });
  } finally {
    await client.end();
  }
}

async function main() {
  const { dsn, table, out, from, to, perMonth, tenants, rows } = parseArgs(process.argv);

  const outDir = out ? path.dirname(out) : path.join(process.cwd(), 'tmp');
  const outFile = out || path.join(outDir, `${table.replace(/[^a-zA-Z0-9_\.]/g, '_')}_${Date.now()}.csv`);
  await fs.promises.mkdir(outDir, { recursive: true });
  const tenantPoolSize = Number.isFinite(tenants) && tenants! > 0 ? tenants! : 1000;

  const t0 = process.hrtime.bigint();
  let t1: bigint;
  if (await fileExistsNonEmpty(outFile)) {
    console.log(`Found existing CSV at ${outFile}, skipping generation`);
    t1 = process.hrtime.bigint();
  } else {
    if (from && to && perMonth && perMonth > 0) {
      const monthSpecs: MonthSpec[] = [];
      for (const { year, month } of monthsBetweenInclusive(from, to)) {
        monthSpecs.push({
          start: startOfMonth(year, month),
          endExclusive: endOfMonthExclusive(year, month),
          count: perMonth,
        });
      }
      console.log(`Generating CSV by months ${from}..${to} (${monthSpecs.length} months), ${perMonth} rows/month, tenants=${tenantPoolSize}`);
      await generateCsvByMonths(outFile, monthSpecs, tenantPoolSize);
    } else {
      const totalRows = Number.isFinite(rows) && rows! > 0 ? rows! : 5_000_000;
      console.log(`Generating CSV with ${totalRows} rows over last ~365 days, tenants=${tenantPoolSize}`);
      await generateCsvRandomLastYear(outFile, totalRows, tenantPoolSize);
    }
    t1 = process.hrtime.bigint();
  }
  await copyCsvIntoTable(dsn, table, outFile);
  const t2 = process.hrtime.bigint();

  const genMs = Number(t1 - t0) / 1e6;
  const copyMs = Number(t2 - t1) / 1e6;
  const totalMs = Number(t2 - t0) / 1e6;
  console.log(`CSV generated in ${genMs.toFixed(0)} ms`);
  console.log(`COPY completed in ${copyMs.toFixed(0)} ms`);
  console.log(`Total time ${totalMs.toFixed(0)} ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
