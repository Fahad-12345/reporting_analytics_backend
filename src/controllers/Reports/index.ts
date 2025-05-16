import { excelservice, filterservice, reportservice } from '../../services/Reports';
import { FilterController } from './filter.controller';
import { ReportController } from './report.controller';
import { ExcelController } from './excelsheet.controller';

export const reportController: ReportController = new ReportController(reportservice);
export const filtercontroller: FilterController = new FilterController(filterservice);
export const excelcontroller: ExcelController = new ExcelController(excelservice);