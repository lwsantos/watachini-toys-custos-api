import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLaborCostFromProductPart1700000000004 implements MigrationInterface {
  name = 'RemoveLaborCostFromProductPart1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_parts" 
      DROP COLUMN IF EXISTS "labor_cost"
    `);
    await queryRunner.query(`
      ALTER TABLE "product_parts" 
      DROP COLUMN IF EXISTS "used_labor_cost_per_hour"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_parts" 
      ADD COLUMN "labor_cost" DECIMAL(10, 2) DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "product_parts" 
      ADD COLUMN "used_labor_cost_per_hour" DECIMAL(10, 2) DEFAULT 0
    `);
  }
}
