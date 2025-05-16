import * as dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import { ANY } from '../interfaces';
import { loggerService } from './aws-logger';

dotenv.config({ path: '../.env' });

export const errorHandler: (error: ANY, _req: Request, res: Response, _next: NextFunction) => ANY = async (error: ANY, _req: Request, res: Response, _next: NextFunction): Promise<ANY> => {
    const { body, query, headers, method, originalUrl } = _req;

    const additionalInfo: ANY = {
        body,
        headers,
        query,
        response: {
            message: error.errors || error.message || error.name || error,
            errors: error,
            status: 406,
        }
    };
    if (process.env.NODE_ENVR !== 'production') {
        console.log('error', error);
    }
    loggerService.logToCloudWatch(_req, res, 'error', additionalInfo);


    if (error.errors && Array.isArray(error.errors)) {
        return res.status(406).json({
            message: error.errors[0],
            errors: process.env.NODE_ENVR === 'production' ? null : error.errors
        });
    }


    return res.status(error.status || 406).json({
        message: error.message || error.name || error,
        errors: process.env.NODE_ENVR === 'production' ? null : error.errors
    });

};
