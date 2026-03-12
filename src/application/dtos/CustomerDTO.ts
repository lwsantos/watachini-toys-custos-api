/**
 * DTO for creating a new customer
 * Validates: Requirements 1.1, 1.2
 */
export interface CreateCustomerDTO {
  name: string;
  email?: string;
  phone?: string;
}

/**
 * DTO for updating an existing customer
 * Validates: Requirements 1.4
 */
export interface UpdateCustomerDTO {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * DTO for customer response data
 * Validates: Requirements 1.1, 1.4, 1.5
 */
export interface CustomerResponseDTO {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}
