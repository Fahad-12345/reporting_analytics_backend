import { Http } from '../../shared';
import { FilterService } from './filter.service';
import { ReportService } from './report.service';
import { ExcelService } from './excel.service';
// import { ExceldataService } from './exceldataService';


export const reportservice: ReportService = new ReportService(Http);
export const filterservice: FilterService = new FilterService(Http);
export const excelservice: ExcelService = new ExcelService(Http);
// export const exceldataservice: ExceldataService = new ExceldataService(Http);
