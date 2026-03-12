import { Router, Request, Response, NextFunction } from 'express';
import { GetCostConfigurationUseCase } from '../../application/use-cases/configuration/GetCostConfigurationUseCase';
import { UpdateCostConfigurationUseCase } from '../../application/use-cases/configuration/UpdateCostConfigurationUseCase';
import { CostConfigurationRepository } from '../../infrastructure/database/typeorm/repositories';

const router = Router();

// Instantiate repository
const costConfigurationRepository = new CostConfigurationRepository();

// Instantiate use cases
const getCostConfigurationUseCase = new GetCostConfigurationUseCase(costConfigurationRepository);
const updateCostConfigurationUseCase = new UpdateCostConfigurationUseCase(costConfigurationRepository);

// GET /api/configuration - Obter configuração de custos
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getCostConfigurationUseCase.execute();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/configuration - Atualizar configuração de custos
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateCostConfigurationUseCase.execute(req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('VAL003:')) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

export default router;
