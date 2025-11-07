import { formatNumber } from "../../utils/number.js";
import { dbPostgresPool } from "../db.js";
import { executeQueryWithStats } from "../utils/query-performance.js";

async function main() {
  const shopName = "Novus Оболонський 1";
  const startDate = "2024-11-01";
  const endDate = "2024-12-31";
  const query = `
    SELECT
      SUM(ti.total_price) as total_amount,
      ti.market_name as shop_name
    FROM transaction_items ti
    WHERE ti.market_name = $1
      AND ti.transaction_date >= $2::date
      AND ti.transaction_date <= $3::date
    GROUP BY ti.market_name
  `;

  const { result: data } = await executeQueryWithStats(dbPostgresPool, query, [
    shopName,
    startDate,
    endDate,
  ]);

  const totalAmount = data.rows[0]?.total_amount ?? 0;

  console.log(
    `Total income of "${shopName}": UAH ${formatNumber(totalAmount / 100)}`,
  );
}

main();
