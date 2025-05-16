import { ProviderService } from '../services/provider.service';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ANY } from "../interfaces";
import { GlobalFiltersRequest } from "../interfaces/contracts/request_model";
import { validateQuery } from "../utils/requestValidation/request_validation";

export class ProviderController {
    public constructor(public providerService: ProviderService) {


    }
    public getSummary = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {

            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.providerService.getSummaryChart(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
            }
            else {
                res.locals.data = { message: isValidated, status: 400 };
            }
            next();
            return undefined;
        } catch (error) {
            next(error);
        }
    }

    public getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.providerService.getAppointments(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };

            }
            else {
                res.locals.data = { message: isValidated, status: 400 };
            }
            next();
            return undefined;
        } catch (error) {
            next(error)
        }

    }

    public getAppointmentsAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.providerService.getAppointmentsAnalysis(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };

            }
            else {
                res.locals.data = { message: isValidated, status: 400 };
            }
            next();
            return undefined;
        } catch (error) {
            next(error)
        }

    }

    public getBillStatus = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;
            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.providerService.getBillStatus(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };

            }
            else {
                res.locals.data = { message: isValidated, status: 400 };
            }
            next();
            return undefined;
        } catch (error) {
            next(error)
        }
    }

    public getMissingVisitStatus = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;
            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.providerService.getMissingVisitStatus(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
            }
            else {
                res.locals.data = { message: isValidated, status: 400 };
            }
            next();
            return undefined;
        } catch (error) {
            next(error)
        }
    }

    public generateExportData = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.providerService.generateExports(body, authorization);

                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
            }
            else {
                res.locals.data = { message: isValidated, status: 400 };
            }
            next();
            return undefined;
        } catch (error) {
            next(error);
        }
    }
}