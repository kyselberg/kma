import { formatNumber } from "../../utils/number.js";
import { dbPostgresPool } from "../db.js";
import { executeQueryWithStats } from "../utils/query-performance.js";

async function main() {
  const productName = "Яблука";
  const shopName = "Novus Оболонський 1";
  const startDate = "2024-11-01";
  const endDate = "2024-12-31";
  const query = `
    SELECT
      SUM(ti.quantity * ti.unit_price) as total_amount,
      ti.product_name as product_name,
      ti.market_name as shop_name
    FROM transaction_items ti
    WHERE ti.product_name = $1
      AND ti.market_name = $2
      AND ti.transaction_date >= $3::date
      AND ti.transaction_date <= $4::date
    GROUP BY ti.product_name, ti.market_name
  `;

  const { result: data } = await executeQueryWithStats(dbPostgresPool, query, [
    productName,
    shopName,
    startDate,
    endDate,
  ]);

  const totalAmount = data.rows[0]?.total_amount ?? 0;

  console.log(
    `Total amount of "${productName}" in "${shopName}": UAH ${formatNumber(totalAmount / 100)}`,
  );
}

main();
