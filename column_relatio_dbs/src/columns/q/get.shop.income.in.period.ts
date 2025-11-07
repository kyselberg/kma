import { formatNumber } from "../../utils/number.js";
import { executeQueryWithStats } from "../../utils/query-performance.js";
import { dbClickHouseClient } from "../db.js";

async function main() {
  const shopName = "Novus Оболонський 1";
  const startDate = "2024-11-01";
  const endDate = "2024-12-31";
  const query = `
    SELECT
      SUM(ti.total_price) as total_amount,
      ti.market_name as shop_name
    FROM transaction_items ti
    WHERE ti.market_name = '${shopName}'
      AND ti.transaction_date >= toDate('${startDate}')
      AND ti.transaction_date <= toDate('${endDate}')
    GROUP BY ti.market_name
  `;

  const { result: data } = await executeQueryWithStats(
    dbClickHouseClient,
    query,
  );

  const totalAmount = data.data[0]?.total_amount ?? 0;

  console.log(
    `Total income of "${shopName}": UAH ${formatNumber(totalAmount / 100)}`,
  );
}

main();
