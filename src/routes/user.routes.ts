import { NextFunction, Request, RequestHandler, Response, Router } from 'express';

import { userController } from '../controllers';
import { requestLoggerMiddleWare } from '../utils/request-logger';

export const userRouter: Router = Router();

/**
 * GET routes
 */

userRouter.get('/', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => userController.get(...args), requestLoggerMiddleWare.logger);

/**
 * POST routes
 */


/**
 * PUT routes
 */


/**
 * DELETE routes
 */
