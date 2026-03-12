import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';

/**
 * Use case para exclusão de pedidos
 * @see Requirements 8.5
 */
export class DeleteOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  /**
   * Executa a exclusão de um pedido pelo ID
   * @param id ID do pedido a ser excluído
   * @returns void
   */
  async execute(id: string): Promise<void> {
    await this.orderRepository.delete(id);
  }
}
