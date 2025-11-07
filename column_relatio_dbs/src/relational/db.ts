import { Pool } from "pg";

export const dbPostgresPool: Pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
