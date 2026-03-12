import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { CustomerResponseDTO } from '../../dtos/CustomerDTO';

/**
 * Use case para buscar clientes por nome (case-insensitive)
 * @see Requirements 1.6
 */
export class SearchCustomersUseCase {
  constructor(private customerRepository: ICustomerRepository) {}

  /**
   * Executa a busca de clientes por nome
   * @param name Nome ou parte do nome para busca (case-insensitive)
   * @returns Lista de clientes que correspondem à busca
   */
  async execute(name: string): Promise<CustomerResponseDTO[]> {
    const customers = await this.customerRepository.findByName(name);

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
