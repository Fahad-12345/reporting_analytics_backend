// FilterService.ts
import { sequelize } from '../../config/database';
import { Helper, Http } from '../../shared';
import { generatePatientFilterClause, patientIdsToExclude, excludedPatientNames } from '../../shared/filter-clause';
import { ExcludedUser } from './report.enum';
export class FilterService extends Helper {
    public __http: Http;

    public constructor(public http: typeof Http) {
        super();
        this.__http = new http();
    }

    public getFilteredData = async () => {
        try {

            const RemoveNullPatientData = generatePatientFilterClause(patientIdsToExclude, excludedPatientNames)
            const filterquery = `
            SELECT
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', ctd.case_type_id::integer,
                        'name', ctd.name
                    ) ORDER BY ctd.name -- Alphabetical sorting by name
                ) AS case_types
                FROM (
                    SELECT case_type_id, name
                    FROM case_types_dim
                    where (created_by::integer IS NULL OR created_by::integer != 13) AND (updated_by::integer IS NULL OR updated_by::integer != 13) AND deleted_at IS NULL
                    LIMIT 8
                ) as ctd
            ) AS case_types,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', ed.employer_id::integer,
                        'name', ed.employer_name
                    ) ORDER BY ed.employer_name -- Alphabetical sorting by employer_name
                ) AS employers
                FROM (
                    SELECT employer_id, employer_name
                    FROM employer_dim
                    where is_verified::boolean = 'true' AND (created_by::integer IS NULL OR created_by::integer != ${ExcludedUser.QaUser}) AND (updated_by::integer IS NULL OR updated_by::integer != ${ExcludedUser.QaUser}) AND deleted_at IS NULL
                ) as ed
            ) AS employers,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', fl.facility_location_id::integer,
                        'name', CONCAT(facdim.facility_qualifier, '-' ,fl.facility_location_name )
                    )  ORDER BY CONCAT(facdim.facility_qualifier, '-' ,fl.facility_location_name ) -- Alphabetical sorting by location name
                ) AS practice_locations
                FROM facility_location_dim as fl
                LEFT JOIN facilities_dim facdim On fl.facility_id = facdim.facility_id
                
              where fl.facility_location_id NOT IN ('1','9','33','34','35','38','41','43','11','46','48','49','77','92','99') AND (fl.created_by::integer IS NULL OR fl.created_by::integer != 13) AND (fl.updated_by::integer IS NULL OR fl.updated_by::integer != 13) AND fl.deleted_at IS NULL
            ) AS practice_locations,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', atd.appointment_type_id::integer,
                        'name', atd.qualifier
                    ) ORDER BY atd.qualifier -- Alphabetical sorting by appointment type qualifier
                ) AS visit_types
                FROM appointment_type_dim as atd
                where (created_by::integer IS NULL OR created_by::integer != ${ExcludedUser.QaUser}) AND (updated_by::integer IS NULL OR updated_by::integer != ${ExcludedUser.QaUser}) AND deleted_at IS NULL
            ) AS visit_types,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', vssd.visit_session_state_id::integer,
                        'name', vssd.visit_session_state_name
                    )
                ) AS statuses
                FROM visit_session_state_dim as vssd
                where (created_by::integer IS NULL OR created_by::integer != ${ExcludedUser.QaUser}) AND (updated_by::integer IS NULL OR updated_by::integer != ${ExcludedUser.QaUser}) AND deleted_at IS NULL
            ) AS statuses,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', fd.firm_id::integer,
                        'name', fd.firm_name
                    ) ORDER BY fd.firm_name -- Alphabetical sorting by firm name
                ) AS Firm_Name
                FROM firms_dim as fd
                where is_firm_verified::boolean = 'true' AND (created_by::integer IS NULL OR created_by::integer != ${ExcludedUser.QaUser}) AND (updated_by::integer IS NULL OR updated_by::integer != ${ExcludedUser.QaUser}) AND deleted_at IS NULL  
            ) AS Firm_Name,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', ud.user_id::integer,
                        'name', CONCAT(ud.first_name, ' ', ud.middle_name, ' ', ud.last_name)
                    ) ORDER BY CONCAT(ud.first_name, ' ', ud.middle_name, ' ', ud.last_name) -- Alphabetical sorting by provider name
                ) AS providers
                FROM users_dim as ud
                LEFT JOIN roles_dim AS roles ON ud.role_Id = roles.role_id
                where ud.first_name IS NOT NULL AND roles.medical_identifiers::Boolean = true AND ud.user_id != 13 and ud.status = 1 AND ud.deleted_at IS NULL
            ) AS providers,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', sd.specialty_id::integer,
                        'name', sd.name
                    ) ORDER BY sd.name -- Alphabetical sorting by specialty name
                ) AS specialities
                FROM specialities_dim as sd
                  WHERE sd.specialty_id NOT IN ('10','18','20','21','22','23','25','26','27','33','36') AND (created_by::integer IS NULL OR created_by::integer != 13) AND (updated_by::integer IS NULL OR updated_by::integer != 13) AND deleted_at IS NULL
            ) AS specialities,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', at.attorney_id::integer,
                        'name', CONCAT(at.first_name, ' ', at.middle_name, ' ', at.last_name)
                    ) ORDER BY CONCAT(at.first_name, ' ', at.middle_name, ' ', at.last_name) -- Alphabetical sorting by attorney name
                ) AS attornies
                FROM attorney_dim as at
                where is_verified::boolean = 'true' AND (created_by::integer IS NULL OR created_by::integer != ${ExcludedUser.QaUser}) AND (updated_by::integer IS NULL OR updated_by::integer != ${ExcludedUser.QaUser}) AND deleted_at IS NULL
            ) AS attornies,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', inc.insurance_id::integer,
                        'name', inc.insurance_name
                    ) ORDER BY inc.insurance_name -- Alphabetical sorting by insurance name
                ) AS insurances
                FROM insurance_dim as inc
                where is_insurance_verified::boolean = 'true' AND inc.insurance_name IS NOT NULL AND (created_by::integer IS NULL OR created_by::integer != ${ExcludedUser.QaUser}) AND (updated_by::integer IS NULL OR updated_by::integer != ${ExcludedUser.QaUser}) AND deleted_at IS NULL
            ) AS insurances,
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', pt.patient_id::integer,
                        'name', CONCAT(pt.first_name, ' ', pt.middle_name, ' ', pt.last_name)
                    ) ORDER BY CONCAT(pt.first_name, ' ', pt.middle_name, ' ', pt.last_name) -- Alphabetical sorting by patient name
                ) AS patients
                FROM patient_dim as pt
                where (created_by::integer IS NULL OR created_by::integer != ${ExcludedUser.QaUser}) AND (updated_by::integer IS NULL OR updated_by::integer != ${ExcludedUser.QaUser}) 
                ${RemoveNullPatientData}
                AND deleted_at IS NULL
            ) AS patients
        `

            const results = await sequelize.query(filterquery);
            return results[0];
        } catch (error) {
            throw error;
        }
    }
}
