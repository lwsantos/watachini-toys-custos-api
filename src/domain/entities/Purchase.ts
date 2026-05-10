/**
 * Compra de filamento — dados compartilhados por todos os itens (bobinas) da mesma compra.
 */
export class Purchase {
  id: string;
  price: number;
  quantity: number;
  discount: number;
  freight: number;
  totalCost: number;
  purchaseDate: Date;
  purchaseLocation?: string;
  createdAt: Date;

  constructor(props: Partial<Purchase>) {
    Object.assign(this, props);
  }
}
