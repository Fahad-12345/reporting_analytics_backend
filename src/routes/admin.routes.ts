import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { adminController } from "../controllers";

export const adminRouter: Router = Router();
adminRouter.post('/top-specialities', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => adminController.getTopTenSpecialities(...args));
adminRouter.post('/sum-amounts', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => adminController.getSumOfAmounts(...args));
adminRouter.post('/summary-charts', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => adminController.getSummary(...args));
adminRouter.post('/highest-payers', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => adminController.getHigherPayerTypeStats(...args));
adminRouter.post('/claims-overview', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => adminController.getClaimsOverview(...args));
adminRouter.post('/BilledPayment', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => adminController.getbilledpayment(...args));
adminRouter.post('/revenue-locations', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => adminController.getRevenue(...args));
adminRouter.post('/export-data', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => adminController.adminExportData(...args))
/**
 * GET routes
 */