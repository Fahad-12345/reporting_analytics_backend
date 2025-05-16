
import * as typings from '../interfaces';
import * as models from '../models';
import * as repositories from '../repositories';
import { Helper, Http } from '../shared';
import { generateMessages } from '../utils';

export class UserService extends Helper {

    public __http: Http;

    public constructor(
        public __repo: typeof repositories.userRepository,
        public http: typeof Http
    ) {
        super();
        this.__http = new http();
    }

    public get = async (reqData: typings.GenericReqObjI, _authorization: string): Promise<models.usersI[] | models.usersI> => {

        const { id } = reqData;

        if (!id) {
            return this.__repo.findAll();
        }

        const user: models.usersI = this.shallowCopy(await this.__repo.findById(id));

        if (!user || !Object.keys(user).length) {
            throw generateMessages('NO_RECORD_FOUND');
        }

        return user;
    }

}
