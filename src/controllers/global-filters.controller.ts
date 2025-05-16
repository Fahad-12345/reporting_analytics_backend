import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ANY } from '../interfaces/types';

import { GlobalService } from '../services/global.service';



export class GlobalFilterController {
    public constructor(
        public __service: GlobalService
    ) { }
    public get = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { headers: { authorization }, query } = req;
            const response: ANY = await this.__service.get(query, authorization);
            res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
            next();
            return undefined;
        } catch (error) {
            console.error("dropdowns error", error);
            next(error);
        }
    }

}