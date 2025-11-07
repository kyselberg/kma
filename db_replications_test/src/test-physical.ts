import { PhysicalTopology } from './db';
import { DatabaseOperations } from './operations';

async function testPhysicalReplication() {
  console.log('='.repeat(80));
  console.log('PHYSICAL REPLICATION TEST (Master → Slave)');
  console.log('='.repeat(80));

  const primaryOps = new DatabaseOperations(PhysicalTopology.primary);
  const standbyOps = new DatabaseOperations(PhysicalTopology.standby);

  console.log('\n1. Testing Write to Primary...');
  const writeResult = await primaryOps.write(
    {
      message: 'Test write to primary',
      testType: 'physical-replication',
      timestamp: new Date().toISOString(),
    },
    'primary'
  );

  if (writeResult.success) {
    console.log(`   ✓ Write successful`);
    console.log(`   - ID: ${writeResult.id}`);
    console.log(`   - Duration: ${writeResult.duration}ms`);
  } else {
    console.log(`   ✗ Write failed: ${writeResult.error}`);
  }

  // Wait for replication
  console.log('\n2. Waiting for replication (3 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n3. Reading from Primary...');
  const primaryRead = await primaryOps.read(5);
  console.log(`   - Records found: ${primaryRead.count}`);
  console.log(`   - Query duration: ${primaryRead.duration}ms`);
  primaryRead.records.forEach((record, idx) => {
    console.log(`\n   Record ${idx + 1}:`);
    console.log(`     ID: ${record.id}`);
    console.log(`     Source: ${record.source_node}`);
    console.log(`     Created: ${record.created_at}`);
    console.log(`     Payload: ${JSON.stringify(record.payload)}`);
  });

  console.log('\n4. Reading from Standby...');
  const standbyRead = await standbyOps.read(5);
  console.log(`   - Records found: ${standbyRead.count}`);
  console.log(`   - Query duration: ${standbyRead.duration}ms`);
  standbyRead.records.forEach((record, idx) => {
    console.log(`\n   Record ${idx + 1}:`);
    console.log(`     ID: ${record.id}`);
    console.log(`     Source: ${record.source_node}`);
    console.log(`     Created: ${record.created_at}`);
    console.log(`     Payload: ${JSON.stringify(record.payload)}`);
  });

  console.log('\n5. Testing Bulk Write...');
  const bulkResults = await primaryOps.bulkWrite(10, 'primary-bulk');
  const successCount = bulkResults.filter(r => r.success).length;
  const avgDuration = bulkResults.reduce((sum, r) => sum + r.duration, 0) / bulkResults.length;
  console.log(`   - Success rate: ${successCount}/${bulkResults.length}`);
  console.log(`   - Average write duration: ${avgDuration.toFixed(2)}ms`);

  // Wait for replication
  console.log('\n6. Waiting for bulk replication (5 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n7. Verifying record counts...');
  const primaryCount = await primaryOps.getRecordCount();
  const standbyCount = await standbyOps.getRecordCount();
  console.log(`   - Primary count: ${primaryCount}`);
  console.log(`   - Standby count: ${standbyCount}`);

  if (primaryCount === standbyCount) {
    console.log('   ✓ Counts match - replication is working correctly');
  } else {
    console.log(`   ⚠ Count mismatch - replication lag detected (${primaryCount - standbyCount} records)`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Physical replication test completed');
  console.log('='.repeat(80) + '\n');

  await PhysicalTopology.primary.close();
  await PhysicalTopology.standby.close();
}

testPhysicalReplication().catch(console.error);
