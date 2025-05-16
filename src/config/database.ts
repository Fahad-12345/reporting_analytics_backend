import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';

import { models } from '../models';

import { poolConfig } from './config';

dotenv.config({ path: '.env' });
export const sequelize: Sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {

  dialect: 'postgres',
  host: process.env.DATABASE_HOST,
  logging: process.env.NODE_ENVR === 'local' ? true : false,
  models: [...models],

  pool: poolConfig[process.env.NODE_ENVR],
  port: +(process.env.DATABASE_PORT),
  dialectOptions: process.env.WRITE_DATABASE_HOST === 'localhost' ? {} : {
    ssl: {
      require: true,
      rejectUnauthorized: false,

    }
  },
  replication: {
    read: [
      {
        database: process.env.READ_DATABASE_NAME,
        host: process.env.READ_DATABASE_HOST,
        password: process.env.READ_DATABASE_PASSWORD,
        username: process.env.READ_DATABASE_USERNAME,
      }
    ],
    write: {
      database: process.env.WRITE_DATABASE_NAME,
      host: process.env.WRITE_DATABASE_HOST,
      password: process.env.WRITE_DATABASE_PASSWORD,
      username: process.env.WRITE_DATABASE_USERNAME,
    }
  },
});
// export const sequelize = new Sequelize({
//   database:process.env.WRITE_DATABASE_NAME,
//   username:  process.env.WRITE_DATABASE_USERNAME,
//   password:process.env.WRITE_DATABASE_PASSWORD,
//   host: process.env.WRITE_DATABASE_HOST,
//   port:Number(process.env.DATABASE_PORT),
//   dialect: "postgres",
// });