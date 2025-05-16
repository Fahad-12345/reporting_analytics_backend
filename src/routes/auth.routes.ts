
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { authController } from '../controllers';

export const AuthRouter: Router = Router();

AuthRouter.post('/getuserpermissions', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => authController.getuserpermissions(...args));
