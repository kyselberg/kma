import { formatNumber } from "../../utils/number.js";
import { dbPostgresPool } from "../db.js";
import { executeQueryWithStats } from "../utils/query-performance.js";

interface ProductPair {
  pair: string[];
  frequency: number;
}

interface TopPairsResult {
  rows: ProductPair[];
}

interface QueryParams {
  startDate: string;
  endDate: string;
  limit?: number;
  showReport?: boolean;
}

async function getTopProductPairs(params: QueryParams): Promise<ProductPair[]> {
  const { startDate, endDate, limit = 10, showReport = true } = params;

  const query = `
    WITH transaction_products AS (
      SELECT
        ti.transaction_id,
        array_agg(DISTINCT ti.product_name ORDER BY ti.product_name) AS product_names
      FROM transaction_items ti
      WHERE ti.transaction_date BETWEEN $1::date AND $2::date
      GROUP BY ti.transaction_id
      HAVING COUNT(DISTINCT ti.product_name) > 1
    ),
    product_pairs AS (
      SELECT
        tp.transaction_id,
        LEAST(name1, name2) as product1,
        GREATEST(name1, name2) as product2
      FROM transaction_products tp
      CROSS JOIN LATERAL unnest(tp.product_names) WITH ORDINALITY AS i1(name1, idx1)
      CROSS JOIN LATERAL unnest(tp.product_names) WITH ORDINALITY AS i2(name2, idx2)
      WHERE idx1 < idx2
    )
    SELECT
      ARRAY[product1, product2] as pair,
      COUNT(*) as frequency
    FROM product_pairs
    GROUP BY product1, product2
    ORDER BY frequency DESC
    LIMIT $3
  `;

  try {
    const { result } = await executeQueryWithStats<TopPairsResult>(
      dbPostgresPool,
      query,
      [startDate, endDate, limit],
      showReport,
    );

    return result.rows;
  } catch (error) {
    console.error("Error executing top pairs query:", error);
    throw error;
  }
}

async function main() {
  try {
    const topPairs = await getTopProductPairs({
      startDate: "2024-10-10",
      endDate: "2024-10-12",
      limit: 10,
      showReport: true,
    });

    console.log("\n=== TOP-10 Product Pairs Bought Together ===");
    topPairs.forEach((pair, index) => {
      const [product1, product2] = pair.pair;
      console.log(
        `${index + 1}. ${product1} + ${product2}: ${formatNumber(pair.frequency)} times`,
      );
    });
  } catch (error) {
    console.error("Failed to get top product pairs:", error);
    process.exit(1);
  } finally {
    await dbPostgresPool.end();
  }
}

main();
