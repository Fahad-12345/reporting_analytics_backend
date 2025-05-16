import { ANY } from '../interfaces/types';

export const poolConfig: ANY = {
    development: {
        acquire: 60000,
        evict: 10000,
        idle: 30000,
        max: 30,
      },
    qa: {
        acquire: 60000,
        evict: 10000,
        idle: 30000,
        max: 5,
      },
    staging: {
        acquire: 60000,
        evict: 10000,
        idle: 30000,
        max: 5,
      },
    production: {
        acquire: 60000,
        evict: 10000,
        idle: 30000,
        max: 5,
    }
};
