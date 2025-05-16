import { ReportRequest } from './../../services/Reports/ReportContract/RequestInterface/request-model';
import { body } from 'express-validator';

export const reportObjectValidations =
    [
        body('ReportObject.case_type_ids').isArray().withMessage('case_type_ids must be an array of numbers'),
        body('ReportObject.facility_location_ids').isArray().withMessage('facility_location_ids must be an array of numbers'),
        body('ReportObject.speciality_ids').isArray().withMessage('speciality_ids must be an array of numbers'),
        body('ReportObject.doctor_ids').isArray().withMessage('doctor_ids must be an array'),
        body('ReportObject.bill_recipient_type_id').isNumeric().withMessage('bill_recipient_type_id must be a number'),
        body('ReportObject.insurance_ids').isArray().withMessage('insurance_ids must be an array of numbers'),
        body('ReportObject.patient_ids').isArray().withMessage('patient_ids must be an array of numbers'),
        body('ReportObject.attorney_ids').isArray().withMessage('attorney_ids must be an array of numbers'),
        body('ReportObject.employer_ids').isArray().withMessage('employer_ids must be an array of numbers'),
        body('ReportObject.As_of').isISO8601().toDate().withMessage('As_of must be a valid date'),
        body('ReportObject.start_date').isISO8601().toDate().withMessage('start_date must be a valid date'),
        body('ReportObject.end_date').isISO8601().toDate().withMessage('end_date must be a valid date'),
        body('ReportObject.group_by_id').isNumeric().withMessage('group_by_id must be a number'),
        body('ReportObject.subgroup_by_id').isNumeric().withMessage('subgroup_by_id must be a number'),
        body('ReportObject.Aggregate').isNumeric().withMessage('Aggregate must be a number'),
        body('ReportObject.date_range_type_id').isNumeric().withMessage('date_range_type_id must be a number'),
        body('ReportObject.date_type').isNumeric().withMessage('date_type must be a number'),
        body('ReportObject.firm_ids').isArray().withMessage('firm_ids must be an array of numbers'),
        body('ReportObject.appointment_status_ids').isArray().withMessage('appointment_status_ids must be an array of numbers'),
        body('ReportObject.case_ids').isArray().withMessage('case_ids must be an array of numbers'),
        body('ReportObject.clinic_ids').isArray().withMessage('clinic_ids must be an array of numbers'),
        // body('ReportObject.visit_type_ids').isArray().withMessage('visit_type_ids must be an array of numbers'),
        body('ReportObject.page').isNumeric().withMessage('page must be a number'),
        body('ReportObject.per_page').isNumeric().withMessage('per_page must be a number')
    ];

export const denialDetailReportValidations = [
    body('Denial_detail_report_Object.facility_location_ids').isArray().withMessage('facility_location_ids must be an array of numbers'),
    body('Denial_detail_report_Object.denial_reason').isString().withMessage('denial_reason must be a string'),
    body('Denial_detail_report_Object.columnName').isString().withMessage('columnName must be a string'),
    body('Denial_detail_report_Object.maingroup_by_id').isString().withMessage('maingroup_by_id must be a string'),
    body('Denial_detail_report_Object.mainsubgroup_by_id').isString().withMessage('mainsubgroup_by_id must be a string'),
    body('Denial_detail_report_Object.denial_type_id').isString().withMessage('denial_type_id must be a string'),
    body('Denial_detail_report_Object.group_by_name').exists().withMessage('group_by_name is required'),
    body('Denial_detail_report_Object.sub_group_by_name').exists().withMessage('sub_group_by_name is required'),
    body('Denial_detail_report_Object.group_by_id').isString().withMessage('group_by_id must be a string'),
    body('Denial_detail_report_Object.subgroup_by_id').isString().withMessage('subgroup_by_id must be a string'),
    body('Denial_detail_report_Object.date_range_type_id').isNumeric().withMessage('date_range_type_id must be a number'),
    body('Denial_detail_report_Object.date_type').isNumeric().withMessage('date_type must be a number'),
    body('Denial_detail_report_Object.start_date').isISO8601().toDate().withMessage('start_date must be a valid date'),
    body('Denial_detail_report_Object.end_date').isISO8601().toDate().withMessage('end_date must be a valid date'),
    body('Denial_detail_report_Object.case_type_ids').isArray().withMessage('case_type_ids must be an array of numbers'),
    body('Denial_detail_report_Object.patient_ids').isArray().withMessage('patient_ids must be an array of numbers'),
    body('Denial_detail_report_Object.insurance_ids').isArray().withMessage('insurance_ids must be an array of numbers'),
    body('Denial_detail_report_Object.doctor_ids').isArray().withMessage('doctor_ids must be an array of numbers')
];

