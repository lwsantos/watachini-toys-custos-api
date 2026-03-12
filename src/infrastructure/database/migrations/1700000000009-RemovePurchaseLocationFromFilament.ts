import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePurchaseLocationFromFilament1700000000009 implements MigrationInterface {
  name = 'RemovePurchaseLocationFromFilament1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna existe antes de tentar remover
    const hasColumn = await queryRunner.hasColumn('filaments', 'purchase_location');
    if (hasColumn) {
      await queryRunner.query(`
        ALTER TABLE filaments 
        DROP COLUMN purchase_location
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE filaments 
      ADD COLUMN purchase_location VARCHAR(255) NULL
    `);

    // Preencher com dados da tabela filament_purchases
    await queryRunner.query(`
      UPDATE filaments f
      SET purchase_location = fp.purchase_location
      FROM filament_purchases fp
      WHERE f.purchase_id = fp.id
    `);
  }
}
