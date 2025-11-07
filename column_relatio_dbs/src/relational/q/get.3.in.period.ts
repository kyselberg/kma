import { formatNumber } from "../../utils/number.js";
import { dbPostgresPool } from "../db.js";
import { executeQueryWithStats } from "../utils/query-performance.js";

interface ProductTriple {
  triple: string[];
  frequency: number;
}

interface TopTriplesResult {
  rows: ProductTriple[];
}

interface QueryParams {
  startDate: string;
  endDate: string;
  limit?: number;
  showReport?: boolean;
}

async function getTopProductTriples(
  params: QueryParams,
): Promise<ProductTriple[]> {
  const { startDate, endDate, limit = 10, showReport = true } = params;

  const query = `
    WITH transaction_products AS (
      SELECT
        ti.transaction_id,
        array_agg(DISTINCT ti.product_name ORDER BY ti.product_name) AS product_names
      FROM transaction_items ti
      WHERE ti.transaction_date BETWEEN $1::date AND $2::date
      GROUP BY ti.transaction_id
      HAVING COUNT(DISTINCT ti.product_name) > 2
    ),
    product_triples AS (
      SELECT
        tp.transaction_id,
        ARRAY[name1, name2, name3] as triple
      FROM transaction_products tp
      CROSS JOIN LATERAL unnest(tp.product_names) WITH ORDINALITY AS i1(name1, idx1)
      CROSS JOIN LATERAL unnest(tp.product_names) WITH ORDINALITY AS i2(name2, idx2)
      CROSS JOIN LATERAL unnest(tp.product_names) WITH ORDINALITY AS i3(name3, idx3)
      WHERE idx1 < idx2 AND idx2 < idx3
    )
    SELECT
      triple,
      COUNT(*) as frequency
    FROM product_triples
    GROUP BY triple
    ORDER BY frequency DESC
    LIMIT $3
  `;

  try {
    const { result } = await executeQueryWithStats<TopTriplesResult>(
      dbPostgresPool,
      query,
      [startDate, endDate, limit],
      showReport,
    );

    return result.rows;
  } catch (error) {
    console.error("Error executing top triples query:", error);
    throw error;
  }
}

async function main() {
  try {
    const topTriples = await getTopProductTriples({
      startDate: "2024-10-10",
      endDate: "2024-10-12",
      limit: 10,
      showReport: true,
    });

    console.log("\n=== TOP-10 Product Triples Bought Together ===");
    topTriples.forEach((triple, index) => {
      const [product1, product2, product3] = triple.triple;
      console.log(
        `${index + 1}. ${product1} + ${product2} + ${product3}: ${formatNumber(triple.frequency)} times`,
      );
    });
  } catch (error) {
    console.error("Failed to get top product triples:", error);
    process.exit(1);
  } finally {
    await dbPostgresPool.end();
  }
}

main();
