import { formatNumber } from "../../utils/number.js";
import { dbPostgresPool } from "../db.js";
import { executeQueryWithStats } from "../utils/query-performance.js";

async function main() {
  const query = `
        SELECT SUM(transactions.item_count) AS total_items
        FROM transactions
    `;

  try {
    const { result: data } = await executeQueryWithStats(dbPostgresPool, query);

    const totalItems = data.rows[0]?.total_items ?? 0;

    console.log(`Total items: ${formatNumber(totalItems)}`);
  } catch (error) {
    console.error(error);
  } finally {
    await dbPostgresPool.end();
  }
}

main();
