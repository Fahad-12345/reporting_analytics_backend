import { ANY } from '../interfaces/types';
import * as models from '../models';
import { BaseRepository } from '../shared/base-repository';

export class UserRepository extends BaseRepository<models.users> {

    private readonly joinClause: { [key: string]: ANY };

    public constructor(protected _users: typeof models.users) {
        super(_users);
    }

}
