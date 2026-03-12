import { ProductPart } from './ProductPart';

export class Product {
  id: string;
  name: string;
  description: string;
  laborTimeMinutes: number;
  parts: ProductPart[];
  totalCost: number;
  profitMargin: number;
  finalPrice: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<Product>) {
    Object.assign(this, props);
    this.parts = props.parts || [];
    this.laborTimeMinutes = props.laborTimeMinutes || 0;
  }
}
