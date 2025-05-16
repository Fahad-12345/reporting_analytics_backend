export function ReportFilterQueryHelper(reportFilters: any): string {
    // Destructure the input data with default values as undefined
    reportFilters = reportFilters || {};
    const {
        case_type_ids,
        practice_locations_ids,
        visit_type_ids,
        status_id,
        doctor_ids,
        fromDate,
        toDate,
        speciality_ids,
    } = reportFilters;

    // Start with a default WHERE clause
    let whereClause = `(ctd.case_type_id is NOT NULL 
    OR fl.facility_location_id is NOT NULL
     OR atd.appointment_type_id is NOT NULL
     OR vssd.visit_session_state_id is NOT NULL
     OR phd.physician_id is NOT NULL
     OR sd.specialty_id is NOT NULL)`;

    // If case_type_ids are provided, filter by them
    if (case_type_ids && case_type_ids.length > 0) {
        const quotedCaseTypeIds = case_type_ids.map(id => `'${id}'`).join(', ');
        whereClause += ` AND ctd.case_type_id IN (${quotedCaseTypeIds})`;
    }

    // If practice_location_ids are provided, filter by them
    if (practice_locations_ids && practice_locations_ids.length > 0) {
        const quotedLocationIds = practice_locations_ids.map(id => `'${id}'`).join(', ');
        whereClause += ` AND fl.facility_location_id IN (${quotedLocationIds})`;
    }

    // If visit_type_ids are provided, filter by them
    if (visit_type_ids && visit_type_ids.length > 0) {
        const quotedAppointmentTypeIds = visit_type_ids.map(id => `'${id}'`).join(', ');
        whereClause += ` AND atd.appointment_type_id IN (${quotedAppointmentTypeIds})`;
    }

    // If visit_session_state_ids are provided, filter by them
    if (status_id && status_id.length > 0) {
        const quotedSessionStateIds = status_id.map(id => `'${id}'`).join(', ');
        whereClause += ` AND vssd.visit_session_state_id IN (${quotedSessionStateIds})`;
    }

    // If physician_ids are provided, filter by them
    if (doctor_ids && doctor_ids.length > 0) {
        const quotedPhysicianIds = doctor_ids.map(id => `'${id}'`).join(', ');
        whereClause += ` AND phd.physician_id IN (${quotedPhysicianIds})`;
    }

    // If speciality_ids are provided, filter by them
    if (speciality_ids && speciality_ids.length > 0) {
        const quotedSpecialityIds = speciality_ids.map(id => `'${id}'`).join(', ');
        whereClause += ` AND sd.specialty_id IN (${quotedSpecialityIds})`;
    }
    if (fromDate && toDate) {
        whereClause += ` AND af.scheduled_date_time >= '${fromDate}' AND af.scheduled_date_time <= '${toDate}'`;
    }

    return whereClause;
}
