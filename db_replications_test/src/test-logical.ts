import { LogicalTopology } from './db';
import { DatabaseOperations } from './operations';

async function testLogicalReplication() {
  console.log('='.repeat(80));
  console.log('LOGICAL REPLICATION TEST (Master ↔ Master)');
  console.log('='.repeat(80));

  const nodeAOps = new DatabaseOperations(LogicalTopology.nodeA);
  const nodeBOps = new DatabaseOperations(LogicalTopology.nodeB);

  console.log('\n1. Testing Write to Node A...');
  const writeA = await nodeAOps.write(
    {
      message: 'Test write to node A',
      testType: 'logical-replication',
      timestamp: new Date().toISOString(),
    },
    'node-a'
  );

  if (writeA.success) {
    console.log(`   ✓ Write successful`);
    console.log(`   - ID: ${writeA.id}`);
    console.log(`   - Duration: ${writeA.duration}ms`);
  } else {
    console.log(`   ✗ Write failed: ${writeA.error}`);
  }

  console.log('\n2. Testing Write to Node B...');
  const writeB = await nodeBOps.write(
    {
      message: 'Test write to node B',
      testType: 'logical-replication',
      timestamp: new Date().toISOString(),
    },
    'node-b'
  );

  if (writeB.success) {
    console.log(`   ✓ Write successful`);
    console.log(`   - ID: ${writeB.id}`);
    console.log(`   - Duration: ${writeB.duration}ms`);
  } else {
    console.log(`   ✗ Write failed: ${writeB.error}`);
  }

  // Wait for bidirectional replication
  console.log('\n3. Waiting for bidirectional replication (5 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n4. Reading from Node A...');
  const readA = await nodeAOps.read(10);
  console.log(`   - Records found: ${readA.count}`);
  console.log(`   - Query duration: ${readA.duration}ms`);
  const nodeAFromB = readA.records.filter(r => r.source_node === 'node-b').length;
  console.log(`   - Records originated from Node B: ${nodeAFromB}`);

  console.log('\n5. Reading from Node B...');
  const readB = await nodeBOps.read(10);
  console.log(`   - Records found: ${readB.count}`);
  console.log(`   - Query duration: ${readB.duration}ms`);
  const nodeBFromA = readB.records.filter(r => r.source_node === 'node-a').length;
  console.log(`   - Records originated from Node A: ${nodeBFromA}`);

  console.log('\n6. Testing Concurrent Writes...');
  console.log('   Writing 5 records to each node simultaneously...');

  const concurrentWrites = await Promise.all([
    nodeAOps.bulkWrite(5, 'node-a-concurrent'),
    nodeBOps.bulkWrite(5, 'node-b-concurrent'),
  ]);

  const nodeASuccess = concurrentWrites[0].filter(r => r.success).length;
  const nodeBSuccess = concurrentWrites[1].filter(r => r.success).length;

  console.log(`   - Node A: ${nodeASuccess}/5 successful`);
  console.log(`   - Node B: ${nodeBSuccess}/5 successful`);

  console.log('\n7. Waiting for cross-replication (10 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('\n8. Verifying final record counts...');
  const countA = await nodeAOps.getRecordCount();
  const countB = await nodeBOps.getRecordCount();
  console.log(`   - Node A count: ${countA}`);
  console.log(`   - Node B count: ${countB}`);

  if (countA === countB) {
    console.log('   ✓ Counts match - bidirectional replication is working correctly');
  } else {
    console.log(`   ⚠ Count mismatch - replication lag or conflict detected (diff: ${Math.abs(countA - countB)} records)`);
  }

  console.log('\n9. Checking data consistency...');
  const allDataA = await nodeAOps.readAll();
  const allDataB = await nodeBOps.readAll();

  const idsA = new Set(allDataA.records.map(r => r.id));
  const idsB = new Set(allDataB.records.map(r => r.id));

  const onlyInA = allDataA.records.filter(r => !idsB.has(r.id));
  const onlyInB = allDataB.records.filter(r => !idsA.has(r.id));

  console.log(`   - Records only in Node A: ${onlyInA.length}`);
  console.log(`   - Records only in Node B: ${onlyInB.length}`);

  if (onlyInA.length === 0 && onlyInB.length === 0) {
    console.log('   ✓ Data is fully consistent between nodes');
  } else {
    console.log('   ⚠ Data inconsistency detected');
    if (onlyInA.length > 0) {
      console.log('\n   Records only in Node A:');
      onlyInA.forEach(r => console.log(`     - ${r.id} from ${r.source_node}`));
    }
    if (onlyInB.length > 0) {
      console.log('\n   Records only in Node B:');
      onlyInB.forEach(r => console.log(`     - ${r.id} from ${r.source_node}`));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Logical replication test completed');
  console.log('='.repeat(80) + '\n');

  await LogicalTopology.nodeA.close();
  await LogicalTopology.nodeB.close();
}

testLogicalReplication().catch(console.error);
