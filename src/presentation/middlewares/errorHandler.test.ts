import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';

// Mock Express objects
const mockRequest = {} as Request;
const mockNext = jest.fn() as NextFunction;

function createMockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Custom error classes for testing
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class FilamentNotFoundError extends Error {
  constructor(id: string) {
    super(`Filamento não encontrado: ${id}`);
    this.name = 'FilamentNotFoundError';
  }
}

describe('errorHandler middleware', () => {
  let mockRes: Response;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockRes = createMockResponse();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('ValidationError handling', () => {
    it('should return 400 with VAL001 for generic validation errors', () => {
      const error = new ValidationError('Campos obrigatórios não preenchidos');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Campos obrigatórios não preenchidos',
        code: 'VAL001',
      });
    });

    it('should return 400 with VAL002 for product part validation errors', () => {
      const error = new ValidationError('Produto deve ter pelo menos uma parte');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Produto deve ter pelo menos uma parte',
        code: 'VAL002',
      });
    });

    it('should return 400 with VAL003 for configuration validation errors', () => {
      const error = new ValidationError('Valores de configuração devem ser positivos');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Valores de configuração devem ser positivos',
        code: 'VAL003',
      });
    });

    it('should return 400 with VAL004 for weight validation errors', () => {
      const error = new ValidationError('Peso deve ser maior que zero');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Peso deve ser maior que zero',
        code: 'VAL004',
      });
    });

    it('should return 400 with VAL005 for print time validation errors', () => {
      const error = new ValidationError('Tempo de impressão deve ser maior que zero');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Tempo de impressão deve ser maior que zero',
        code: 'VAL005',
      });
    });

    it('should return 400 with VAL006 for profit margin validation errors', () => {
      const error = new ValidationError('Margem de lucro deve ser não-negativa');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Margem de lucro deve ser não-negativa',
        code: 'VAL006',
      });
    });
  });

  describe('BusinessError handling', () => {
    it('should return 400 with BUS001 for filament not available errors', () => {
      const error = new BusinessError('Filamento não disponível');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Business Error',
        message: 'Filamento não disponível',
        code: 'BUS001',
      });
    });
  });

  describe('NotFoundError handling', () => {
    it('should return 404 with BUS003 for product not found errors', () => {
      const error = new NotFoundError('Produto não encontrado');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Produto não encontrado',
        code: 'BUS003',
      });
    });

    it('should return 404 with BUS004 for configuration not found errors', () => {
      const error = new NotFoundError('Configuração não encontrada');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Configuração não encontrada',
        code: 'BUS004',
      });
    });
  });

  describe('FilamentNotFoundError handling', () => {
    it('should return 404 with BUS002 for filament not found errors', () => {
      const error = new FilamentNotFoundError('123');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Filamento não encontrado: 123',
        code: 'BUS002',
      });
    });
  });

  describe('Generic error handling', () => {
    it('should return 500 for unknown errors in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Something went wrong',
      });
    });

    it('should hide error details in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive internal error details');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });

    it('should show validation error messages even in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new ValidationError('Campos obrigatórios não preenchidos');

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Campos obrigatórios não preenchidos',
        code: 'VAL001',
      });
    });
  });

  describe('Infrastructure error handling', () => {
    it('should return 500 with INF001 for database connection errors', () => {
      const error = new Error('Database connection failed');
      error.name = 'ConnectionError';

      errorHandler(error, mockRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal Server Error',
          code: 'INF001',
        })
      );
    });
  });
});
