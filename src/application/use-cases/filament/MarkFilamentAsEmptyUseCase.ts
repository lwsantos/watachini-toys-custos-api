import { FilamentStatus } from '../../../domain/entities';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';

export class FilamentNotFoundError extends Error {
  constructor(id: string) {
    super(`Filamento não encontrado: ${id}`);
    this.name = 'FilamentNotFoundError';
  }
}

export interface MarkFilamentAsEmptyDTO {
  filamentId: string;
}

export class MarkFilamentAsEmptyUseCase {
  constructor(private filamentRepository: IFilamentRepository) {}

  async execute(dto: MarkFilamentAsEmptyDTO): Promise<void> {
    const filament = await this.filamentRepository.findById(dto.filamentId);

    if (!filament) {
      throw new FilamentNotFoundError(dto.filamentId);
    }

    await this.filamentRepository.updateStatus(dto.filamentId, FilamentStatus.EMPTY);
  }
}
