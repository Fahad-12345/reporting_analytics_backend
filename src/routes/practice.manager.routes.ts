
import { practiceManagerController } from "../controllers";
//import { prependOnceListener } from "cluster";
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';



export const practiceManagerRouter: Router = Router();

/**
 * GET routes
 */
practiceManagerRouter.post('/summaryCharts', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => practiceManagerController.getSummary(...args))
practiceManagerRouter.post('/patientTrends', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => practiceManagerController.getPatientTrends(...args))

practiceManagerRouter.post('/appointment-trends', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => practiceManagerController.getAppointmentTrends(...args));

practiceManagerRouter.post('/gap-duration', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => practiceManagerController.getGapDuration(...args));

practiceManagerRouter.post('/visits', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => practiceManagerController.getVisitStatus(...args))
practiceManagerRouter.post('/bills', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => practiceManagerController.getBillStatus(...args))
practiceManagerRouter.post('/denial-type', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => practiceManagerController.getDenialTypeStats(...args));
practiceManagerRouter.post('/export-data', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => practiceManagerController.generateExportData(...args))
