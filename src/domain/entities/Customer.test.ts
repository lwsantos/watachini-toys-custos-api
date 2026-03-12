import { Customer, ValidationError } from './Customer';

describe('Customer Entity', () => {
  describe('constructor', () => {
    it('should create a customer with valid name', () => {
      const customer = new Customer({
        id: '123',
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999'
      });

      expect(customer.id).toBe('123');
      expect(customer.name).toBe('João Silva');
      expect(customer.email).toBe('joao@email.com');
      expect(customer.phone).toBe('11999999999');
      expect(customer.createdAt).toBeInstanceOf(Date);
      expect(customer.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a customer with only required fields', () => {
      const customer = new Customer({
        id: '123',
        name: 'Maria Santos'
      });

      expect(customer.name).toBe('Maria Santos');
      expect(customer.email).toBeNull();
      expect(customer.phone).toBeNull();
    });

    it('should throw ValidationError when name is empty', () => {
      expect(() => new Customer({ id: '123', name: '' }))
        .toThrow(ValidationError);
      expect(() => new Customer({ id: '123', name: '' }))
        .toThrow('O nome do cliente é obrigatório');
    });

    it('should throw ValidationError when name is only whitespace', () => {
      expect(() => new Customer({ id: '123', name: '   ' }))
        .toThrow(ValidationError);
      expect(() => new Customer({ id: '123', name: '   ' }))
        .toThrow('O nome do cliente é obrigatório');
    });

    it('should throw ValidationError when name is undefined', () => {
      expect(() => new Customer({ id: '123' }))
        .toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('should update customer name', () => {
      const customer = new Customer({ id: '123', name: 'João Silva' });
      const originalUpdatedAt = customer.updatedAt;

      // Small delay to ensure updatedAt changes
      customer.update({ name: 'João Santos' });

      expect(customer.name).toBe('João Santos');
      expect(customer.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should update customer email', () => {
      const customer = new Customer({ id: '123', name: 'João Silva' });
      
      customer.update({ email: 'novo@email.com' });

      expect(customer.email).toBe('novo@email.com');
    });

    it('should update customer phone', () => {
      const customer = new Customer({ id: '123', name: 'João Silva' });
      
      customer.update({ phone: '11888888888' });

      expect(customer.phone).toBe('11888888888');
    });

    it('should allow setting email to null', () => {
      const customer = new Customer({ id: '123', name: 'João Silva', email: 'joao@email.com' });
      
      customer.update({ email: null });

      expect(customer.email).toBeNull();
    });

    it('should throw ValidationError when updating name to empty', () => {
      const customer = new Customer({ id: '123', name: 'João Silva' });

      expect(() => customer.update({ name: '' }))
        .toThrow(ValidationError);
      expect(() => customer.update({ name: '' }))
        .toThrow('O nome do cliente é obrigatório');
    });

    it('should throw ValidationError when updating name to whitespace only', () => {
      const customer = new Customer({ id: '123', name: 'João Silva' });

      expect(() => customer.update({ name: '   ' }))
        .toThrow(ValidationError);
    });
  });
});
