export class PurchaseNotFoundError extends Error {
  constructor(public readonly purchaseId: string) {
    super(`Compra com ID ${purchaseId} não encontrada`);
    this.name = 'PurchaseNotFoundError';
  }
}
