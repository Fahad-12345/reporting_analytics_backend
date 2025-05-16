import * as dotenv from 'dotenv';

import { responses } from '../config/codes';

dotenv.config({ path: '../.env' });

interface GenerateMsgI {
    [key: string]: number | string;
}

export const generateMessages: (code: string, validator?: boolean) => GenerateMsgI = (code: string, validator: boolean): GenerateMsgI => {

    if (validator) {
        return responses[`${process.env.ENV_LANG}`].validator[`${code}`];
    }

    return responses[`${process.env.ENV_LANG}`][`${code}`];

};
