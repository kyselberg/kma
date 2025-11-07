import express, { Request, Response } from 'express';
import { LogicalTopology, PhysicalTopology } from './db';
import logicalRoutes from './routes/logical.routes';
import physicalRoutes from './routes/physical.routes';

const app = express();
app.use(express.json());

app.use('/physical', physicalRoutes);
app.use('/logical', logicalRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`PostgreSQL Replication Test API Server`);
  console.log(`${'='.repeat(80)}`);
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('\n  Physical Replication:');
  console.log('    POST   /physical/write');
  console.log('    GET    /physical/read/primary?limit=N');
  console.log('    GET    /physical/read/standby?limit=N');
  console.log('    GET    /physical/metrics');
  console.log('    GET    /physical/count');
  console.log('\n  Logical Replication:');
  console.log('    POST   /logical/write/:node (a or b)');
  console.log('    GET    /logical/read/:node?limit=N (a or b)');
  console.log('    GET    /logical/metrics');
  console.log('    GET    /logical/count');
  console.log('\n  General:');
  console.log('    GET    /health');
  console.log(`\n${'='.repeat(80)}\n`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await Promise.all([
    PhysicalTopology.primary.close(),
    PhysicalTopology.standby.close(),
    LogicalTopology.nodeA.close(),
    LogicalTopology.nodeB.close(),
  ]);
  process.exit(0);
});
