/**
 * Entidade de domínio Customer - representa um cliente no sistema de pedidos
 * @see Requirements 1.1, 1.2, 1.3
 */

/**
 * Erro de validação para entidades de domínio
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<Customer>) {
    this.id = props.id || '';
    this.name = props.name || '';
    this.email = props.email ?? null;
    this.phone = props.phone ?? null;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  /**
   * Valida os dados do cliente
   * @throws ValidationError se o nome estiver vazio ou contiver apenas espaços em branco
   * @see Requirements 1.2, 1.3
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('O nome do cliente é obrigatório');
    }
  }

  /**
   * Atualiza os dados do cliente
   * @param props Propriedades a serem atualizadas
   * @throws ValidationError se o nome for inválido
   */
  update(props: Partial<Omit<Customer, 'id' | 'createdAt'>>): void {
    if (props.name !== undefined) {
      this.name = props.name;
    }
    if (props.email !== undefined) {
      this.email = props.email;
    }
    if (props.phone !== undefined) {
      this.phone = props.phone;
    }
    this.updatedAt = new Date();

    this.validate();
  }
}
