
export enum FilterOptions {

}
export enum BillRecepientType {
    Patient = 1,
    Employer = 2,
    Insurance = 3,
    Attorney = 4,
    Other = 5
}

export enum paymentRecipientType {
    Patient = 1,
    Insurance = 2,
    LawFirm = 3,
    Employer = 4,
    Other = 5
}
export enum HighestPayingDropDown {
    Patient = 1,
    Employer = 4,
    Insurance = 2,
    Firm = 3,
}

export enum ExcludedUser {
    QaUser = 13,
}
export enum DateType {
    DOS = 1,
    BilledDate = 2,
    CheckDate = 3,
    PostedDate = 4
}
export enum GroupByID {
    Practice_Location = 1,
    Specialty = 2,
    Provider = 3,
    Patient = 4,
    Bill_Recipient_Type = 5,
    Insurance = 6,
    Attorney = 7,
    Bill_Status = 8,
    Payment_Status = 9,
    Case_Type = 10,
    Denial_Reason = 11,
    Law_Firm = 12,
    Employer = 13,
    Visit_Type = 14,
    Appointment_Status = 15,
    Practice = 16,
    Office = 25,
}

export enum AggregateType {
    Sum = 1,
    Average = 2,
    Standard_Deviation = 3,
    Count = 4,
    Distinct_Count = 5,
    Maximum = 6,
    Minimum = 7
}

export enum DateRange {
    Last_Month = 1,
    Last_Quarter = 2,
    Six_Months = 3,
    Three_Quarter = 4,
    Yearly = 5,
    Custom = 6
}
export enum ReportType {
    Payment_Detail_Report = 1,
    Payment_Summary_Report = 2,
    Account_Receivable_Report = 3,
    Denial_Report = 4,
    Denial_Detail_Report = 5,
    Appointment_Status_Report = 6,
    Appointment_Summary_Report = 7
}

export enum viewbyID {
    month = 1,
    quarterly = 2,
    yearly = 3,
    specialty = 4,
    visit_type = 5
}

export enum viewbyIDForAppt {
    month = 1,
    specialty = 2,
    visit_type = 14,
}
export const groupByNameMapping = {
    1: 'Practice Location',
    2: 'Specialty',
    3: 'Provider',
    4: 'Patient',
    6: 'Insurance',
    7: 'Attorney',
    8: 'Bill Status',
    9: 'Payment Status',
    10: 'Case Type',
    11: 'Denial Reason',
    14: 'Visit_Type',
    15: 'Appointment_Status',

};

export const viewByNameMapping = {
    1: 'Month',
    2: 'Specialty',
    14: 'Visit Type'
};

export const dateRangeClause = {
    "1": "1 month",
    "2": "3 month",
    "3": "6 month",
    "4": "9 month",
    "5": "12 month"
};

export const billRecipientMapping = {
    1: 'Patient',
    2: 'Employer',
    3: 'Insurance',
    4: 'Attorney',
    5: 'Other'
};

export function setInvoiceFilter(bill_recipient_type_id: BillRecepientType | null, bill_recipient_type_name?: string): string {
    // Define a mapping for non-null bill_recipient_type_ids
    const invoiceLabels = {
        [BillRecepientType.Patient]: 'Patient',
        [BillRecepientType.Employer]: 'Employer',
        [BillRecepientType.Insurance]: 'Insurance',
        [BillRecepientType.Attorney]: 'Firm',
        [BillRecepientType.Other]: 'Other'
    };

    if (bill_recipient_type_id !== null) {
        // If bill_recipient_type_id is not null, use the mapping
        return ` AND jsonb_each.value->>'invoice_to_label' = '${invoiceLabels[bill_recipient_type_id]}'`;
    } else if (bill_recipient_type_name) {
        // If bill_recipient_type_id is null, compare using the bill_recipient_type_name
        return ` AND jsonb_each.value->>'invoice_to_label' = ${bill_recipient_type_name}`;
    }
    // Return an empty string or a default filter if both are null
    return '';
}

export function generateDynamicJoins(tableAlias) {
    return `
        LEFT JOIN insurance_dim AS insDim ON CAST(${tableAlias}.value->> 'invoice_to_id' AS INT) = insDim.insurance_id AND insDim.deleted_at IS NULL
        AND ${tableAlias}.value->>'invoice_to_label'='Insurance'
        LEFT JOIN patient_dim AS patDim ON CAST(${tableAlias}.value->> 'invoice_to_id' AS INT) = patDim.patient_id AND patDim.deleted_at IS NULL
        AND ${tableAlias}.value->>'invoice_to_label'='Patient'
        LEFT JOIN firms_dim AS firmDim ON CAST(${tableAlias}.value->> 'invoice_to_id' AS INT) = firmDim.firm_id AND firmDim.deleted_at IS NULL
        AND ${tableAlias}.value->>'invoice_to_label'='Firm'
        LEFT JOIN employer_dim AS empDim ON CAST(${tableAlias}.value->> 'invoice_to_id' AS INT) = empDim.employer_id AND empDim.deleted_at IS NULL
        AND ${tableAlias}.value->>'invoice_to_label'='Employer'
    `;
}
