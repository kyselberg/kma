import {
  generateMarkets,
  generateProducts,
  generateTransactionBatch,
  logMemoryUsage,
} from "../utils/data-generator.js";
import { dbClickHouseClient } from "./db.js";

async function createSchema(): Promise<void> {
  console.log("Створення схеми бази даних...");

  const productsSQL = `
    CREATE TABLE IF NOT EXISTS products (
      id UInt32,
      name LowCardinality(String),
      price UInt32,
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY id
    SETTINGS index_granularity = 8192
  `;

  const marketsSQL = `
    CREATE TABLE IF NOT EXISTS markets (
      id UInt32,
      name LowCardinality(String),
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY id
    SETTINGS index_granularity = 8192
  `;

  const transactionsSQL = `
    CREATE TABLE IF NOT EXISTS transactions (
      id UInt64,
      market_id UInt32,
      total_amount UInt32,
      item_count UInt8,
      transaction_date DateTime,
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMM(transaction_date)
    ORDER BY (market_id, transaction_date, id)
    SETTINGS index_granularity = 8192
  `;

  const transactionItemsSQL = `
    CREATE TABLE IF NOT EXISTS transaction_items (
      transaction_id UInt64,
      product_id UInt32,
      product_name LowCardinality(String),
      quantity UInt8,
      unit_price UInt32,
      total_price UInt32,
      transaction_date Date,
      market_id UInt32,
      market_name LowCardinality(String)
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMM(transaction_date)
    ORDER BY (product_id, transaction_date, market_id, transaction_id)
    SETTINGS index_granularity = 8192
  `;

  for (const [name, sql] of [
    ["products", productsSQL],
    ["markets", marketsSQL],
    ["transactions", transactionsSQL],
    ["transaction_items", transactionItemsSQL],
  ] as const) {
    await dbClickHouseClient.exec({ query: sql });
    console.log(`✓ Created ${name} table`);
  }

  const addProjection = `
    ALTER TABLE transaction_items
    ADD PROJECTION IF NOT EXISTS pr_by_product_day
    (
      SELECT product_id, transaction_date, sum(total_price) AS revenue
      GROUP BY product_id, transaction_date
    )
  `;
  await dbClickHouseClient.exec({ query: addProjection });
  await dbClickHouseClient.exec({
    query: `ALTER TABLE transaction_items MATERIALIZE PROJECTION pr_by_product_day`,
  });
  console.log("✓ Added & materialized projection pr_by_product_day");

  // =========================
  // Materialized Views
  // =========================
  console.log("Creating materialized views...");

  const dailySalesMV = `
    CREATE MATERIALIZED VIEW IF NOT EXISTS daily_sales_by_product
    ENGINE = SummingMergeTree()
    PARTITION BY toYYYYMM(date)
    ORDER BY (product_id, date)
    AS SELECT
      toDate(transaction_date) as date,
      product_id,
      sum(quantity) as total_quantity,
      sum(total_price) as total_revenue,
      count() as transaction_count
    FROM transaction_items
    GROUP BY product_id, date
  `;

  const productPairsMV = `
    CREATE MATERIALIZED VIEW IF NOT EXISTS product_pairs
    ENGINE = SummingMergeTree()
    PARTITION BY toYYYYMM(transaction_date)
    ORDER BY (p1, p2, transaction_date)
    AS
    WITH transaction_items_grouped AS (
      SELECT
        groupArray(product_id) AS items,
        toDate(transaction_date) AS transaction_date
      FROM transaction_items
      GROUP BY transaction_id, transaction_date
      HAVING length(items) > 1
    )
    SELECT
      item1 AS p1,
      item2 AS p2,
      transaction_date,
      count() AS frequency
    FROM transaction_items_grouped
    ARRAY JOIN
      items AS item1, arrayEnumerate(items) AS i1
    ARRAY JOIN
      items AS item2, arrayEnumerate(items) AS i2
    WHERE i1 < i2
    GROUP BY p1, p2, transaction_date
  `;

  await dbClickHouseClient.exec({ query: dailySalesMV });
  console.log("✓ Created daily_sales_by_product materialized view");

  await dbClickHouseClient.exec({ query: productPairsMV });
  console.log("✓ Created product_pairs materialized view");
}

async function insertProducts(): Promise<void> {
  console.log("Генерація продуктів...");
  const products = generateProducts();

  await dbClickHouseClient.insert({
    table: "products",
    values: products,
    format: "JSONEachRow",
  });

  console.log(`✓ Згенеровано та вставлено ${products.length} продуктів`);
}

