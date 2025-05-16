import { NextFunction, Request, Response } from 'express';
import { FilterService } from '../../services/Reports/filter.service'; // Import your filter service

export class FilterController {
    public constructor(public filterService: FilterService) {
    }

    public getFilteredData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { body } = req;
            const response = await this.filterService.getFilteredData();
            res.locals.data = { result: { data: response }, message_code: 'SUCCESS' };
            next();
            return undefined;
        }
        catch (error) {
            next(error);
        }
    }
}
