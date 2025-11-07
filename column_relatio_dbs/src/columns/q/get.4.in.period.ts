import { formatNumber } from "../../utils/number.js";
import { executeQueryWithStats } from "../../utils/query-performance.js";
import { dbClickHouseClient } from "../db.js";

interface ProductQuadruple {
  quadruple: string[];
  frequency: number;
}

interface TopQuadruplesResult {
  data: ProductQuadruple[];
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
        groupArray(DISTINCT ti.product_name) AS product_names
      FROM transaction_items ti
      WHERE ti.transaction_date BETWEEN toDate('${startDate}') AND toDate('${endDate}')
      GROUP BY ti.transaction_id
      HAVING length(product_names) > 3
    ),
    enumerated_products AS (
      SELECT
        transaction_id,
        product_names,
        arrayEnumerate(product_names) AS indices
      FROM transaction_products
    ),
    product_quadruples AS (
      SELECT
        ep.transaction_id,
        arraySort([ep.product_names[i1], ep.product_names[i2], ep.product_names[i3], ep.product_names[i4]]) AS quadruple
      FROM enumerated_products ep
      ARRAY JOIN indices AS i1
      ARRAY JOIN indices AS i2
      ARRAY JOIN indices AS i3
      ARRAY JOIN indices AS i4
      WHERE i1 < i2 AND i2 < i3 AND i3 < i4
    )
    SELECT
      quadruple,
      count() AS frequency
    FROM product_quadruples
    GROUP BY quadruple
    ORDER BY frequency DESC
    LIMIT ${limit}
  `;

  try {
    const { result } = await executeQueryWithStats<TopQuadruplesResult>(
      dbClickHouseClient,
      query,
      showReport,
    );

    return result.data;
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
    await dbClickHouseClient.close();
  }
}

main();
