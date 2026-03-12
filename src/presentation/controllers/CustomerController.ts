import { Router, Request, Response, NextFunction } from 'express';
import {
  CreateCustomerUseCase,
  UpdateCustomerUseCase,
  ListCustomersUseCase,
  SearchCustomersUseCase,
  ValidationError,
  NotFoundError,
} from '../../application/use-cases/customer';
import { CustomerRepository } from '../../infrastructure/database/typeorm/repositories';

const router = Router();

// Instantiate repository
const customerRepository = new CustomerRepository();

// Instantiate use cases
const createCustomerUseCase = new CreateCustomerUseCase(customerRepository);
const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepository);
const listCustomersUseCase = new ListCustomersUseCase(customerRepository);
const searchCustomersUseCase = new SearchCustomersUseCase(customerRepository);

// POST /api/customers - Criar cliente
// @see Requirements 1.1, 1.2, 1.3
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createCustomerUseCase.execute(req.body);
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

// GET /api/customers - Listar clientes
// @see Requirements 1.5
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await listCustomersUseCase.execute();
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/search - Buscar clientes por nome
// @see Requirements 1.6
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.query;
    
    if (!name || typeof name !== 'string') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'O parâmetro "name" é obrigatório para a busca',
      });
      return;
    }
    
    const customers = await searchCustomersUseCase.execute(name);
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id - Obter cliente por ID
// @see Requirements 1.1
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const customer = await customerRepository.findById(id);
    
    if (!customer) {
      res.status(404).json({
        error: 'Not Found',
        message: `Cliente com ID ${id} não encontrado`,
      });
      return;
    }
    
    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id - Atualizar cliente
// @see Requirements 1.4
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await updateCustomerUseCase.execute(id, req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
      return;
    }
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

// DELETE /api/customers/:id - Excluir cliente
// @see Requirements 1.1
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Verificar se o cliente existe antes de excluir
    const customer = await customerRepository.findById(id);
    if (!customer) {
      res.status(404).json({
        error: 'Not Found',
        message: `Cliente com ID ${id} não encontrado`,
      });
      return;
    }
    
    await customerRepository.delete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
