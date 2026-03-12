export class FilamentPurchase {
  id: string;
  price: number;
  quantity: number;
  discount: number;
  freight: number;
  manufacturer: string;
  purchaseLocation: string;
  color: string;
  filamentType: string;
  totalCost: number;
  purchaseDate: Date;
  createdAt: Date;

  constructor(props: Partial<FilamentPurchase>) {
    Object.assign(this, props);
  }
}
