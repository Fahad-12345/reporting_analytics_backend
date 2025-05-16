import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ANY } from "../interfaces";
import { AuthService } from "../services/auth.service";

export class AuthController {
    public constructor(public providerService: AuthService) {


    }
    public getuserpermissions = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {

            const { body, headers: { authorization } } = req;
            const response: ANY = await this.providerService.getuserpermissions(body);
            res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
            next();
            return undefined;
        } catch (error) {
            next(error);
        }
    }
}