export enum PayerRecepientType {
    Patient = 1,
    Insurance = 2,
    LawFirm = 3,
    Employer = 4,
    Other = 5,
    InvPatient = "Patient",
    InvInsurance = "Insurance",
    InvLawFirm = "Firm",
    InvEmployer = "Employer",
    InvOther = "Other"
}

export interface Filter {
    speciality_ids?: number[];
    provider_ids?: number[];
    case_type_ids?: number[];
    facility_location_ids?: number[];
    fromDate?: string;
    toDate?: string;
    month_id?: number;
    time_span_id?: number;
}