import * as AWS from 'aws-sdk';
import { Request, Response } from 'express';

const cloudwatchlogs: AWS.CloudWatchLogs = new AWS.CloudWatchLogs({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
type ANY = any;

export class LoggerService {
    public logData = async (request: Request, response: Response, response_type?: string, additionalInfo?: ANY, resObjMessage?: ANY, formatedResultData?: ANY, resultData?: ANY, count?: number, checkReccursive?: boolean): Promise<ANY> => {
        try {
            const { method, originalUrl } = request;
            const logGroup: string = `${process.env.AWS_CLOUDWATCH_GROUP_NAME}`;
            const logStream: string = `${process.env.AWS_CLOUDWATCH_STREAM_NAME}`;
            const reqTag: string = 'http';
            const requestMethod: string = method;
            const requestUrl: string = originalUrl;
            const responseMessage: string = 'Requesting';
            const responseType: string = response_type ?? 'info';

            const userId: string = (request.body.user_id == undefined) ? (request.query.user_id as string) : (request.body.user_id as string);
            if (!response.locals.executionTimeInMs) {
                const executionTime = process.hrtime(response.locals.receptionTime);
                response.locals.executionTimeInMs = (executionTime[0] * 1000) + (executionTime[1] / 1000000);
            }

            const requestToGetToken: AWS.CloudWatchLogs.DescribeLogStreamsRequest = {
                descending: true,
                limit: 1,
                logGroupName: logGroup,
            };

            const params: AWS.CloudWatchLogs.PutLogEventsRequest = {
                logEvents: [
                    {
                        message: `[${responseType}], userId:${userId}, executionTime:${response.locals.executionTimeInMs} ${responseMessage} ${requestMethod} ${requestUrl}, ${JSON.stringify({ tags: reqTag, additionalInfo })} `,
                        timestamp: new Date().getTime()
                    },
                ],
                logGroupName: logGroup,
                logStreamName: logStream,
                sequenceToken: (await cloudwatchlogs.describeLogStreams(requestToGetToken).promise()).logStreams[0].uploadSequenceToken
            };

            await cloudwatchlogs.putLogEvents(params).promise();
            return null;

        } catch (error) {
            if (count < 5) {
                await this.logToCloudWatch(request, response, response_type, additionalInfo, resObjMessage, formatedResultData, resultData, count, true);
            } else {
                console.log('error', error);
            }

            return null;
        }

    }

    public logToCloudWatch = async (request: Request, response: Response, response_type?: string, additionalInfo?: ANY, resObjMessage?: ANY, formatedResultData?: ANY, resultData?: ANY, count?: number, checkReccursive?: boolean): Promise<ANY> => {

        try {

            let numberOfTries = count ? count : 0;

            if (checkReccursive) {
                numberOfTries = count + 1;
            }

            await this.logData(request, response, response_type, additionalInfo, resObjMessage, formatedResultData, resultData, numberOfTries, checkReccursive);
            return null;

        } catch (error) {
            return null;
        }

    }


}

export const loggerService: LoggerService = new LoggerService();
