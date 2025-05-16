import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ANY } from "../interfaces";
import { GlobalFiltersRequest } from "../interfaces/contracts/request_model";
import { AdminService } from "../services/admin.service";
import { BillRecepientType } from '../services/Reports/report.enum';
import { validateQuery } from "../utils/requestValidation/request_validation";

export class AdminController {
    public constructor(public adminService: AdminService) {

    }

    public getSummary = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {

            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.adminService.getSummaryChart(body);
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

    /*** Retuns top 10 specialities by billed amount*/
    public getTopTenSpecialities = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const query = req.body

            const requestData: GlobalFiltersRequest = query;
            const isValidated: boolean | string = validateQuery(requestData);

            if (isValidated === true) {
                const response: ANY = await this.adminService.getTopTenBilledSpecialities(query);

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
    /** Returing billed amount in comparison with payment received *****/
    public getbilledpayment = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {

            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;
            const billRecipient: number = body.recipient_id
            delete body.recipient_id

            const isValidated: boolean | string = validateQuery(requestData);

            if (isValidated === true) {
                const validRecipientIds = [
                    BillRecepientType.Patient,
                    BillRecepientType.Employer,
                    BillRecepientType.Insurance,
                    BillRecepientType.Attorney
                ];
                if (validRecipientIds.includes(billRecipient)) {
                    body.recipient_id = billRecipient;
                }
                const response: ANY = await this.adminService.getbilledpayments(body);
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

    public getSumOfAmounts = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {

            const { body, headers: { authorization } } = req;
            const billRecipient: number = body.recipient_id
            delete body.recipient_id
            const requestData: GlobalFiltersRequest = body;
            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const validRecipientIds = [
                    BillRecepientType.Patient,
                    BillRecepientType.Employer,
                    BillRecepientType.Insurance,
                    BillRecepientType.Attorney
                ];
                if (validRecipientIds.includes(billRecipient)) {
                    body.recipient_id = billRecipient;
                }
                const response: ANY = await this.adminService.getSumOfAmounts(body);
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

    public getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {

            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;

            const isValidated: boolean | string = validateQuery(requestData);
            if (isValidated === true) {
                const response: ANY = await this.adminService.getRevenueLocation(body);
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


    public getClaimsOverview = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body, headers: { authorization } } = req;
            const billRecipient = body.recipient_id
            delete body.recipient_id
            const requestData: GlobalFiltersRequest = body;
            const isValidated = validateQuery(requestData);
            if (isValidated === true) {
                const validRecipientIds = [
                    BillRecepientType.Patient,
                    BillRecepientType.Employer,
                    BillRecepientType.Insurance,
                    BillRecepientType.Attorney,
                    BillRecepientType.Other,
                ];
                if (validRecipientIds.includes(billRecipient)) {
                    body.recipient_id = billRecipient;
                }

                const response: ANY = await this.adminService.getClaimsOverview(body);
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

    public getHigherPayerTypeStats = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body, headers: { authorization } } = req;
            const requestData: GlobalFiltersRequest = body;

            const billRecipient = body.recipient_id
            delete body.recipient_id
            const isValidated = validateQuery(requestData);
            if (isValidated === true) {
                const validRecipientIds = [
                    BillRecepientType.Patient,
                    BillRecepientType.Employer,
                    BillRecepientType.Insurance,
                    BillRecepientType.Attorney,
                    BillRecepientType.Other,
                ];
                if (validRecipientIds.includes(billRecipient)) {
                    body.recipient_id = billRecipient;
                }
                const response: ANY = await this.adminService.getHigherPayerTypeService(body);
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
    public adminExportData = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {
            const { body, headers: { authorization } } = req;
            let requestData: GlobalFiltersRequest = body;


            if (body.recipient_id && body.recipient_id !== 0 && body.recipient_id !== null) {
                const billRecipient: number = body.recipient_id
                delete body.recipient_id;
                const isValidated: boolean | string = validateQuery(requestData);
                if (isValidated === true) {
                    const validRecipientIds = [
                        BillRecepientType.Patient,
                        BillRecepientType.Employer,
                        BillRecepientType.Insurance,
                        BillRecepientType.Attorney
                    ];
                    if (validRecipientIds.includes(billRecipient)) {
                        body.recipient_id = billRecipient;

                        const response: ANY = await this.adminService.generateExports(body);

                        res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                    }
                    else {
                        res.locals.data = { message: isValidated, status: 400 };
                    }

                }
            }
            else if (body.recipient_id === 0 || body.recipient_id === null) {
                const { recipient_id, ...filteredRequestData } = body;
                const isValidated = validateQuery(filteredRequestData);
                if (isValidated === true) {
                    const response: ANY = await this.adminService.generateExports(body);
                    res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                }
                else {
                    res.locals.data = { message: isValidated, status: 400 };
                }

            }

            else if (!body.recipient_id) {
                const { ...filteredRequestData } = body;
                const isValidated = validateQuery(filteredRequestData);
                if (isValidated === true) {
                    const response: ANY = await this.adminService.generateExports(body);
                    res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                }
                else {
                    res.locals.data = { message: isValidated, status: 400 };
                }

            }
            next();
            return undefined;
        } catch (error) {
            next(error);
        }
    }
}