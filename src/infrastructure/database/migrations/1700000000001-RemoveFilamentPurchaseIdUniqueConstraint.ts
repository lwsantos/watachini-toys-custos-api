import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFilamentPurchaseIdUniqueConstraint1700000000001 implements MigrationInterface {
  name = 'RemoveFilamentPurchaseIdUniqueConstraint1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove a constraint unique do purchase_id para permitir múltiplos filamentos por compra
    await queryRunner.query(`
      ALTER TABLE "filaments" DROP CONSTRAINT IF EXISTS "UQ_filaments_purchase_id"
    `);
    
    // Remove também possíveis índices únicos que possam existir
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_filaments_purchase_id"
    `);
    
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_filaments_purchase_id"
    `);

    // Cria um índice não-único para performance nas consultas
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_filaments_purchase_id" ON "filaments" ("purchase_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove o índice não-único
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_filaments_purchase_id"
    `);

    // Recria a constraint unique (isso pode falhar se houver dados duplicados)
    await queryRunner.query(`
      ALTER TABLE "filaments" ADD CONSTRAINT "UQ_filaments_purchase_id" UNIQUE ("purchase_id")
    `);
  }
}
