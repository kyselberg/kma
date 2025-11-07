import { formatNumber } from "../../utils/number.js";
import { dbPostgresPool } from "../db.js";
import { executeQueryWithStats } from "../utils/query-performance.js";

interface ProductQuadruple {
  quadruple: string[];
  frequency: number;
}

interface TopQuadruplesResult {
  rows: ProductQuadruple[];
}

interface QueryParams {
  startDate: string;
  endDate: string;
  limit?: number;
  showReport?: boolean;
}

async function getTopProductQuadruples(
  params: QueryParams,
): Promise<ProductQuadruple[]> {
  const { startDate, endDate, limit = 10, showReport = true } = params;

  const query = `
    WITH transaction_products AS (
      SELECT
        ti.transaction_id,
        array_agg(DISTINCT ti.product_name ORDER BY ti.product_name) AS product_names
      FROM transaction_items ti
      WHERE ti.transaction_date BETWEEN $1::date AND $2::date
      GROUP BY ti.transaction_id
      HAVING COUNT(DISTINCT ti.product_name) > 3
    ),
    product_quadruples AS (
      SELECT
        tp.transaction_id,
        ARRAY[name1, name2, name3, name4] as quadruple
      FROM transaction_products tp
      CROSS JOIN LATERAL unnest(tp.product_names) WITH ORDINALITY AS i1(name1, idx1)
      CROSS JOIN LATERAL unnest(tp.product_names) WITH ORDINALITY AS i2(name2, idx2)
      CROSS JOIN LATERAL unnest(tp.product_names) WITH ORDINALITY AS i3(name3, idx3)
      CROSS JOIN LATERAL unnest(tp.product_names) WITH ORDINALITY AS i4(name4, idx4)
      WHERE idx1 < idx2 AND idx2 < idx3 AND idx3 < idx4
    )
    SELECT
      quadruple,
      COUNT(*) as frequency
    FROM product_quadruples
    GROUP BY quadruple
    ORDER BY frequency DESC
    LIMIT $3
  `;

  try {
    const { result } = await executeQueryWithStats<TopQuadruplesResult>(
      dbPostgresPool,
      query,
      [startDate, endDate, limit],
      showReport,
    );

    return result.rows;
  } catch (error) {
    console.error("Error executing top quadruples query:", error);
    throw error;
  }
}

async function main() {
  try {
    const topQuadruples = await getTopProductQuadruples({
      startDate: "2024-10-10",
      endDate: "2024-10-12",
      limit: 10,
      showReport: true,
    });

    console.log("\n=== TOP-10 Product Quadruples Bought Together ===");
    topQuadruples.forEach((quadruple, index) => {
      const [product1, product2, product3, product4] = quadruple.quadruple;
      console.log(
        `${index + 1}. ${product1} + ${product2} + ${product3} + ${product4}: ${formatNumber(quadruple.frequency)} times`,
      );
    });
  } catch (error) {
    console.error("Failed to get top product quadruples:", error);
    process.exit(1);
  } finally {
    await dbPostgresPool.end();
  }
}

main();
