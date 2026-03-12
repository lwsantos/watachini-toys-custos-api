import { Customer } from '../entities';

/**
 * Interface do repositório de clientes
 * Define os métodos para persistência e consulta de clientes
 * @see Requirements 1.1, 1.4, 1.5, 1.6
 */
export interface ICustomerRepository {
  /**
   * Cria um novo cliente
   * @param customer Dados do cliente a ser criado
   * @returns Cliente criado com ID gerado
   * @see Requirements 1.1
   */
  create(customer: Customer): Promise<Customer>;

  /**
   * Busca um cliente pelo ID
   * @param id ID do cliente
   * @returns Cliente encontrado ou null se não existir
   */
  findById(id: string): Promise<Customer | null>;

  /**
   * Lista todos os clientes cadastrados
   * @returns Lista de todos os clientes
   * @see Requirements 1.5
   */
  findAll(): Promise<Customer[]>;

  /**
   * Busca clientes por nome (case-insensitive)
   * @param name Nome ou parte do nome para busca
   * @returns Lista de clientes que correspondem à busca
   * @see Requirements 1.6
   */
  findByName(name: string): Promise<Customer[]>;

  /**
   * Atualiza os dados de um cliente existente
   * @param customer Dados atualizados do cliente
   * @returns Cliente atualizado
   * @see Requirements 1.4
   */
  update(customer: Customer): Promise<Customer>;

  /**
   * Remove um cliente pelo ID
   * @param id ID do cliente a ser removido
   * @see Requirements 1.4
   */
  delete(id: string): Promise<void>;
}
