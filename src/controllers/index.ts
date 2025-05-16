

import {
    adminService,
    authService,
    globalService,
    practiceManagerService,
    providerService,
    userService
} from '../services';
import { AdminController } from './admin.controller';
import { AuthController } from './auth.controller';
import { PracticeManagerController } from './practice.manager.controller';
import { ProviderController } from './provider.controller';

import { GlobalFilterController } from './global-filters.controller';
import { UserController } from './user.controller';


export const authController: AuthController = new AuthController(authService);
export const userController: UserController = new UserController(userService);
export const globalFilterController: GlobalFilterController = new GlobalFilterController(globalService);
export const adminController: AdminController = new AdminController(adminService);
export const providerController: ProviderController = new ProviderController(providerService);
export const practiceManagerController: PracticeManagerController = new PracticeManagerController(practiceManagerService);

