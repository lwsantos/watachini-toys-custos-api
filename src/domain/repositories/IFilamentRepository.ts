import { Filament, FilamentCharacteristics, FilamentStatus } from '../entities';

export interface FilamentFilters {
  color?: string;
  filamentType?: string;
  status?: FilamentStatus;
  manufacturer?: string;
}

export interface IFilamentRepository {
  create(filament: Filament): Promise<Filament>;
  findById(id: string): Promise<Filament | null>;
  findAll(filters?: FilamentFilters): Promise<Filament[]>;
  findAvailableByColorAndType(color: string, type: string): Promise<Filament[]>;
  findAllAvailable(): Promise<Filament[]>;
  updateStatus(id: string, status: FilamentStatus): Promise<void>;
  update(filament: Filament): Promise<Filament>;
  findOldestAvailable(color: string, type: string): Promise<Filament | null>;
  findByPurchaseId(purchaseId: string): Promise<Filament[]>;

  /**
   * Busca filamentos disponíveis por características
   * @param filamentType Tipo do filamento (ex: "PLA", "PETG", "ABS")
   * @param manufacturer Fabricante do filamento
   * @param color Cor do filamento
   * @returns Lista de filamentos que correspondem às características
   */
  findAvailableByCharacteristics(
    filamentType: string,
    manufacturer: string,
    color: string
  ): Promise<Filament[]>;

  /**
   * Retorna características únicas de filamentos disponíveis
   * Usado para popular dropdown no frontend
   */
  getUniqueAvailableCharacteristics(): Promise<FilamentCharacteristics[]>;
}
