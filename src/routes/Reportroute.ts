import {
    NextFunction,
    Request,
    RequestHandler,
    Response,
    Router,
} from "express";

import { reportController } from "../controllers/Reports";
import { reportObjectValidations, denialDetailReportValidations, arDetailReportValidations } from '../utils/requestValidation/report_validation';
export const ReportRouter: Router = Router();


ReportRouter.post('/getPaymentDetailReport', reportObjectValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.getpaymentReport(...args));
ReportRouter.post('/getPaymentSummaryReport', reportObjectValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.getpaymentSummaryReport(...args));
ReportRouter.post('/getAccountRecievable', reportObjectValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.getAccountReceivable(...args));
ReportRouter.post('/getAccountReceivableDetail', arDetailReportValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.getAccountReceivableDetailReport(...args));
ReportRouter.post('/getDenialReport', reportObjectValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.getDenialReport(...args));
ReportRouter.post('/getDenialDetailReport', denialDetailReportValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.getdenialDetailReport(...args));
ReportRouter.post('/getStatusReport', reportObjectValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.getStatusReport(...args));
ReportRouter.post('/getAppointmentSummaryReport', reportObjectValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.getAppointmentSummaryReport(...args))
ReportRouter.post('/generatePDF', reportObjectValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.generatePDF(...args));
ReportRouter.post('/generateStatusPDF', reportObjectValidations, (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => reportController.generateStatusPDF(...args));


