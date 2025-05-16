import { sequelize } from '../config/database';
import { AuthReturn } from '../interfaces';
import { GlobalFiltersRequest } from "../interfaces/contracts/request_model";
import { Helper, Http } from "../shared";

export class AuthService extends Helper {
    public __http: Http;
    public constructor(public http: typeof Http) {
        super();
        this.__http = new http();
    }
    public getuserpermissions = async (reqData) => {
        try {
            const {
                user_id
            }: GlobalFiltersRequest["auth"] = reqData;

            // Validate user_id
            if (!Number.isInteger(user_id) || user_id <= 0) {
                throw new Error("Invalid user_id. Please provide a valid user_id.");
            }
            const query: string = `
                SELECT
                dashboard_type,report_type
                FROM
                dashboard_reports_auth
                WHERE
                user_id = ${user_id}
            `;
            const [results] = await sequelize.query(query);
            const mergedData: AuthReturn = {
                dashboard_type: [],
                report_type: []
            };
            if (Array.isArray(results)) {
                results.forEach(item => {
                    const dashboardType: [] = item["dashboard_type"];
                    const reportType: [] = item["report_type"];

                    if (!mergedData.dashboard_type.includes(dashboardType)) {
                        mergedData.dashboard_type.push(dashboardType);
                    }

                    if (!mergedData.report_type.includes(reportType)) {
                        mergedData.report_type.push(reportType);
                    }
                });

                return mergedData;
            } else {
                throw new Error("Invalid structure");
            }
        } catch (error) {
            throw error;
        }
    }
};

