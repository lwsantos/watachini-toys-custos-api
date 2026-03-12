import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLaborTimeMinutesToProduct1700000000002 implements MigrationInterface {
  name = 'AddLaborTimeMinutesToProduct1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "labor_time_minutes" INTEGER DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "labor_time_minutes"
    `);
  }
}
