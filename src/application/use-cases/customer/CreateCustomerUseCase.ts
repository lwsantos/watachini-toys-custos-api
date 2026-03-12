import { v4 as uuidv4 } from 'uuid';
import { Customer } from '../../../domain/entities';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { CreateCustomerDTO, CustomerResponseDTO } from '../../dtos/CustomerDTO';

/**
 * Erro de validação para operações de cliente
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Use case para criação de clientes
 * @see Requirements 1.1, 1.2, 1.3
 */
export class CreateCustomerUseCase {
  constructor(private customerRepository: ICustomerRepository) {}

  /**
   * Executa a criação de um novo cliente
   * @param dto Dados do cliente a ser criado
   * @returns Dados do cliente criado
   * @throws ValidationError se o nome estiver vazio ou contiver apenas espaços em branco
   */
  async execute(dto: CreateCustomerDTO): Promise<CustomerResponseDTO> {
    const now = new Date();

    // A validação do nome obrigatório é feita no construtor da entidade Customer
    // que lança ValidationError se o nome estiver vazio ou contiver apenas espaços
    const customer = new Customer({
      id: uuidv4(),
      name: dto.name,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      createdAt: now,
      updatedAt: now,
    });

    const savedCustomer = await this.customerRepository.create(customer);

    return {
      id: savedCustomer.id,
      name: savedCustomer.name,
      email: savedCustomer.email,
      phone: savedCustomer.phone,
      createdAt: savedCustomer.createdAt,
      updatedAt: savedCustomer.updatedAt,
    };
  }
}
