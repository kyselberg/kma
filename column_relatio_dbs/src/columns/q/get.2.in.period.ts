import { formatNumber } from "../../utils/number.js";
import { executeQueryWithStats } from "../../utils/query-performance.js";
import { dbClickHouseClient } from "../db.js";

interface ProductPair {
  pair: string[];
  frequency: number;
}

interface TopPairsResult {
  data: ProductPair[];
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
        groupArray(DISTINCT ti.product_name) AS product_names
      FROM transaction_items ti
      WHERE ti.transaction_date BETWEEN toDate('${startDate}') AND toDate('${endDate}')
      GROUP BY ti.transaction_id
      HAVING length(product_names) > 1
    ),
    enumerated_products AS (
      SELECT
        transaction_id,
        product_names,
        arrayEnumerate(product_names) AS indices
      FROM transaction_products
    ),
    product_pairs AS (
      SELECT
        ep.transaction_id,
        arraySort([ep.product_names[i1], ep.product_names[i2]]) AS pair
      FROM enumerated_products ep
      ARRAY JOIN indices AS i1
      ARRAY JOIN indices AS i2
      WHERE i1 < i2
    )
    SELECT
      pair,
      count() AS frequency
    FROM product_pairs
    GROUP BY pair
    ORDER BY frequency DESC
    LIMIT ${limit}
  `;

  try {
    const { result } = await executeQueryWithStats<TopPairsResult>(
      dbClickHouseClient,
      query,
      showReport,
    );

    return result.data;
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
    await dbClickHouseClient.close();
  }
}

main();