export const arDetailReportValidations = [
    body('Ar_Detail_report_Object.columnName').isString().withMessage('columnName must be a string'),
    body('Ar_Detail_report_Object.bill_recipient_name').isString().withMessage('bill_recipient_name must be a string'),
    body('Ar_Detail_report_Object.invoice_recipient_name').isString().withMessage('invoice_recipient_name must be a string'),
    body('Ar_Detail_report_Object.bill_recipient_id').isNumeric().withMessage('bill_recipient_id must be a number'),
    body('Ar_Detail_report_Object.subgroup_by_name').isString().withMessage('subgroup_by_name must be a string'),
    body('Ar_Detail_report_Object.subgroup_by_id').isNumeric().withMessage('subgroup_by_id must be a number'),
    body('Ar_Detail_report_Object.group_by_name').isString().withMessage('group_by_name must be a string'),
    body('Ar_Detail_report_Object.group_by_id').isNumeric().withMessage('group_by_id must be a number'),
    body('Ar_Detail_report_Object.bill_recipient_type_name').isString().withMessage('bill_recipient_type_name must be a string'),
    body('Ar_Detail_report_Object.bill_recipient_type_id').isNumeric().withMessage('bill_recipient_type_id must be a number'),
    body('Ar_Detail_report_Object.date_type').isNumeric().withMessage('date_type must be a number'),
    body('Ar_Detail_report_Object.start_date').isISO8601().toDate().withMessage('start_date must be a valid date'),
    body('Ar_Detail_report_Object.end_date').isISO8601().toDate().withMessage('end_date must be a valid date'),
    body('Ar_Detail_report_Object.maingroup_by_id').isNumeric().withMessage('maingroup_by_id must be a number'),
    body('Ar_Detail_report_Object.mainsubgroup_by_id').isNumeric().withMessage('mainsubgroup_by_id must be a number'),
    body('Ar_Detail_report_Object.facility_location_ids').isArray().withMessage('facility_location_ids must be an array of numbers'),
    body('Ar_Detail_report_Object.case_type_ids').isArray().withMessage('case_type_ids must be an array of numbers'),
    body('Ar_Detail_report_Object.speciality_ids').isArray().withMessage('speciality_ids must be an array of numbers'),
    body('Ar_Detail_report_Object.doctor_ids').isArray().withMessage('doctor_ids must be an array of numbers'),
    body('Ar_Detail_report_Object.insurance_ids').isArray().withMessage('insurance_ids must be an array of numbers'),
    body('Ar_Detail_report_Object.patient_ids').isArray().withMessage('patient_ids must be an array of numbers'),
    body('Ar_Detail_report_Object.attorney_ids').isArray().withMessage('attorney_ids must be an array of numbers'),
    body('Ar_Detail_report_Object.employer_ids').isArray().withMessage('employer_ids must be an array of numbers'),
    body('Ar_Detail_report_Object.firm_ids').isArray().withMessage('firm_ids must be an array of numbers')
];

export const reportRequestValidation = [
    ...reportObjectValidations,
    ...denialDetailReportValidations,
    ...arDetailReportValidations
];
