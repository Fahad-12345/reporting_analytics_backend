import {
    userRepository,
} from '../repositories';

import { Http } from '../shared/http';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';
import { GlobalService } from './global.service';
import { PracticeManagerService } from './practice.manager.service';
import { ProviderService } from './provider.service';
import { UserService } from './user.service';

export const userService: UserService = new UserService(
    userRepository,
    Http
);
export const adminService: AdminService = new AdminService(
    Http
);
export const practiceManagerService: PracticeManagerService = new PracticeManagerService(
    Http
);
export const providerService: ProviderService = new ProviderService(
    Http
);
export const globalService: GlobalService = new GlobalService(
    Http
);
export const authService: AuthService = new AuthService(
    Http
);
