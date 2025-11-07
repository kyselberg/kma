import { formatNumber } from "../../utils/number.js";
import { dbPostgresPool } from "../db.js";
import { executeQueryWithStats } from "../utils/query-performance.js";

async function main() {
  const productName = "Яблука";
  const startDate = "2024-11-01";
  const endDate = "2024-12-31";
  const query = `
    SELECT
      SUM(ti.quantity * ti.unit_price) as total_amount,
      ti.product_name as product_name
    FROM transaction_items ti
    WHERE ti.product_name = $1
      AND ti.transaction_date >= $2::date
      AND ti.transaction_date <= $3::date
    GROUP BY ti.product_name
  `;

  const { result: data } = await executeQueryWithStats(dbPostgresPool, query, [
    productName,
    startDate,
    endDate,
  ]);

  const totalAmount = data.rows[0]?.total_amount ?? 0;

  console.log(
    `Total amount of "${productName}": UAH ${formatNumber(totalAmount / 100)}`,
  );
}

main();
