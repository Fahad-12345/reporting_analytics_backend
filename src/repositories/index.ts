import { users } from '../models';

import { UserRepository } from './users.repository';

export const userRepository: UserRepository = new UserRepository(users);


