import { Request } from 'express';
export interface ReportRequest extends Request {
    ReportObject: {
        case_type_ids: number[],
        facility_location_ids: number[];
        speciality_ids: number[];
        doctor_ids: [],
        bill_recipient_type_id: number,
        insurance_ids: number[],
        patient_ids: number[],
        attorney_ids: number[],
        employer_ids: number[],
        As_of: Date,
        start_date: Date,
        end_date: Date,
        group_by_id: number,
        subgroup_by_id: number,
        Aggregate: number,
        date_range_type_id: number,
        date_type: number,
        firm_ids: number[],
        visit_type_ids: number[],
        page: number,
        per_page: number,
        appointment_status_ids: number[],
        case_ids: number[],
        clinic_location_ids: number[],
        in_house: string,
    };
    Denial_detail_report_Object: {
        facility_location_ids: number[],
        denial_reason: string,
        columnName: string,
        maingroup_by_id: string,
        mainsubgroup_by_id: string,
        denial_type_id: string,
        group_by_name: any,
        sub_group_by_name: any,
        group_by_id: string,
        subgroup_by_id: string,
        date_range_type_id: number,
        date_type: number,
        start_date: Date,
        end_date: Date,
        case_type_ids: number[],
        patient_ids: number[],
        insurance_ids: number[],
        doctor_ids: number[]
    }
    Ar_Detail_report_Object: {
        columnName: string,
        bill_recipient_name: string,
        invoice_recipient_name: string,
        bill_recipient_id: number,
        Invoice_Recipient_Id: number,
        subgroup_by_name: string,
        subgroup_by_id: number,
        group_by_name: string,
        group_by_id: number,
        bill_recipient_type_name: string,
        bill_recipient_type_id: number,
        date_type: number,
        start_date: Date,
        end_date: Date,
        maingroup_by_id: number,
        mainsubgroup_by_id: number,
        facility_location_ids: number[],
        case_type_ids: number[],
        speciality_ids: number[],
        doctor_ids: number[],
        insurance_ids: number[],
        patient_ids: number[],
        attorney_ids: number[],
        employer_ids: number[],
        firm_ids: number[]
    }
}

export interface reportExcel {
    recipientName: string,
    recipientTypeName: string,
    headerresult: string[],
    desiredOrder: string[],
    orderedHeader: string[],
    detailResult: any[]
}

