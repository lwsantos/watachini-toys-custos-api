import { IProductRepository } from '../../../domain/repositories/IProductRepository';

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class DeleteProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(productId: string): Promise<void> {
    // Validate product exists
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new BusinessError(`Produto não encontrado: ${productId}`);
    }

    // Delete product (cascade will delete parts)
    await this.productRepository.delete(productId);
  }
}
