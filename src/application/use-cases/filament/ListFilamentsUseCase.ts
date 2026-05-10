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

    const filamentDTOs = filaments.map((filament): FilamentDTO => {
      const p = filament.purchase;
      if (!p) {
        throw new Error(`Filamento ${filament.id} sem compra associada`);
      }
      return {
        id: filament.id,
        purchaseId: filament.purchaseId,
        color: filament.color,
        filamentType: filament.filamentType,
        manufacturer: filament.manufacturer,
        costPerGram: filament.costPerGram,
        totalCost: filament.totalCost,
        status: filament.status,
        purchaseDate: p.purchaseDate,
        purchaseLocation: p.purchaseLocation,
        purchasePrice: filament.unitPriceAtPurchase ?? p.price,
        purchaseDiscount: p.discount,
        purchaseFreight: p.freight,
        purchaseQuantity: p.quantity,
        createdAt: filament.createdAt,
      };
    });

    return {
      filaments: filamentDTOs,
      total: filamentDTOs.length,
    };
  }
}
