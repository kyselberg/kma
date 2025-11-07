import {
  generateMarkets,
  generateProducts,
  generateTransactionBatch,
  logMemoryUsage,
} from "../utils/data-generator.js";
import { dbPostgresPool } from "./db.js";

async function createSchema(): Promise<void> {
  console.log("Створення схеми бази даних...");

  const productsSQL = `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const marketsSQL = `
    CREATE TABLE IF NOT EXISTS markets (
      id INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const dropTransactionsSQL = `DROP TABLE IF EXISTS transactions CASCADE`;

  const transactionsSQL = `
    CREATE TABLE IF NOT EXISTS transactions (
      id BIGINT NOT NULL,
      market_id INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      item_count INTEGER NOT NULL,
      transaction_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) PARTITION BY RANGE (transaction_date)
  `;

  function generateWeeklyPartitions() {
    const partitions = [];
    const startDate = new Date("2024-10-01");
    const endDate = new Date("2025-12-01");

    let currentDate = new Date(startDate);
    let weekNum = 1;

    while (currentDate < endDate) {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");

      partitions.push({
        name: `transactions_w${String(weekNum).padStart(3, "0")}`,
        from: currentDate.toISOString().split("T")[0],
        to: nextWeek.toISOString().split("T")[0],
      });

      currentDate = nextWeek;
      weekNum++;
    }

    return partitions;
  }

  const transactionPartitions = generateWeeklyPartitions();

  const dropTransactionItemsSQL = `DROP TABLE IF EXISTS transaction_items CASCADE`;

  const transactionItemsSQL = `
    CREATE TABLE IF NOT EXISTS transaction_items (
      transaction_id BIGINT NOT NULL,
      product_id INTEGER NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      transaction_date DATE NOT NULL,
      market_id INTEGER NOT NULL,
      market_name VARCHAR(255) NOT NULL
    ) PARTITION BY RANGE (transaction_date)
  `;

  function generateWeeklyItemsPartitions() {
    const partitions = [];
    const startDate = new Date("2024-10-01");
    const endDate = new Date("2025-12-01");

    let currentDate = new Date(startDate);
    let weekNum = 1;

    while (currentDate < endDate) {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);

      partitions.push({
        name: `transaction_items_w${String(weekNum).padStart(3, "0")}`,
        from: currentDate.toISOString().split("T")[0],
        to: nextWeek.toISOString().split("T")[0],
      });

      currentDate = nextWeek;
      weekNum++;
    }

    return partitions;
  }

  const itemsPartitions = generateWeeklyItemsPartitions();

  const client = await dbPostgresPool.connect();
  try {
    await client.query(productsSQL);
    console.log("✓ Created products table");

    await client.query(marketsSQL);
    console.log("✓ Created markets table");

    await client.query(dropTransactionsSQL);
    console.log("✓ Dropped old transactions table (if existed)");

    await client.query(transactionsSQL);
    console.log("✓ Created partitioned transactions table");

    for (const partition of transactionPartitions) {
      const partitionSQL = `
        CREATE TABLE IF NOT EXISTS ${partition.name} PARTITION OF transactions
        FOR VALUES FROM ('${partition.from}') TO ('${partition.to}')
      `;
      await client.query(partitionSQL);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${partition.name}_market
        ON ${partition.name}(market_id)
      `);
    }
    console.log(
      `✓ Created ${transactionPartitions.length} weekly partitions for transactions`,
    );

    await client.query(dropTransactionItemsSQL);
    console.log("✓ Dropped old transaction_items table (if existed)");

    await client.query(transactionItemsSQL);
    console.log("✓ Created partitioned transaction_items table");

    for (const partition of itemsPartitions) {
      const partitionSQL = `
        CREATE TABLE IF NOT EXISTS ${partition.name} PARTITION OF transaction_items
        FOR VALUES FROM ('${partition.from}') TO ('${partition.to}')
      `;
      await client.query(partitionSQL);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${partition.name}_product_date
        ON ${partition.name}(product_id, transaction_date)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${partition.name}_market
        ON ${partition.name}(market_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${partition.name}_transaction
        ON ${partition.name}(transaction_id)
      `);
    }

    console.log(
      `✓ Created ${itemsPartitions.length} weekly partitions for transaction_items with indexes`,
    );
  } finally {
    client.release();
  }
}

async function insertProducts(): Promise<void> {
  console.log("Генерація продуктів...");
  const products = generateProducts();

  const client = await dbPostgresPool.connect();
  try {
    await client.query("TRUNCATE TABLE products RESTART IDENTITY CASCADE");

    const insertSQL = `
      INSERT INTO products (id, name, price)
      VALUES ($1, $2, $3)
    `;

    for (const product of products) {
      await client.query(insertSQL, [product.id, product.name, product.price]);
    }

    console.log(`✓ Згенеровано та вставлено ${products.length} продуктів`);
  } finally {
    client.release();
  }
}

async function insertMarkets(): Promise<void> {
  console.log("Генерація магазинів...");
  const markets = generateMarkets();

  const client = await dbPostgresPool.connect();
  try {
    await client.query("TRUNCATE TABLE markets RESTART IDENTITY CASCADE");

    const insertSQL = `
      INSERT INTO markets (id, name)
      VALUES ($1, $2)
    `;

    for (const market of markets) {
      await client.query(insertSQL, [market.id, market.name]);
    }

    console.log(`✓ Згенеровано та вставлено ${markets.length} магазинів`);
  } finally {
    client.release();
  }
}

