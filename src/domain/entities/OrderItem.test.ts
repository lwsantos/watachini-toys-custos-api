import { OrderItem } from './OrderItem';
import { ValidationError } from './Customer';

describe('OrderItem Entity', () => {
  describe('constructor', () => {
    it('should create an order item with valid data', () => {
      const item = new OrderItem({
        id: 'item-1',
        orderId: 'order-1',
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 2,
        costPrice: 10.00,
        salePrice: 25.00
      });

      expect(item.id).toBe('item-1');
      expect(item.orderId).toBe('order-1');
      expect(item.productId).toBe('product-1');
      expect(item.productName).toBe('Produto Teste');
      expect(item.quantity).toBe(2);
      expect(item.costPrice).toBe(10.00);
      expect(item.salePrice).toBe(25.00);
      expect(item.createdAt).toBeInstanceOf(Date);
    });

    it('should calculate totalCost correctly (costPrice × quantity)', () => {
      const item = new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 3,
        costPrice: 15.00,
        salePrice: 30.00
      });

      expect(item.totalCost).toBe(45.00); // 15 × 3
    });

    it('should calculate totalSaleValue correctly (salePrice × quantity)', () => {
      const item = new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 3,
        costPrice: 15.00,
        salePrice: 30.00
      });

      expect(item.totalSaleValue).toBe(90.00); // 30 × 3
    });

    it('should throw ValidationError when productId is empty', () => {
      expect(() => new OrderItem({
        productId: '',
        productName: 'Produto Teste',
        quantity: 1,
        costPrice: 10.00,
        salePrice: 20.00
      })).toThrow(ValidationError);
      expect(() => new OrderItem({
        productId: '',
        productName: 'Produto Teste',
        quantity: 1,
        costPrice: 10.00,
        salePrice: 20.00
      })).toThrow('O ID do produto é obrigatório');
    });

    it('should throw ValidationError when productName is empty', () => {
      expect(() => new OrderItem({
        productId: 'product-1',
        productName: '',
        quantity: 1,
        costPrice: 10.00,
        salePrice: 20.00
      })).toThrow(ValidationError);
      expect(() => new OrderItem({
        productId: 'product-1',
        productName: '',
        quantity: 1,
        costPrice: 10.00,
        salePrice: 20.00
      })).toThrow('O nome do produto é obrigatório');
    });

    it('should throw ValidationError when quantity is zero', () => {
      expect(() => new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 0,
        costPrice: 10.00,
        salePrice: 20.00
      })).toThrow(ValidationError);
      expect(() => new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 0,
        costPrice: 10.00,
        salePrice: 20.00
      })).toThrow('A quantidade deve ser maior que zero');
    });

    it('should throw ValidationError when quantity is negative', () => {
      expect(() => new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: -1,
        costPrice: 10.00,
        salePrice: 20.00
      })).toThrow(ValidationError);
    });

    it('should throw ValidationError when costPrice is negative', () => {
      expect(() => new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 1,
        costPrice: -10.00,
        salePrice: 20.00
      })).toThrow(ValidationError);
      expect(() => new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 1,
        costPrice: -10.00,
        salePrice: 20.00
      })).toThrow('Os valores de custo e venda devem ser maiores ou iguais a zero');
    });

    it('should throw ValidationError when salePrice is negative', () => {
      expect(() => new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 1,
        costPrice: 10.00,
        salePrice: -20.00
      })).toThrow(ValidationError);
    });

    it('should allow zero costPrice', () => {
      const item = new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 1,
        costPrice: 0,
        salePrice: 20.00
      });

      expect(item.costPrice).toBe(0);
      expect(item.totalCost).toBe(0);
    });

    it('should allow zero salePrice', () => {
      const item = new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 1,
        costPrice: 10.00,
        salePrice: 0
      });

      expect(item.salePrice).toBe(0);
      expect(item.totalSaleValue).toBe(0);
    });
  });

  describe('update', () => {
    it('should update quantity and recalculate totals', () => {
      const item = new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 2,
        costPrice: 10.00,
        salePrice: 25.00
      });

      item.update({ quantity: 5 });

      expect(item.quantity).toBe(5);
      expect(item.totalCost).toBe(50.00); // 10 × 5
      expect(item.totalSaleValue).toBe(125.00); // 25 × 5
    });

    it('should update costPrice and recalculate totals', () => {
      const item = new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 2,
        costPrice: 10.00,
        salePrice: 25.00
      });

      item.update({ costPrice: 15.00 });

      expect(item.costPrice).toBe(15.00);
      expect(item.totalCost).toBe(30.00); // 15 × 2
    });

    it('should update salePrice and recalculate totals', () => {
      const item = new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 2,
        costPrice: 10.00,
        salePrice: 25.00
      });

      item.update({ salePrice: 30.00 });

      expect(item.salePrice).toBe(30.00);
      expect(item.totalSaleValue).toBe(60.00); // 30 × 2
    });

    it('should throw ValidationError when updating quantity to zero', () => {
      const item = new OrderItem({
        productId: 'product-1',
        productName: 'Produto Teste',
        quantity: 2,
        costPrice: 10.00,
        salePrice: 25.00
      });

      expect(() => item.update({ quantity: 0 })).toThrow(ValidationError);
    });
  });
});
