import * as Sequelize from 'sequelize';

export type SequelizeTransaction = Sequelize.Transaction;

export interface Paginate {
    page?: number;
    paginate?: number;
}

interface AuthorizationI {
    Authorization: string;
}

export interface GeneralResponseDataI<I> {
    data: unknown[] | I;
    total?: number;
}

export interface GeneralApiResponseI<I> {
    message: string;
    result: GeneralResponseDataI<I>;
    status: boolean;
}

// tslint:disable-next-line: no-any
export type ANY = any;

export interface Filter {
    /** Where clause */
    [key: string]: ANY;
}

export interface Where {
    [key: string]: ANY;
}

export interface Options {
    [key: string]: ANY;
}

export interface Paginate {
    page?: number;
    paginate?: number;
}

interface AuthorizationI {
    Authorization: string;
}

export interface GenericQueryParamsI { [key: string]: number | string | null | undefined | [string | number]; }

export interface GenericHeadersI {
    [key: string]: ANY;
    headers?: AuthorizationI;
    params?: GenericQueryParamsI;
}

export type GenericReqObjI = ANY;

export interface GeneralResponseDataI<I> {
    data: unknown[] | I;
    total?: number;
}

export interface GeneralApiResponseI<I> {
    message: string;
    result: GeneralResponseDataI<I>;
    status: boolean;
}
export interface ResponseObject {
    current_interest: number,
    previous_interest: number,
    current_billed: number,
    previous_billed: number,
    total_payment_received: number,
    previous_payment_received: number,
    current_account_receivable: number,
    previous_account_receivable: number,
    current_writeoff: number,
    previous_writeoff: number,
    interest_difference: number,
    billed_difference: number,
    payment_received_difference: number,
    account_receivable_difference: number,
    writeoff_difference: number,
    isInterestPositive: boolean,
    isBilledPositive: boolean,
    isPaymentPositive: boolean,
    isReceivablesPositive: boolean,
    isWriteoffPositive: boolean,
};
export interface MonthInfo {
    totalDays: number,
    startDate: Date,
    endDate: Date,
}

export interface PmSummaryResponseObject {
    Denial_Rate_current_number: number,
    Denial_Rate_current_total_number: number,
    Denial_Rate_previous_number: number,
    Denial_Rate_previous_total_number: number,
    Denial_Rate_current: number,
    Denial_Rate_previous: number,
    Denial_Rate_changed: number,
    Denial_is_Positive: boolean,

    Cancel_current_number: number,
    Cancel_current_total_number: number,
    Cancel_previous_number: number,
    Cancel_previous_total_number: number,
    Cancel_current: number,
    Cancel_previous: number,
    Cancel_changed: number,
    Cancel_is_Positive: boolean,

    Unbilled_Visit_current_number: number,
    Unbilled_Visit_current_total_number: number,
    Unbilled_Visit_previous_number: number,
    Unbilled_Visit_previous_total_number: number,
    Unbilled_Visit_current: number,
    Unbilled_Visit_previous: number,
    Unbilled_Visit_changed: number,
    Unbilled_is_Positive: boolean,

    Appointment_current_number: number,
    Appointment_current_total_number: number,
    Appointment_previous_number: number,
    Appointment_previous_total_number: number,
    Appointment_current: number,
    Appointment_previous: number,
    Appointment_changed: number,
    Appointment_is_Positive: boolean,

    WaitTime_current: number,
    WaitTime_previous: number,
    WaitTime_changed: number,
    WaitTime_is_Positive: boolean,
}


export interface PatientResponseObject {
    newPatients: number,
    newPateintsPrevious: number,
    newPatientChanged: number,
    newPatientIsPositive: boolean,

    returningPatients: number,
    returningPateintsPrevious: number,
    returningPatientsChanged: number,
    returningPatientsIsPositive: boolean,

    newCases: number,
    previousCases: number,
    newCasesChanged: number,
    newCasesIsPositive: boolean,
}

export interface ProviderSummaryResponseObject {
    Appointment_current_number: number,
    Appointment_current_total_number: number,
    Appointment_previous_number: number,
    Appointment_previous_total_number: number,
    Appointment_current: number,
    Appointment_previous: number,
    Appointment_changed: number,
    Appointment_is_Positive: boolean,

    Cancel_current_number: number,
    Cancel_current_total_number: number,
    Cancel_previous_number: number,
    Cancel_previous_total_number: number,
    Cancel_current: number,
    Cancel_previous: number,
    Cancel_changed: number,
    Cancel_is_Positive: boolean,

