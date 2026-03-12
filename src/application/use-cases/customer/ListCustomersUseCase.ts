import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { CustomerResponseDTO } from '../../dtos/CustomerDTO';

/**
 * Use case para listar todos os clientes
 * @see Requirements 1.5
 */
export class ListCustomersUseCase {
  constructor(private customerRepository: ICustomerRepository) {}

  /**
   * Executa a listagem de todos os clientes
   * @returns Lista de todos os clientes cadastrados
   */
  async execute(): Promise<CustomerResponseDTO[]> {
    const customers = await this.customerRepository.findAll();

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }));
  }
}
