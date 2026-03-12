import { Router, Request, Response, NextFunction } from 'express';
import { RegisterFilamentPurchaseUseCase, ValidationError } from '../../application/use-cases/filament/RegisterFilamentPurchaseUseCase';
import { ListFilamentsUseCase } from '../../application/use-cases/filament/ListFilamentsUseCase';
import { MarkFilamentAsEmptyUseCase, FilamentNotFoundError } from '../../application/use-cases/filament/MarkFilamentAsEmptyUseCase';
import { UpdateFilamentUseCase, FilamentNotFoundError as UpdateFilamentNotFoundError, ValidationError as UpdateValidationError } from '../../application/use-cases/filament/UpdateFilamentUseCase';
import { FilamentRepository, FilamentPurchaseRepository } from '../../infrastructure/database/typeorm/repositories';
import { FilamentStatus } from '../../domain/entities';

const router = Router();

// Instantiate repositories
const filamentRepository = new FilamentRepository();
const filamentPurchaseRepository = new FilamentPurchaseRepository();

// Instantiate use cases
const registerFilamentPurchaseUseCase = new RegisterFilamentPurchaseUseCase(
  filamentRepository,
  filamentPurchaseRepository
);
const listFilamentsUseCase = new ListFilamentsUseCase(filamentRepository);
const markFilamentAsEmptyUseCase = new MarkFilamentAsEmptyUseCase(filamentRepository);
const updateFilamentUseCase = new UpdateFilamentUseCase(filamentRepository, filamentPurchaseRepository);

// POST /api/filaments/purchases - Registrar compra de filamento
router.post('/purchases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await registerFilamentPurchaseUseCase.execute(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// GET /api/filaments - Listar filamentos com filtros
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: { color?: string; filamentType?: string; status?: FilamentStatus; manufacturer?: string } = {};

    if (req.query.color) {
      filters.color = req.query.color as string;
    }

    if (req.query.filamentType) {
      filters.filamentType = req.query.filamentType as string;
    }

    if (req.query.status) {
      const statusValue = req.query.status as string;
      if (statusValue === 'available' || statusValue === 'empty') {
        filters.status = statusValue === 'available' ? FilamentStatus.AVAILABLE : FilamentStatus.EMPTY;
      }
    }

    if (req.query.manufacturer) {
      filters.manufacturer = req.query.manufacturer as string;
    }

    const result = await listFilamentsUseCase.execute(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/filaments/available - Listar filamentos disponíveis
router.get('/available', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listFilamentsUseCase.execute({ status: FilamentStatus.AVAILABLE });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/filaments/available/characteristics - Listar características únicas de filamentos disponíveis
router.get('/available/characteristics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const characteristics = await filamentRepository.getUniqueAvailableCharacteristics();
    
    // Add label for display
    const withLabels = characteristics.map(char => ({
      ...char,
      label: `${char.filamentType} - ${char.manufacturer} - ${char.color}`,
    }));
    
    res.json(withLabels);
  } catch (error) {
    next(error);
  }
});

// GET /api/filaments/available/unique - Listar filamentos disponíveis únicos (mais antigo de cada cor/tipo/modelo)
router.get('/available/unique', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listFilamentsUseCase.execute({ status: FilamentStatus.AVAILABLE });
    
    // Agrupar por cor + tipo + modelo e pegar o mais antigo de cada grupo
    const uniqueMap = new Map<string, typeof result.filaments[0]>();
    
    for (const filament of result.filaments) {
      const key = `${filament.color}|${filament.filamentType}|${filament.manufacturer}`;
      const existing = uniqueMap.get(key);
      
      if (!existing || new Date(filament.purchaseDate) < new Date(existing.purchaseDate)) {
        uniqueMap.set(key, filament);
      }
    }
    
    const uniqueFilaments = Array.from(uniqueMap.values()).sort((a, b) => 
      a.color.localeCompare(b.color) || a.filamentType.localeCompare(b.filamentType)
    );
    
    res.json({
      filaments: uniqueFilaments,
      total: uniqueFilaments.length,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/filaments/:id/status - Atualizar status do filamento
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (status === FilamentStatus.AVAILABLE) {
      // Reverter para disponível
      await filamentRepository.updateStatus(id, FilamentStatus.AVAILABLE);
      res.status(204).send();
    } else {
      // Marcar como vazio/acabou
      await markFilamentAsEmptyUseCase.execute({ filamentId: id });
      res.status(204).send();
    }
  } catch (error) {
    if (error instanceof FilamentNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// PUT /api/filaments/:id - Atualizar filamento
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await updateFilamentUseCase.execute({ id, ...req.body });
    res.json(result);
  } catch (error) {
    if (error instanceof UpdateFilamentNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    if (error instanceof UpdateValidationError) {
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
