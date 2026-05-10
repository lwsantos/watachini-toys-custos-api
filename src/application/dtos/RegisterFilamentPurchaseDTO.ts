/** Uma linha do pedido: mesmo tipo/cor com N bobinas ao mesmo valor unitário */
export interface RegisterFilamentPurchaseLineDTO {
  color: string;
  filamentType: string;
  manufacturer?: string;
  quantity: number;
  /** Preço unitário de cada bobina (antes de frete/desconto da compra) */
  unitPrice: number;
}

export interface RegisterFilamentPurchaseDTO {
  lines: RegisterFilamentPurchaseLineDTO[];
  /** Desconto total do pedido (rateado entre todas as bobinas) */
  discount?: number;
  /** Frete total do pedido (rateado entre todas as bobinas) */
  freight?: number;
  purchaseLocation?: string;
  purchaseDate?: Date;
}

export interface RegisterFilamentPurchaseResultDTO {
  purchaseId: string;
  filamentIds: string[];
  /** Primeiro filamento criado (retrocompatível com clientes antigos) */
  filamentId: string;
  /** Custo por bobina do primeiro item (retrocompatível) */
  totalCost: number;
  costPerGram: number;
}
