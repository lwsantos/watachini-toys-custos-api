import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomersTable1700000000010 implements MigrationInterface {
  name = 'CreateCustomersTable1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create customers table
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "email" varchar(255),
        "phone" varchar(50),
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customers" PRIMARY KEY ("id")
      )
    `);

    // Create index for name search
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_name" ON "customers" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_name"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
  }
}
