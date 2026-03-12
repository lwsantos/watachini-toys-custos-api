import { CreateCustomerUseCase, ValidationError } from './CreateCustomerUseCase';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { Customer } from '../../../domain/entities';

describe('CreateCustomerUseCase', () => {
  let useCase: CreateCustomerUseCase;
  let mockRepository: jest.Mocked<ICustomerRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new CreateCustomerUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should create a customer with valid name', async () => {
      const dto = { name: 'João Silva', email: 'joao@email.com', phone: '11999999999' };
      
      mockRepository.create.mockImplementation(async (customer: Customer) => customer);

      const result = await useCase.execute(dto);

      expect(result.name).toBe('João Silva');
      expect(result.email).toBe('joao@email.com');
      expect(result.phone).toBe('11999999999');
      expect(result.id).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should create a customer with only required fields', async () => {
      const dto = { name: 'Maria Santos' };
      
      mockRepository.create.mockImplementation(async (customer: Customer) => customer);

      const result = await useCase.execute(dto);

      expect(result.name).toBe('Maria Santos');
      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
    });

    it('should throw ValidationError when name is empty', async () => {
      const dto = { name: '' };

      await expect(useCase.execute(dto)).rejects.toThrow('O nome do cliente é obrigatório');
    });

    it('should throw ValidationError when name is only whitespace', async () => {
      const dto = { name: '   ' };

      await expect(useCase.execute(dto)).rejects.toThrow('O nome do cliente é obrigatório');
    });

    it('should generate unique IDs for each customer', async () => {
      const dto1 = { name: 'Cliente 1' };
      const dto2 = { name: 'Cliente 2' };
      
      mockRepository.create.mockImplementation(async (customer: Customer) => customer);

      const result1 = await useCase.execute(dto1);
      const result2 = await useCase.execute(dto2);

      expect(result1.id).not.toBe(result2.id);
    });
  });
});
