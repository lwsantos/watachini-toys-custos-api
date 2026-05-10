import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnitPriceAtPurchaseToFilaments1700000000014 implements MigrationInterface {
  name = 'AddUnitPriceAtPurchaseToFilaments1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "filaments"
      ADD COLUMN IF NOT EXISTS "unit_price_at_purchase" decimal(10, 2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "filaments" DROP COLUMN IF EXISTS "unit_price_at_purchase"
    `);
  }
}
