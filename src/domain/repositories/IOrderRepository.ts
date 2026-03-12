import { Order } from '../entities';
import { OrderStatus, PaymentStatus } from '../entities/OrderEnums';

/**
 * Interface do repositório de pedidos
 * Define os métodos para persistência e consulta de pedidos
 * @see Requirements 2.1, 6.4, 7.10, 8.1, 8.3, 8.4, 8.5
 */
export interface IOrderRepository {
  /**
   * Cria um novo pedido
   * @param order Dados do pedido a ser criado
   * @returns Pedido criado com ID gerado
   * @see Requirements 2.1
   */
  create(order: Order): Promise<Order>;

  /**
   * Busca um pedido pelo ID
   * @param id ID do pedido
   * @returns Pedido encontrado ou null se não existir
   * @see Requirements 8.3
   */
  findById(id: string): Promise<Order | null>;

  /**
   * Lista todos os pedidos cadastrados
   * @returns Lista de todos os pedidos
   * @see Requirements 8.1
   */
  findAll(): Promise<Order[]>;

  /**
   * Busca pedidos por status do pedido
   * @param status Status do pedido para filtrar
   * @returns Lista de pedidos com o status especificado
   * @see Requirements 6.4
   */
  findByStatus(status: OrderStatus): Promise<Order[]>;

  /**
   * Busca pedidos por status de pagamento
   * @param status Status de pagamento para filtrar
   * @returns Lista de pedidos com o status de pagamento especificado
   * @see Requirements 7.10
   */
  findByPaymentStatus(status: PaymentStatus): Promise<Order[]>;

  /**
   * Atualiza os dados de um pedido existente
   * @param order Dados atualizados do pedido
   * @returns Pedido atualizado
   * @see Requirements 8.4
   */
  update(order: Order): Promise<Order>;

  /**
   * Remove um pedido pelo ID
   * @param id ID do pedido a ser removido
   * @see Requirements 8.5
   */
  delete(id: string): Promise<void>;
}
