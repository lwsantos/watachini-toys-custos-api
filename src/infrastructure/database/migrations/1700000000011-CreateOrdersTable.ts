import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTable1700000000011 implements MigrationInterface {
  name = 'CreateOrdersTable1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create orders table
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "order_date" timestamp NOT NULL DEFAULT now(),
        "expected_delivery_date" timestamp,
        "order_status" varchar(50) NOT NULL DEFAULT 'Pendente',
        "payment_status" varchar(50) NOT NULL DEFAULT 'Pendente',
        "payment_method" varchar(50),
        "payment_date" timestamp,
        "shipping_cost" decimal(10,2) NOT NULL DEFAULT 0,
        "shipping_paid_by" varchar(50) NOT NULL DEFAULT 'Cliente',
        "total_cost" decimal(10,2) NOT NULL DEFAULT 0,
        "total_sale_value" decimal(10,2) NOT NULL DEFAULT 0,
        "profit" decimal(10,2) NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Create indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_customer_id" ON "orders" ("customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_order_status" ON "orders" ("order_status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_payment_status" ON "orders" ("payment_status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_order_date" ON "orders" ("order_date" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_order_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_payment_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_order_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_customer_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
  }
}
