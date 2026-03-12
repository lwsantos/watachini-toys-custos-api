import { Router, Request, Response, NextFunction } from 'express';
import { CreateProductUseCase, ValidationError, BusinessError } from '../../application/use-cases/product/CreateProductUseCase';
import { GetProductWithCostsUseCase, NotFoundError } from '../../application/use-cases/product/GetProductWithCostsUseCase';
import { UpdateProductUseCase, ValidationError as UpdateValidationError, BusinessError as UpdateBusinessError } from '../../application/use-cases/product/UpdateProductUseCase';
import { DeleteProductUseCase, BusinessError as DeleteBusinessError } from '../../application/use-cases/product/DeleteProductUseCase';
import { CalculateFinalPriceUseCase, ValidationError as CalcValidationError, NotFoundError as CalcNotFoundError } from '../../application/use-cases/product/CalculateFinalPriceUseCase';
import { RecalculateProductUseCase, BusinessError as RecalcBusinessError } from '../../application/use-cases/product/RecalculateProductUseCase';
import { ProductRepository, FilamentRepository, CostConfigurationRepository } from '../../infrastructure/database/typeorm/repositories';

const router = Router();

// Instantiate repositories
const productRepository = new ProductRepository();
const filamentRepository = new FilamentRepository();
const costConfigurationRepository = new CostConfigurationRepository();

// Instantiate use cases
const createProductUseCase = new CreateProductUseCase(
  productRepository,
  filamentRepository,
  costConfigurationRepository
);
const getProductWithCostsUseCase = new GetProductWithCostsUseCase(productRepository);
const updateProductUseCase = new UpdateProductUseCase(
  productRepository,
  filamentRepository,
  costConfigurationRepository
);
const deleteProductUseCase = new DeleteProductUseCase(productRepository);
const calculateFinalPriceUseCase = new CalculateFinalPriceUseCase(productRepository);
const recalculateProductUseCase = new RecalculateProductUseCase(
  productRepository,
  filamentRepository,
  costConfigurationRepository
);

// POST /api/products - Criar produto
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createProductUseCase.execute(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
      return;
    }
    if (error instanceof BusinessError) {
      res.status(400).json({
        error: 'Business Error',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// GET /api/products - Listar produtos
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productRepository.findAll();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// POST /api/products/recalculate-all - Recalcular custos de todos os produtos
router.post('/recalculate-all', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productRepository.findAll();
    
    const results: {
      success: Array<{
        productId: string;
        name: string;
        previousTotalCost: number;
        newTotalCost: number;
        previousFinalPrice: number;
        newFinalPrice: number;
      }>;
      errors: Array<{
        productId: string;
        name: string;
        error: string;
      }>;
    } = {
      success: [],
      errors: [],
    };

    for (const product of products) {
      try {
        const result = await recalculateProductUseCase.execute(product.id);
        results.success.push({
          productId: result.productId,
          name: result.name,
          previousTotalCost: result.previousTotalCost,
          newTotalCost: result.newTotalCost,
          previousFinalPrice: result.previousFinalPrice,
          newFinalPrice: result.newFinalPrice,
        });
      } catch (error) {
        results.errors.push({
          productId: product.id,
          name: product.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    res.json({
      totalProducts: products.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      results,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - Obter produto com custos
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await getProductWithCostsUseCase.execute(id);
    res.json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// PUT /api/products/:id - Atualizar produto
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await updateProductUseCase.execute(id, req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof UpdateValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
      return;
    }
    if (error instanceof UpdateBusinessError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// DELETE /api/products/:id - Excluir produto
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await deleteProductUseCase.execute(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof DeleteBusinessError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// POST /api/products/:id/calculate - Calcular preço com margem
router.post('/:id/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { profitMarginPercent, persistChanges } = req.body;
    
    const result = await calculateFinalPriceUseCase.execute({
      productId: id,
      profitMarginPercent,
      persistChanges,
    });
    res.json(result);
  } catch (error) {
    if (error instanceof CalcValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
      return;
    }
    if (error instanceof CalcNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// POST /api/products/:id/recalculate - Recalcular custos do produto
router.post('/:id/recalculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await recalculateProductUseCase.execute(id);
    res.json(result);
  } catch (error) {
    if (error instanceof RecalcBusinessError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

export default router;
