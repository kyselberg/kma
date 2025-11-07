import { LogicalTopology } from './db';
import { MetricsCollector, printLogicalMetrics } from './metrics';

async function collectLogicalMetrics() {
  console.log('Collecting Logical Replication Metrics...\n');

  const nodeACollector = new MetricsCollector(LogicalTopology.nodeA);
  const nodeBCollector = new MetricsCollector(LogicalTopology.nodeB);

  let nodeAMetrics = null;
  let nodeBMetrics = null;

  try {
    // Collect metrics from Node A
    try {
      nodeAMetrics = await nodeACollector.collectLogicalMetrics();
      printLogicalMetrics(nodeAMetrics);
    } catch (error: any) {
      console.error('❌ Failed to collect metrics from Node A:');
      console.error(`   ${error.message}`);
      console.error('   (This is expected if Node A is disconnected from network)\n');
    }

    // Collect metrics from Node B
    try {
      nodeBMetrics = await nodeBCollector.collectLogicalMetrics();
      printLogicalMetrics(nodeBMetrics);
    } catch (error: any) {
      console.error('❌ Failed to collect metrics from Node B:');
      console.error(`   ${error.message}`);
      console.error('   (This is expected if Node B is disconnected from network)\n');
    }

    // Summary - only if we have at least one node's metrics
    if (nodeAMetrics || nodeBMetrics) {
      console.log('Summary:');
      console.log('--------');

      if (nodeAMetrics) {
        console.log('\nNode A:');
        console.log(`  Publications: ${nodeAMetrics.publications.length}`);
        console.log(`  Subscriptions: ${nodeAMetrics.subscriptions.length}`);
        console.log(`  Active Slots: ${nodeAMetrics.slots.filter(s => s.active).length}/${nodeAMetrics.slots.length}`);

        if (nodeAMetrics.subscriptions.length > 0) {
          const activeSubs = nodeAMetrics.subscriptions.filter(s => s.pid !== null);
          console.log(`  Active Subscriptions: ${activeSubs.length}/${nodeAMetrics.subscriptions.length}`);
        }
      } else {
        console.log('\nNode A: ❌ Unavailable');
      }

      if (nodeBMetrics) {
        console.log('\nNode B:');
        console.log(`  Publications: ${nodeBMetrics.publications.length}`);
        console.log(`  Subscriptions: ${nodeBMetrics.subscriptions.length}`);
        console.log(`  Active Slots: ${nodeBMetrics.slots.filter(s => s.active).length}/${nodeBMetrics.slots.length}`);

        if (nodeBMetrics.subscriptions.length > 0) {
          const activeSubs = nodeBMetrics.subscriptions.filter(s => s.pid !== null);
          console.log(`  Active Subscriptions: ${activeSubs.length}/${nodeBMetrics.subscriptions.length}`);
        }
      } else {
        console.log('\nNode B: ❌ Unavailable');
      }

      // Check for potential issues
      console.log('\nHealth Check:');

      if (nodeAMetrics && nodeBMetrics) {
        const nodeAInactive = nodeAMetrics.subscriptions.filter(s => s.pid === null);
        const nodeBInactive = nodeBMetrics.subscriptions.filter(s => s.pid === null);

        if (nodeAInactive.length > 0) {
          console.log(`  ⚠ Node A has ${nodeAInactive.length} inactive subscription(s)`);
        }
        if (nodeBInactive.length > 0) {
          console.log(`  ⚠ Node B has ${nodeBInactive.length} inactive subscription(s)`);
        }
        if (nodeAInactive.length === 0 && nodeBInactive.length === 0) {
          console.log('  ✓ All subscriptions are active');
        }
      } else {
        console.log('  ⚠ Cannot perform full health check - one or more nodes unavailable');
      }
    }

  } catch (error) {
    console.error('Fatal error collecting metrics:', error);
  } finally {
    try {
      await LogicalTopology.nodeA.close();
    } catch (e) {
      // Ignore close errors
    }
    try {
      await LogicalTopology.nodeB.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

collectLogicalMetrics().catch(console.error);