async function getProductPrices(): Promise<Map<number, number>> {
  const client = await dbPostgresPool.connect();
  try {
    const result = await client.query("SELECT id, price FROM products");
    const priceMap = new Map<number, number>();
    for (const row of result.rows) {
      priceMap.set(Number(row.id), Number(row.price));
    }
    return priceMap;
  } finally {
    client.release();
  }
}

async function getProductNames(): Promise<Map<number, string>> {
  const client = await dbPostgresPool.connect();
  try {
    const result = await client.query("SELECT id, name FROM products");
    const nameMap = new Map<number, string>();
    for (const row of result.rows) {
      nameMap.set(Number(row.id), row.name);
    }
    return nameMap;
  } finally {
    client.release();
  }
}

async function getMarketNames(): Promise<Map<number, string>> {
  const client = await dbPostgresPool.connect();
  try {
    const result = await client.query("SELECT id, name FROM markets");
    const nameMap = new Map<number, string>();
    for (const row of result.rows) {
      nameMap.set(Number(row.id), row.name);
    }
    return nameMap;
  } finally {
    client.release();
  }
}

const totalTransactions = 1_000_000;
const batchSize = 50_000;

async function batchInsert(
  batchNum: number,
  productPrices: Map<number, number>,
  productNames: Map<number, string>,
  marketNames: Map<number, string>,
): Promise<void> {
  const client = await dbPostgresPool.connect();
  try {
    await client.query("BEGIN");

    console.log("Generating transactions...");
    const batch = generateTransactionBatch(
      batchNum,
      batchSize,
      productPrices,
      productNames,
      marketNames,
    );

    console.log("Inserting transactions in bulk...");

    const subBatchSize = 1000;
    for (let i = 0; i < batch.transactions.length; i += subBatchSize) {
      const subBatch = batch.transactions.slice(i, i + subBatchSize);
      const values: any[] = [];
      const placeholders: string[] = [];

      subBatch.forEach((transaction, idx) => {
        const offset = idx * 5;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`,
        );
        values.push(
          transaction.id,
          transaction.market_id,
          transaction.total_amount,
          transaction.item_count,
          transaction.transaction_date,
        );
      });

      const transactionInsertSQL = `
        INSERT INTO transactions (id, market_id, total_amount, item_count, transaction_date)
        VALUES ${placeholders.join(", ")}
      `;

      await client.query(transactionInsertSQL, values);
    }

    console.log("Inserting transaction items in bulk...");

    for (let i = 0; i < batch.items.length; i += subBatchSize) {
      const subBatch = batch.items.slice(i, i + subBatchSize);
      const values: any[] = [];
      const placeholders: string[] = [];

      subBatch.forEach((item, idx) => {
        const offset = idx * 9;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`,
        );
        values.push(
          item.transaction_id,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.total_price,
          item.transaction_date,
          item.market_id,
          item.market_name,
        );
      });

      const itemInsertSQL = `
        INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, unit_price, total_price, transaction_date, market_id, market_name)
        VALUES ${placeholders.join(", ")}
      `;

      await client.query(itemInsertSQL, values);
    }

    await client.query("COMMIT");

    const totalBatches = totalTransactions / batchSize;
    console.log(
      `Прогрес: ${batchNum + 1}/${totalBatches} батчів завершено (${(((batchNum + 1) / totalBatches) * 100).toFixed(1)}%)`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function generateTransactions(): Promise<void> {
  console.log("Генерація транзакцій...");
  logMemoryUsage();

  const client = await dbPostgresPool.connect();
  try {
    await client.query("TRUNCATE TABLE transaction_items CASCADE");
    await client.query("TRUNCATE TABLE transactions CASCADE");

    console.log("Налаштування PostgreSQL для швидкого імпорту...");
    await client.query("SET synchronous_commit = OFF");
    await client.query("SET maintenance_work_mem = '1GB'");
  } finally {
    client.release();
  }

  console.log("Завантаження довідкових даних...");
  const productPrices = await getProductPrices();
  const productNames = await getProductNames();
  const marketNames = await getMarketNames();

  const totalBatches = totalTransactions / batchSize;

  const startTime = Date.now();

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    await batchInsert(batchNum, productPrices, productNames, marketNames);

    if (batchNum % 5 === 0) {
      if (global.gc) {
        global.gc();
      }
      logMemoryUsage();

      const elapsed = (Date.now() - startTime) / 1000;
      const recordsInserted = (batchNum + 1) * batchSize;
      const recordsPerSec = Math.round(recordsInserted / elapsed);
      console.log(
        `⚡ Швидкість: ${recordsPerSec.toLocaleString()} транзакцій/сек`,
      );
    }
  }

  const cleanupClient = await dbPostgresPool.connect();
  try {
    console.log("Аналіз таблиць для оновлення статистики...");
    await cleanupClient.query("ANALYZE transactions");
    await cleanupClient.query("ANALYZE transaction_items");
  } finally {
    cleanupClient.release();
  }

  console.log("✓ Згенеровано та вставлено транзакції з товарами");
}

async function main(): Promise<void> {
  console.log("Запуск скрипта для заповнення PostgreSQL бази даних...");
  try {
    await createSchema();
    await insertProducts();
    await insertMarkets();
    await generateTransactions();
    console.log("✅ Заповнення PostgreSQL бази даних завершено успішно!");
  } catch (err) {
    console.error("Помилка під час заповнення бази даних:", err);
    process.exitCode = 1;
  } finally {
    await dbPostgresPool.end();
  }
}

main();
