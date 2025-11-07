import { Request, Response, Router } from 'express';
import { PhysicalTopology } from '../db';
import { MetricsCollector } from '../metrics';
import { DatabaseOperations } from '../operations';

const router = Router();

const physicalPrimary = new DatabaseOperations(PhysicalTopology.primary);
const physicalStandby = new DatabaseOperations(PhysicalTopology.standby);

router.post('/write', async (req: Request, res: Response) => {
  try {
    const { payload, sourceNode = 'primary' } = req.body;
    const result = await physicalPrimary.write(payload, sourceNode);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/read/primary', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await physicalPrimary.read(limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/read/standby', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await physicalStandby.read(limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const primaryCollector = new MetricsCollector(PhysicalTopology.primary);
    const standbyCollector = new MetricsCollector(PhysicalTopology.standby);

    const [primaryMetrics, standbyMetrics] = await Promise.all([
      primaryCollector.collectPhysicalMetrics('primary'),
      standbyCollector.collectPhysicalMetrics('standby'),
    ]);

    res.json({
      primary: primaryMetrics,
      standby: standbyMetrics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/count', async (req: Request, res: Response) => {
  try {
    const [primaryCount, standbyCount] = await Promise.all([
      physicalPrimary.getRecordCount(),
      physicalStandby.getRecordCount(),
    ]);

    res.json({
      primary: primaryCount,
      standby: standbyCount,
      difference: primaryCount - standbyCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
