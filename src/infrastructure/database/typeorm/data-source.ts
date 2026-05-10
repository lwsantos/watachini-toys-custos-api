import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'printing_cost_control',
  synchronize: false,
  logging: !isProduction,
  entities: [
    path.join(__dirname, 'entities', '*.{ts,js}'),
  ],
  migrations: [
    path.join(__dirname, '..', 'migrations', '*.{ts,js}'),
  ],
  subscribers: [],
};

export const AppDataSource = new DataSource(dataSourceOptions);
