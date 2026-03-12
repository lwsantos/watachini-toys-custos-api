import { Order } from './Order';
import { ValidationError } from './Customer';
import { OrderStatus, PaymentStatus, ShippingPaidBy } from './OrderEnums';

describe('Order Entity', () => {
  const validItem = {
    productId: 'product-1',
    productName: 'Produto Teste',
    quantity: 2,
    costPrice: 10.00,
    salePrice: 25.00
  };

  describe('constructor', () => {
    it('should create an order with valid data', () => {
      const order = new Order({
        id: 'order-1',
        customerId: 'customer-1',
        items: [validItem]
      });

      expect(order.id).toBe('order-1');
      expect(order.customerId).toBe('customer-1');
      expect(order.items).toHaveLength(1);
      expect(order.orderStatus).toBe(OrderStatus.PENDING);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(order.shippingPaidBy).toBe(ShippingPaidBy.CUSTOMER);
      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });

    it('should set orderDate to current date if not provided', () => {
      const beforeCreate = new Date();
      const order = new Order({
        customerId: 'customer-1',
        items: [validItem]
      });
      const afterCreate = new Date();

      expect(order.orderDate.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(order.orderDate.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should throw ValidationError when customerId is empty', () => {
      expect(() => new Order({
        customerId: '',
        items: [validItem]
      })).toThrow(ValidationError);
      expect(() => new Order({
        customerId: '',
        items: [validItem]
      })).toThrow('O cliente é obrigatório para criar um pedido');
    });

    it('should throw ValidationError when items array is empty', () => {
      expect(() => new Order({
        customerId: 'customer-1',
        items: []
      })).toThrow(ValidationError);
      expect(() => new Order({
        customerId: 'customer-1',
        items: []
      })).toThrow('O pedido deve ter pelo menos um item');
    });
  });

  describe('total calculations', () => {
    it('should calculate totalCost as sum of item costs', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [
          { productId: 'p1', productName: 'Produto 1', quantity: 2, costPrice: 10, salePrice: 20 },
          { productId: 'p2', productName: 'Produto 2', quantity: 3, costPrice: 15, salePrice: 30 }
        ]
      });

      // (2 × 10) + (3 × 15) = 20 + 45 = 65
      expect(order.totalCost).toBe(65);
    });

    it('should calculate totalSaleValue as sum of item sale values', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [
          { productId: 'p1', productName: 'Produto 1', quantity: 2, costPrice: 10, salePrice: 20 },
          { productId: 'p2', productName: 'Produto 2', quantity: 3, costPrice: 15, salePrice: 30 }
        ]
      });

      // (2 × 20) + (3 × 30) = 40 + 90 = 130
      expect(order.totalSaleValue).toBe(130);
    });

    it('should calculate profit as totalSaleValue - totalCost', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [
          { productId: 'p1', productName: 'Produto 1', quantity: 2, costPrice: 10, salePrice: 20 }
        ]
      });

      // totalSaleValue = 40, totalCost = 20, profit = 20
      expect(order.profit).toBe(20);
    });
  });

  describe('shipping cost conditional inclusion', () => {
    it('should NOT include shipping in totalCost when paid by customer', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [{ productId: 'p1', productName: 'Produto 1', quantity: 1, costPrice: 100, salePrice: 150 }],
        shippingCost: 20,
        shippingPaidBy: ShippingPaidBy.CUSTOMER
      });

      expect(order.totalCost).toBe(100); // Only item cost, no shipping
      expect(order.profit).toBe(50); // 150 - 100
    });

    it('should include shipping in totalCost when paid by company', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [{ productId: 'p1', productName: 'Produto 1', quantity: 1, costPrice: 100, salePrice: 150 }],
        shippingCost: 20,
        shippingPaidBy: ShippingPaidBy.COMPANY
      });

      expect(order.totalCost).toBe(120); // Item cost + shipping
      expect(order.profit).toBe(30); // 150 - 120
    });
  });

  describe('item management', () => {
    it('should add item and recalculate totals', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [{ productId: 'p1', productName: 'Produto 1', quantity: 1, costPrice: 10, salePrice: 20 }]
      });

      order.addItem({ productId: 'p2', productName: 'Produto 2', quantity: 2, costPrice: 15, salePrice: 30 });

      expect(order.items).toHaveLength(2);
      expect(order.totalCost).toBe(40); // 10 + 30
      expect(order.totalSaleValue).toBe(80); // 20 + 60
    });

    it('should remove item and recalculate totals', () => {
      const order = new Order({
        id: 'order-1',
        customerId: 'customer-1',
        items: [
          { id: 'item-1', productId: 'p1', productName: 'Produto 1', quantity: 1, costPrice: 10, salePrice: 20 },
          { id: 'item-2', productId: 'p2', productName: 'Produto 2', quantity: 2, costPrice: 15, salePrice: 30 }
        ]
      });

      order.removeItem('item-1');

      expect(order.items).toHaveLength(1);
      expect(order.totalCost).toBe(30); // Only item-2
      expect(order.totalSaleValue).toBe(60);
    });

    it('should throw ValidationError when removing last item', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [{ id: 'item-1', productId: 'p1', productName: 'Produto 1', quantity: 1, costPrice: 10, salePrice: 20 }]
      });

      expect(() => order.removeItem('item-1')).toThrow(ValidationError);
    });

    it('should throw ValidationError message when removing last item', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [{ id: 'item-2', productId: 'p1', productName: 'Produto 1', quantity: 1, costPrice: 10, salePrice: 20 }]
      });

      expect(() => order.removeItem('item-2')).toThrow('O pedido deve ter pelo menos um item');
    });
  });

  describe('update', () => {
    it('should update shipping cost and recalculate totals', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [{ productId: 'p1', productName: 'Produto 1', quantity: 1, costPrice: 100, salePrice: 150 }],
        shippingCost: 10,
        shippingPaidBy: ShippingPaidBy.COMPANY
      });

      order.update({ shippingCost: 30 });

      expect(order.shippingCost).toBe(30);
      expect(order.totalCost).toBe(130); // 100 + 30
      expect(order.profit).toBe(20); // 150 - 130
    });

    it('should update shippingPaidBy and recalculate totals', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [{ productId: 'p1', productName: 'Produto 1', quantity: 1, costPrice: 100, salePrice: 150 }],
        shippingCost: 20,
        shippingPaidBy: ShippingPaidBy.CUSTOMER
      });

      expect(order.totalCost).toBe(100); // No shipping

      order.update({ shippingPaidBy: ShippingPaidBy.COMPANY });

      expect(order.totalCost).toBe(120); // Now includes shipping
      expect(order.profit).toBe(30); // 150 - 120
    });

    it('should update order status', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [validItem]
      });

      order.update({ orderStatus: OrderStatus.IN_PRODUCTION });

      expect(order.orderStatus).toBe(OrderStatus.IN_PRODUCTION);
    });

    it('should update payment status', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [validItem]
      });

      order.update({ paymentStatus: PaymentStatus.PAID });

      expect(order.paymentStatus).toBe(PaymentStatus.PAID);
    });
  });

  describe('setItems', () => {
    it('should replace all items and recalculate totals', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [{ productId: 'p1', productName: 'Produto 1', quantity: 1, costPrice: 10, salePrice: 20 }]
      });

      order.setItems([
        { productId: 'p2', productName: 'Produto 2', quantity: 3, costPrice: 20, salePrice: 40 }
      ]);

      expect(order.items).toHaveLength(1);
      expect(order.items[0].productId).toBe('p2');
      expect(order.totalCost).toBe(60); // 3 × 20
      expect(order.totalSaleValue).toBe(120); // 3 × 40
    });

    it('should throw ValidationError when setting empty items array', () => {
      const order = new Order({
        customerId: 'customer-1',
        items: [validItem]
      });

      expect(() => order.setItems([])).toThrow(ValidationError);
      expect(() => order.setItems([])).toThrow('O pedido deve ter pelo menos um item');
    });
  });
});
