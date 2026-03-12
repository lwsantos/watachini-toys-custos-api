import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEnergyCostConfiguration1700000000005 implements MigrationInterface {
  name = 'UpdateEnergyCostConfiguration1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename energy_cost_per_hour to energy_cost_per_kwh
    await queryRunner.query(`
      ALTER TABLE "cost_configurations" 
      RENAME COLUMN "energy_cost_per_hour" TO "energy_cost_per_kwh"
    `);
    
    // Add printer_power_kwh column
    await queryRunner.query(`
      ALTER TABLE "cost_configurations" 
      ADD COLUMN "printer_power_kwh" DECIMAL(10, 4) DEFAULT 0.2
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cost_configurations" 
      DROP COLUMN "printer_power_kwh"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "cost_configurations" 
      RENAME COLUMN "energy_cost_per_kwh" TO "energy_cost_per_hour"
    `);
  }
}
