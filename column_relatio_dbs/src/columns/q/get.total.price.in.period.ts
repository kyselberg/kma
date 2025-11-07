import { formatNumber } from "../../utils/number.js";
import { executeQueryWithStats } from "../../utils/query-performance.js";
import { dbClickHouseClient } from "../db.js";

async function main() {
  const startDate = "2024-11-01";
  const endDate = "2024-12-31";
  const query = `
        SELECT SUM(transactions.total_amount) as total_amount
        FROM transactions
        WHERE transaction_date >= '${startDate}'
          AND transaction_date <= '${endDate}'
    `;

  try {
    const { result: data } = await executeQueryWithStats(
      dbClickHouseClient,
      query,
    );

    const totalAmount = data.data[0]?.total_amount ?? 0;
    console.log(
      `Total amount in period ${startDate} - ${endDate}: UAH ${formatNumber(totalAmount / 100)}`,
    );
  } catch (error) {
    console.error(error);
  } finally {
    await dbClickHouseClient.close();
  }
}

main();
