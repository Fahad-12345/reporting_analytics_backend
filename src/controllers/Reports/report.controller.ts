import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ReportService } from '../../services/Reports/report.service';
import { reportObjectValidations, denialDetailReportValidations, arDetailReportValidations } from '../../utils/requestValidation/report_validation';
export class ReportController {
    public constructor(public reportService: ReportService) {
    }

    public getpaymentReport =
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { body } = req;
                const response = await this.reportService.getPaymentReport(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                next();
                return undefined;
            } catch (error) {
                next(error);
            }
        }

    public getpaymentSummaryReport =
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { body } = req;
                const response = await this.reportService.getPaymentSummaryReport(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                next();
                return undefined;
            } catch (error) {
                next(error);
            }
        }

    public getAccountReceivable =
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { body } = req;
                const response = await this.reportService.getAccountReceivableReport(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                next();
                return undefined;
            } catch (error) {
                next(error);
            }
        }


    public getAccountReceivableDetailReport =
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { body } = req;
                const response = await this.reportService.getAccountReceivableDetailReport(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                next();
                return undefined
            } catch (error) {
                next(error);
            }
        }

    public getDenialReport =
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { body } = req;
                const response = await this.reportService.getDenialReport(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                next();
                return undefined;
            } catch (error) {
                next(error);
            }
        }


    public getdenialDetailReport =
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { body } = req;
                const response = await this.reportService.denialDetailReport(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                next();
                return undefined;
            } catch (error) {
                next(error);
            }
        }

    public getStatusReport =
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { body } = req;
                const response = await this.reportService.getStatusReport(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                next();
                return undefined;
            } catch (error) {
                next(error);
            }
        }

    public getAppointmentSummaryReport =
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { body } = req;
                const response = await this.reportService.getAppointmentSummaryReport(body);
                res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
                next();
                return undefined;
            } catch (error) {
                next(error);
            }
        }

    public generatePDF = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { body } = req;
            const response = await this.reportService.generatePDF(body);
            res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
            next();
            return undefined;
        } catch (error) {
            next(error);
        }
    }
    public generateStatusPDF = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { body } = req;
            const response = await this.reportService.generateStatusPDF(body);
            res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
            next();
            return undefined;
        } catch (error) {
            next(error);
        }
    }
}