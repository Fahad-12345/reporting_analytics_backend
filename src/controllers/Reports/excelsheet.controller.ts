import { NextFunction, Request, Response } from 'express';
import { ExcelService } from '../../services/Reports/excel.service';
import * as fs from 'fs';

export class ExcelController {
    public constructor(public excelservice: ExcelService) { }

    public getExcelFile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { body } = req;

            const response = await this.excelservice.generateExcelDataByReportType(body);
            if (req.accepts('text/csv')) {
                var csvContent = response;
            } else {
                res.status(406).send('Not Acceptable');
            }

            res.locals.data = { result: { csvContent: csvContent }, message_code: 'SUCCESS' };
            next();
            return undefined
        } catch (error) {
            next(error);
        }
    }
}
