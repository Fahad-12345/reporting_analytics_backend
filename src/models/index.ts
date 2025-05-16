import { ANY } from '../interfaces/types';
import { users } from '../models/user';
import { user_basic_info } from '../models/user_basic_info';


type ModelType = ANY;

export * from './user';
export * from './globalFilter'
export * from './user_basic_info';

export const models: ModelType = [
    users,
    user_basic_info
];
