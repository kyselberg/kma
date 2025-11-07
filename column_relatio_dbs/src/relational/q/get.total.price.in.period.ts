import { formatNumber } from "../../utils/number.js";
import { dbPostgresPool } from "../db.js";
import { executeQueryWithStats } from "../utils/query-performance.js";

async function main() {
  const startDate = "2024-11-01";
  const endDate = "2024-12-31";
  const query = `
        SELECT SUM(transactions.total_amount) as total_amount
        FROM transactions
        WHERE transaction_date >= $1
          AND transaction_date <= $2
    `;

  try {
    const { result: data } = await executeQueryWithStats(
      dbPostgresPool,
      query,
      [startDate, endDate],
    );

    const totalAmount = data.rows[0]?.total_amount ?? 0;
    console.log(
      `Total amount in period ${startDate} - ${endDate}: UAH ${formatNumber(totalAmount / 100)}`,
    );
  } catch (error) {
    console.error(error);
  } finally {
    await dbPostgresPool.end();
  }
}

main();
