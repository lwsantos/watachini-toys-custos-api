import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Compra (filament_purchases): apenas dados da transação.
 * Filamento: remove purchase_date duplicado (passa a vir só da compra via FK).
 */
export class NormalizePurchaseAndFilament1700000000013 implements MigrationInterface {
  name = 'NormalizePurchaseAndFilament1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_filaments_purchase_date"`);

    await queryRunner.query(`
      ALTER TABLE "filaments" DROP COLUMN IF EXISTS "purchase_date"
    `);

    await queryRunner.query(`
      ALTER TABLE "filament_purchases" DROP COLUMN IF EXISTS "color"
    `);
    await queryRunner.query(`
      ALTER TABLE "filament_purchases" DROP COLUMN IF EXISTS "filament_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "filament_purchases" DROP COLUMN IF EXISTS "manufacturer"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "filament_purchases" ADD COLUMN "color" varchar(100)
    `);
    await queryRunner.query(`
      ALTER TABLE "filament_purchases" ADD COLUMN "filament_type" varchar(100)
    `);
    await queryRunner.query(`
      ALTER TABLE "filament_purchases" ADD COLUMN "manufacturer" varchar(255)
    `);

    await queryRunner.query(`
      UPDATE "filament_purchases" fp
      SET
        "color" = sub."color",
        "filament_type" = sub."filament_type",
        "manufacturer" = sub."manufacturer"
      FROM (
        SELECT DISTINCT ON ("purchase_id")
          "purchase_id",
          "color",
          "filament_type",
          "manufacturer"
        FROM "filaments"
        ORDER BY "purchase_id", "created_at" ASC
      ) sub
      WHERE fp."id" = sub."purchase_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "filament_purchases" ALTER COLUMN "color" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "filament_purchases" ALTER COLUMN "filament_type" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "filaments" ADD COLUMN "purchase_date" timestamp
    `);
    await queryRunner.query(`
      UPDATE "filaments" f
      SET "purchase_date" = fp."purchase_date"
      FROM "filament_purchases" fp
      WHERE f."purchase_id" = fp."id"
    `);
    await queryRunner.query(`
      ALTER TABLE "filaments" ALTER COLUMN "purchase_date" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_filaments_purchase_date" ON "filaments" ("purchase_date")
    `);
  }
}
