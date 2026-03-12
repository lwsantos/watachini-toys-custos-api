import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPartFilamentsToCharacteristics1700000000006 implements MigrationInterface {
  name = 'AlterPartFilamentsToCharacteristics1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar novas colunas
    await queryRunner.query(`
      ALTER TABLE "part_filaments" 
      ADD COLUMN "filament_type" VARCHAR(100),
      ADD COLUMN "manufacturer" VARCHAR(255),
      ADD COLUMN "color" VARCHAR(100)
    `);

    // 2. Migrar dados existentes (copiar características do filamento referenciado)
    await queryRunner.query(`
      UPDATE "part_filaments" pf
      SET 
        filament_type = f.filament_type,
        manufacturer = f.manufacturer,
        color = f.color
      FROM "filaments" f
      WHERE pf.filament_id = f.id
    `);

    // 3. Tornar colunas NOT NULL após migração
    await queryRunner.query(`
      ALTER TABLE "part_filaments" 
      ALTER COLUMN "filament_type" SET NOT NULL,
      ALTER COLUMN "manufacturer" SET NOT NULL,
      ALTER COLUMN "color" SET NOT NULL
    `);

    // 4. Remover índice antigo de filament_id
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_part_filaments_filament_id"`);

    // 5. Remover FK e coluna antiga
    await queryRunner.query(`
      ALTER TABLE "part_filaments" DROP CONSTRAINT IF EXISTS "FK_part_filaments_filament"
    `);
    await queryRunner.query(`
      ALTER TABLE "part_filaments" DROP COLUMN "filament_id"
    `);

    // 6. Criar índice para busca por características
    await queryRunner.query(`
      CREATE INDEX "idx_part_filaments_characteristics" 
      ON "part_filaments"("filament_type", "manufacturer", "color")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover índice de características
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_part_filaments_characteristics"`);

    // 2. Adicionar coluna filament_id de volta (nullable inicialmente)
    await queryRunner.query(`
      ALTER TABLE "part_filaments" 
      ADD COLUMN "filament_id" uuid
    `);

    // 3. Tentar restaurar filament_id baseado nas características
    // (pode não encontrar correspondência exata se filamentos foram alterados)
    await queryRunner.query(`
      UPDATE "part_filaments" pf
      SET filament_id = (
        SELECT f.id FROM "filaments" f
        WHERE f.filament_type = pf.filament_type
          AND f.manufacturer = pf.manufacturer
          AND f.color = pf.color
        LIMIT 1
      )
    `);

    // 4. Recriar FK (apenas se filament_id não for null)
    await queryRunner.query(`
      ALTER TABLE "part_filaments" 
      ADD CONSTRAINT "FK_part_filaments_filament" 
      FOREIGN KEY ("filament_id") REFERENCES "filaments"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // 5. Recriar índice de filament_id
    await queryRunner.query(`
      CREATE INDEX "IDX_part_filaments_filament_id" ON "part_filaments" ("filament_id")
    `);

    // 6. Remover colunas de características
    await queryRunner.query(`
      ALTER TABLE "part_filaments" 
      DROP COLUMN "filament_type",
      DROP COLUMN "manufacturer",
      DROP COLUMN "color"
    `);
  }
}
