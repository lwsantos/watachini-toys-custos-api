import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create filament status enum
    await queryRunner.query(`
      CREATE TYPE "filament_status_enum" AS ENUM ('available', 'empty')
    `);

    // Create filament_purchases table
    await queryRunner.query(`
      CREATE TABLE "filament_purchases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "price" decimal(10,2) NOT NULL,
        "quantity" decimal(10,2) NOT NULL,
        "discount" decimal(10,2) NOT NULL DEFAULT 0,
        "freight" decimal(10,2) NOT NULL DEFAULT 0,
        "manufacturer" varchar(255),
        "purchase_location" varchar(255),
        "color" varchar(100) NOT NULL,
        "filament_type" varchar(100) NOT NULL,
        "total_cost" decimal(10,2) NOT NULL,
        "purchase_date" timestamp NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_filament_purchases" PRIMARY KEY ("id")
      )
    `);

    // Create filaments table
    await queryRunner.query(`
      CREATE TABLE "filaments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "purchase_id" uuid NOT NULL,
        "color" varchar(100) NOT NULL,
        "filament_type" varchar(100) NOT NULL,
        "manufacturer" varchar(255),
        "cost_per_gram" decimal(10,4) NOT NULL,
        "total_cost" decimal(10,2) NOT NULL,
        "status" "filament_status_enum" NOT NULL DEFAULT 'available',
        "purchase_date" timestamp NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_filaments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_filaments_purchase" FOREIGN KEY ("purchase_id") 
          REFERENCES "filament_purchases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "UQ_filaments_purchase_id" UNIQUE ("purchase_id")
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "description" text,
        "total_cost" decimal(10,2) NOT NULL DEFAULT 0,
        "profit_margin" decimal(5,2) NOT NULL DEFAULT 0,
        "final_price" decimal(10,2) NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);

    // Create product_parts table
    await queryRunner.query(`
      CREATE TABLE "product_parts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "weight_grams" decimal(10,2) NOT NULL,
        "print_time_hours" decimal(10,2) NOT NULL,
        "filament_cost" decimal(10,2) NOT NULL DEFAULT 0,
        "energy_cost" decimal(10,2) NOT NULL DEFAULT 0,
        "maintenance_cost" decimal(10,2) NOT NULL DEFAULT 0,
        "labor_cost" decimal(10,2) NOT NULL DEFAULT 0,
        "total_cost" decimal(10,2) NOT NULL DEFAULT 0,
        "used_energy_cost_per_hour" decimal(10,2) NOT NULL DEFAULT 0,
        "used_labor_cost_per_hour" decimal(10,2) NOT NULL DEFAULT 0,
        "used_maintenance_cost_per_hour" decimal(10,2) NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_parts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_parts_product" FOREIGN KEY ("product_id") 
          REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create part_filaments junction table
    await queryRunner.query(`
      CREATE TABLE "part_filaments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "part_id" uuid NOT NULL,
        "filament_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_part_filaments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_part_filaments_part" FOREIGN KEY ("part_id") 
          REFERENCES "product_parts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_part_filaments_filament" FOREIGN KEY ("filament_id") 
          REFERENCES "filaments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Create cost_configurations table
    await queryRunner.query(`
      CREATE TABLE "cost_configurations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "energy_cost_per_hour" decimal(10,2) NOT NULL,
        "labor_cost_per_hour" decimal(10,2) NOT NULL,
        "maintenance_cost_per_hour" decimal(10,2) NOT NULL,
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cost_configurations" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_filaments_status" ON "filaments" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_filaments_color_type" ON "filaments" ("color", "filament_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_filaments_purchase_date" ON "filaments" ("purchase_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_parts_product_id" ON "product_parts" ("product_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_part_filaments_part_id" ON "part_filaments" ("part_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_part_filaments_filament_id" ON "part_filaments" ("filament_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_part_filaments_filament_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_part_filaments_part_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_parts_product_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_filaments_purchase_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_filaments_color_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_filaments_status"`);

    // Drop tables in reverse order (respecting foreign key constraints)
    await queryRunner.query(`DROP TABLE IF EXISTS "cost_configurations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "part_filaments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_parts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "filaments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "filament_purchases"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "filament_status_enum"`);
  }
}
