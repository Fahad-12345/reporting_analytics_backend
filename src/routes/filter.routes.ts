import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { filtercontroller } from '../controllers/Reports';



export const filterRouter: Router = Router();
filterRouter.get('/filters', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => filtercontroller.getFilteredData(...args));