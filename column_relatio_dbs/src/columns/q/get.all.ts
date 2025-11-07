import { formatNumber } from "../../utils/number.js";
import { executeQueryWithStats } from "../../utils/query-performance.js";
import { dbClickHouseClient } from "../db.js";

async function main() {
  const query = `
        SELECT SUM(transactions.item_count) AS total_items
        FROM transactions
    `;

  try {
    const { result: data } = await executeQueryWithStats(
      dbClickHouseClient,
      query,
    );

    const totalItems = data.data[0]?.total_items ?? 0;

    console.log(`Total items: ${formatNumber(totalItems)}`);
  } catch (error) {
    console.error(error);
  } finally {
    await dbClickHouseClient.close();
  }
}

main();
