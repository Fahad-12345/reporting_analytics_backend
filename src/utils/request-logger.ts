import { NextFunction, Request, RequestHandler, Response } from 'express';
import { loggerService } from './aws-logger';

import { ANY } from '../interfaces';
import { generateMessages } from '../utils/generate-message';

class RequestLoggerMiddleWare {

    public logger = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        try {

            const { locals: { data: { message_code: messageCode, result: resultData, message, status } } } = res;
            const { body, headers, query } = req;
            const resObjMessage: ANY = messageCode ? {
                ...generateMessages(messageCode)
            } : {
                message
            };
            const size: number = Buffer.byteLength(JSON.stringify(resultData));

            const kiloBytes: number = size / 1024;

            const formatedResultData: ANY = kiloBytes <= 200 ? resultData : 'Data is to large to store';

            const additionalInfo: ANY = {
                body,
                headers,
                query,
                response: {
                    ...resObjMessage,
                    result: formatedResultData,
                    status: 200,
                }
            };

            const numberCount: number = 0;
            // tslint:disable-next-line: no-floating-promises
            loggerService.logToCloudWatch(req, res, 'info', additionalInfo, resObjMessage, formatedResultData, resultData, numberCount, false);


            res.status(200).json({
                ...resObjMessage,
                result: { ...resultData },
                status: status ? status : 200,
            });

            return undefined;

        } catch (err) {
            next(err);
        }
    }

}

export const requestLoggerMiddleWare: RequestLoggerMiddleWare = new RequestLoggerMiddleWare();
