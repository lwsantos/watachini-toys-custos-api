export interface FilamentCharacteristics {
  filamentType: string;
  manufacturer: string;
  color: string;
}

export class PartFilament {
  id: string;
  partId: string;
  filamentType: string;
  manufacturer: string;
  color: string;
  createdAt: Date;

  constructor(props: Partial<PartFilament>) {
    Object.assign(this, props);
  }

  getCharacteristics(): FilamentCharacteristics {
    return {
      filamentType: this.filamentType,
      manufacturer: this.manufacturer,
      color: this.color,
    };
  }
}
