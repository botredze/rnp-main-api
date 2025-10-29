import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { SeederOptions } from 'typeorm-extension';

const options: DataSourceOptions & SeederOptions = {
  type: process.env.DB_DRIVER as 'mysql' | 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [process.cwd() + '/src/core/typeOrm/models/*.ts'],
  migrations: [process.cwd() + '/src/core/typeOrm/migrations/*.ts'],
  migrationsTableName: 'migrations',

  seeds: [process.cwd() + '/src/core/typeOrm/seeders/*.ts'],

  poolErrorHandler: (error) => {
    // TODO: Logger
    console.error(error);

    process.exit(1);
  },
};

export const AppDataSource = new DataSource(options);