async function insertMarkets(): Promise<void> {
  console.log("Генерація магазинів...");
  const markets = generateMarkets();

  await dbClickHouseClient.insert({
    table: "markets",
    values: markets,
    format: "JSONEachRow",
  });

  console.log(`✓ Згенеровано та вставлено ${markets.length} магазинів`);
}

async function getProductPrices(): Promise<Map<number, number>> {
  const result = await dbClickHouseClient.query({
    query: "SELECT id, price FROM products",
    format: "JSONEachRow",
  });
  const rows = (await result.json()) as Array<{
    id: number;
    price: string | number;
  }>;
  const priceMap = new Map<number, number>();
  for (const row of rows) {
    priceMap.set(Number(row.id), Number(row.price));
  }
  return priceMap;
}

async function getProductNames(): Promise<Map<number, string>> {
  const result = await dbClickHouseClient.query({
    query: "SELECT id, name FROM products",
    format: "JSONEachRow",
  });
  const rows = (await result.json()) as Array<{
    id: number;
    name: string;
  }>;
  const nameMap = new Map<number, string>();
  for (const row of rows) {
    nameMap.set(Number(row.id), row.name);
  }
  return nameMap;
}

async function getMarketNames(): Promise<Map<number, string>> {
  const result = await dbClickHouseClient.query({
    query: "SELECT id, name FROM markets",
    format: "JSONEachRow",
  });
  const rows = (await result.json()) as Array<{
    id: number;
    name: string;
  }>;
  const nameMap = new Map<number, string>();
  for (const row of rows) {
    nameMap.set(Number(row.id), row.name);
  }
  return nameMap;
}

const totalTransactions = 1_000_000;
const batchSize = 10_000; // Зменшено через денормалізацію (більший розмір кожного рядка)

async function batchInsert(
  batchNum: number,
  productPrices: Map<number, number>,
  productNames: Map<number, string>,
  marketNames: Map<number, string>,
): Promise<void> {
  console.log("Generating transactions...");
  const batch = generateTransactionBatch(
    batchNum,
    batchSize,
    productPrices,
    productNames,
    marketNames,
  );

  console.log("Inserting data...");

  // Вставляємо транзакції
  await dbClickHouseClient.insert({
    table: "transactions",
    values: batch.transactions,
    format: "JSONEachRow",
    clickhouse_settings: {
      async_insert: 1,
      wait_for_async_insert: 0,
      insert_deduplicate: 0,
    },
  });

  // Вставляємо items підбатчами через денормалізацію (більший розмір)
  const itemsSubBatchSize = 50_000;
  for (let i = 0; i < batch.items.length; i += itemsSubBatchSize) {
    const subBatch = batch.items.slice(i, i + itemsSubBatchSize);
    await dbClickHouseClient.insert({
      table: "transaction_items",
      values: subBatch,
      format: "JSONEachRow",
      clickhouse_settings: {
        async_insert: 1,
        wait_for_async_insert: 0,
        insert_deduplicate: 0,
      },
    });
  }

  const totalBatches = totalTransactions / batchSize;
  console.log(
    `Прогрес: ${batchNum + 1}/${totalBatches} батчів завершено (${(((batchNum + 1) / totalBatches) * 100).toFixed(1)}%)`,
  );
}

async function generateTransactions(): Promise<void> {
  console.log("Генерація транзакцій...");
  logMemoryUsage();

  console.log("Завантаження довідкових даних...");
  const productPrices = await getProductPrices();
  const productNames = await getProductNames();
  const marketNames = await getMarketNames();

  const totalBatches = totalTransactions / batchSize;
  const startTime = Date.now();

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    await batchInsert(batchNum, productPrices, productNames, marketNames);

    if (batchNum % 10 === 0) {
      if (global.gc) {
        global.gc();
      }
      logMemoryUsage();

      const elapsed = (Date.now() - startTime) / 1000;
      const recordsInserted = (batchNum + 1) * batchSize;
      const recordsPerSec = Math.round(recordsInserted / elapsed);
      console.log(
        `⚡ Швидкість ClickHouse: ${recordsPerSec.toLocaleString()} транзакцій/сек`,
      );
    }
  }

  console.log("✓ Згенеровано та вставлено транзакції з товарами");
}

async function main(): Promise<void> {
  console.log("Запуск скрипта для заповнення бази даних...");
  try {
    await createSchema();
    await insertProducts();
    await insertMarkets();
    await generateTransactions();
    console.log("✅ Заповнення бази даних завершено успішно!");
  } catch (err) {
    console.error("Помилка під час заповнення бази даних:", err);
    process.exitCode = 1;
  } finally {
    await dbClickHouseClient.close();
  }
}

main();
