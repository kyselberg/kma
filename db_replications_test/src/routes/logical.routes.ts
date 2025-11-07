import { Request, Response, Router } from 'express';
import { LogicalTopology } from '../db';
import { MetricsCollector } from '../metrics';
import { DatabaseOperations } from '../operations';

const router = Router();

const logicalNodeA = new DatabaseOperations(LogicalTopology.nodeA);
const logicalNodeB = new DatabaseOperations(LogicalTopology.nodeB);

router.post('/write/:node', async (req: Request, res: Response) => {
  try {
    const node = req.params.node;
    const { payload } = req.body;

    const ops = node === 'a' ? logicalNodeA : logicalNodeB;
    const sourceNode = node === 'a' ? 'node-a' : 'node-b';

    const result = await ops.write(payload, sourceNode);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/read/:node', async (req: Request, res: Response) => {
  try {
    const node = req.params.node;
    const limit = parseInt(req.query.limit as string) || 10;

    const ops = node === 'a' ? logicalNodeA : logicalNodeB;
    const result = await ops.read(limit);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const nodeACollector = new MetricsCollector(LogicalTopology.nodeA);
    const nodeBCollector = new MetricsCollector(LogicalTopology.nodeB);

    const [nodeAMetrics, nodeBMetrics] = await Promise.all([
      nodeACollector.collectLogicalMetrics(),
      nodeBCollector.collectLogicalMetrics(),
    ]);

    res.json({
      nodeA: nodeAMetrics,
      nodeB: nodeBMetrics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/count', async (req: Request, res: Response) => {
  try {
    const [nodeACount, nodeBCount] = await Promise.all([
      logicalNodeA.getRecordCount(),
      logicalNodeB.getRecordCount(),
    ]);

    res.json({
      nodeA: nodeACount,
      nodeB: nodeBCount,
      difference: Math.abs(nodeACount - nodeBCount),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