    Unfinalized_Visit_current_number: number,
    Unfinalized_Visit_current_total_number: number,
    Unfinalized_Visit_previous_number: number,
    Unfinalized_Visit_previous_total_number: number,
    Unfinalized_Visit_current: number,
    Unfinalized_Visit_previous: number,
    Unfinalized_Visit_changed: number,
    Unfinalized_is_Positive: boolean,
}

export interface PaymentSummaryObject {

    id_no: number | null,
    bill_date: number | null | string,
    group_by_name: string | null,
    billed_amount: string,
    paid_amount: string,
    outstanding_amount: string,
    write_off_amount: string,
    overpayment: string,
    interest_amount: string,


}

export interface PaymentSummaryObject {

    id_no: number | null,
    bill_date: number | null | string,
    group_by_name: string | null,
    subgroup_by_name: string | null,
    billed_amount: string,
    paid_amount: string,
    outstanding_amount: string,
    write_off_amount: string,
    overpayment: string,
    interest_amount: string,
    groupByNameMapping: any

}

export interface PaymentSummarydates {
    group_by_name?: string,
    countEntries?: number,
    billed_amount?: number | [],
    paid_amount?: number | [],
    outstanding_amount?: number | [],
    write_off_amount?: number | [],
    overpayment?: number | [],
    interest_amount?: number | []
}

export type PaymentSummaryArray = PaymentSummaryObject[];

export type GranularDataItem = {
    date_label: string | number | Date;
    Cancelled_Noshows?: number;
    completed?: number;
    re_scheduled?: number;
    Scheduled?: number;
};

export type GenericAppointmentData<T extends GranularDataItem[] = GranularDataItem[]> = {
    granular_data: T | undefined[];
    no_show: number;
    Cancelled: number;
    completed: number;
    'Total Appointments': number;
    re_scheduled: number;
};

export type timeSpanMappings = {
    1?: string | {};
    2?: any;
    3?: string | {};
    4?: string | number | {};
    5?: any;
    default?: string | {};
}

export type missingvisitsObject = {
    case_type_name: any,
    missing_icd: any,
    missing_cpt: any,
    missing_document: any
}

export interface AuthReturn {
    dashboard_type: string[] | any,
    report_type: string[] | any
}

export type ExportFilterType =
    'IN' | 'DATE_RANGE_START' | 'DATE_RANGE_END' | 'MONTH' | 'TIME_SPAN' | 'GRANULARITY' | 'IN_ARRAY';

export type innerFilterType =
    1 | 2 | 3 | 4;

export interface ExportFilter {
    column: string;
    type: ExportFilterType;
    innerfiltertype?: innerFilterType;
    filtersAlias?: string;
    innerfilter?: string;
    innerfilteralias?: string;
}

export interface ExportFilters {
    [key: string]: Filter;
}
export interface innerfilters {
    [key: string]: Filter;
}

export interface ExportJoin {
    alias: string;
    toSelect?: string[];
    subjoincondition?: string[],
    joinChecks?: string[];
}

export interface ExportLeftJoin {
    [key: string]: ExportJoin;
}

export interface ExportInnerJoin {
    [key: string]: ExportJoin;
}


export interface ExportChartDetail {
    tableName: string;
    alias: string;
    toSelect?: string[];
    selectAggregate?: string[];
    explicitChecks: string[];
    leftJoin?: ExportLeftJoin;
    innerJoin?: ExportInnerJoin;
    filters: ExportFilters;
    having?: string
    innerfilters?: innerfilters;
    innerfilteralias?: string;
    filterAlias?: string;
    orderby?: string;
}

export interface ExportChartsDetails {
    [key: string]: ExportChartDetail;
}
export interface referralFilter {
    selectClause: string,
    subGroupByClause: string,
    joinCondition: string,
    joinClause: string,
    whereClause: string,
    groupByClause: string,
    extraJoins: string,
    extraSelect: string,
    extraGroupBy: string,
    extraWhereClause: string
}

export interface patientFirstAppointment {
    patient_name?: string,
    accident_date?: string,
    case_type_name?: string,
    patient_phone_no?: string,
    patient_cell_no?: string,
    insurance_name?: string
}

export interface eachPatientInfo {
    scheduled_date_time?: string,
    code_description?: string,
    speciality_name?: string,
    appointment_type?: string
    appointment_status_name?: string
}

export interface SummaryRow {
    totalVC?: number;
    totalNS?: number;
    totalSC?: number;
    grandTotal?: number;
}

export interface summaryReportGroup {
    outside_referring_address?: string;
    outside_phone?: number | string;
    outside_fax?: number | string;
    sc?: string;
    vc?: string;
    ns?: string;
    total?: string;
}