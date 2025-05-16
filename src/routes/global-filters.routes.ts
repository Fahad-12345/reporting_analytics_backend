import { NextFunction, Request, RequestHandler, Response, Router } from 'express';

import { globalFilterController } from '../controllers';

export const globalFilterRouter: Router = Router();


/**
 * GET routes
 */

globalFilterRouter.get('/', (...args: [Request, Response, NextFunction]): Promise<RequestHandler> => globalFilterController.get(...args));


/**
 * POST routes
 */


/**
 * PUT routes
 */


/**
 * DELETE routes
 */