/**
 * Status do pedido - representa o estado atual do pedido no fluxo de vendas
 * @see Requirements 6.1
 */
export enum OrderStatus {
  PENDING = 'Pendente',
  IN_PRODUCTION = 'Em_Producao',
  AWAITING_SHIPMENT = 'Aguardando_Envio',
  SHIPPED = 'Pedido_Enviado',
  DELIVERED = 'Pedido_Entregue'
}

/**
 * Status do pagamento - indica se o pagamento foi realizado
 * @see Requirements 7.1
 */
export enum PaymentStatus {
  PENDING = 'Pendente',
  PAID = 'Pago'
}

/**
 * Método de pagamento - forma utilizada para pagamento do pedido
 * @see Requirements 7.2
 */
export enum PaymentMethod {
  PIX = 'Pix',
  CREDIT_CARD = 'Cartao_Credito',
  DEBIT_CARD = 'Cartao_Debito',
  TRANSFER = 'Transferencia'
}

/**
 * Responsável pelo frete - indica quem paga o frete do pedido
 * @see Requirements 4.2
 */
export enum ShippingPaidBy {
  CUSTOMER = 'Cliente',
  COMPANY = 'Watahini_Toys'
}
