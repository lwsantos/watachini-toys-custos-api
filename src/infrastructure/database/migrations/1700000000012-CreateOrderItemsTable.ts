import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderItemsTable1700000000012 implements MigrationInterface {
  name = 'CreateOrderItemsTable1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create order_items table
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "product_name" varchar(255) NOT NULL,
        "quantity" int NOT NULL,
        "cost_price" decimal(10,2) NOT NULL,
        "sale_price" decimal(10,2) NOT NULL,
        "total_cost" decimal(10,2) NOT NULL,
        "total_sale_value" decimal(10,2) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Create indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_product_id" ON "order_items" ("product_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_items_product_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_items_order_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
  }
}
