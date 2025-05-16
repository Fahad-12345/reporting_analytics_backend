import { NextFunction, Request, RequestHandler, Response } from 'express';
import { GlobalFiltersRequest } from "../interfaces/contracts/request_model";
import { ANY } from '../interfaces/types';
import { PracticeManagerService } from "../services/practice.manager.service";
import { validateQuery } from "../utils/requestValidation/request_validation";

export class PracticeManagerController {
    public constructor(public practiceManagerService: PracticeManagerService) {
    }
    public getSummary = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {

            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.practiceManagerService.getSummaryChart(body);
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
    public getPatientTrends = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {

            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.practiceManagerService.getPatientTrends(body);
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
                const response: ANY = await this.practiceManagerService.getBillStatus(body);
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

    public getDenialTypeStats = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {

                const response: ANY = await this.practiceManagerService.getDenialTypesService(body, authorization);

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

    public getAppointmentTrends = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.practiceManagerService.getAppointmentTrends(body);
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

    public getVisitStatus = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;
            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.practiceManagerService.getVisitStatus(body);
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

    public getGapDuration = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;
            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.practiceManagerService.getGapDuration(body);
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
                const response: ANY = await this.practiceManagerService.generateExports(body, authorization);

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