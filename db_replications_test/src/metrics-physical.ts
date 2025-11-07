import { PhysicalTopology } from './db';
import { MetricsCollector, printPhysicalMetrics } from './metrics';

async function collectPhysicalMetrics() {
  console.log('Collecting Physical Replication Metrics...\n');

  const primaryCollector = new MetricsCollector(PhysicalTopology.primary);
  const standbyCollector = new MetricsCollector(PhysicalTopology.standby);

  let primaryMetrics = null;
  let standbyMetrics = null;

  try {
    // Collect metrics from primary
    try {
      primaryMetrics = await primaryCollector.collectPhysicalMetrics('primary');
      printPhysicalMetrics(primaryMetrics);
    } catch (error: any) {
      console.error('❌ Failed to collect metrics from Primary:');
      console.error(`   ${error.message}\n`);
    }

    // Collect metrics from standby
    try {
      standbyMetrics = await standbyCollector.collectPhysicalMetrics('standby');
      printPhysicalMetrics(standbyMetrics);
    } catch (error: any) {
      console.error('❌ Failed to collect metrics from Standby:');
      console.error(`   ${error.message}`);
      console.error('   (This is expected if standby is disconnected from network)\n');
    }

    // Calculate replication lag if available
    if (primaryMetrics && primaryMetrics.replicationState && primaryMetrics.replicationState.length > 0) {
      console.log('Summary:');
      console.log('--------');
      primaryMetrics.replicationState.forEach((state, idx) => {
        console.log(`\nReplica ${idx + 1} (${state.applicationName}):`);
        console.log(`  Status: ${state.state}`);
        console.log(`  Sync Mode: ${state.syncState}`);

        if (state.replayLag) {
          console.log(`  ⚠ Replication Lag: ${state.replayLag}`);
        } else {
          console.log(`  ✓ No significant lag detected`);
        }
      });
    } else if (primaryMetrics && (!primaryMetrics.replicationState || primaryMetrics.replicationState.length === 0)) {
      console.log('\n⚠ Warning: No active replication connections detected on Primary');
      console.log('   This may indicate that Standby is disconnected or not running.\n');
    }

  } catch (error) {
    console.error('Fatal error collecting metrics:', error);
  } finally {
    try {
      await PhysicalTopology.primary.close();
    } catch (e) {
      // Ignore close errors
    }
    try {
      await PhysicalTopology.standby.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

collectPhysicalMetrics().catch(console.error);
