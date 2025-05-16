import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { providerController } from '../controllers';

export const providerRouter: Router = Router();


providerRouter.post('/appointments', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => providerController.getAppointments(...args))
providerRouter.post('/appointments-analysis', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => providerController.getAppointmentsAnalysis(...args))
providerRouter.post('/bills', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => providerController.getBillStatus(...args))
providerRouter.post('/missing-visits', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => providerController.getMissingVisitStatus(...args))
/**
 * GET routes
 */
providerRouter.post('/summary-charts', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => providerController.getSummary(...args));
providerRouter.post('/export-data', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => providerController.generateExportData(...args));


