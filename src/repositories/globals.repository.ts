import { ANY } from '../interfaces/types';
import * as models from '../models';
import { BaseRepository } from '../shared/base-repository';

export class GlobalsRepository extends BaseRepository<models.Globals> {

    private readonly joinClause: { [key: string]: ANY };

    public constructor(protected _globals: typeof models.Globals) {
        super(_globals);
    }

}
