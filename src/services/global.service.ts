
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import * as typings from '../interfaces';
import { Helper, Http } from "../shared";
import { qaLocationsFilter } from '../shared/filter-clause';
export class GlobalService extends Helper {
    public __http: Http;
    public constructor(

        public http: typeof Http
    ) {
        super();
        this.__http = new http();
    }


    public get = async (reqData: typings.GenericReqObjI, _authorization: string): Promise<object> => {
        let query1: string = `
        WITH extractedData AS (
            SELECT 
                facilities.facility_id AS facility_id,
                facilities.facility_qualifier AS facility_name,
                facilities.facility_name AS facilities_name,
                usrFacDim.facility_location_id AS facility_location_id,
                facLocDim.facility_location_name AS facility_location_name,
                usrFacDim.specialty_id AS speciality_id,
                specialities.name AS speciality_name,
                usrFacDim.user_id AS physician_id,
                CONCAT(users.first_name, ' ', users.middle_name, ' ', users.last_name) AS physician_name
            FROM user_facilities_dim usrFacDim
            INNER JOIN facility_location_dim facLocDim 
                ON usrFacDim.facility_location_id = facLocDim.facility_location_id 
                AND facLocDim.deleted_at IS NULL 
                AND facLocDim.facility_location_name IS NOT NULL
            LEFT JOIN facilities_dim facilities 
                ON facLocDim.facility_id = facilities.facility_id 
                AND facilities.deleted_at IS NULL
            RIGHT JOIN specialities_dim specialities 
                ON usrFacDim.specialty_id = specialities.specialty_id 
                AND specialities.deleted_at IS NULL 
                AND specialities.name IS NOT NULL
            INNER JOIN users_dim users 
                ON usrFacDim.user_id = users.user_id 
                AND users.deleted_at IS NULL
            LEFT JOIN roles_dim roles 
                ON users.role_id = roles.role_id 
                AND roles.deleted_at IS NULL
            WHERE 
                users.first_name IS NOT NULL 
                AND specialities.name IS NOT NULL 
                AND roles.medical_identifiers::Boolean = true 
                AND users.user_id != 13 
                AND users.status = 1
                AND (usrFacDim.created_by::integer IS NULL OR usrFacDim.created_by::integer != 13) 
                AND (usrFacDim.updated_by::integer IS NULL OR usrFacDim.updated_by::integer != 13)
                ${qaLocationsFilter('usrFacDim')}
                AND usrFacDim.specialty_id NOT IN ('10', '18', '20', '21', '22', '23', '25', '26', '27', '33', '36') 
        ),
        LocationsDis AS (
            SELECT DISTINCT
                facility_id,
                facility_name,
                facilities_name,
                facility_location_id,
                facility_location_name
            FROM extractedData
        ),
        SpecProvs AS (
            SELECT
                locDis.facility_id,
                locDis.facility_name,
                locDis.facilities_name,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'facility_location_id', locDis.facility_location_id,
                        'facility_location_name', locDis.facility_location_name,
                        'speciality_id', locDis.speciality_id,
                        'speciality_name', locDis.speciality_name
                    ) ORDER BY locDis.facility_location_name
                ) AS specialities,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'speciality_id', locDis.speciality_id,
                        'speciality_name', locDis.speciality_name,
                        'provider_id', locDis.physician_id,
                        'provider_name', locDis.physician_name
                    ) ORDER BY locDis.physician_name
                ) AS providers
            FROM extractedData locDis
            GROUP BY 
                locDis.facility_id, 
                locDis.facility_name,
                locDis.facilities_name
        ),
        LocsGrouped AS (
            SELECT 
                locDis.facility_id,
                locDis.facility_name,
                locDis.facilities_name,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'facility_location_id', locDis.facility_location_id,
                        'facility_location_name', locDis.facility_location_name
                    ) ORDER BY locDis.facility_location_name
                ) AS locations
            FROM LocationsDis locDis
            GROUP BY 
                locDis.facility_id, 
                locDis.facility_name,
                locDis.facilities_name
        )
        SELECT 
            SpecProvs.*, 
            LocsGrouped.locations 
        FROM 
            SpecProvs 
        JOIN 
            LocsGrouped ON LocsGrouped.facility_id = SpecProvs.facility_id
        ORDER BY 
            SpecProvs.facility_name;
        
        

        `;
        let query2: string = `
            SELECT
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'case_type_id', casTypDim.case_type_id::integer,
                        'case_type_name', casTypDim.name
                    )
                ) AS casetypes
            FROM case_types_dim as casTypDim
            where slug IS NOT NULL and deleted_at IS NULL
            GROUP BY casTypDim.name
            ORDER BY casTypDim.name

        `;


        const dependent: object[] = await sequelize.query(query1, { type: QueryTypes.SELECT });
        const independent: object[] = await sequelize.query(query2, { type: QueryTypes.SELECT });
        const result: object = {
            dependents: dependent,
            independent: independent
        }
        return result;
    }
}