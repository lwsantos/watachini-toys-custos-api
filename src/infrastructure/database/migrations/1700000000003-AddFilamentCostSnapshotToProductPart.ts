import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFilamentCostSnapshotToProductPart1700000000003 implements MigrationInterface {
  name = 'AddFilamentCostSnapshotToProductPart1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_parts" 
      ADD COLUMN "used_filament_cost_per_gram" DECIMAL(10, 4) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_parts" 
      DROP COLUMN "used_filament_cost_per_gram"
    `);
  }
}
