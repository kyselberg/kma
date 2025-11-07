## Partitioning and Sharding Setup (PostgreSQL)

This repo brings up three environments to compare:

- Plain DB (no partitions): `app.events_plain` on port 54321
- Variant A (single instance, monthly RANGE partitions): `app.events` on port 54322
- Variant B (coordinator with FDW + shards by HASH(tenant_id)): `app.events_sharded` via coordinator on port 54325, shards on 54323/54324

### Goals
- Faster queries via partition pruning and targeted routing
- Operational ease (monthly retention, easier archiving)
- Scalability (horizontal via shards for multi-tenant)

### Bring up
```bash
docker compose up -d
```

Wait for healthchecks to pass.

### Connection strings
- Plain: `postgresql://app:app@localhost:54321/app`
- Partitioned: `postgresql://app:app@localhost:54322/app`
- Coordinator: `postgresql://app:app@localhost:54325/app`
- Shard1: `postgresql://app:app@localhost:54323/app`
- Shard2: `postgresql://app:app@localhost:54324/app`

### Schemas
- Plain table: `app.events_plain`
- Variant A parent: `app.events` (monthly partitions `app.events_YYYY_MM` + `app.events_default`)
- Variant B:
  - Coordinator parent: `app.events_sharded` (hash by `tenant_id`)
  - Foreign partitions: `app.events_mod2_r0` -> shard1, `app.events_mod2_r1` -> shard2
  - Shard local table: `app.events_shard`

### Data generation (UUID ids, ~500k per month)
Install Node deps (Node 18+):
```bash
npm install
```

Generate for Variant A (monthly RANGE partitions):
```bash
npx tsx gen.ts \
  --dsn postgresql://app:app@localhost:54322/app \
  --table app.events \
  --from 2024-01 --to 2024-12 \
  --per-month 500000 --tenants 1000
```

Generate for Plain DB:
```bash
npx tsx gen.ts \
  --dsn postgresql://app:app@localhost:54321/app \
  --table app.events_plain \
  --from 2024-01 --to 2024-12 \
  --per-month 500000 --tenants 1000
```

Generate for Variant B (through coordinator → shards by HASH(tenant_id)):
```bash
npx tsx gen.ts \
  --dsn postgresql://app:app@localhost:54325/app \
  --table app.events_sharded \
  --from 2024-01 --to 2024-12 \
  --per-month 500000 --tenants 1000
```

The script streams CSV generation and loads via COPY. It prints timings for generation and COPY.

### Test plan: verify placement and pruning
Variant A (single instance):
```bash
psql postgresql://app:app@localhost:54322/app -f sql/tests/variant_a_verification.sql
```
Expect: rows appear in the right `events_YYYY_MM` partitions and EXPLAIN shows partition pruning for a monthly range filter.

Variant B (coordinator+shards):
```bash
psql postgresql://app:app@localhost:54325/app -f sql/tests/variant_b_verification.sql
```
Expect: rows are distributed across `events_mod2_r0` and `events_mod2_r1` (and visible on shards); EXPLAIN with `tenant_id = const` should prune to a single foreign partition.

### Maintenance and retention (Variant A)
Create partitions for a range and drop older than a cutoff:
```bash
psql postgresql://app:app@localhost:54322/app \
  -c "SET app.maint.from_month='2025-01'" \
  -c "SET app.maint.to_month='2025-12'" \
  -f scripts/partition_maintenance.sql

psql postgresql://app:app@localhost:54322/app \
  -c "SET app.maint.drop_before='2024-01'" \
  -f scripts/partition_maintenance.sql
```

Schedule: run monthly (cron/CI) to pre-create next month partition and drop partitions outside retention window.

### Indexing and constraints
- PK: `id uuid` on all variants
- Common indexes: `(occurred_at)`, `(tenant_id)`, `(tenant_id, occurred_at)` on each partition and shard
- Foreign keys: add on parent in Variant A (Postgres will enforce per-partition); avoid global FKs across shards in Variant B

### Benchmarks (compare plain vs partitioned)
Run comparable queries against `app.events_plain` and `app.events`:
```sql
-- plain (port 54321)
EXPLAIN ANALYZE SELECT count(*) FROM app.events_plain
 WHERE occurred_at >= '2024-06-01' AND occurred_at < '2024-07-01';

-- partitioned (port 54322)
EXPLAIN ANALYZE SELECT count(*) FROM app.events
 WHERE occurred_at >= '2024-06-01' AND occurred_at < '2024-07-01';
```
Expect partition pruning to reduce scanned data in Variant A.

### Monitoring (quick pointers)
- Track per-partition sizes: `pg_total_relation_size('app.events_YYYY_MM')`
- Track shard latency and row counts; alert on uneven distribution and disk space
- Regular `VACUUM (ANALYZE)`; autovacuum should be effective on smaller child tables

### One-shot end-to-end
```bash
bash run-all.sh
```
This brings up Docker, waits for readiness, and generates 500k rows per month for 2024 into all three setups.

## Benchmarks and comparison
After loading data, run the benchmark suite to compare plain vs partitioned vs sharded. It captures EXPLAIN ANALYZE for typical queries:

```bash
bash run-benchmarks.sh
```

Outputs are saved under `tmp/benchmarks/`:
- `plain.txt` (no partitions)
- `variant_a.txt` (RANGE partitions by month)
- `variant_b.txt` (HASH sharded by tenant via FDW)

Included query types:
- Point lookup by `id`
- Time-range aggregation for a month
- Tenant-scoped time-range aggregation
- Group-by month rollup
- Small batch insert (10 rows)
