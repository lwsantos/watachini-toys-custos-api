import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReduceCostPerGramPrecision1700000000007 implements MigrationInterface {
  name = 'ReduceCostPerGramPrecision1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar precisão de cost_per_gram na tabela filaments de 4 para 2 casas decimais
    await queryRunner.query(`
      ALTER TABLE filaments 
      ALTER COLUMN cost_per_gram TYPE DECIMAL(10, 2)
    `);

    // Alterar precisão de used_filament_cost_per_gram na tabela product_parts de 4 para 2 casas decimais
    await queryRunner.query(`
      ALTER TABLE product_parts 
      ALTER COLUMN used_filament_cost_per_gram TYPE DECIMAL(10, 2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para 4 casas decimais
    await queryRunner.query(`
      ALTER TABLE filaments 
      ALTER COLUMN cost_per_gram TYPE DECIMAL(10, 4)
    `);

    await queryRunner.query(`
      ALTER TABLE product_parts 
      ALTER COLUMN used_filament_cost_per_gram TYPE DECIMAL(10, 4)
    `);
  }
}
