import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import {
  ListFilamentsFilterDTO,
  ListFilamentsResultDTO,
  FilamentDTO,
} from '../../dtos/ListFilamentsDTO';

export class ListFilamentsUseCase {
  constructor(private filamentRepository: IFilamentRepository) {}

  async execute(filters?: ListFilamentsFilterDTO): Promise<ListFilamentsResultDTO> {
    const filaments = await this.filamentRepository.findAll(filters);

    const filamentDTOs = filaments.map((filament): FilamentDTO => ({
      id: filament.id,
      purchaseId: filament.purchaseId,
      color: filament.color,
      filamentType: filament.filamentType,
      manufacturer: filament.manufacturer,
      costPerGram: filament.costPerGram,
      totalCost: filament.totalCost,
      status: filament.status,
      purchaseDate: filament.purchaseDate,
      purchaseLocation: filament.purchaseLocation,
      purchasePrice: filament.purchasePrice,
      purchaseDiscount: filament.purchaseDiscount,
      purchaseFreight: filament.purchaseFreight,
      purchaseQuantity: filament.purchaseQuantity,
      createdAt: filament.createdAt,
    }));

    return {
      filaments: filamentDTOs,
      total: filamentDTOs.length,
    };
  }
}
