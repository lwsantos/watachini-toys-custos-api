import { Customer } from '../../../domain/entities';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { UpdateCustomerDTO, CustomerResponseDTO } from '../../dtos/CustomerDTO';

/**
 * Erro quando um recurso não é encontrado
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Use case para atualização de clientes
 * @see Requirements 1.4
 */
export class UpdateCustomerUseCase {
  constructor(private customerRepository: ICustomerRepository) {}

  /**
   * Executa a atualização de um cliente existente
   * @param id ID do cliente a ser atualizado
   * @param dto Dados a serem atualizados
   * @returns Dados do cliente atualizado
   * @throws NotFoundError se o cliente não existir
   * @throws ValidationError se o nome for inválido (validação feita na entidade)
   */
  async execute(id: string, dto: UpdateCustomerDTO): Promise<CustomerResponseDTO> {
    // Buscar cliente existente
    const existingCustomer = await this.customerRepository.findById(id);

    if (!existingCustomer) {
      throw new NotFoundError(`Cliente com ID ${id} não encontrado`);
    }

    // Atualizar usando o método da entidade de domínio (validação acontece lá)
    existingCustomer.update({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
    });

    // Salvar via repositório
    const savedCustomer = await this.customerRepository.update(existingCustomer);

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
