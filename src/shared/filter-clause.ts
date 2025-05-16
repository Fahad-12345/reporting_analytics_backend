export function qaLocationsFilter(locationAlias?: any): string {
    let whereClause = ``
    if (locationAlias) {
        whereClause = `AND ${locationAlias}.facility_location_id NOT IN ('33','34','35','38','41','43','11','46','48','49','77','92','99')`
    } else {
        whereClause = `AND facility_location_id NOT IN ('33','34','35','38','41','43','11','46','48','49','77','92','99')`
    }
    return whereClause;
}

export function qaSpecialitiesFilter(specialityAlias?: any): string {
    let whereClause = ``
    if (specialityAlias) {
        whereClause = `AND ${specialityAlias}.speciality_id NOT IN ('10','18','20','21','22','25','26','27','33','36')`
    } else {
        whereClause = `AND speciality_id NOT IN ('10','18','20','21','22','25','26','27','33','36')`
    }
    return whereClause;
}

export function qaProvidersFilter(providerOrDoctor: Boolean, providerAlias?: any): string {
    let whereClause = ``
    if (providerAlias) {
        if (providerOrDoctor) {
            whereClause = `AND ${providerAlias}.provider_id NOT IN ('50000')`;
        } else {
            whereClause = `AND ${providerAlias}.doctor_id NOT IN ('50000')`;
        }
    } else {
        if (providerOrDoctor) {
            whereClause = `AND provider_id NOT IN ('50000')`;
        } else {
            whereClause = `AND doctor_id NOT IN ('50000')`;
        }
    }
    return whereClause;
}

// Removing empty and QA data from patient filter
export const patientIdsToExclude = [17311, 6225, 17587, 3861];
export const excludedPatientNames = '4- 4- W';

export function generatePatientFilterClause(patientIdsToExclude: number[], excludedName: string) {
    const excludedIdsCondition = patientIdsToExclude.length > 0 ? `AND pt.patient_id NOT IN (${patientIdsToExclude.join(',')})` : '';
    const excludedNameCondition = excludedName ? `AND CONCAT(pt.first_name, ' ', pt.middle_name, ' ', pt.last_name) != '${excludedName}'` : '';
    return `${excludedIdsCondition} ${excludedNameCondition}`;
}

export function InvoiceRecipients(billRecipientType?: any): string {
    let InvoiceRecipientType = ``;
    switch (billRecipientType) {
        case 1:
            InvoiceRecipientType = 'Patient'
            break;
        case 2:
            InvoiceRecipientType = 'Employer'
            break;
        case 3:
            InvoiceRecipientType = 'Insurance'
            break;
        case 4:
            InvoiceRecipientType = 'Firm'
            break;
        case 5:
            InvoiceRecipientType = 'Other'
            break;

        default:
            break;
    }

    return InvoiceRecipientType;
}