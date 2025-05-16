
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { excelcontroller } from '../controllers/Reports';

export const ExcelRouter: Router = Router();

ExcelRouter.post('/getexceldata', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => excelcontroller.getExcelFile(...args));
