import { Router } from 'express';
import { requestLoggerMiddleWare } from '../utils/request-logger';
import { adminRouter } from './admin.routes';
import { globalFilterRouter } from './global-filters.routes';


import { ReportRouter } from './Reportroute';
import { AuthRouter } from './auth.routes';
import { ExcelRouter } from './excelroute';
import { filterRouter } from './filter.routes';
import { practiceManagerRouter } from './practice.manager.routes';
import { providerRouter } from './provider.routes';
export const routes: Router = Router();
routes.use('/provider', providerRouter, requestLoggerMiddleWare.logger);
routes.use('/admin', adminRouter, requestLoggerMiddleWare.logger);
routes.use('/practice-manager', practiceManagerRouter, requestLoggerMiddleWare.logger)
routes.use('/global-filter-dropdowns', globalFilterRouter, requestLoggerMiddleWare.logger);
routes.use('/provider', providerRouter, requestLoggerMiddleWare.logger);
routes.use('/report', ReportRouter, requestLoggerMiddleWare.logger);
routes.use('/report-filter', filterRouter, requestLoggerMiddleWare.logger);
routes.use('/excel', ExcelRouter, requestLoggerMiddleWare.logger);
routes.use('/auth', AuthRouter, requestLoggerMiddleWare.logger);
