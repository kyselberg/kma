import { ClickHouseClient, createClient } from "@clickhouse/client";

export const dbClickHouseClient: ClickHouseClient = createClient({
  url: "http://localhost:8123",
  username: "default_user",
  password: "default_pass",
  request_timeout: 1_000_000,
});
