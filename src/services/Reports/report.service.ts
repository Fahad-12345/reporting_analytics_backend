import { sequelize } from "../../config/database";
import { PaymentSummaryArray, PaymentSummaryObject, PaymentSummarydates, referralFilter } from "../../interfaces";
import { Helper, Http } from "../../shared";
import { qaLocationsFilter, qaSpecialitiesFilter } from "../../shared/filter-clause";
import { ReportRequest } from "./ReportContract/RequestInterface/request-model";
import puppeteer from "puppeteer";
import {
    AggregateType,
    BillRecepientType,
    DateRange,
    DateType,
    ExcludedUser,
    GroupByID,
    billRecipientMapping,
    dateRangeClause,
    viewbyID,
    viewbyIDForAppt,
    paymentRecipientType,
    setInvoiceFilter,
    generateDynamicJoins
} from "./report.enum";
import { generateHTMLPages } from "./Templates/statusReportExport";
import { newgenerateSummaryHTMLPages } from "./Templates/summaryReportExport";
import { arDetailReportValidations } from "../../utils/requestValidation/report_validation";
// import { generateSummaryHTMLPages, newgenerateSummaryHTMLPages } from "./Templates/summaryReportExport";

export class ReportService extends Helper {
    public __http: Http;
    combinedResult: { detailResults: object[]; summaryResults: object[]; Arraydata: object[]; };

    public constructor(public http: typeof Http) {
        super();
        this.__http = new http();
    }


    public getPaymentSummaryReport = async (reportFilters?: any) => {
        try {

            const {
                case_type_ids, employer_ids, facility_location_ids, visit_type_ids, patient_ids, insurance_ids, attorney_ids, firm_ids, doctor_ids, bill_recipient_type_id, date_type, start_date, end_date, speciality_ids, group_by_id, view_by_id, subgroup_by_id, Aggregate, detail,
            } = reportFilters;
            // Query to show sum of data by default
            let selectedDate: string = ``;
            let selectedDateInvoice: string = ``;
            let leftClause: string = `LEFT`;
            let invoiceWhereClause: string = `invoice.invoice_category != 'invoice_for_bill' AND invoice.deleted_at IS NULL 
                AND casFac.case_type_id IS NOT NULL 
                AND (invoice.created_by::integer IS NULL OR invoice.created_by::integer != 13) 
                AND (invoice.updated_by::integer IS NULL OR invoice.updated_by::integer != 13) 
                ${qaLocationsFilter('facLocDim')} `;
            let billRecClause: string = ``;
            const validRecipientIds = [
                BillRecepientType.Patient,
                BillRecepientType.Employer,
                BillRecepientType.Insurance,
                BillRecepientType.Attorney
            ];
            if (validRecipientIds.includes(bill_recipient_type_id)) {
                leftClause = ``
                billRecClause = `AND bill_recipient_type_id IN (${bill_recipient_type_id})`;
                const recipientName: string = billRecipientMapping[bill_recipient_type_id];
                invoiceWhereClause += `AND value->>'invoice_to_label' = '${recipientName}'`
            }
            let billsClause: string = ``;
            let billDateSelectClause: string = ``;
            let billDateClause: string = ``;
            let rankedRowsClause: string = ``;
            let aggregateClauseJoin: string = `RankedRows`;
            let aggregatedBillsClause: string = ``;
            let groupBYClause: string = ``;
            let checkAmountClause: string = `COALESCE(payFac.check_amount, 0) AS paid_amount,`;
            let aggBillsSelectClause: string = ``;
            let payFactClause: string = `
            LEFT JOIN (
                SELECT
                    payFac.bill_id,
                    MAX(payFac.deleted_at) AS max_deleted_at,
                    SUM(payFac.check_amount) AS check_amount
                FROM
                  payment_fact payFac
                WHERE
                  payFac.deleted_at IS NULL
                GROUP BY
                  payFac.bill_id
            ) payFac ON bilFac.bill_id = payFac.bill_id`;
            if ([DateType.CheckDate, DateType.PostedDate].includes(date_type)) {
                payFactClause = `LEFT JOIN payment_fact payFac ON bilFac.bill_id = payFac.bill_id AND payFac.deleted_at IS NULL`;
                groupBYClause = `
                 GROUP BY  
                    bill_id,
                    billed_amount,
                    outstanding_amount,
                    write_off_amount,
                    overpayment,
                    interest_amount`;
                aggregatedBillsClause = `
                ,payments AS (
                    SELECT bill_id, SUM(paid_amount) AS paid_amount 
                    from  RankedRows
                    GROUP BY bill_id
                    )`;
                aggregateClauseJoin = `JOIN payments AS aggBills ON bills.bill_id = aggBills.bill_id`;
                aggBillsSelectClause = `aggBills.`;
                rankedRowsClause = `bills`;
            }

            let joinClause: string = `
            ${payFactClause}
            LEFT JOIN specialities_dim AS specDim ON bilFac.speciality_id = specDim.specialty_id AND specDim.deleted_at IS NULL AND specDim.name is NOT NULL
            LEFT JOIN facilities_dim AS facDim ON bilFac.facility_id = facDim.facility_id AND facDim.deleted_at is NULL
            LEFT JOIN facility_location_dim AS facLocDim ON bilFac.facility_location_id = facLocDim.facility_location_id AND facLocDim.deleted_at IS NULL AND facLocDim.facility_location_name  is NOT NULL
            LEFT JOIN users_dim AS usrDim ON bilFac.doctor_id = usrDim.user_id AND usrDim.deleted_at IS NULL
            LEFT JOIN patient_dim AS patDim ON bilFac.patient_id = patDim.patient_id AND patDim.deleted_at IS NULL
            ${leftClause} JOIN (
                SELECT
                    DISTINCT ON (bill_id)
                    bill_id,
                    insurance_id,
                    firm_id,
					employer_id

                FROM
                    bills_recipient_dim
                WHERE
                    deleted_at IS NULL ${billRecClause}
                GROUP BY
                    bill_id,insurance_id,firm_id,employer_id
            ) bilRecDim ON bilRecDim.bill_id = bilFac.bill_id            
            LEFT JOIN insurance_dim AS insDim ON bilRecDim.insurance_id = insDim.insurance_id AND insDim.deleted_at IS NULL
            LEFT JOIN firms_dim AS firmDim ON bilRecDim.firm_id = firmDim.firm_id AND firmDim.deleted_at IS NULL
            LEFT JOIN employer_dim AS empDim ON bilRecDim.employer_id = empDim.employer_id AND empDim.deleted_at IS NULL
            LEFT JOIN case_fact_new AS caseFac ON bilFac.case_id = caseFac.case_id AND caseFac.deleted_at IS NULL
            LEFT JOIN attorney_dim AS attDim ON caseFac.attorney_id = attDim.attorney_id AND attDim.deleted_at IS NULL
            LEFT JOIN bill_status_dim AS bilStatDim ON bilFac.bill_status_id = bilStatDim.bill_status_id AND bilStatDim.deleted_at IS NULL
            LEFT JOIN payment_status_dim AS payStatDim ON bilFac.payment_status_id = payStatDim.payment_status_id AND payStatDim.deleted_at IS NULL 
            LEFT JOIN case_types_dim AS casTypDim ON bilFac.case_type_id = casTypDim.case_type_id AND casTypDim.deleted_at IS NULL AND casTypDim.name is NOT NULL`;
            let detailquery: string = `ROUND(CAST(SUM(billed_amount)AS NUMERIC), 2) as billed_amount,
            ROUND(CAST(SUM(${aggBillsSelectClause}paid_amount)AS NUMERIC), 2) as paid_amount,
            ROUND(CAST(SUM(outstanding_amount)AS NUMERIC), 2) as outstanding_amount,
            ROUND(CAST(SUM( write_off_amount)AS NUMERIC), 2) as write_off_amount,
            ROUND(CAST(SUM( overpayment)AS NUMERIC), 2) as overpayment,
            ROUND(CAST(SUM(interest_amount)AS NUMERIC), 2) as interest_amount`;
            let detailGroupBy: string = ``;
            // let limitclause: string = `LIMIT 500`;
            let subGroupByName: string = ``;
            let nullDate: string = ``;
            let nullAggregateDate: string = ``;
            let nullcheck: string = `AND group_by_name IS NOT NULL`
            // If user wants to export individual data to excel, below code changes detail query
            if (detail == 1) {
                detailquery = `billed_amount,
                                paid_amount,
                                outstanding_amount,
                                write_off_amount,
                                overpayment,
                                interest_amount`;
                detailGroupBy = `billed_amount,paid_amount,outstanding_amount,write_off_amount,overpayment,interest_amount`;
                // limitclause = `LIMIT 2000`;
            }
            let viewByClause: string = ``;
            let viewByClauseInvoice: string = ``;
            let whereClause: string = `bilFac.time_id is NULL AND bilFac.deleted_at IS NULL AND bilFac.case_type_id IS NOT NULL 
            AND bilFac.speciality_id IS NOT NULL
            AND bilFac.facility_location_id IS NOT NULL AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13) ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}`;
            let NameClause: string = `Bill_Recipient_Type,BILL_ID`;
            let selectClause: string = `bilRecDim.bill_recipient_type_name AS Bill_Recipient_Type,bilRecDim.bill_recipient_type_id AS BILL_ID`;
            let queryclause: string = ``;
            let billsSelectClause: string = ``;
            // If case_type_ids are provided, filter by them
            if (case_type_ids && case_type_ids.length > 0) {
                // const quotedCaseTypeIds = case_type_ids.map(id => `'${id}'`).join(', ');
                invoiceWhereClause += ` AND casFac.case_type_id IN (${case_type_ids})`;
                whereClause += ` AND bilFac.case_type_id IN (${case_type_ids})`;
            }
            if (firm_ids && firm_ids.length > 0) {
                // const quotedCaseTypeIds = case_type_ids.map(id => `'${id}'`).join(', ');
                invoiceWhereClause += ` AND casFac.firm_id IN (${firm_ids})`;
                whereClause += ` AND firmDim.firm_id IN (${firm_ids})`;
            }

            // If practice_location_ids are provided, filter by them
            if (facility_location_ids && facility_location_ids.length > 0) {
                const quotedLocationIds: string = facility_location_ids.map(id => `'${id}'`).join(', ');
                whereClause += ` AND bilFac.facility_location_id IN (${quotedLocationIds})`;

                invoiceWhereClause += `AND casFac.practice_locations ?| ARRAY['${facility_location_ids.join("','")}'] `;
            }

            // If visit_type_ids are provided, filter by them
            if (visit_type_ids && visit_type_ids.length > 0) {
                const quotedAppointmentTypeIds: string = visit_type_ids.map(id => `'$+{id}'`).join(', ');
                whereClause += ` AND atd.appointment_type_id IN (${quotedAppointmentTypeIds})`;
            }
            if (group_by_id != null) {
                NameClause = `ID_NO,group_by_name`;
                if ([DateType.CheckDate, DateType.PostedDate].includes(date_type)) {
                    groupBYClause += `,group_by_name,ID_NO`;
                }
                // Changing query parameters for different groupby conditions
                switch (group_by_id) {
                    case GroupByID.Practice_Location:
                        selectClause = `CONCAT(facDim.facility_qualifier,' - ',facLocDim.facility_location_name) AS group_by_name,facLocDim.facility_location_id AS ID_NO`;
                        break;
                    case GroupByID.Specialty:
                        selectClause = `specDim.specialty_id AS ID_NO,specDim.qualifier AS group_by_name`;
                        break;
                    case GroupByID.Provider:
                        selectClause = `CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS group_by_name,usrDim.user_id AS ID_NO`;
                        break;
                    case GroupByID.Patient:
                        selectClause = `CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS group_by_name,patDim.patient_id AS ID_NO`;
                        break;
                    case GroupByID.Bill_Recipient_Type:
                        selectClause = `bilRecDim.bill_recipient_type_name AS group_by_name, bilRecDim.bill_recipient_id AS ID_NO`;
                        break;
                    case GroupByID.Insurance:
                        selectClause = `insDim.insurance_name AS group_by_name,insDim.insurance_id AS ID_NO`;
                        break;
                    case GroupByID.Attorney:
                        selectClause = `CONCAT(attDim.first_name,' ',attDim.middle_name,' ',attDim.last_name) AS group_by_name,attDim.attorney_id AS ID_NO`;
                        break;
                    case GroupByID.Bill_Status:
                        selectClause = ` bilStatDim.name AS group_by_name,bilStatDim.bill_status_id AS ID_NO`;
                        break;
                    case GroupByID.Payment_Status:
                        selectClause = `payStatDim.name AS group_by_name,payStatDim.payment_status_id AS ID_NO`;
                        break;
                    case GroupByID.Case_Type:
                        selectClause = `casTypDim.name AS group_by_name,casTypDim.case_type_id AS ID_NO`;
                        break;
                    case GroupByID.Law_Firm:
                        selectClause = `firmDim.firm_name AS group_by_name,firmDim.firm_id AS ID_NO`;
                        break;
                    case GroupByID.Employer:
                        selectClause = `empDim.employer_name AS group_by_name,empDim.employer_id AS ID_NO`;
                        break;
                    default:
                        selectClause += ``;
                        break;
                }

            }
            if (subgroup_by_id != null) {
                nullcheck += ` AND subgroup_by_name IS NOT NULL`;
                subGroupByName = `,subgroup_by_name`;
                NameClause += `,subgroup_by_name`;
                if ([DateType.CheckDate, DateType.PostedDate].includes(date_type)) {
                    groupBYClause += `,subgroup_by_name`;
                }
                let subgroup_by_name: string = ``;
                switch (subgroup_by_id) {
                    case GroupByID.Practice_Location:
                        subgroup_by_name = `,CONCAT(facDim.facility_qualifier,' - ',facLocDim.facility_location_name) AS subgroup_by_name`;
                        break;
                    case GroupByID.Specialty:
                        subgroup_by_name = `,specDim.qualifier AS subgroup_by_name`;
                        break;
                    case GroupByID.Provider:
                        subgroup_by_name = `,CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS subgroup_by_name`;
                        break;
                    case GroupByID.Patient:
                        subgroup_by_name = `,CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS subgroup_by_name`;
                        break;
                    case GroupByID.Bill_Recipient_Type:
                        subgroup_by_name = `,bilRecDim.bill_recipient_type_name AS subgroup_by_name`;
                        break;
                    case GroupByID.Insurance:
                        subgroup_by_name = `,insDim.insurance_name AS subgroup_by_name`;
                        break;
                    case GroupByID.Attorney:
                        subgroup_by_name = `,CONCAT(attDim.first_name,' ',attDim.middle_name,' ',attDim.last_name) AS subgroup_by_name`;
                        break;
                    case GroupByID.Bill_Status:
                        subgroup_by_name = ` ,bilStatDim.name AS subgroup_by_name`;
                        break;
                    case GroupByID.Payment_Status:
                        subgroup_by_name = `,payStatDim.name AS subgroup_by_name`;
                        break;
                    case GroupByID.Case_Type:
                        subgroup_by_name = `,casTypDim.name AS subgroup_by_name`;
                        break;
                    case GroupByID.Law_Firm:
                        subgroup_by_name = `,firmDim.firm_name AS subgroup_by_name`;
                        break;
                    case GroupByID.Employer:
                        subgroup_by_name = `,empDim.employer_name AS subgroup_by_name`;
                        break;
                    default:
                        selectClause += ``;
                        break;
                }
                selectClause += subgroup_by_name;
            }
            if (patient_ids && patient_ids.length > 0) {
                whereClause += ` AND patDim.patient_id IN (${patient_ids})`;
                invoiceWhereClause += `AND invoice.patient_id IN (${patient_ids})`;
            }
            if (insurance_ids && insurance_ids.length > 0) {
                whereClause += ` AND insDim.insurance_id IN (${insurance_ids})`;
                invoiceWhereClause += `AND casFac.insurances ?| ARRAY['${insurance_ids.join("','")}'] `;

            }
            if (attorney_ids && attorney_ids.length > 0) {
                whereClause += ` AND attDim.attorney_id IN (${attorney_ids})`;
                invoiceWhereClause += `AND casFac.attorney_id IN (${attorney_ids})`;
            }
            if (employer_ids && employer_ids.length > 0) {
                whereClause += ` AND caseFac.employers ?| ARRAY['${employer_ids.join("','")}']`;
                invoiceWhereClause += `AND casFac.employers ?| ARRAY['${employer_ids.join("','")}'] `;
            }

            // If physician_ids are provided, filter by them
            if (doctor_ids && doctor_ids.length > 0) {
                const quotedIds: string = doctor_ids.map(id => `'${id}'`).join(', ');
                whereClause += ` AND usrDim.user_id IN (${quotedIds})`;

                invoiceWhereClause += `AND EXISTS (
                SELECT 1
                FROM unnest(string_to_array(invoice.doctor_ids, ',')) AS doctor_id
                WHERE doctor_id::int IN (${doctor_ids})
                )`;

            }
            if (speciality_ids && speciality_ids.length > 0) {
                const quotedIds: string = speciality_ids.map(id => `'${id}'`).join(', ');
                whereClause += ` AND specDim.specialty_id IN (${quotedIds})`;

                invoiceWhereClause += `AND EXISTS (
                    SELECT 1
                    FROM unnest(string_to_array(invoice.specialty_ids, ',')) AS speciality_id
                    WHERE speciality_id::int IN (${speciality_ids})
                    )`;
            }
            switch (date_type) {
                case DateType.DOS:
                    whereClause += ` AND bilFac.dos_from_date >= '${start_date}' AND bilFac.dos_to_date <= '${end_date}'`;
                    invoiceWhereClause += ` AND invoice.dos_start >= '${start_date}' AND invoice.dos_end <= '${end_date}'`;
                    selectedDateInvoice = `invoice.dos_end`;
                    selectedDate = `bilFac.dos_to_date`;
                    break;
                case DateType.CheckDate:
                    whereClause += ` AND payFac.check_date >= '${start_date}' AND payFac.check_date <= '${end_date}'`;
                    invoiceWhereClause += ` AND payFac.check_date >= '${start_date}' AND payFac.check_date <= '${end_date}'`;
                    selectedDate = `payFac.check_date`;
                    selectedDateInvoice = `payFac.check_date`;
                    break;
                case DateType.PostedDate:
                    whereClause += ` AND payFac.created_at >= '${start_date}' AND payFac.created_at <= '${end_date}'`;
                    invoiceWhereClause += ` AND payFac.created_at >= '${start_date}' AND payFac.created_at <= '${end_date}'`;
                    selectedDate = `payFac.created_at`;
                    selectedDateInvoice = `payFac.created_at`;

                    break;
                case DateType.BilledDate:
                    whereClause += ` AND bilFac.bill_date >= '${start_date}' AND bilFac.bill_date <= '${end_date}'`;
                    invoiceWhereClause += ` AND invoice.invoice_date >= '${start_date}' AND invoice.invoice_date <= '${end_date}'`;
                    selectedDate = `bilFac.bill_date`;
                    selectedDateInvoice = `invoice.invoice_date `;
                    break;
                default:
                    whereClause += ``;
                    invoiceWhereClause += ``;
                    selectedDate += ``;
                    selectedDateInvoice += ``;
                    break;
            }
            if (view_by_id) {
                billDateClause = `MAX(bill_date) AS bill_date,`;
                billDateSelectClause = `bill_date,`;
                nullDate = `NULL AS bill_date,`;
                if (![DateType.CheckDate, DateType.PostedDate].includes(date_type)) {
                    NameClause += `,bill_date`;
                }
                if (detail == 1) {
                    detailGroupBy += `bill_date,`;
                }
                nullAggregateDate = `bill_date,`;
                const viewByIdObject = {
                    1: 'month',
                    2: 'quarter',
                    3: 'year',
                };

                const viewByClauseInterval = viewByIdObject[`${view_by_id}`] || false;
                viewByClause = `DATE(DATE_TRUNC('${viewByClauseInterval}',${selectedDate})) AS bill_date,`;
                viewByClauseInvoice = `DATE(DATE_TRUNC('${viewByClauseInterval}',${selectedDateInvoice})) AS bill_date,`;


            }
            if ([DateType.CheckDate, DateType.PostedDate].includes(date_type)) {
                billsClause = `,bills AS (
                    SELECT 
                        ${NameClause},${billDateClause}
                        billed_amount,
                        bill_id,
                        outstanding_amount,
                        write_off_amount,
                        overpayment,
                        interest_amount
                    from  RankedRows bilFac
                        ${groupBYClause}

                    )`;
            }
            // Calculating Aggregate function selected by user. This runs as a separate query. It was combined with main query at first
            // But due to LIMIT problem, It is separated from main query
            queryclause = `WITH RankedRows AS (
                    SELECT  
                            ${viewByClause}
                            ${selectClause},
                            bilFac.bill_amount AS billed_amount,
                            bilFac.bill_id AS bill_id,
                            ${checkAmountClause}
                            bilFac.outstanding_amount AS outstanding_amount,
                            bilFac.write_off_amount AS write_off_amount,
                            bilFac.over_payment AS overpayment,
                            bilFac.interest_amount AS interest_amount
                   FROM 
                        bills_fact_new AS bilFac
                        ${joinClause}
                    WHERE
                        ${whereClause}
     
                ) 
                ${aggregatedBillsClause}
                ${billsClause}`
            const aggregateUsage = `(
                SELECT
                    ID_NO,group_by_name,${nullAggregateDate}
                    ROUND(CAST(SUM(billed_amount)AS NUMERIC), 2) as billed_amount,
                    ROUND(CAST(SUM(${aggBillsSelectClause}paid_amount)AS NUMERIC), 2) as paid_amount,
                    ROUND(CAST(SUM(outstanding_amount)AS NUMERIC), 2) as outstanding_amount,
                    ROUND(CAST(SUM(write_off_amount)AS NUMERIC), 2) as write_off_amount,
                    ROUND(CAST(SUM(overpayment)AS NUMERIC), 2) as overpayment,
                    ROUND(CAST(SUM(interest_amount)AS NUMERIC), 2) as interest_amount
                FROM
                    ${rankedRowsClause}
                ${aggregateClauseJoin}
                    GROUP BY ${nullAggregateDate} ID_NO,group_by_name ${subGroupByName}
            ) AS sums `
            const nullAggregate: string = `NULL AS ID_NO,
            NULL AS group_by_name,
            NULL AS subgroup_by_name,`
            switch (Aggregate) {

                case AggregateType.Sum:
                case null:
                case undefined:
                    queryclause += `
                            SELECT 
                                ${nullAggregate}
                                ${nullDate}
                                ROUND(CAST(SUM(billed_amount)AS NUMERIC), 2) AS billed_amount,
                                ROUND(CAST(SUM(${aggBillsSelectClause}paid_amount)AS NUMERIC), 2) AS paid_amount,
                                ROUND(CAST(SUM(outstanding_amount)AS NUMERIC), 2) AS outstanding_amount,
                                ROUND(CAST(SUM(write_off_amount)AS NUMERIC), 2) AS write_off_amount,
                                ROUND(CAST(SUM(overpayment)AS NUMERIC), 2) AS overpayment,
                                ROUND(CAST(SUM(interest_amount)AS NUMERIC), 2) AS interest_amount
                            FROM 
                                ${rankedRowsClause}
                            ${aggregateClauseJoin}`;
                    break;
                case AggregateType.Average:
                    queryclause += `
                            SELECT
                                ${nullAggregate}
                                ${nullDate}
                                ROUND(CAST(AVG(billed_amount)AS NUMERIC), 2) AS billed_amount,
                                ROUND(CAST(AVG(paid_amount)AS NUMERIC), 2) AS paid_amount,
                                ROUND(CAST(AVG(outstanding_amount)AS NUMERIC), 2) AS outstanding_amount,
                                ROUND(CAST(AVG(write_off_amount)AS NUMERIC), 2) AS write_off_amount,
                                ROUND(CAST(AVG(overpayment)AS NUMERIC), 2) AS overpayment,
                                ROUND(CAST(AVG(interest_amount)AS NUMERIC), 2) AS interest_amount
                            FROM ${aggregateUsage} `;
                    break;
                case AggregateType.Standard_Deviation:
                    queryclause += `
                            SELECT
                                ${nullAggregate}
                                ${nullDate}
                                COALESCE(STDDEV(billed_amount), 0) AS total_billed_amount,
                                COALESCE(STDDEV(paid_amount), 0) AS paid_amount,
                                COALESCE(STDDEV(outstanding_amount), 0) AS outstanding_amount,
                                COALESCE(STDDEV(write_off_amount), 0) AS write_off_amount,
                                COALESCE(STDDEV(overpayment), 0) AS overpayment,
                                COALESCE(STDDEV(interest_amount), 0) AS interest_amount
                            FROM ${aggregateUsage} `;
                    break;
                case AggregateType.Count:
                    queryclause += `
                            SELECT
                                ${nullAggregate}
                                ${nullDate}
                                count(billed_amount) AS billed_amount,
                                count(paid_amount) AS paid_amount,
                                count(outstanding_amount) AS outstanding_amount,
                                count(write_off_amount) AS write_off_amount,
                                count(overpayment) AS overpayment,
                                count(interest_amount) AS interest_amount
                            FROM ${aggregateUsage} `;
                    break;
                case AggregateType.Maximum:
                    queryclause += `
                            SELECT
                                ${nullAggregate}
                                ${nullDate}
                                ROUND(CAST(MAX(billed_amount)AS NUMERIC), 2) AS billed_amount,
                                ROUND(CAST(MAX(paid_amount)AS NUMERIC), 2) AS paid_amount,
                                ROUND(CAST(MAX(outstanding_amount)AS NUMERIC), 2) AS outstanding_amount,
                                ROUND(CAST(MAX(write_off_amount)AS NUMERIC), 2) AS write_off_amount,
                                ROUND(CAST(MAX(overpayment)AS NUMERIC), 2) AS overpayment,
                                ROUND(CAST(MAX(interest_amount)AS NUMERIC), 2) AS interest_amount
                            FROM ${aggregateUsage} `;
                    break;
                case AggregateType.Minimum:
                    queryclause += `
                            SELECT
                                ${nullAggregate}
                                ${nullDate}
                                ROUND(CAST(MIN(billed_amount)AS NUMERIC), 2) AS billed_amount,
                                ROUND(CAST(MIN(paid_amount)AS NUMERIC), 2) AS paid_amount,
                                ROUND(CAST(MIN(outstanding_amount)AS NUMERIC), 2) AS outstanding_amount,
                                ROUND(CAST(MIN(write_off_amount)AS NUMERIC), 2) AS write_off_amount,
                                ROUND(CAST(MIN(overpayment)AS NUMERIC), 2) AS overpayment,
                                ROUND(CAST(MIN(interest_amount)AS NUMERIC), 2) AS interest_amount
                            FROM ${aggregateUsage}`;
                    break;
                default:
                    queryclause += ``;
                    break;
            }
            // Main query which fetches individual or summed up data based on detailquery
            const PaymentSummaryreport: string = `
            WITH RankedRows AS (
                SELECT  
                        ${viewByClause}
                        ${selectClause},
                        bilFac.bill_amount AS billed_amount,
                        bilFac.bill_id AS bill_id,
                        ${checkAmountClause}
                        bilFac.outstanding_amount AS outstanding_amount,
                        bilFac.write_off_amount AS write_off_amount,
                        bilFac.over_payment AS overpayment,
                        bilFac.interest_amount AS interest_amount
               FROM 
                    bills_fact_new AS bilFac
                    ${joinClause}
                WHERE
                    ${whereClause}

            )
            ${aggregatedBillsClause}
            ${billsClause}
            SELECT 
            ${NameClause},${billDateSelectClause}
                ${detailquery}
            FROM 
                ${rankedRowsClause}
            ${aggregateClauseJoin}
            WHERE 
               (
                billed_amount IS NOT NULL OR
                ${aggBillsSelectClause}paid_amount IS NOT NULL OR
                outstanding_amount IS NOT NULL OR
                write_off_amount IS NOT NULL OR
                overpayment IS NOT NULL OR
                interest_amount IS NOT NULL
            ) ${nullcheck}
            GROUP BY ${billDateSelectClause}${detailGroupBy} ${NameClause}  
            ORDER BY ID_NO
            
            `;

            detailquery = `ROUND(CAST(SUM(billed_amount)AS NUMERIC), 2) as billed_amount,
            ROUND(COALESCE(SUM(CAST(paid_amount AS NUMERIC)), 0), 2) AS paid_amount,
            ROUND(CAST(SUM(outstanding_amount)AS NUMERIC), 2) as outstanding_amount,
            ROUND(CAST(SUM( write_off_amount)AS NUMERIC), 2) as write_off_amount,
            ROUND(CAST(SUM( overpayment)AS NUMERIC), 2) as overpayment,
            ROUND(CAST(SUM(interest_amount)AS NUMERIC), 2) as interest_amount`;

            if (selectClause.includes("CONCAT(facDim.facility_qualifier,' - ',facLocDim.facility_location_name) AS subgroup_by_name")) {
                selectClause = selectClause.replace(
                    "CONCAT(facDim.facility_qualifier,' - ',facLocDim.facility_location_name) AS subgroup_by_name",
                    "CONCAT(facDim.facility_qualifier,' - ',practice_loc->>'name') AS subgroup_by_name"
                );
            }
            if (selectClause.includes("CONCAT(facDim.facility_qualifier,' - ',facLocDim.facility_location_name) AS group_by_name")) {
                selectClause = selectClause.replace(
                    "CONCAT(facDim.facility_qualifier,' - ',facLocDim.facility_location_name) AS group_by_name",
                    "CONCAT(facDim.facility_qualifier,' - ',practice_loc->>'name') AS group_by_name"
                );
            }
            const InvoiceData: string = `
            WITH RankedRows AS (
                SELECT  DISTINCT ON (invoice.invoice_id )
                        ${viewByClauseInvoice}
                        ${selectClause},
                        invoice.invoice_amount AS billed_amount,
                        invoice.invoice_id AS bill_id,
                        COALESCE(payFac.check_amount, 0) AS paid_amount,
                        invoice.outstanding_amount AS outstanding_amount,
                        invoice.write_off_amount AS write_off_amount,
                        invoice.over_amount AS overpayment,
                        invoice.interest_amount AS interest_amount
               FROM 
                    invoices_dim AS invoice
                LEFT JOIN payment_fact AS payFac ON payFac.invoice_id = invoice.invoice_id 
                LEFT JOIN specialities_dim AS specDim ON specDim.specialty_id = ANY(array_remove(string_to_array(invoice.specialty_ids, ','), '')::int[]) 
                    AND specDim.deleted_at IS NULL 
                    AND specDim.name IS NOT NULL
                LEFT JOIN facility_location_dim AS facLocDim ON facLocDim.facility_location_id = ANY(array_remove(string_to_array(invoice.invoice_from_facility_location_ids, ','), '')::int[]) 
                    AND facLocDim.deleted_at IS NULL 
                    AND facLocDim.facility_location_name IS NOT NULL
                LEFT JOIN facilities_dim AS facDim ON invoice.invoice_from_facility_id = facDim.facility_id AND facDim.deleted_at is NULL
                LEFT JOIN users_dim AS usrDim ON usrDim.user_id = ANY(array_remove(string_to_array(invoice.doctor_ids, ','), '')::int[]) 
                    AND usrDim.deleted_at IS NULL
                LEFT JOIN patient_dim AS patDim ON invoice.patient_id = patDim.patient_id 
                    AND patDim.deleted_at IS NULL
                LEFT JOIN case_fact_new casFac ON invoice.case_id = casFac.case_id 
                    AND casFac.deleted_at IS NULL        
                LEFT JOIN firms_dim AS firmDim ON casFac.firm_id = firmDim.firm_id 
                    AND firmDim.deleted_at IS NULL
                LEFT JOIN attorney_dim AS attDim ON casFac.attorney_id = attDim.attorney_id 
                    AND attDim.deleted_at IS NULL
                LEFT JOIN case_types_dim AS casTypDim ON casFac.case_type_id = casTypDim.case_type_id 
                    AND casTypDim.deleted_at IS NULL 
                    AND casTypDim.name IS NOT NULL
                LEFT JOIN LATERAL (SELECT value AS practice_loc FROM jsonb_each(casFac.practice_locations) ORDER BY key::int LIMIT 1) AS first_location ON true
                LEFT JOIN LATERAL jsonb_each(invoice.invoice_to_locations) AS entry(key, value) ON true
                LEFT JOIN LATERAL jsonb_each(casFac.insurances) AS insurance_entry(id, insurance_data) ON true
                LEFT JOIN insurance_dim AS insDim ON insDim.insurance_id = insurance_entry.id::int 
                LEFT JOIN LATERAL jsonb_each(casFac.employers) AS employer_entry(id, insurance_data) ON true
                LEFT JOIN employer_dim AS empDim ON empDim.employer_id = employer_entry.id::int 
                WHERE
                    ${invoiceWhereClause}

            )

            SELECT 
            ${NameClause},${billDateSelectClause}
                ${detailquery}
            FROM 
                RankedRows
            WHERE 
               (
                billed_amount IS NOT NULL OR
                paid_amount IS NOT NULL OR
                outstanding_amount IS NOT NULL OR
                write_off_amount IS NOT NULL OR
                overpayment IS NOT NULL OR
                interest_amount IS NOT NULL
            ) ${nullcheck}
            GROUP BY ${billDateSelectClause}${detailGroupBy} ${NameClause}  
            ORDER BY ID_NO
            
            `;
            // Executing main query
            const results: any = await sequelize.query(PaymentSummaryreport);
            // Executing Aggregate query
            const totals: any = await sequelize.query(queryclause);
            // Executing invoice query
            const invoice: any = await sequelize.query(InvoiceData);
            invoice[0].forEach((inv) => {
                totals[0][0].billed_amount = (parseFloat(totals[0][0].billed_amount) + parseFloat(inv.billed_amount || 0)).toFixed(2);
                totals[0][0].paid_amount = (parseFloat(totals[0][0].paid_amount) + parseFloat(inv.paid_amount || 0)).toFixed(2);
                totals[0][0].outstanding_amount = (parseFloat(totals[0][0].outstanding_amount) + parseFloat(inv.outstanding_amount || 0)).toFixed(2);
                totals[0][0].write_off_amount = (parseFloat(totals[0][0].write_off_amount) + parseFloat(inv.write_off_amount || 0)).toFixed(2);
                totals[0][0].overpayment = (parseFloat(totals[0][0].overpayment) + parseFloat(inv.overpayment || 0)).toFixed(2);
                totals[0][0].interest_amount = (parseFloat(totals[0][0].interest_amount) + parseFloat(inv.interest_amount || 0)).toFixed(2);
            })
            type PaymentType = {
                id_no?: any;
                group_by_name: any;
                billed_amount: any;
                paid_amount: any;
                outstanding_amount: any;
                write_off_amount: any;
                overpayment: any;
                interest_amount: any;
                subgroup_by_name?: any; // Make it optional
                bill_date?: any; // Make it optional
            };

            // Iterate through each invoice
            invoice[0].forEach((inv: PaymentType) => {
                const groupName = inv.group_by_name || null;
                const subGroupName = inv.subgroup_by_name || null;
                const billDate = inv.bill_date || null;
                const idNo = inv.id_no || null;

                let matchFound = false; // Track if a match is found

                // Iterate through results and check for matching entries
                results[0].forEach((payment: PaymentType) => {
                    const groupNameMatch = payment.group_by_name === groupName;
                    const subGroupMatch = subGroupName ? payment.subgroup_by_name === subGroupName : true;
                    const dateMatch = billDate ? payment.bill_date === billDate : true;
                    const idMatch = idNo ? payment.id_no === idNo : true;

                    // If we have a complete match, update the values and set matchFound to true
                    if (groupNameMatch && subGroupMatch && dateMatch && idMatch) {
                        payment.billed_amount = (parseFloat(payment.billed_amount) || 0) + (parseFloat(inv.billed_amount) || 0);
                        payment.paid_amount = (parseFloat(payment.paid_amount) || 0) + (parseFloat(inv.paid_amount) || 0);
                        payment.outstanding_amount = (parseFloat(payment.outstanding_amount) || 0) + (parseFloat(inv.outstanding_amount) || 0);
                        payment.write_off_amount = (parseFloat(payment.write_off_amount) || 0) + (parseFloat(inv.write_off_amount) || 0);
                        payment.overpayment = (parseFloat(payment.overpayment) || 0) + (parseFloat(inv.overpayment) || 0);
                        payment.interest_amount = (parseFloat(payment.interest_amount) || 0) + (parseFloat(inv.interest_amount) || 0);

                        matchFound = true; // We found a match, no need to push a new entry
                    }
                });

                // If no match was found, push a new entry into results[0]
                if (!matchFound) {
                    const newEntry: PaymentType = {
                        group_by_name: groupName,
                        billed_amount: parseFloat(inv.billed_amount) || 0,
                        paid_amount: parseFloat(inv.paid_amount) || 0,
                        outstanding_amount: parseFloat(inv.outstanding_amount) || 0,
                        write_off_amount: parseFloat(inv.write_off_amount) || 0,
                        overpayment: parseFloat(inv.overpayment) || 0,
                        interest_amount: parseFloat(inv.interest_amount) || 0,
                    };

                    // Add optional fields only if they exist
                    if (idNo) newEntry.id_no = idNo;
                    if (subGroupName) newEntry.subgroup_by_name = subGroupName;
                    if (billDate) newEntry.bill_date = billDate;

                    results[0].push(newEntry); // Push only when no match is found
                }
            });
            const resultsArray: any = results[0];
            // Merging Aggregate results to main query results
            if (totals[0]) {
                resultsArray.push(totals[0][0]);
            }
            const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            resultsArray.forEach(function (value: PaymentSummaryObject) {
                if (value.subgroup_by_name == null && !subgroup_by_id) {
                    delete value.subgroup_by_name
                }
                let dateLabel: string | number | Date = value.bill_date;
                // Assigning label to aggregate result based on selected aggregate
                if (value.group_by_name == null) {
                    switch (Aggregate) {
                        case AggregateType.Sum:
                        case null:
                            value.group_by_name = 'Grand Total';
                            break;
                        case AggregateType.Average:
                            value.group_by_name = 'Total Average';
                            break;
                        case AggregateType.Standard_Deviation:
                            value.group_by_name = 'Total Standard Deviation';
                            break;
                        case AggregateType.Count:
                        case AggregateType.Distinct_Count:
                            value.group_by_name = 'Total Count';
                            break;
                        case AggregateType.Maximum:
                            value.group_by_name = 'Maximum';
                            break;
                        case AggregateType.Minimum:
                            value.group_by_name = 'Minimum';
                            break;
                        default:
                            value.group_by_name = 'Grand Total';
                            break;
                    }
                }
                // Below code is used to change default date labels provided by database to customized labels
                // e.g for month database gives 01/09/2024. This function changes it to Jan 2024
                let newDate: Date = new Date(value.bill_date);
                const year: string = `${newDate.getFullYear()}`;
                if (value.bill_date != null) {
                    if (view_by_id) {
                        switch (view_by_id) {
                            case 1:
                                dateLabel = `${months[newDate.getMonth()]} ${year}`; // Group data by month labels
                                value.bill_date = dateLabel;
                                break;
                            case 2:
                                let quarter = Math.floor(newDate.getMonth() / 3) + 1; // Calculating the quarter
                                switch (quarter) {
                                    case 1:
                                        dateLabel = ` Jan-Mar ${year}`;
                                        break;
                                    case 2:
                                        dateLabel = ` Apr-Jun ${year}`;
                                        break;
                                    case 3:
                                        dateLabel = `Jul-Sep ${year}`;
                                        break;
                                    case 4:
                                        dateLabel = `Oct-Dec ${year}`;
                                        break;
                                    default:
                                        dateLabel = `Quarter ${year}`;
                                }
                                value.bill_date = dateLabel;
                                break;
                            case 3:
                                dateLabel = year.toString();
                                value.bill_date = dateLabel;
                                break;
                            default:
                                dateLabel = value.bill_date;
                        }
                    }
                }

            });

            // Below Function Calculates the selected aggregate for each selected view by option
            // e.g user selected Aggregate as Average and view by as monthly, It calculates averages for each month
            let data: any = resultsArray;
            let dateTotals: PaymentSummarydates = {};
            let arrangedData: PaymentSummaryArray = [];
            if (view_by_id) {
                if (Aggregate === AggregateType.Sum || (!Aggregate)) {
                    let groupBy = 'Total';
                    data.forEach((entry: PaymentSummaryObject) => {
                        if (entry.bill_date !== null) {
                            if (!dateTotals[entry.bill_date]) {
                                dateTotals[entry.bill_date] = {
                                    group_by_name: groupBy,
                                    subgroup_by_name: null,
                                    billed_amount: 0,
                                    paid_amount: 0,
                                    outstanding_amount: 0,
                                    write_off_amount: 0,
                                    overpayment: 0,
                                    interest_amount: 0
                                };
                                if (!subgroup_by_id) {
                                    delete dateTotals[entry.bill_date].subgroup_by_name;
                                }
                            }
                            dateTotals[entry.bill_date].billed_amount += parseFloat(entry.billed_amount);
                            dateTotals[entry.bill_date].paid_amount += parseFloat(entry.paid_amount);
                            dateTotals[entry.bill_date].outstanding_amount += parseFloat(entry.outstanding_amount);
                            dateTotals[entry.bill_date].write_off_amount += parseFloat(entry.write_off_amount);
                            dateTotals[entry.bill_date].overpayment += parseFloat(entry.overpayment);
                            dateTotals[entry.bill_date].interest_amount += parseFloat(entry.interest_amount);
                        }
                    });
                }
                else if (Aggregate === AggregateType.Average) {


                    let groupBy: string = 'Average';

                    data.forEach((entry: PaymentSummaryObject) => {
                        if (entry.bill_date !== null) {
                            if (!dateTotals[entry.bill_date]) {
                                dateTotals[entry.bill_date] = {
                                    group_by_name: groupBy,
                                    subgroup_by_name: null,
                                    countEntries: 0,
                                    billed_amount: 0,
                                    paid_amount: 0,
                                    outstanding_amount: 0,
                                    write_off_amount: 0,
                                    overpayment: 0,
                                    interest_amount: 0
                                };
                                if (!subgroup_by_id) {
                                    delete dateTotals[entry.bill_date].subgroup_by_name;
                                }
                            }

                            dateTotals[entry.bill_date].billed_amount = (
                                (dateTotals[entry.bill_date].billed_amount * dateTotals[entry.bill_date].countEntries)
                                + parseFloat(entry.billed_amount)
                            ) / (dateTotals[entry.bill_date].countEntries + 1);

                            dateTotals[entry.bill_date].paid_amount = (
                                (dateTotals[entry.bill_date].paid_amount * dateTotals[entry.bill_date].countEntries)
                                + parseFloat(entry.paid_amount)
                            ) / (dateTotals[entry.bill_date].countEntries + 1);

                            dateTotals[entry.bill_date].outstanding_amount = (
                                (dateTotals[entry.bill_date].outstanding_amount * dateTotals[entry.bill_date].countEntries)
                                + parseFloat(entry.outstanding_amount)
                            ) / (dateTotals[entry.bill_date].countEntries + 1);

                            dateTotals[entry.bill_date].write_off_amount = (
                                (dateTotals[entry.bill_date].write_off_amount * dateTotals[entry.bill_date].countEntries)
                                + parseFloat(entry.write_off_amount)
                            ) / (dateTotals[entry.bill_date].countEntries + 1);

                            dateTotals[entry.bill_date].overpayment = (
                                (dateTotals[entry.bill_date].overpayment * dateTotals[entry.bill_date].countEntries)
                                + parseFloat(entry.overpayment)
                            ) / (dateTotals[entry.bill_date].countEntries + 1);

                            dateTotals[entry.bill_date].interest_amount = (
                                (dateTotals[entry.bill_date].interest_amount * dateTotals[entry.bill_date].countEntries)
                                + parseFloat(entry.interest_amount)
                            ) / (dateTotals[entry.bill_date].countEntries + 1);

                            dateTotals[entry.bill_date].countEntries++;
                        }
                    });

                    this.removeCountEntries(dateTotals);
                }
                else if (Aggregate === AggregateType.Standard_Deviation) {


                    let groupBy: string = 'StandardDeviation';

                    data.forEach((entry: PaymentSummaryObject) => {
                        if (entry.bill_date !== null) {
                            if (!dateTotals[entry.bill_date]) {
                                dateTotals[entry.bill_date] = {
                                    group_by_name: groupBy,
                                    subgroup_by_name: null,
                                    countEntries: 0,
                                    billed_amount: [],
                                    paid_amount: [],
                                    outstanding_amount: [],
                                    write_off_amount: [],
                                    overpayment: [],
                                    interest_amount: []
                                };
                                if (!subgroup_by_id) {
                                    delete dateTotals[entry.bill_date].subgroup_by_name;
                                }

                            }

                            // Push the values to the respective arrays
                            dateTotals[entry.bill_date].billed_amount.push(parseFloat(entry.billed_amount));
                            dateTotals[entry.bill_date].paid_amount.push(parseFloat(entry.paid_amount));
                            dateTotals[entry.bill_date].outstanding_amount.push(parseFloat(entry.outstanding_amount));
                            dateTotals[entry.bill_date].write_off_amount.push(parseFloat(entry.write_off_amount));
                            dateTotals[entry.bill_date].overpayment.push(parseFloat(entry.overpayment));
                            dateTotals[entry.bill_date].interest_amount.push(parseFloat(entry.interest_amount));

                            dateTotals[entry.bill_date].countEntries++;
                        }
                    });

                    // Calculate standard deviation for each property
                    Object.keys(dateTotals).forEach((date) => {
                        ['billed_amount', 'paid_amount', 'outstanding_amount', 'write_off_amount', 'overpayment', 'interest_amount'].forEach((property) => {
                            const values: [] = dateTotals[date][property];
                            const standardDeviation: number = calculateStandardDeviation(values);
                            dateTotals[date][property] = standardDeviation;
                        });
                    });

                    // Function to calculate standard deviation
                    function calculateStandardDeviation(dataArray) {
                        const n: number = dataArray.length;
                        if (n <= 1) {
                            return 0;
                        }

                        const mean: number = dataArray.reduce((acc, val) => acc + val, 0) / n;
                        const sumOfSquares: number = dataArray.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
                        const variance: number = sumOfSquares / (n - 1);
                        const standardDeviation: number = Math.sqrt(variance);

                        return standardDeviation;
                    }

                }
                else if (Aggregate === AggregateType.Count || Aggregate === AggregateType.Distinct_Count) {
                    let groupBy: string = 'Count';
                    data.forEach((entry: PaymentSummaryObject) => {
                        if (entry.bill_date !== null) {
                            if (!dateTotals[entry.bill_date]) {
                                dateTotals[entry.bill_date] = {
                                    group_by_name: groupBy,
                                    subgroup_by_name: null,
                                    billed_amount: 0,
                                    paid_amount: 0,
                                    outstanding_amount: 0,
                                    write_off_amount: 0,
                                    overpayment: 0,
                                    interest_amount: 0
                                };
                                if (!subgroup_by_id) {
                                    delete dateTotals[entry.bill_date].subgroup_by_name;
                                }
                            }
                            dateTotals[entry.bill_date].billed_amount++;
                            dateTotals[entry.bill_date].paid_amount++;
                            dateTotals[entry.bill_date].outstanding_amount++;
                            dateTotals[entry.bill_date].write_off_amount++;
                            dateTotals[entry.bill_date].overpayment++;
                            dateTotals[entry.bill_date].interest_amount++;
                        }
                    });
                }
                else if (Aggregate == AggregateType.Maximum) {


                    let groupBy: string = 'Maximum';

                    data.forEach((entry: PaymentSummaryObject) => {
                        if (entry.bill_date !== null) {
                            if (!dateTotals[entry.bill_date]) {
                                dateTotals[entry.bill_date] = {
                                    group_by_name: groupBy,
                                    subgroup_by_name: null,
                                    billed_amount: -Infinity,
                                    paid_amount: -Infinity,
                                    outstanding_amount: -Infinity,
                                    write_off_amount: -Infinity,
                                    overpayment: -Infinity,
                                    interest_amount: -Infinity
                                };
                                if (!subgroup_by_id) {
                                    delete dateTotals[entry.bill_date].subgroup_by_name;
                                }
                            }
                            if (parseFloat(dateTotals[entry.bill_date].billed_amount) < parseFloat(entry.billed_amount)) {
                                dateTotals[entry.bill_date].billed_amount = parseFloat(entry.billed_amount);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].paid_amount) < parseFloat(entry.paid_amount)) {
                                dateTotals[entry.bill_date].paid_amount = parseFloat(entry.paid_amount);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].outstanding_amount) < parseFloat(entry.outstanding_amount)) {
                                dateTotals[entry.bill_date].outstanding_amount = parseFloat(entry.outstanding_amount);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].write_off_amount) < parseFloat(entry.write_off_amount)) {
                                dateTotals[entry.bill_date].write_off_amount = parseFloat(entry.write_off_amount);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].overpayment) < parseFloat(entry.overpayment)) {
                                dateTotals[entry.bill_date].overpayment = parseFloat(entry.overpayment);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].interest_amount) < parseFloat(entry.interest_amount)) {
                                dateTotals[entry.bill_date].interest_amount = parseFloat(entry.interest_amount);
                            }
                        }
                    });
                }

                if (Aggregate == AggregateType.Minimum) {
                    let groupBy: string = 'Minimum';

                    data.forEach((entry: PaymentSummaryObject) => {
                        if (entry.bill_date !== null) {
                            if (!dateTotals[entry.bill_date]) {
                                dateTotals[entry.bill_date] = {
                                    group_by_name: groupBy,
                                    subgroup_by_name: null,
                                    billed_amount: Infinity,
                                    paid_amount: Infinity,
                                    outstanding_amount: Infinity,
                                    write_off_amount: Infinity,
                                    overpayment: Infinity,
                                    interest_amount: Infinity
                                };
                                if (!subgroup_by_id) {
                                    delete dateTotals[entry.bill_date].subgroup_by_name;
                                }
                            }
                            if (parseFloat(dateTotals[entry.bill_date].billed_amount) > parseFloat(entry.billed_amount)) {
                                dateTotals[entry.bill_date].billed_amount = parseFloat(entry.billed_amount);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].paid_amount) > parseFloat(entry.paid_amount)) {
                                dateTotals[entry.bill_date].paid_amount = parseFloat(entry.paid_amount);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].outstanding_amount) > parseFloat(entry.outstanding_amount)) {
                                dateTotals[entry.bill_date].outstanding_amount = parseFloat(entry.outstanding_amount);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].write_off_amount) > parseFloat(entry.write_off_amount)) {
                                dateTotals[entry.bill_date].write_off_amount = parseFloat(entry.write_off_amount);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].overpayment) > parseFloat(entry.overpayment)) {
                                dateTotals[entry.bill_date].overpayment = parseFloat(entry.overpayment);
                            }
                            if (parseFloat(dateTotals[entry.bill_date].interest_amount) > parseFloat(entry.interest_amount)) {
                                dateTotals[entry.bill_date].interest_amount = parseFloat(entry.interest_amount);
                            }
                        }
                    });
                }
                // Sort the array by bill_date
                data.sort((a: any, b: any) => {
                    if (a.bill_date === null && b.bill_date === null) return 0;
                    if (a.bill_date === null) return 1;
                    if (b.bill_date === null) return -1;

                    const strcomp: Boolean = a.bill_date.localeCompare(b.bill_date);
                    return strcomp; // String comparison for months

                });

                // Arranging all the totals by date
                const dataArray = Object.entries(dateTotals);
                dataArray.sort((a, b) => {
                    const dateA = new Date(a[0]);
                    const dateB = new Date(b[0]);
                    return dateA.getTime() - dateB.getTime();
                });
                const sortedData: Record<string, any> = {};
                dataArray.forEach(([key, value]) => {
                    sortedData[key] = value;
                });

                // Rearrange the array with totals followed by respective date objects
                Object.keys(sortedData).forEach((date: string) => {
                    arrangedData.push({
                        bill_date: date,
                        ...sortedData[date]
                    });


                    data.forEach((entry: any) => {
                        if (!arrangedData[entry]) {
                            if (entry.bill_date === date) {
                                // entry.bill_date = null
                                arrangedData.push(entry);
                            }
                        }
                    });
                });
                // Push null entries to the end
                data.forEach((entry: PaymentSummaryObject) => {
                    if (entry.bill_date === null) {
                        arrangedData.push(entry);
                    }
                });
                // deleting bill date of all entries other than totals and last object
                arrangedData.forEach((entry: PaymentSummaryObject) => {
                    if (entry.id_no != null) {
                        delete entry.bill_date;
                        entry.id_no = null;
                    }
                    if (entry.bill_date == null) {
                        delete entry.bill_date
                    }

                })
            }

            if (view_by_id) {
                return arrangedData;
            }
            else {
                if (detail == 0) {
                    resultsArray.forEach((value) => {
                        delete value.id_no
                    })
                }
                return resultsArray;
            }
        } catch (error) {
            throw error;
        }
    };


    public getPaymentReport = async (reportFilters): Promise<object> => {
        try {
            const {
                case_type_ids,
                facility_location_ids,
                visit_type_ids,
                patient_ids,
                insurance_ids,
                attorney_ids,
                firm_ids,
                employer_ids,
                doctor_ids,
                bill_recipient_type_id,
                date_type,
                start_date,
                end_date,
                speciality_ids,
                page,
                per_page
            }: ReportRequest["ReportObject"] = reportFilters;


            const offset = (page - 1) * per_page;
            // Start with a default WHERE clause
            let payFacWhereCondition: string =
                `payFac.deleted_at is NULL 
             AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) 
             AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13)
            ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}          
	         AND bilFac.case_type_id IS NOT NULL
             AND bilFac.speciality_id IS NOT NULL
             AND bilFac.facility_location_id IS NOT NULL
              `;

            let distinctWhereClause: string = '';
            let invDate = ``;
            let billDate = ``;
            let conditionalJoin: string = ` 
            LEFT JOIN
            bills_fact_new AS bilFac ON invDim.bills @> to_jsonb(bilFac.bill_id) AND bilFac.deleted_at IS NULL `
            let conditionalJoin2: string = `
            LEFT JOIN 
            bills_fact_new as bilFac on bilFac.bill_id = payFac.bill_id AND bilFac.deleted_at is NULL`
            const locJoins = generateDynamicJoins('loc');
            // If case_type_ids are provided, filter by them
            if (case_type_ids && case_type_ids.length > 0) {
                payFacWhereCondition += ` AND bilFac.case_type_id IN (${case_type_ids})`;

            }
            if (firm_ids && firm_ids.length > 0) {
                payFacWhereCondition += ` AND firmDim.firm_id IN (${firm_ids})`;

            }
            // If practice_location_ids are provided, filter by them
            if (facility_location_ids && facility_location_ids.length > 0) {
                payFacWhereCondition += ` AND bilFac.facility_location_id IN (${facility_location_ids})`;

            }
            // If visit_type_ids are provided, filter by them
            if (visit_type_ids && visit_type_ids.length > 0) {
                payFacWhereCondition += ` AND atd.appointment_type_id IN (${visit_type_ids})`;

            }
            if (patient_ids && patient_ids.length > 0) {
                payFacWhereCondition += ` AND patDim.patient_id IN (${patient_ids})`;

            }
            if (insurance_ids && insurance_ids.length > 0) {
                payFacWhereCondition += ` AND insDim.insurance_id IN (${insurance_ids})`;

            }
            //if employer ids are provided
            if (employer_ids && employer_ids.length > 0) {
                payFacWhereCondition += ` AND caseFac.employers ?| ARRAY['${employer_ids.join("','")}']`;
                distinctWhereClause = ` AND empDim.employer_id IN (${employer_ids})`;
            }
            if (attorney_ids && attorney_ids.length > 0) {
                payFacWhereCondition += ` AND attDim.attorney_id IN (${attorney_ids})`;

            }

            if (bill_recipient_type_id === paymentRecipientType.Patient) {
                payFacWhereCondition += `  AND payFac.payment_by_id IN (${bill_recipient_type_id}) `;


            }
            if (bill_recipient_type_id === paymentRecipientType.Employer) {
                payFacWhereCondition += `  AND payFac.payment_by_id IN (${bill_recipient_type_id}) `;


            }
            if (bill_recipient_type_id === paymentRecipientType.Insurance) {
                payFacWhereCondition += `  AND payFac.payment_by_id IN (${bill_recipient_type_id}) `;
            }
            if (bill_recipient_type_id === paymentRecipientType.LawFirm) {
                payFacWhereCondition += `  AND payFac.payment_by_id IN (${bill_recipient_type_id}) `;
            }
            if (bill_recipient_type_id === paymentRecipientType.Other) {
                payFacWhereCondition += `  AND payFac.payment_by_id IN (${bill_recipient_type_id}) `;
            }

            // If physician_ids are provided, filter by them
            if (doctor_ids && doctor_ids.length > 0) {
                payFacWhereCondition += ` AND usrDim.user_id IN (${doctor_ids})`;
            }
            // If speciality_ids are provided, filter by them
            if (speciality_ids && speciality_ids.length > 0) {
                payFacWhereCondition += ` AND specDim.specialty_id IN (${speciality_ids})`;
            }
            switch (date_type) {
                case DateType.DOS:
                    billDate = ` AND bilFac.dos_from_date >= '${start_date}' AND bilFac.dos_to_date <= '${end_date}'`;
                    invDate = `AND bilFac.dos_from_date >= '${start_date}' AND bilFac.dos_to_date <= '${end_date}'`;
                    // invDate = `AND invDim.dos_start >= '${start_date}' AND invDim.dos_end <= '${end_date}'`
                    break;
                case DateType.BilledDate:
                    billDate = ` AND bilFac.bill_date >= '${start_date}' AND bilFac.bill_date <= '${end_date}'`;
                    invDate = `AND invDim.invoice_date >= '${start_date}' AND invDim.invoice_date <= '${end_date}'`;
                    break;
                case DateType.CheckDate:
                    payFacWhereCondition += ` AND payFac.check_date >= '${start_date}' AND payFac.check_date <= '${end_date}'`;
                    break;
                case DateType.PostedDate:
                    payFacWhereCondition += ` AND payFac.created_at >= '${start_date}' AND payFac.created_at <= '${end_date}'`;
                    break;
            }

            let billdata: string = `
               WITH BillData_Table AS (
                SELECT 
                bilFac.bill_label AS Bill_NO,
                '-' AS invoice_category,
                bilFac.case_id AS case_ID,
                TO_CHAR(bilFac.bill_date,'MM-DD-YY') AS Billed_date,
                current_date - bilFac.bill_date AS no_of_days,
                bilStatDim.name AS Bill_Status,
                eorStatDim.name AS EOR_Status,
                denStatDim.name AS Denial_Status,
                verStatDim.name AS Verification_Status,
                payStatDim.name AS Payment_Status,
                casTypDim.name AS Case_Type,
                CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS Patient_Name,
                specDim.name AS specialty,
                TO_CHAR(caseFac.accident_date,'MM-DD-YY') AS DOA,
                TO_CHAR(patDim.dob,'MM-DD-YY') AS date_of_birth,
                CONCAT(FacDim.facility_qualifier,'-',facLocDim.facility_location_name) AS Practice_location,
                CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS Provider_Name,
                TO_CHAR(bilFac.dos_from_date,'MM-DD-YY') AS First_Visit_date,
                TO_CHAR(bilFac.dos_to_date,'MM-DD-YY') AS Last_visit_date,
                TO_CHAR(DATE(payFac.created_at),'MM-DD-YY') AS Posted_Date,
                TO_CHAR(payFac.check_date,'MM-DD-YY') AS Check_Date,
                payFac.check_no AS Check_No,
                payFac.check_amount AS Check_Amount,
                bilFac.bill_amount AS billed_amount,
                bilFac.paid_amount AS paid_amount,
                bilFac.outstanding_amount AS outstanding_amount,
                bilFac.write_off_amount AS write_Off,
                bilFac.over_payment AS overpayment,
                bilFac.interest_amount AS Interest,
                CONCAT(attDim.first_name,' ',attDim.middle_name,' ',attDim.last_name) AS Attorney_Name,
                firmDim.firm_name AS Firm_Name,
                payTypDim.payment_type_name AS Payment_Type,
                payByDim.payment_by_name AS Paid_by,
                insDim.insurance_name AS Insurance_Name,
                CONCAT(bilRecDim.bill_recipient_f_name, ' ', bilRecDim.bill_recipient_m_name, ' ', bilRecDim.bill_recipient_l_name) AS Bill_Recipient_Name,
                bilRecDim.bill_recipient_type_name AS Bill_Recipient_Type,
                denTypDim.denial_type_name AS Denial_Type,
	            TO_CHAR(DATE(bilFac.created_at),'MM-DD-YY') as created_at,
	            TO_CHAR(DATE(bilFac.updated_at),'MM-DD-YY') as updated_at,
	            TO_CHAR(DATE(payFac.created_at),'MM-DD-YY') as payment_created_at,
	            TO_CHAR(DATE(payFac.updated_at),'MM-DD-YY') as payment_updated_at
                FROM
                payment_fact AS payFac 
                ${conditionalJoin2}  
                LEFT JOIN
                payment_by_dim AS payByDim ON payFac.payment_by_id = payByDim.payment_by_id AND payByDim.deleted_at is NULL
                LEFT JOIN
                payment_type_dim AS payTypDim ON payFac.payment_type_id = payTypDim.payment_type_id AND payTypDim.deleted_at is NULL
                LEFT JOIN
                payment_status_dim AS payStatDim ON bilFac.payment_status_id = payStatDim.payment_status_id AND payStatDim.deleted_at IS NULL
                LEFT JOIN
                verification_status_dim AS verStatDim ON bilFac.verification_status_id = verStatDim.verification_status_id AND verStatDim.deleted_at is NULL
                LEFT JOIN
                denial_status_dim AS denStatDim ON bilFac.denial_status_id = denStatDim.denial_status_id AND denStatDim.deleted_at is NULL
                LEFT JOIN
                eor_status_dim AS eorStatDim ON bilFac.eor_status_id = eorStatDim.eor_status_id AND eorStatDim.deleted_at is NULL
                LEFT JOIN
                bill_status_dim AS bilStatDim ON bilFac.bill_status_id = bilStatDim.bill_status_id AND bilStatDim.deleted_at is NULL
                LEFT JOIN
                case_types_dim AS casTypDim ON bilFac.case_type_id = casTypDim.case_type_id AND casTypDim.deleted_at is NULL
                LEFT JOIN
                case_fact_new AS caseFac ON bilFac.case_id = caseFac.case_id AND caseFac.deleted_at is NULL
                LEFT JOIN
                specialities_dim AS specDim ON bilFac.speciality_id = specDim.specialty_id AND specDim.deleted_at is NULL
                LEFT JOIN 
                facilities_dim AS FacDim ON bilFac.facility_id = FacDim.facility_id AND FacDim.deleted_at is NULL
                LEFT JOIN
                facility_location_dim AS facLocDim ON bilFac.facility_location_id = facLocDim.facility_location_id AND facLocDim.deleted_at is NULL
                LEFT JOIN
                users_dim AS usrDim ON  bilFac.doctor_id = usrDim.user_id AND usrDim.deleted_at is NULL

                LEFT JOIN (
            SELECT DISTINCT ON (bill_id)
            bill_recipient_f_name,
            bill_recipient_m_name,
            bill_recipient_l_name,
            bill_recipient_type_name,
            bill_recipient_type_id,
                    bill_id,
                    patient_id,
                    insurance_id,
                    firm_id,
					employer_id
                FROM
                    bills_recipient_dim
                WHERE
                    deleted_at IS NULL
                GROUP BY
                    bill_id,patient_id,insurance_id,firm_id,employer_id,
                    bill_recipient_f_name,bill_recipient_m_name,bill_recipient_l_name,
                    bill_recipient_type_name,bill_recipient_type_id   
            ) bilRecDim ON bilRecDim.bill_id = bilFac.bill_id 

                LEFT JOIN
                insurance_dim AS insDim ON bilRecDim.insurance_id = insDim.insurance_id AND insDim.deleted_at is NULL
                LEFT JOIN
                patient_dim AS patDim ON caseFac.patient_id = patDim.patient_id AND patDim.deleted_at is NULL
                LEFT JOIN 
                firms_dim AS firmDim ON caseFac.firm_id = firmDim.firm_id AND firmDim.deleted_at is NULL
              

                LEFT JOIN
                attorney_dim AS attDim ON caseFac.attorney_id = attDim.attorney_id AND attDim.deleted_at is NULL 
                
                LEFT JOIN (
                    SELECT DISTINCT ON (bill_id)
                      bill_id,denial_id
                     from denial_dim
                      where deleted_at is null
                    )denDim ON bilFac.bill_id = denDim.bill_id
                    
                    LEFT JOIN(
                    SELECT DISTINCT ON (denial_id)
                        denial_id,
                     denial_type_name
                    from denial_type_dim 
                    where deleted_at is null
                    )denTypDim on denTypDim.denial_id = denDim.denial_id
        WHERE
        ${payFacWhereCondition} ${billDate}  
     ) ,`
            let invoicedata: string = `
                InvoiceData_Table AS (
                SELECT 
                COALESCE('inv-' || loc.invoice_id::text, '') AS Bill_NO,
                invDim.invoice_category AS invoice_category,
                invDim.case_id AS case_ID,
                TO_CHAR(invDim.invoice_date,'MM-DD-YY') AS Billed_date,
                current_date - invDim.invoice_date AS no_of_days,
                bilStatDim.name AS Bill_Status,
                eorStatDim.name AS EOR_Status,
                denStatDim.name AS Denial_Status,
                verStatDim.name AS Verification_Status,
                payStatDim.name AS Payment_Status,
                casTypDim.name AS Case_Type,
                CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS Patient_Name,
                specDim.name AS specialty,
                TO_CHAR(caseFac.accident_date,'MM-DD-YY') AS DOA,
                TO_CHAR(patDim.dob,'MM-DD-YY') AS date_of_birth,
                CONCAT(FacDim.facility_qualifier,'-',facLocDim.facility_location_name) AS Practice_location,
                CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS Provider_Name,
                 TO_CHAR(invDim.dos_start,'MM-DD-YY') AS First_Visit_date,
                TO_CHAR(invDim.dos_end,'MM-DD-YY') AS Last_visit_date,
                TO_CHAR(DATE(payFac.created_at),'MM-DD-YY') AS Posted_Date,
                TO_CHAR(payFac.check_date,'MM-DD-YY') AS Check_Date,
                payFac.check_no AS Check_No,
                payFac.check_amount AS Check_Amount,
                invDim.invoice_amount AS billed_amount,
                invDim.paid_amount AS paid_amount,
                invDim.outstanding_amount AS outstanding_amount,
                invDim.write_off_amount AS write_Off,
                invDim.over_amount AS overpayment,
                invDim.interest_amount AS Interest,
                CONCAT(attDim.first_name,' ',attDim.middle_name,' ',attDim.last_name) AS Attorney_Name,
                firmDim.firm_name AS Firm_Name,
                payTypDim.payment_type_name AS Payment_Type,
                payByDim.payment_by_name AS Paid_by,
                insDim.insurance_name AS Insurance_Name,
               COALESCE(loc.value->>'name', '') AS Bill_Recipient_Name,
			   COALESCE(loc.value->>'invoice_to_label', '') AS Bill_Recipient_Type,
                denTypDim.denial_type_name AS Denial_Type,
                    TO_CHAR(DATE(invDim.created_at),'MM-DD-YY') as created_at,
                    TO_CHAR(DATE(invDim.updated_at),'MM-DD-YY') as updated_at,
                    TO_CHAR(DATE(payFac.created_at),'MM-DD-YY') as payment_created_at,
                    TO_CHAR(DATE(payFac.updated_at),'MM-DD-YY') as payment_updated_at
                FROM
                payment_fact AS payFac 
                LEFT JOIN 
                invoices_dim AS invDim ON payFac.invoice_id = invDim.invoice_id
                 AND invDim.deleted_at is NULL AND invDim.bills IS NOT NULL
                 LEFT JOIN (
                    SELECT
                    invoice_id,
                    (jsonb_each(invoice_to_locations)).key AS invoice_location_id,
                    (jsonb_each(invoice_to_locations)).value AS value
                     FROM
                     invoices_dim
                     ) loc ON invDim.invoice_id = loc.invoice_id  
                ${conditionalJoin}  
                LEFT JOIN
                payment_by_dim AS payByDim ON payFac.payment_by_id = payByDim.payment_by_id AND payByDim.deleted_at is NULL
                LEFT JOIN
                payment_type_dim AS payTypDim ON payFac.payment_type_id = payTypDim.payment_type_id AND payTypDim.deleted_at is NULL
                LEFT JOIN
                payment_status_dim AS payStatDim ON bilFac.payment_status_id = payStatDim.payment_status_id AND payStatDim.deleted_at IS NULL
                LEFT JOIN
                verification_status_dim AS verStatDim ON bilFac.verification_status_id = verStatDim.verification_status_id AND verStatDim.deleted_at is NULL
                LEFT JOIN
                denial_status_dim AS denStatDim ON bilFac.denial_status_id = denStatDim.denial_status_id AND denStatDim.deleted_at is NULL
                LEFT JOIN
                eor_status_dim AS eorStatDim ON bilFac.eor_status_id = eorStatDim.eor_status_id AND eorStatDim.deleted_at is NULL
                LEFT JOIN
                bill_status_dim AS bilStatDim ON bilFac.bill_status_id = bilStatDim.bill_status_id AND bilStatDim.deleted_at is NULL
                LEFT JOIN
                case_types_dim AS casTypDim ON bilFac.case_type_id = casTypDim.case_type_id AND casTypDim.deleted_at is NULL
                LEFT JOIN
                case_fact_new AS caseFac ON bilFac.case_id = caseFac.case_id AND caseFac.deleted_at is NULL
                LEFT JOIN
                specialities_dim AS specDim ON bilFac.speciality_id = specDim.specialty_id AND specDim.deleted_at is NULL
                LEFT JOIN 
                facilities_dim AS FacDim ON bilFac.facility_id = FacDim.facility_id AND FacDim.deleted_at is NULL
                LEFT JOIN
                facility_location_dim AS facLocDim ON bilFac.facility_location_id = facLocDim.facility_location_id AND facLocDim.deleted_at is NULL
                LEFT JOIN
                users_dim AS usrDim ON  bilFac.doctor_id = usrDim.user_id AND usrDim.deleted_at is NULL
                ${locJoins}
                LEFT JOIN
                attorney_dim AS attDim ON caseFac.attorney_id = attDim.attorney_id AND attDim.deleted_at is NULL 
                
                LEFT JOIN (
                    SELECT DISTINCT ON (bill_id)
                      bill_id,denial_id
                     from denial_dim
                      where deleted_at is null
                    )denDim ON bilFac.bill_id = denDim.bill_id
                    
                    LEFT JOIN(
                    SELECT DISTINCT ON (denial_id)
                        denial_id,
                     denial_type_name
                    from denial_type_dim 
                    where deleted_at is null
                    )denTypDim on denTypDim.denial_id = denDim.denial_id

                  
        WHERE
        ${payFacWhereCondition}  ${distinctWhereClause}   ${invDate}   
    ) `

            let Paymentreport = `
             ${billdata}
             ${invoicedata}    
             SELECT 
             'Total' AS data,
             ct.*,
            (SELECT COUNT(*) FROM BillData_Table) + (SELECT COUNT(*) FROM InvoiceData_Table ) AS total_count
             FROM ( SELECT * FROM BillData_Table UNION ALL SELECT * FROM InvoiceData_Table ) AS ct `

            if (per_page && page) {
                const offset = (page - 1) * per_page;
                Paymentreport += `
                LIMIT ${per_page} OFFSET ${offset}`;
            }






            const results = await sequelize.query(Paymentreport);
            const result1: any[] = results[0];
            const actualresult = result1.filter(
                (payment) => payment.data === 'Total'
            );
            const finalresult = {
                actualdata: actualresult
            }

            return finalresult;
        } catch (error) {
            // Handle any errors and log them
            throw error;
        }
    };

    public getAccountReceivableReport = async (
        reportFilters?
    ): Promise<object> => {
        try {
            const {
                facility_location_ids,
                case_type_ids,
                speciality_ids,
                doctor_ids,
                bill_recipient_type_id,
                insurance_ids,
                patient_ids,
                attorney_ids,
                employer_ids,
                firm_ids,
                As_of,
                start_date,
                end_date,
                group_by_id,
                subgroup_by_id,
                date_type
            }: ReportRequest["ReportObject"] = reportFilters;



            // Start with a default WHERE clause
            let selectClause: string = `bilRecDim.bill_recipient_type_name AS Bill_Recipient_Type_Name,bilRecDim.bill_recipient_type_id AS Bill_Recipient_Type_Id`;
            let invSelectClause: string = `COALESCE(invDim.value->>'invoice_to_label', '') AS Bill_Recipient_Type_Name, '' AS Bill_Recipient_Type_Id`;
            let whereClause: string = `
            bilFac.deleted_at is null 
           AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) 
           AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13)
            ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}         
           AND bilFac.case_type_id IS NOT NULL
            AND bilFac.patient_id IS NOT NULL
            AND bilFac.speciality_id IS NOT NULL
            AND bilFac.facility_location_id IS NOT NULL 
            `;
            let comma: string = ``;
            let bilRecFilter: string = ``;
            let EmployerFilter: string = ``;
            let nameClause: string = `Bill_Recipient_Type_Name AS Bill_Recipient_Type_Name,Bill_Recipient_Type_Id`;
            let nameClause2: string = `Bill_Recipient_Type_Name AS Bill_Recipient_Type_Name,NULL AS Bill_Recipient_Type_Id `;
            let dateClause: string = `CURRENT_DATE`;
            let groupByClause: string = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id`;
            let groupByClause2: string = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id`;
            let dynamicNUll: string = `NULL,NULL,NULL`;
            let orderByClause: string = `Bill_Recipient_Type_Name`;
            let NULLforfirstTime: string = '';
            let dynamicNullInbill = ` `;
            let dynamicValueInvoice = ` `;
            let dynamicNullInSUMandPercentage = ``;
            let dosDateFilter = ``;
            let invDateFilter = ``;
            let OtherFilter = ``;
            const invDimJoins = generateDynamicJoins('invDim');
            const dynamicobject1: object = {
                [`${GroupByID.Practice}`]: `FacDim.facility_qualifier AS group_by_name,FacDim.facility_id as group_by_id`,
                [`${GroupByID.Practice_Location}`]: `CONCAT(FacDim.facility_qualifier,'-',facLocDim.facility_location_name) AS group_by_name,facLocDim.facility_location_id AS group_by_id `,
                [`${GroupByID.Specialty}`]: `specDim.name AS group_by_name,specDim.specialty_id AS group_by_id`,
                [`${GroupByID.Provider}`]: `CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS group_by_name, usrDim.user_id AS group_by_id `,
                [`${GroupByID.Case_Type}`]: `casTypDim.name AS group_by_name, casTypDim.case_type_id AS group_by_id`
            };
            const dynamicobject2: object = {
                [`${GroupByID.Practice}`]: `FacDim.facility_qualifier AS subgroup_by_name,FacDim.facility_id as subgroup_by_id`,
                [`${GroupByID.Practice_Location}`]: `CONCAT(FacDim.facility_qualifier,'-',facLocDim.facility_location_name) AS subgroup_by_name,facLocDim.facility_location_id AS subgroup_by_id`,
                [`${GroupByID.Specialty}`]: `specDim.name AS subgroup_by_name,specDim.specialty_id AS subgroup_by_id`,
                [`${GroupByID.Provider}`]: `CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS subgroup_by_name,usrDim.user_id AS subgroup_by_id`,
                [`${GroupByID.Case_Type}`]: `casTypDim.name AS subgroup_by_name,casTypDim.case_type_id AS subgroup_by_id`

            };
            if (group_by_id) {
                selectClause += ` , ${dynamicobject1[`${group_by_id}`]}`;
                invSelectClause += ` , ${dynamicobject1[`${group_by_id}`]}`;
                comma = `,`;
                nameClause = `group_by_name,group_by_id`;
                nameClause2 = `NULL,NULL`;
                groupByClause = `group_by_name,group_by_id`;
                groupByClause2 = `Billed_Amount`;
                dynamicNUll = `NULL,NULL,NULL`;
                orderByClause = `group_by_name`;

            }
            if (group_by_id && subgroup_by_id) {
                selectClause += ` ,${dynamicobject2[`${subgroup_by_id}`]}`;
                invSelectClause += ` ,${dynamicobject2[`${subgroup_by_id}`]}`;
                comma = `,`;
                nameClause = `group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`;
                nameClause2 = `NULL,NULL,NULL,NULL`;
                groupByClause = `group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`;
                groupByClause2 = `Billed_Amount`;
                dynamicNUll = `NULL,NULL,NULL,NULL,NULL`;
                orderByClause = `group_by_name,subgroup_by_name`;
            }
            if (facility_location_ids && facility_location_ids.length > 0) {
                whereClause += ` AND bilFac.facility_location_id IN (${facility_location_ids})`;

            }
            if (patient_ids && patient_ids.length > 0) {
                whereClause += ` AND patDim.patient_id IN (${patient_ids})`;

            }
            if (insurance_ids && insurance_ids.length > 0) {
                whereClause += ` AND insDim.insurance_id IN (${insurance_ids})`;

            }
            if (attorney_ids && attorney_ids.length > 0) {
                whereClause += ` AND attDim.attorney_id IN (${attorney_ids})`;

            }
            if (firm_ids && firm_ids.length > 0) {
                whereClause += ` AND firmDim.firm_id IN (${firm_ids})`;

            }
            if (employer_ids && employer_ids.length > 0) {
                whereClause += ` AND caseFac.employers ?| ARRAY['${employer_ids.join("','")}']`;
                EmployerFilter += ` AND empDim.employer_id IN (${employer_ids})`;
            }
            if (case_type_ids && case_type_ids.length > 0) {
                whereClause += `AND casTypDim.case_type_id IN (${case_type_ids})`;

            }
            const BillRecepientTypeArr: number[] = [
                BillRecepientType.Patient,
                BillRecepientType.Employer,
                BillRecepientType.Insurance,
                BillRecepientType.Attorney,
                BillRecepientType.Other
            ];



            if (BillRecepientTypeArr.includes(bill_recipient_type_id) && !group_by_id && !subgroup_by_id) {
                bilRecFilter = `  AND bilRecDim.bill_recipient_type_id IN (${bill_recipient_type_id})`;
                OtherFilter = setInvoiceFilter(bill_recipient_type_id);
                nameClause = `Bill_Recipient_Type_Name AS Bill_Recipient_Type_Name,Bill_Recipient_Type_Id,
                Bill_RECIPIENT_NAME AS Bill_RECIPIENT_NAME,NULL AS INVOICE_RECIPIENT_NAME,Bill_Recipient_Id`;
                nameClause2 = `Bill_Recipient_Type_Name AS Bill_Recipient_Type_Name,NULL AS Bill_Recipient_Type_Id,
                 NULL AS Bill_RECIPIENT_NAME,INVOICE_RECIPIENT_NAME AS INVOICE_RECIPIENT_NAME,NULL::INT AS Bill_Recipient_Id`;
                groupByClause = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id,
                Bill_RECIPIENT_NAME,Bill_Recipient_Id`;
                groupByClause2 = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id,
                INVOICE_RECIPIENT_NAME,Invoice_Recipient_Id`;
                dynamicNUll = `NULL,NULL,NULL,NULL,NULL`
                orderByClause = `Bill_RECIPIENT_NAME`;
                dynamicNullInbill = ` NULL::INT AS Invoice_Recipient_Id,`;
                dynamicValueInvoice = `Invoice_Recipient_Id,`;
                dynamicNullInSUMandPercentage = `NULL,NULL,`;
            }
            if (BillRecepientTypeArr.includes(bill_recipient_type_id) && group_by_id && !subgroup_by_id) {
                bilRecFilter += ` AND bilRecDim.bill_recipient_type_id IN (${bill_recipient_type_id})`;
                OtherFilter = setInvoiceFilter(bill_recipient_type_id);
                nameClause = `Bill_Recipient_Type_Name AS Bill_Recipient_Type_Name,Bill_Recipient_Type_Id,
                Bill_RECIPIENT_NAME AS Bill_RECIPIENT_NAME,NULL AS INVOICE_RECIPIENT_NAME,Bill_Recipient_Id,group_by_name,group_by_id`;
                nameClause2 = `Bill_Recipient_Type_Name AS Bill_Recipient_Type_Name,NULL AS Bill_Recipient_Type_Id,
                NULL AS Bill_RECIPIENT_NAME,INVOICE_RECIPIENT_NAME AS INVOICE_RECIPIENT_NAME,NULL::INT AS Bill_Recipient_Id,group_by_name,group_by_id`;
                groupByClause = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id,
                Bill_RECIPIENT_NAME,Bill_Recipient_Id,group_by_name,group_by_id`;
                groupByClause2 = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id,
                INVOICE_RECIPIENT_NAME,Invoice_Recipient_Id,group_by_name,group_by_id`;
                dynamicNUll = `NULL,NULL,NULL,NULL,NULL,NULL,NULL`;
                orderByClause = `group_by_name,Bill_RECIPIENT_NAME`;
                dynamicNullInbill = ` NULL::INT AS Invoice_Recipient_Id,`
                dynamicValueInvoice = `Invoice_Recipient_Id,`
                dynamicNullInSUMandPercentage = `NULL,NULL,`;


            }
            if (BillRecepientTypeArr.includes(bill_recipient_type_id) && group_by_id && subgroup_by_id) {
                bilRecFilter += `  AND bilRecDim.bill_recipient_type_id IN (${bill_recipient_type_id})`;
                OtherFilter = setInvoiceFilter(bill_recipient_type_id);
                nameClause = ` Bill_Recipient_Type_Name AS Bill_Recipient_Type_Name,Bill_Recipient_Type_Id,
                Bill_RECIPIENT_NAME AS Bill_RECIPIENT_NAME,NULL AS INVOICE_RECIPIENT_NAME,Bill_Recipient_Id,group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`;
                nameClause2 = ` Bill_Recipient_Type_Name AS Bill_Recipient_Type_Name,NULL AS Bill_Recipient_Type_Id,
                 NULL AS Bill_RECIPIENT_NAME,INVOICE_RECIPIENT_NAME AS INVOICE_RECIPIENT_NAME,NULL::INT AS Bill_Recipient_Id,group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`;
                groupByClause = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id,
                Bill_RECIPIENT_NAME,Bill_Recipient_Id,group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`;
                groupByClause2 = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id,
                INVOICE_RECIPIENT_NAME,Invoice_Recipient_Id,group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`;
                dynamicNUll = `NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL`;
                orderByClause = `group_by_name,subgroup_by_name,Bill_RECIPIENT_NAME`;
                dynamicNullInbill = ` NULL::INT AS Invoice_Recipient_Id,`
                dynamicValueInvoice = `Invoice_Recipient_Id,`
                dynamicNullInSUMandPercentage = `NULL,NULL,`;

            }
            // If physician_ids are provided, filter by them
            if (doctor_ids && doctor_ids.length > 0) {
                whereClause += ` AND usrDim.user_id IN (${doctor_ids})`;
            }
            // If speciality_ids are provided, filter by them
            if (speciality_ids && speciality_ids.length > 0) {
                whereClause += ` AND specDim.specialty_id IN (${speciality_ids})`;
            }
            if (As_of) {
                dateClause = `'${As_of}'::Date`;
            }
            switch (date_type) {
                case DateType.DOS:
                    whereClause += ` AND bilFac.dos_from_date >= '${start_date}' AND bilFac.dos_to_date <= '${end_date}'`;
                    dosDateFilter = `AND invDim.dos_start >= '${start_date}' AND invDim.dos_end <= '${end_date}' `;
                    break;
                case DateType.BilledDate:
                    whereClause += ` AND bilFac.bill_date >= '${start_date}' AND bilFac.bill_date <= '${end_date}'`;
                    invDateFilter = ` AND invDim.invoice_date >= '${start_date}' AND invDim.invoice_date <= '${end_date}'`;
                    break;
            }

            let commonJoinClause = ` LEFT JOIN
                specialities_dim AS specDim ON bilFac.speciality_id = specDim.specialty_id AND specDim.deleted_at is NULL
                LEFT JOIN 
                facilities_dim AS FacDim ON bilFac.facility_id = FacDim.facility_id AND FacDim.deleted_at is NULL
                LEFT JOIN
                facility_location_dim AS facLocDim ON bilFac.facility_location_id = facLocDim.facility_location_id AND facLocDim.deleted_at is null
                LEFT JOIN
                case_fact_new AS caseFac ON bilFac.case_id = caseFac.case_id AND caseFac.deleted_at is null
                LEFT JOIN
                attorney_dim AS attDim ON caseFac.attorney_id = attDim.attorney_id AND attDim.deleted_at is null
                LEFT JOIN(
                    SELECT 
                        user_id,first_name,middle_name,last_name,deleted_at
                        FROM 
                        users_dim
                    )usrDim ON  bilFac.doctor_id = usrDim.user_id AND usrDim.deleted_at is null
                LEFT JOIN 
                case_types_dim AS casTypDim ON bilFac.case_type_id = casTypDim.case_type_id AND casTypDim.deleted_at is NULL`

            let commonSumClause = ` SUM(Billed_Amount) AS Billed_Amount,
            COALESCE(SUM(Check_Amount), 0) AS Check_Amount,
            SUM(Write_off_Amount) AS Write_off_Amount,
            SUM(Balance_0_to_29_Days) AS Balance_0_to_29_Days,
            SUM(Balance_30_to_59_Days) AS Balance_30_to_59_Days,
            SUM(Balance_60_to_89_Days) AS Balance_60_to_89_Days,
            SUM(Balance_90_to_119_Days) AS Balance_90_to_119_Days,
            SUM(Balance_120_to_149_Days) AS Balance_120_to_149_Days,
            SUM(Balance_150PlusDays) AS Balance_150PlusDays,
            SUM(Total_Outstanding_Amount) AS Total_Outstanding_Amount`;

            let commonTotalSumClause = `
            SUM(cs.Billed_Amount) AS Billed_Amount,
            SUM(cs.Check_Amount) AS Check_Amount,
            SUM(cs.Write_off_Amount) AS Write_off_Amount,
            SUM(cs.Balance_0_to_29_Days) AS Balance_0_to_29_Days,
            SUM(cs.Balance_30_to_59_Days) AS Balance_30_to_59_Days,
            SUM(cs.Balance_60_to_89_Days) AS Balance_60_to_89_Days,
            SUM(cs.Balance_90_to_119_Days) AS Balance_90_to_119_Days,
            SUM(cs.Balance_120_to_149_Days) AS Balance_120_to_149_Days,
            SUM(cs.Balance_150PlusDays) AS Balance_150PlusDays,
            SUM(cs.Total_Outstanding_Amount) AS Total_Outstanding_Amount`;

            let commonFromClause = `
            (
           SELECT
           Billed_Amount,
           Check_Amount,
           Write_off_Amount,
           Balance_0_to_29_Days,
           Balance_30_to_59_Days,
           Balance_60_to_89_Days,
           Balance_90_to_119_Days,
           Balance_120_to_149_Days,
           Balance_150PlusDays,
           Total_Outstanding_Amount
           FROM
            bills_summary
            UNION ALL
           SELECT
        Billed_Amount,
        Check_Amount,
        Write_off_Amount,
        Balance_0_to_29_Days,
        Balance_30_to_59_Days,
        Balance_60_to_89_Days,
        Balance_90_to_119_Days,
        Balance_120_to_149_Days,
        Balance_150PlusDays,
        Total_Outstanding_Amount
    FROM
        invoice_summary
) AS cs`
            let commonFromClauseForGroupBy = `
            (
    SELECT
        Billed_Amount,
        Check_Amount,
        Write_off_Amount,
        Balance_0_to_29_Days,
        Balance_30_to_59_Days,
        Balance_60_to_89_Days,
        Balance_90_to_119_Days,
        Balance_120_to_149_Days,
        Balance_150PlusDays,
        Total_Outstanding_Amount
    FROM
        bills_summary  ) AS cs `

            let commonPercentageClause = `
            CAST(100.0 * COALESCE(SUM(cs.Billed_Amount) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2)),
            CAST(100.0 * COALESCE(SUM(cs.Check_Amount) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2)),
            CAST(100.0 * COALESCE(SUM(cs.Write_off_Amount) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2)),
            CAST(100.0 * COALESCE(SUM(cs.Balance_0_to_29_Days) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2)),
            CAST(100.0 * COALESCE(SUM(cs.Balance_30_to_59_Days) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2)),
           CAST(100.0 * COALESCE(SUM(cs.Balance_60_to_89_Days) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2)),
           CAST(100.0 * COALESCE(SUM(cs.Balance_90_to_119_Days) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2)),
           CAST(100.0 * COALESCE(SUM(cs.Balance_120_to_149_Days) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2)),
           CAST(100.0 * COALESCE(SUM(cs.Balance_150PlusDays) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2)),
           CAST(100.0 * COALESCE(SUM(cs.Total_Outstanding_Amount) / NULLIF(SUM(cs.Billed_Amount), 0), 0) AS DECIMAL(18,2))`


            let filtered_invoices = `
             WITH filtered_invoices AS (
              SELECT
               invDim.*,
             jsonb_each.key AS invoice_location_id,
             jsonb_each.value AS value
            FROM invoices_dim invDim,
           LATERAL jsonb_each(invDim.invoice_to_locations)
         WHERE 
         invDim.deleted_at IS NULL AND invDim.bills IS NOT NULL ${dosDateFilter} ${invDateFilter} ${OtherFilter} ),`

            let billdata: string = `
            ---------bills_summary data----------------------
                bills_summary AS (
                SELECT DISTINCT ON (bilFac.bill_id)    
                CONCAT(bilRecDim.bill_recipient_f_name,' ',bilRecDim.bill_recipient_m_name,' ',bilRecDim.bill_recipient_l_name) AS Bill_Recipient_Name,
                bilRecDim.bill_recipient_id AS Bill_Recipient_Id,
                bilFac.bill_amount AS Billed_Amount,
                payFac.check_amount AS Check_Amount,
                bilFac.write_off_amount AS Write_off_Amount,
                (CASE WHEN bilFac.bill_date <= ${dateClause} AND ${dateClause} - bilFac.bill_date <= 30 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_0_to_29_Days,
                (CASE WHEN bilFac.bill_date <= ${dateClause} AND ${dateClause} - bilFac.bill_date  > 30 AND ${dateClause} - bilFac.bill_date  <= 60 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_30_to_59_Days,
                (CASE WHEN bilFac.bill_date <= ${dateClause} AND ${dateClause} - bilFac.bill_date  > 60 AND ${dateClause} - bilFac.bill_date  <= 90 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_60_to_89_Days,
                (CASE WHEN bilFac.bill_date <= ${dateClause} AND ${dateClause} - bilFac.bill_date  > 90 AND ${dateClause} - bilFac.bill_date  <= 120 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_90_to_119_Days,
                (CASE WHEN bilFac.bill_date <= ${dateClause} AND ${dateClause} - bilFac.bill_date  > 120 AND ${dateClause} - bilFac.bill_date  <= 150 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_120_to_149_Days,
               
                (CASE WHEN bilFac.bill_date <= ${dateClause} AND ${dateClause} - bilFac.bill_date  > 150 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_150PlusDays,
                (bilFac.outstanding_amount) AS Total_Outstanding_Amount,
                ${selectClause}

                From
                bills_fact_new AS bilFac
                LEFT JOIN (
                    SELECT
                        bill_id,
                       SUM(check_amount) AS check_amount
                    FROM
                        payment_fact
                    WHERE
                        deleted_at IS NULL
                    GROUP BY
                        bill_id
                ) payFac ON bilFac.bill_id = payFac.bill_id
               ${commonJoinClause}
               LEFT JOIN
                bills_recipient_dim AS bilRecDim ON bilFac.bill_id = bilRecDim.bill_id AND bilRecDim.deleted_at is null
                LEFT JOIN
                insurance_dim AS insDim ON bilRecDim.insurance_id = insDim.insurance_id AND insDim.deleted_at is null
                LEFT JOIN
                (SELECT 
                    patient_id,
                    first_name,middle_name,last_name,
                    deleted_at
                FROM 
                patient_dim 
                ) patDim ON bilRecDim.patient_id = patDim.patient_id AND patDim.deleted_at is null
               LEFT JOIN
                firms_dim AS  firmDim ON caseFac.firm_id = firmDim.firm_id ANd firmDim.deleted_at is null
                WHERE
                ${whereClause}  ${bilRecFilter}  AND bilRecDim.bill_recipient_type_id IS NOT NULL     
       )`
            let dynamicComma = ',';
            //    -------------------invoice data --------------------------------
            let invoiceData = `invoice_summary AS (
                SELECT 
                DISTINCT ON (invDim.invoice_id)
                COALESCE(invDim.value->>'name', '') AS INVOICE_RECIPIENT_NAME,
				COALESCE(CAST(invDim.value->>'invoice_to_id' AS INT)) AS Invoice_Recipient_Id,
				invDim.invoice_amount AS Billed_Amount,
                payFac.check_amount AS Check_Amount, 
				invDim.write_off_amount AS Write_off_Amount,
                (CASE WHEN invDim.invoice_date <= ${dateClause} AND ${dateClause} - invDim.invoice_date <= 30 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_0_to_29_Days,
                (CASE WHEN invDim.invoice_date <= ${dateClause} AND ${dateClause} - invDim.invoice_date  > 30 AND ${dateClause} - invDim.invoice_date  <= 60 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_30_to_59_Days,
                (CASE WHEN invDim.invoice_date <= ${dateClause} AND ${dateClause} - invDim.invoice_date  > 60 AND ${dateClause} - invDim.invoice_date  <= 90 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_60_to_89_Days,
                (CASE WHEN invDim.invoice_date <= ${dateClause} AND ${dateClause} - invDim.invoice_date  > 90 AND ${dateClause} - invDim.invoice_date  <= 120 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_90_to_119_Days,
                (CASE WHEN invDim.invoice_date <= ${dateClause} AND ${dateClause} - invDim.invoice_date  > 120 AND ${dateClause} - invDim.invoice_date  <= 150 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_120_to_149_Days,
                (CASE WHEN invDim.invoice_date <= ${dateClause} AND ${dateClause} - invDim.invoice_date  > 150 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_150PlusDays,
                (invDim.outstanding_amount) AS Total_Outstanding_Amount,
                ${invSelectClause}
                From
                bills_fact_new AS bilFac
                LEFT JOIN 
				filtered_invoices AS invDim ON invDim.bills @> to_jsonb(bilFac.bill_id) 

                LEFT JOIN (
                    SELECT
                        invoice_id,
                       SUM(check_amount) AS check_amount
                    FROM
                        payment_fact
                    WHERE
                        deleted_at IS NULL
                    GROUP BY
                        invoice_id
                ) payFac ON invDim.invoice_id = payFac.invoice_id
                
                ${commonJoinClause}
                ${invDimJoins} 
                WHERE
                ${whereClause} ${EmployerFilter}  AND COALESCE(invDim.value->>'invoice_to_label', '') <> ''
       )`


            // --------------common sum clause -----------------------------
            let commonSumPercentage = ` SELECT
           'Detail'::TEXT AS ResultType,
           'Bill' AS Category,
               ${nameClause},
            ${dynamicNullInbill}  
            ${commonSumClause}
            FROM 
            bills_summary
                GROUP BY
                ${groupByClause}
            UNION ALL
             SELECT
           'Detail'::TEXT AS ResultType,
           'Invoice' AS Category,         
             ${nameClause2},
             ${dynamicValueInvoice}
             ${NULLforfirstTime}
            ${commonSumClause}
            FROM 
            invoice_summary
                GROUP BY
                ${groupByClause2}
        
------------------total sum clause ---------------------------------
            UNION ALL
                SELECT
                'Total Sum':: TEXT AS ResultType,
                ${dynamicNUll},
                ${dynamicNullInSUMandPercentage}
                ${commonTotalSumClause}
            FROM
              ${commonFromClause}      
-----------------------Percentage clause -------------------------------            
            UNION ALL
             SELECT
            'Percentage':: TEXT AS Percentage,
            ${dynamicNUll},
           ${dynamicNullInSUMandPercentage}
            ${commonPercentageClause}
            FROM
            ${commonFromClause}
            ORDER BY
        ${orderByClause}`;


            if ((group_by_id || subgroup_by_id) && !bill_recipient_type_id) {
                commonSumPercentage = ` SELECT
           'Detail'::TEXT AS ResultType,
           'Bill' AS Category,
               ${nameClause},
            ${dynamicNullInbill}  
            ${commonSumClause}
            FROM 
            bills_summary
                GROUP BY
                ${groupByClause}
        
------------------total sum clause ---------------------------------
            UNION ALL
                SELECT
                'Total Sum':: TEXT AS ResultType,
                ${dynamicNUll},
                ${dynamicNullInSUMandPercentage}
                ${commonTotalSumClause}
            FROM
              ${commonFromClauseForGroupBy}      
-----------------------Percentage clause -------------------------------            
            UNION ALL
             SELECT
            'Percentage':: TEXT AS Percentage,
            ${dynamicNUll},
           ${dynamicNullInSUMandPercentage}
            ${commonPercentageClause}
            FROM
            ${commonFromClauseForGroupBy}
            ORDER BY
            ${orderByClause}  `
            }





            let AccountRecievableQuery: string = `${filtered_invoices}${billdata}${dynamicComma}${invoiceData}${commonSumPercentage}`;



            const results: any[] = await sequelize.query(AccountRecievableQuery);
            const result1: any[] = results[0];
            const sumResults: object = result1.filter(
                (result) => result.resulttype === "Total Sum"
            );
            const PercentageResults: object = result1.filter(
                (result) => result.resulttype === "Percentage"
            );
            const detailResults: object = result1.filter(
                (result) => result.resulttype === "Detail"
            );
            const combinedResult: object = {
                detailResults: detailResults,
                sumResults: sumResults,
                PercentageResults: PercentageResults
            };
            return combinedResult;
        } catch (error) {
            throw error;
        }
    };



    public getAccountReceivableDetailReport = async (reportFilters?) => {
        try {
            let {
                columnName,
                bill_recipient_name,
                invoice_recipient_name,
                bill_recipient_id,
                Invoice_Recipient_Id,
                bill_recipient_type_name,
                bill_recipient_type_id,
                subgroup_by_name,
                maingroup_by_id,
                mainsubgroup_by_id,
                group_by_id,
                subgroup_by_id,
                group_by_name,
                date_type,
                start_date,
                end_date,
                facility_location_ids,
                case_type_ids,
                speciality_ids,
                doctor_ids,
                insurance_ids,
                patient_ids,
                attorney_ids,
                employer_ids,
                firm_ids
            }: ReportRequest["Ar_Detail_report_Object"] = reportFilters;

            let whereClause: string = `Bill_Recipient_Type_Id = ${bill_recipient_type_id}`;
            let invWhereCondition: string = `Bill_Recipient_Type_Name = ${bill_recipient_type_name}`;

            let mainWhereClause: string = `bilFac.deleted_at is NULL AND payFac.deleted_at is NULL
            AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != ${ExcludedUser.QaUser})
            AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != ${ExcludedUser.QaUser})
            ${qaSpecialitiesFilter('bilFac')} ${qaLocationsFilter('bilFac')} 
            AND bilFac.case_type_id IS NOT NULL
            AND bilFac.patient_id IS NOT NULL
            AND bilFac.speciality_id IS NOT NULL
            AND bilFac.facility_location_id IS NOT NULL `;
            let invRecFilter = ``;

            let EmployerFilter = ``;
            let RecTypFilter = ``;

            let DateClause: string = `CURRENT_DATE`;
            let queryClause: string = ``;
            let selectClause: string = `bilRecDim.bill_recipient_type_name AS Bill_Recipient_Type_Name,bilRecDim.bill_recipient_type_id AS Bill_Recipient_Type_Id`;
            let selectClause2: string = `COALESCE(invDim.value->>'invoice_to_label', '') AS Bill_Recipient_Type_Name`;
            let groupbyClause: string = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id`;
            let groupbyClause2: string = `Bill_Recipient_Type_Name`;
            let dosDateFilter = ``;
            let invDateFilter = ``;
            const invDimJoins = generateDynamicJoins('invDim');

            const escapedBillRecipientName: string = this.escapeSqlValue(bill_recipient_name);
            const escapedBillrecipientTypeName: string = this.escapeSqlValue(bill_recipient_type_name);
            const groupBy: string = this.escapeSqlValue(group_by_name);
            const subGroupBy: string = this.escapeSqlValue(subgroup_by_name);
            const dynamicobject1: object = {
                [`${GroupByID.Practice}`]: `FacDim.facility_qualifier AS group_by_name,FacDim.facility_id as group_by_id`,
                [`${GroupByID.Practice_Location}`]: `CONCAT(FacDim.facility_qualifier,'-',facLocDim.facility_location_name) AS group_by_name,facLocDim.facility_location_id AS group_by_id `,
                [`${GroupByID.Specialty}`]: `specDim.name AS group_by_name,specDim.specialty_id AS group_by_id`,
                [`${GroupByID.Provider}`]: `CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS group_by_name, usrDim.user_id AS group_by_id `,
                [`${GroupByID.Case_Type}`]: `casTypDim.name AS group_by_name,casTypDim.case_type_id AS group_by_id`
            };
            const dynamicobject2: object = {
                [`${GroupByID.Practice}`]: `FacDim.facility_qualifier AS subgroup_by_name,FacDim.facility_id as subgroup_by_id`,
                [`${GroupByID.Practice_Location}`]: `CONCAT(FacDim.facility_qualifier,'-',facLocDim.facility_location_name) AS subgroup_by_name,facLocDim.facility_location_id AS subgroup_by_id`,
                [`${GroupByID.Specialty}`]: `specDim.name AS subgroup_by_name,specDim.specialty_id AS subgroup_by_id`,
                [`${GroupByID.Provider}`]: `CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS subgroup_by_name,usrDim.user_id AS subgroup_by_id`,
                [`${GroupByID.Case_Type}`]: `casTypDim.name AS subgroup_by_name,casTypDim.case_type_id AS subgroup_by_id`

            };

            if (bill_recipient_type_id || bill_recipient_type_name) {
                RecTypFilter = `AND bilRecDim.bill_recipient_type_id IN (${bill_recipient_type_id})`;
                invRecFilter = setInvoiceFilter(bill_recipient_type_id);
                selectClause = `bilRecDim.bill_recipient_type_name AS Bill_Recipient_Type_Name,bilRecDim.bill_recipient_type_id AS Bill_Recipient_Type_Id`;
                groupbyClause = `Bill_Recipient_Type_Name,Bill_Recipient_Type_Id`;
            }

            // when bill_recipient_id is coming from frontend
            if (bill_recipient_id && !group_by_id && !invoice_recipient_name) {                       // 1
                groupbyClause = `Bill_Recipient_Name,Bill_Recipient_Id`;
                groupbyClause2 = `Bill_Recipient_Name,Invoice_Recipient_Id`;
                whereClause = `Bill_Recipient_Id = ${bill_recipient_id}`;
                invWhereCondition = `Bill_Recipient_Name = ${invoice_recipient_name}`;
            }
            if (group_by_id && !invoice_recipient_name) {                        // 3
                selectClause = dynamicobject1[`${maingroup_by_id}`];
                selectClause2 = dynamicobject1[`${maingroup_by_id}`];
                groupbyClause = `group_by_name,group_by_id`
                groupbyClause2 = `group_by_name,group_by_id`
                whereClause = `group_by_id = ${group_by_id}`;
                invWhereCondition = `group_by_id = ${group_by_id}`;
            }
            if (group_by_id && bill_recipient_id && !mainsubgroup_by_id && !invoice_recipient_name) {
                selectClause = dynamicobject1[`${maingroup_by_id}`];
                selectClause2 = dynamicobject1[`${maingroup_by_id}`];
                groupbyClause = `Bill_Recipient_Name,Bill_Recipient_Id,group_by_name,group_by_id`
                groupbyClause2 = `Bill_Recipient_Name,Invoice_Recipient_Id,group_by_name,group_by_id`
                whereClause = `group_by_id = ${group_by_id} AND Bill_Recipient_Id = ${bill_recipient_id} `;
                invWhereCondition = `group_by_id = ${group_by_id} AND Bill_Recipient_Name = ${invoice_recipient_name} `;
            }
            if (group_by_id && subgroup_by_id && !bill_recipient_id && !invoice_recipient_name) {
                selectClause += `, ${dynamicobject2[`${mainsubgroup_by_id}`]}`;
                selectClause2 += `, ${dynamicobject2[`${mainsubgroup_by_id}`]}`;
                groupbyClause = `group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`
                groupbyClause2 = `group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`
                whereClause = `group_by_id = ${group_by_id} AND subgroup_by_id = ${subgroup_by_id}`;
                invWhereCondition = `group_by_id = ${group_by_id} AND subgroup_by_id = ${subgroup_by_id}`;

            }
            if (group_by_id && subgroup_by_id && bill_recipient_id && !invoice_recipient_name) {
                selectClause += `, ${dynamicobject2[`${mainsubgroup_by_id}`]}`;
                selectClause2 += `, ${dynamicobject2[`${mainsubgroup_by_id}`]}`;
                groupbyClause = `Bill_Recipient_Name,Bill_Recipient_Id,group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`
                groupbyClause2 = `Bill_Recipient_Name,Invoice_Recipient_Id,group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`
                whereClause = `Bill_Recipient_Id = ${bill_recipient_id} AND group_by_id = ${group_by_id} AND subgroup_by_id = ${subgroup_by_id}`;
                invWhereCondition = `Bill_Recipient_Name = ${invoice_recipient_name} AND group_by_id = ${group_by_id} AND subgroup_by_id = ${subgroup_by_id}`;
            }
            // when invoice_recipient_id is coming from frontend 
            if (invoice_recipient_name && !group_by_id && !bill_recipient_id) {                       // 1
                groupbyClause = `Bill_Recipient_Name,Bill_Recipient_Id`;
                groupbyClause2 = `Bill_Recipient_Name,Invoice_Recipient_Id`;
                whereClause = `Bill_Recipient_Id = NULL`;
                invWhereCondition = `Bill_Recipient_Name = ${invoice_recipient_name}`;
            }
            if (group_by_id && !bill_recipient_id) {                        // 3
                selectClause = dynamicobject1[`${maingroup_by_id}`];
                selectClause2 = dynamicobject1[`${maingroup_by_id}`];
                groupbyClause = `group_by_name,group_by_id`
                groupbyClause2 = `group_by_name,group_by_id`
                whereClause = `group_by_id = ${group_by_id}`;
                invWhereCondition = `group_by_id = ${group_by_id}`;
            }
            if (group_by_id && invoice_recipient_name && !mainsubgroup_by_id && !bill_recipient_id) {
                selectClause = dynamicobject1[`${maingroup_by_id}`];
                selectClause2 = dynamicobject1[`${maingroup_by_id}`];
                groupbyClause = `Bill_Recipient_Name,Bill_Recipient_Id,group_by_name,group_by_id`
                groupbyClause2 = `Bill_Recipient_Name,Invoice_Recipient_Id,group_by_name,group_by_id`
                whereClause = `group_by_id = ${group_by_id} AND Bill_Recipient_Id = NULL `;
                invWhereCondition = `group_by_id = ${group_by_id} AND Bill_Recipient_Name = ${invoice_recipient_name} `;
            }
            if (group_by_id && subgroup_by_id && !invoice_recipient_name && !bill_recipient_id) {
                selectClause += `, ${dynamicobject2[`${mainsubgroup_by_id}`]}`;
                selectClause2 += `, ${dynamicobject2[`${mainsubgroup_by_id}`]}`;
                groupbyClause = `group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`
                groupbyClause2 = `group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`
                whereClause = `group_by_id = ${group_by_id} AND subgroup_by_id = ${subgroup_by_id}`;
                invWhereCondition = `group_by_id = ${group_by_id} AND subgroup_by_id = ${subgroup_by_id}`;

            }
            if (group_by_id && subgroup_by_id && invoice_recipient_name && !bill_recipient_id) {
                selectClause += `, ${dynamicobject2[`${mainsubgroup_by_id}`]}`;
                selectClause2 += `, ${dynamicobject2[`${mainsubgroup_by_id}`]}`;
                groupbyClause = `Bill_Recipient_Name,Bill_Recipient_Id,group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`
                groupbyClause2 = `Bill_Recipient_Name,Invoice_Recipient_Id,group_by_name,group_by_id,subgroup_by_name,subgroup_by_id`
                whereClause = `Bill_Recipient_Id = NULL AND group_by_id = ${group_by_id} AND subgroup_by_id = ${subgroup_by_id}`;
                invWhereCondition = `Bill_Recipient_Name = ${invoice_recipient_name} AND group_by_id = ${group_by_id} AND subgroup_by_id = ${subgroup_by_id}`;
            }



            if (columnName) {
                queryClause = this.getQueryClauseForAr(columnName);
            }
            switch (date_type) {
                case DateType.DOS:
                    mainWhereClause += ` AND bilFac.dos_from_date >= '${start_date}' AND bilFac.dos_to_date <= '${end_date}'`;
                    dosDateFilter = ` AND invDim.dos_start >= '${start_date}' AND invDim.dos_end <= '${end_date}'`

                    break;
                case DateType.BilledDate:
                    mainWhereClause += ` AND bilFac.bill_date >= '${start_date}' AND bilFac.bill_date <= '${end_date}'`;
                    invDateFilter = ` AND invDim.invoice_date >= '${start_date}' AND invDim.invoice_date <= '${end_date}'`;
                    break;
            }
            if (facility_location_ids && facility_location_ids.length > 0) {
                mainWhereClause += ` AND bilFac.facility_location_id IN (${facility_location_ids})`;

            }
            if (patient_ids && patient_ids.length > 0) {
                mainWhereClause += ` AND patDim.patient_id IN (${patient_ids})`;

            }
            if (insurance_ids && insurance_ids.length > 0) {
                mainWhereClause += ` AND insDim.insurance_id IN (${insurance_ids})`;

            }
            if (attorney_ids && attorney_ids.length > 0) {
                mainWhereClause += ` AND attDim.attorney_id IN (${attorney_ids})`;

            }
            if (firm_ids && firm_ids.length > 0) {
                mainWhereClause += ` AND firmDim.firm_id IN (${firm_ids})`;

            }
            if (employer_ids && employer_ids.length > 0) {
                mainWhereClause += ` AND caseFac.employers ?| ARRAY['${employer_ids.join("','")}']`;
                EmployerFilter = ` AND empDim.employer_id IN (${employer_ids})`;
            }
            if (case_type_ids && case_type_ids.length > 0) {
                mainWhereClause += ` AND casTypDim.case_type_id IN (${case_type_ids})`;

            }
            // If physician_ids are provided, filter by them
            if (doctor_ids && doctor_ids.length > 0) {
                mainWhereClause += ` AND usrDim.user_id IN (${doctor_ids})`;

            }
            // If speciality_ids are provided, filter by them
            if (speciality_ids && speciality_ids.length > 0) {
                mainWhereClause += ` AND specDim.specialty_id IN (${speciality_ids})`;

            }



            let filtered_invoices = `
            WITH filtered_invoices AS (
             SELECT
              invDim.*,
            jsonb_each.key AS invoice_location_id,
            jsonb_each.value AS value
           FROM invoices_dim invDim,
          LATERAL jsonb_each(invDim.invoice_to_locations)
        WHERE invDim.deleted_at IS NULL AND invDim.bills IS NOT NULL  ${dosDateFilter}  ${invDateFilter} ${invRecFilter}),`
            let ARmainDetail: string = `
 bill_data AS (
    SELECT DISTINCT ON (bilFac.bill_id)
    bilFac.bill_label AS bill_ID,
    bilFac.case_id AS case_ID,
    TO_CHAR(bilFac.bill_date, 'MM-DD-YY') AS Billed_date,
    TO_CHAR(bilFac.accident_date, 'MM-DD-YY') AS Accident_Date,
    bilStatDim.name AS Bill_Status,
    eorStatDim.name AS EOR_Status,
    denStatDim.name AS Denial_Status,
    verStatDim.name AS Verification_Status,
    payStatDim.name AS Payment_Status,
    casTypDim.name AS Case_Type,
    CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS Patient_Name,
    specDim.name AS specialty,
    CONCAT(FacDim.facility_qualifier,'-',facLocDim.facility_location_name) AS Practice_location,
    CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS Provider_Name,
    TO_CHAR(bilFac.dos_from_date,'MM-DD-YY') AS Dos_From_Date,
    TO_CHAR(bilFac.dos_to_date,'MM-DD-YY') AS Dos_To_Date,
    TO_CHAR(payFac.check_date,'MM-DD-YY') AS Check_Date,
    payFac.check_amount AS Check_Amount,
    bilFac.bill_amount AS billed_amount,
    bilFac.paid_amount AS paid_amount,
    bilFac.outstanding_amount AS outstanding_amount,
    bilFac.write_off_amount AS write_Off,
    bilFac.over_payment AS overpayment,
    bilFac.interest_amount AS Interest,
    CONCAT(attDim.first_name,' ',attDim.middle_name,' ',attDim.last_name) AS Attorney_Name,
    firmDim.firm_name AS Firm_Name,
    ${selectClause},
    CONCAT(bilRecDim.bill_recipient_f_name,' ',bilRecDim.bill_recipient_m_name,' ',bilRecDim.bill_recipient_l_name) AS Bill_Recipient_Name,
    bilRecDim.bill_recipient_id AS Bill_Recipient_Id,
    denTypDim.denial_type_name AS Denial_Type,
        (CASE WHEN bilFac.bill_date <= ${DateClause} AND ${DateClause} - bilFac.bill_date <= 30 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_0_to_29_Days,
        (CASE WHEN bilFac.bill_date <= ${DateClause} AND ${DateClause} - bilFac.bill_date  > 30 AND ${DateClause} - bilFac.bill_date  <= 60 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_30_to_59_Days,
        (CASE WHEN bilFac.bill_date <= ${DateClause} AND ${DateClause} - bilFac.bill_date  > 60 AND ${DateClause} - bilFac.bill_date  <= 90 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_60_to_89_Days,
        (CASE WHEN bilFac.bill_date <= ${DateClause} AND ${DateClause} - bilFac.bill_date  > 90 AND ${DateClause} - bilFac.bill_date  <= 120 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_90_to_119_Days,
        (CASE WHEN bilFac.bill_date <= ${DateClause} AND ${DateClause} - bilFac.bill_date  > 120 AND ${DateClause} - bilFac.bill_date  <= 150 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_120_to_149_Days,
        (CASE WHEN bilFac.bill_date <= ${DateClause} AND ${DateClause} - bilFac.bill_date  > 150 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_150PlusDays,
        (bilFac.outstanding_amount) AS Total_Outstanding_Amount
    FROM
        bills_fact_new as bilFac
    LEFT JOIN payment_fact AS payFac ON payFac.bill_id = bilFac.bill_id
    LEFT JOIN payment_status_dim AS payStatDim ON payFac.payment_status_id = payStatDim.payment_status_id AND payStatDim.deleted_at is NULL
    LEFT JOIN verification_status_dim AS verStatDim ON bilFac.verification_status_id = verStatDim.verification_status_id AND verStatDim.deleted_at is NULL
    LEFT JOIN denial_status_dim AS denStatDim ON bilFac.denial_status_id = denStatDim.denial_status_id AND denStatDim.deleted_at is NULL
    LEFT JOIN eor_status_dim AS eorStatDim ON bilFac.eor_status_id = eorStatDim.eor_status_id AND eorStatDim.deleted_at is NULL
    LEFT JOIN bill_status_dim AS bilStatDim ON bilFac.bill_status_id = bilStatDim.bill_status_id AND bilStatDim.deleted_at is NULL
    LEFT JOIN case_types_dim AS casTypDim ON bilFac.case_type_id = casTypDim.case_type_id AND casTypDim.deleted_at is NULL
    LEFT JOIN case_fact_new AS caseFac ON bilFac.case_id = caseFac.case_id AND caseFac.deleted_at is NULL
    LEFT JOIN patient_dim AS patDim ON bilFac.patient_id = patDim.patient_id AND patDim.deleted_at is NULL
    LEFT JOIN specialities_dim AS specDim ON bilFac.speciality_id = specDim.specialty_id AND specDim.deleted_at is NULL
    LEFT JOIN facilities_dim AS FacDim ON bilFac.facility_id = FacDim.facility_id AND FacDim.deleted_at is NULL
    LEFT JOIN  facility_location_dim AS facLocDim ON bilFac.facility_location_id = facLocDim.facility_location_id AND facLocDim.deleted_at is NULL
    LEFT JOIN  users_dim AS usrDim ON  bilFac.doctor_id = usrDim.user_id AND usrDim.deleted_at is NULL
    LEFT JOIN  payment_by_dim AS payByDim ON payFac.payment_by_id = payByDim.payment_by_id AND payByDim.deleted_at is NULL
    LEFT JOIN payment_type_dim AS payTypDim ON payFac.payment_type_id = payTypDim.payment_type_id AND payTypDim.deleted_at is NULL
    LEFT JOIN bills_recipient_dim AS bilRecDim ON bilFac.bill_id = bilRecDim.bill_id AND bilRecDim.deleted_at is NULL
    LEFT JOIN insurance_dim AS insDim ON bilRecDim.insurance_id = insDim.insurance_id AND insDim.deleted_at is null
    LEFT JOIN attorney_dim AS attDim ON caseFac.attorney_id = attDim.attorney_id AND attDim.deleted_at is NULL
    LEFT JOIN firms_dim AS firmDim ON caseFac.firm_id = firmDim.firm_id AND firmDim.deleted_at is NULL
    LEFT JOIN denial_dim AS denDim ON bilFac.bill_id = denDim.bill_id AND denDim.deleted_at is NULL
    LEFT JOIN denial_type_dim AS denTypDim on denDim.denial_id = CAST(denTypDim.denial_id AS INTEGER) AND denTypDim.deleted_at is NULL
  WHERE
  ${mainWhereClause} ${RecTypFilter}  AND bilRecDim.bill_recipient_type_id IS NOT NULL
),
 invoice_data AS (
    SELECT DISTINCT ON (invDim.invoice_id)
    COALESCE(invDim.invoice_id::text, '') AS Bill_ID,
    bilFac.case_id AS case_ID,
    TO_CHAR(invDim.invoice_date, 'MM-DD-YY') AS Billed_date,
    TO_CHAR(bilFac.accident_date, 'MM-DD-YY') AS Accident_Date,
    bilStatDim.name AS Bill_Status,
    eorStatDim.name AS EOR_Status,
    denStatDim.name AS Denial_Status,
    verStatDim.name AS Verification_Status,
    payStatDim.name AS Payment_Status,
    casTypDim.name AS Case_Type,
    CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS Patient_Name,
    specDim.name AS specialty,
    CONCAT(FacDim.facility_qualifier,'-',facLocDim.facility_location_name) AS Practice_location,
    CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS Provider_Name,
    TO_CHAR(bilFac.dos_from_date,'MM-DD-YY') AS Dos_From_Date,
    TO_CHAR(bilFac.dos_to_date,'MM-DD-YY') AS Dos_To_Date,
    TO_CHAR(payFac.check_date,'MM-DD-YY') AS Check_Date,
    payFac.check_amount AS Check_Amount,
     invDim.invoice_amount AS billed_amount,
    invDim.paid_amount AS paid_amount,
    invDim.outstanding_amount AS outstanding_amount,
    invDim.write_off_amount AS write_Off,
    invDim.over_amount AS overpayment,
    invDim.interest_amount AS Interest,
    CONCAT(attDim.first_name,' ',attDim.middle_name,' ',attDim.last_name) AS Attorney_Name,
    firmDim.firm_name AS Firm_Name,
    ${selectClause2},
    COALESCE(invDim.value->>'name', '') AS Bill_Recipient_Name,
    COALESCE(CAST(invDim.value->>'invoice_to_id' AS INT)) AS Invoice_Recipient_Id,
    denTypDim.denial_type_name AS Denial_Type,
        (CASE WHEN invDim.invoice_date <= ${DateClause} AND ${DateClause} - invDim.invoice_date <= 30 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_0_to_29_Days,
        (CASE WHEN invDim.invoice_date <= ${DateClause} AND ${DateClause} - invDim.invoice_date  > 30 AND ${DateClause} - invDim.invoice_date  <= 60 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_30_to_59_Days,
        (CASE WHEN invDim.invoice_date <= ${DateClause} AND ${DateClause} - invDim.invoice_date  > 60 AND ${DateClause} - invDim.invoice_date  <= 90 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_60_to_89_Days,
        (CASE WHEN invDim.invoice_date <= ${DateClause} AND ${DateClause} - invDim.invoice_date  > 90 AND ${DateClause} - invDim.invoice_date  <= 120 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_90_to_119_Days,
        (CASE WHEN invDim.invoice_date <= ${DateClause} AND ${DateClause} - invDim.invoice_date  > 120 AND ${DateClause} - invDim.invoice_date  <= 150 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_120_to_149_Days,
        (CASE WHEN invDim.invoice_date <= ${DateClause} AND ${DateClause} - invDim.invoice_date  > 150 THEN invDim.outstanding_amount ELSE 0 END) AS Balance_150PlusDays,
        (invDim.outstanding_amount) AS Total_Outstanding_Amount
    FROM
       bills_fact_new as bilFac
    LEFT JOIN filtered_invoices AS invDim ON invDim.bills @> to_jsonb(bilFac.bill_id) 
    LEFT JOIN payment_fact AS payFac ON invDim.invoice_id = payFac.invoice_id
    LEFT JOIN payment_status_dim AS payStatDim ON payFac.payment_status_id = payStatDim.payment_status_id AND payStatDim.deleted_at is NULL
    LEFT JOIN verification_status_dim AS verStatDim ON bilFac.verification_status_id = verStatDim.verification_status_id AND verStatDim.deleted_at is NULL
    LEFT JOIN denial_status_dim AS denStatDim ON bilFac.denial_status_id = denStatDim.denial_status_id AND denStatDim.deleted_at is NULL
    LEFT JOIN eor_status_dim AS eorStatDim ON bilFac.eor_status_id = eorStatDim.eor_status_id AND eorStatDim.deleted_at is NULL
    LEFT JOIN bill_status_dim AS bilStatDim ON bilFac.bill_status_id = bilStatDim.bill_status_id AND bilStatDim.deleted_at is NULL
    LEFT JOIN case_types_dim AS casTypDim ON bilFac.case_type_id = casTypDim.case_type_id AND casTypDim.deleted_at is NULL
    LEFT JOIN case_fact_new AS caseFac ON bilFac.case_id = caseFac.case_id AND caseFac.deleted_at is NULL
    LEFT JOIN specialities_dim AS specDim ON bilFac.speciality_id = specDim.specialty_id AND specDim.deleted_at is NULL
    LEFT JOIN facilities_dim AS FacDim ON bilFac.facility_id = FacDim.facility_id AND FacDim.deleted_at is NULL
    LEFT JOIN  facility_location_dim AS facLocDim ON bilFac.facility_location_id = facLocDim.facility_location_id AND facLocDim.deleted_at is NULL
    LEFT JOIN  users_dim AS usrDim ON  bilFac.doctor_id = usrDim.user_id AND usrDim.deleted_at is NULL
    LEFT JOIN  payment_by_dim AS payByDim ON payFac.payment_by_id = payByDim.payment_by_id AND payByDim.deleted_at is NULL
    LEFT JOIN payment_type_dim AS payTypDim ON payFac.payment_type_id = payTypDim.payment_type_id AND payTypDim.deleted_at is NULL
    LEFT JOIN attorney_dim AS attDim ON caseFac.attorney_id = attDim.attorney_id AND attDim.deleted_at is NULL
    ${invDimJoins}      
    LEFT JOIN denial_dim AS denDim ON bilFac.bill_id = denDim.bill_id AND denDim.deleted_at is NULL
    LEFT JOIN denial_type_dim AS denTypDim on denDim.denial_id = CAST(denTypDim.denial_id AS INTEGER) AND denTypDim.deleted_at is NULL
  WHERE
  ${mainWhereClause} ${EmployerFilter}  AND COALESCE(invDim.value->>'invoice_to_label', '') <> ''
)
  
`

            let billData = `
SELECT 
'AR_Detail_Report'::TEXT AS ResultType,
${queryClause}
FROM 
bill_data
WHERE 
${whereClause}
group by
${groupbyClause}`

            let UnionCLause = `UNION ALL `
            let invoicedata = `
 SELECT 
'AR_Detail_Report'::TEXT AS ResultType,
${queryClause}
FROM 
invoice_data
WHERE 
${invWhereCondition}
group by
${groupbyClause2}`

            // SELECT 
            // 'AR_Invoice_Detail_Report'::TEXT AS ResultType,
            // ${queryClause}
            // FROM                

            let ARdetailQuery = `${filtered_invoices}${ARmainDetail}${billData} ${UnionCLause} ${invoicedata}`


            if ((bill_recipient_id || group_by_id || subgroup_by_id || bill_recipient_type_id) && !invoice_recipient_name) {
                ARdetailQuery = `${filtered_invoices} ${ARmainDetail} ${billData}`
            } else if ((invoice_recipient_name || group_by_id || subgroup_by_id || bill_recipient_type_name) && !bill_recipient_id) {
                ARdetailQuery = `${filtered_invoices} ${ARmainDetail} ${invoicedata}`
            }


            /////////////////////////actual dataa /////////////////////////////////////////
            const result: any[] = await sequelize.query(ARdetailQuery);

            let result1: any[] = result[0];

            const ARdetailResults: object[] = result1.filter(
                (result) => result.resulttype === "AR_Detail_Report");
            const combinedResult: object = {
                ARdetailResults: ARdetailResults
            };

            return combinedResult;


        } catch (error) {
            throw error;
        }
    }
    public getDenialReport = async (reportFilters?): Promise<object> => {

        try {
            let {
                case_type_ids,
                facility_location_ids,
                patient_ids,
                insurance_ids,
                doctor_ids,
                date_type,
                start_date,
                end_date,
                date_range_type_id,
                group_by_id,
                subgroup_by_id,
                Aggregate,
            }: ReportRequest["ReportObject"] = reportFilters;

            // Added in refactoring removing from 3 different places
            let commonSelectClause: string = `
                SUM(Balance_0_to_29_Days) AS Total_30_days,
                SUM(Balance_30_to_59_Days)AS Total_60_days,
                SUM(Balance_60_to_89_Days)AS Total_90_days,
                SUM(Balance_90_to_119_Days)AS Total_120_days,
                SUM(Balance_120_to_149_Days)AS Total_150_days,
                SUM(Balance_150_to_179_Days)AS Total_180_days,
                SUM(Balance_180PlusDays)AS Total_180Plus_days,
                SUM(Total_Denied_Amount) AS Total_Denied`
            // Added in refactoring removing from 2 different places
            let commonSelectClause2: string = `
                SUM(Balance_0_to_29_Days) AS Balance_0_to_29_Days,
                SUM(Balance_30_to_59_Days) AS Balance_30_to_59_Days,
                SUM(Balance_60_to_89_Days) AS Balance_60_to_89_Days,
                SUM(Balance_90_to_119_Days) AS Balance_90_to_119_Days,
                SUM(Balance_120_to_149_Days) AS Balance_120_to_149_Days,
                SUM(Balance_150_to_179_Days) AS Balance_150_to_179_Days,
                SUM(Balance_180PlusDays) AS Balance_180PlusDays,
                SUM(Total_Denied_Amount) AS Total_Denied_Amount`

            let commonGroupquery: string = `'Detail'::TEXT AS ResultType,
            'Total'::TEXT AS Total,`

            let whereClause: string = `bilFac.denials_count IS NOT NULL 
            AND bilFac.denials_count != 0 
            AND bilFac.deleted_at is NULL 
            AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) 
            AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13)
             ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}
             AND bilFac.case_type_id IS NOT NULL
             AND bilFac.patient_id IS NOT NULL
	        AND bilRecDim.bill_recipient_type_id is NOT NULL
             AND bilFac.speciality_id IS NOT NULL
             AND bilFac.facility_location_id IS NOT NULL`;

            let selectClause: string = `denTypDim.denial_type_name AS Denial_Reason,denTypDim.denial_type_id AS Denial_Type_Id`;
            let group: string = `${commonGroupquery}Denial_Reason,Denial_Type_Id`;
            let groupedData: string = `Denial_Reason,Denial_Type_Id`;
            let queryClause: string = `UNION ALL
            SELECT
            'Summary':: TEXT AS ResultType,
            'Total'::TEXT AS Total,            
            NULL,NULL,
            ${commonSelectClause}
            FROM
            (
            SELECT
            ${commonGroupquery}
            ${commonSelectClause2}
            from
            updated_table
            GROUP BY
            ${groupedData}) As numm
            ORDER BY 
            Denial_Reason`;

            if (case_type_ids && case_type_ids.length > 0) {
                whereClause += ` AND bilFac.case_type_id IN (${case_type_ids})`;
            }
            if (facility_location_ids && facility_location_ids.length > 0) {
                whereClause += ` AND bilFac.facility_location_id IN (${facility_location_ids})`;
            }
            if (patient_ids && patient_ids.length > 0) {
                whereClause += ` AND patDim.patient_id IN (${patient_ids})`;
            }
            if (insurance_ids && insurance_ids.length > 0) {
                whereClause += ` AND insDim.insurance_id IN (${insurance_ids})`;
            }
            if (doctor_ids && doctor_ids.length > 0) {
                whereClause += ` AND usrDim.user_id IN (${doctor_ids})`;
            }
            const dynamicobject = {
                [`${GroupByID.Denial_Reason}`]: `,denTypDim.denial_type_name AS group_by_name,denTypDim.denial_type_id AS group_by_id`,
                [`${GroupByID.Insurance}`]: `,insDim.insurance_name AS group_by_name, insDim.insurance_id AS group_by_id`,
                [`${GroupByID.Denial_Reason}_${GroupByID.Provider}`]: `,denTypDim.denial_type_name AS group_by_name,denTypDim.denial_type_id AS group_by_id,CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS sub_group_by_name,usrDim.user_id AS subgroup_by_id`,
                [`${GroupByID.Denial_Reason}_${GroupByID.Insurance}`]: `,denTypDim.denial_type_name AS group_by_name,denTypDim.denial_type_id AS group_by_id ,insDim.insurance_name AS sub_group_by_name,insDim.insurance_id AS subgroup_by_id`,
                [`${GroupByID.Denial_Reason}_${GroupByID.Patient}`]: `,denTypDim.denial_type_name AS group_by_name,denTypDim.denial_type_id AS group_by_id,CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS sub_group_by_name,patDim.patient_id AS subgroup_by_id`,
                [`${GroupByID.Insurance}_${GroupByID.Provider}`]: `,insDim.insurance_name AS group_by_name,insDim.insurance_id AS group_by_id,CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS sub_group_by_name,usrDim.user_id AS subgroup_by_id`,
                [`${GroupByID.Insurance}_${GroupByID.Denial_Reason}`]: `,insDim.insurance_name AS group_by_name,insDim.insurance_id AS group_by_id ,denTypDim.denial_type_name AS sub_group_by_name,denTypDim.denial_type_id AS subgroup_by_id`,
                [`${GroupByID.Insurance}_${GroupByID.Patient}`]: `,insDim.insurance_name AS group_by_name,insDim.insurance_id AS group_by_id,CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS sub_group_by_name,patDim.patient_id AS subgroup_by_id`,
            };
            let dynamicSelectValue: string;

            if (group_by_id && subgroup_by_id) {
                dynamicSelectValue = dynamicobject[`${group_by_id}_${subgroup_by_id}`];
                selectClause += `${dynamicSelectValue}`;
                whereClause += ` AND denTypDim.denial_type_id IS NOT NULL AND insDim.insurance_id IS NOT NULL AND patDim.patient_id IS NOT NULL AND usrDim.user_id IS NOT NULL`;
                groupedData = `group_by_name,group_by_id,sub_group_by_name,subgroup_by_id`;
                group = `${commonGroupquery}group_by_name,group_by_id,sub_group_by_name,subgroup_by_id`;
            }
            if (group_by_id && !subgroup_by_id) {
                dynamicSelectValue = dynamicobject[`${group_by_id}`];
                selectClause += `${dynamicSelectValue}`;
                whereClause += ` AND denTypDim.denial_type_id IS NOT NULL AND insDim.insurance_id IS NOT NULL AND patDim.patient_id IS NOT NULL AND usrDim.user_id IS NOT NULL`;
                group = `${commonGroupquery}group_by_name,group_by_id`;
                groupedData = `group_by_name,group_by_id`;
            }
            if (!group_by_id && !subgroup_by_id) {
                whereClause += ` AND denTypDim.denial_type_id IS NOT NULL`
            }

            if (group_by_id || (group_by_id && subgroup_by_id)) {
                const modifiedqueryclause = (
                    groupby: number,
                    subgroupby: number
                ): any => {
                    let dynamicvalue: string;
                    if (groupby && subgroupby) {
                        dynamicvalue = `NULL,NULL,NULL,NULL,`;
                    } else if (groupby) {
                        dynamicvalue = `NULL,NULL,`;
                    }


                    const groupsubgroupbyClause: string = `UNION ALL 
                  SELECT 
                  'Summary':: TEXT AS ResultType,
                  'Total':: TEXT AS Total,
                  ${dynamicvalue}
            ${commonSelectClause}
                  FROM 
                (
                SELECT
            ${commonGroupquery}
            ${commonSelectClause2}
            from
            updated_table
            GROUP BY
            ${groupedData}) As numm
            ORDER BY
            group_by_name `;
                    // updated_table
                    return groupsubgroupbyClause;
                };
                queryClause = modifiedqueryclause(group_by_id, subgroup_by_id);
            }
            if (Aggregate) {
                const getAggregateSubQuery = (
                    aggregate: number,
                    group_by_id: number,
                    subgroup_by_id: number
                ): string => {
                    const dynamicValueForConditionObject = {
                        [`${AggregateType.Sum}`]: "SUM",
                        [`${AggregateType.Average}`]: "AVG",
                        [`${AggregateType.Count}`]: "count",
                        [`${AggregateType.Maximum}`]: "MAX",
                        [`${AggregateType.Minimum}`]: "MIN",
                    };
                    const dynamictotal = {
                        [`${AggregateType.Sum}`]: "Total sum",
                        [`${AggregateType.Average}`]: "Total average",
                        [`${AggregateType.Count}`]: "Total count",
                        [`${AggregateType.Maximum}`]: "maximum value",
                        [`${AggregateType.Minimum}`]: "minimum value",
                    };
                    let dynamicNull: string;
                    let orderBy: string = '';
                    if (group_by_id && subgroup_by_id) {
                        dynamicNull = `NULL,NULL,NULL,NULL,`;
                        orderBy = `ORDER BY group_by_name`;
                    } else if (group_by_id) {
                        dynamicNull = `NULL,NULL,`;
                        orderBy = `ORDER BY group_by_name`;
                    } else {
                        dynamicNull = `NULL,NULL,`;
                        orderBy = `ORDER BY Denial_Reason`;
                    }
                    const dynamicValueForConditionValue =
                        dynamicValueForConditionObject[`${aggregate}`];
                    const dynamicValueForConditionValue1 = dynamictotal[`${aggregate}`];
                    const aggregateQueryClause = `UNION ALL 
                SELECT 
                'Summary':: TEXT AS ResultType,
                '${dynamicValueForConditionValue1}'::TEXT  AS Total,
                ${dynamicNull}
                ${dynamicValueForConditionValue}(Balance_0_to_29_Days) AS Total_30_days,
                ${dynamicValueForConditionValue}(Balance_30_to_59_Days) AS Total_60_days,
                ${dynamicValueForConditionValue}(Balance_60_to_89_Days) AS Total_90_days,
                ${dynamicValueForConditionValue}(Balance_90_to_119_Days) AS Total_120_days,
                ${dynamicValueForConditionValue}(Balance_120_to_149_Days) AS Total_150_days,
                ${dynamicValueForConditionValue}(Balance_150_to_179_Days) AS Total_180_days,
                ${dynamicValueForConditionValue}(Balance_180PlusDays) AS Total_180Plus_days,
                ${dynamicValueForConditionValue}(Total_Denied_Amount) AS Total_Denied
                FROM 
                (
                SELECT
            ${commonGroupquery}
            ${commonSelectClause2}
            from
            updated_table
            GROUP BY
            ${groupedData}) As numm
             ${orderBy}`;
                    return aggregateQueryClause;
                };
                queryClause = getAggregateSubQuery(
                    Aggregate,
                    group_by_id,
                    subgroup_by_id
                );
            }


            if (date_range_type_id && date_range_type_id != DateRange.Custom) {
                const dateRangeLimit = dateRangeClause[date_range_type_id];
                whereClause += ` AND denDim.denial_date >= CURRENT_DATE - INTERVAL '${dateRangeLimit}' AND denDim.denial_date < CURRENT_DATE`;
            }
            if (date_range_type_id == DateRange.Custom) {
                switch (date_type) {
                    case date_type = DateType.DOS:
                        whereClause += ` AND bilFac.dos_from_date >= '${start_date}' AND bilFac.dos_to_date <= '${end_date}'`;
                        break;
                    case date_type = DateType.BilledDate:
                        whereClause += ` AND bilFac.bill_date >= '${start_date}' AND bilFac.bill_date <= '${end_date}'`;
                        break;
                    case DateType.PostedDate:
                        whereClause += ` AND denDim.created_at::date >= '${start_date}' AND denDim.created_at::date <= '${end_date}'`;
                        break;
                }
            }
            const DenialQuery_All_data: string = ` 
            with updated_table AS (
                Select 
                ${selectClause},
                (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE <= 30 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_0_to_29_Days,
                (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 30 AND CURRENT_DATE - (denDim.denial_date)::DATE <= 60 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_30_to_59_Days,
                (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 60 AND CURRENT_DATE - (denDim.denial_date)::DATE <= 90 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_60_to_89_Days,
                (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 90 AND CURRENT_DATE - (denDim.denial_date )::DATE <= 120 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_90_to_119_Days,
                (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 120 AND CURRENT_DATE - (denDim.denial_date )::DATE <= 150 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_120_to_149_Days,
                (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 150 AND CURRENT_DATE - (denDim.denial_date )::DATE <= 182 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_150_to_179_Days,
                (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 182 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_180PlusDays,
                (bilFac.outstanding_amount) AS Total_Denied_Amount,
                ROW_NUMBER() OVER (PARTITION BY denTypDim.denial_type_name ORDER BY denDim.denial_date) AS row_num
                from
                bills_fact_new AS bilFac
                LEFT JOIN (
                    SELECT 
                      bill_id,denial_id,denial_date,created_at
                     from denial_dim
                      where deleted_at is null
                    )denDim ON bilFac.bill_id = denDim.bill_id
                    
                    LEFT JOIN(
                    SELECT DISTINCT ON (denial_id)
                        denial_id,denial_type_id,
                     denial_type_name
                    from denial_type_dim 
                    where deleted_at is null
                    )denTypDim on denTypDim.denial_id = denDim.denial_id
                LEFT JOIN case_fact_new AS caseFac ON bilFac.case_id = caseFac.case_id AND caseFac.deleted_at is NULL
                LEFT JOIN case_types_dim AS casTypDim ON bilFac.case_type_id = casTypDim.case_type_id AND casTypDim.deleted_at is NULL
                LEFT JOIN facilities_dim AS FacDim ON bilFac.facility_id = FacDim.facility_id AND FacDim.deleted_at is NULL
                LEFT JOIN facility_location_dim AS facLocDim ON bilFac.facility_location_id = facLocDim.facility_location_id AND facLocDim.deleted_at is NULL
                LEFT JOIN users_dim AS usrDim ON bilFac.doctor_id = usrDim.user_id AND usrDim.deleted_at is NULL
                LEFT JOIN patient_dim AS patDim ON bilFac.patient_id = patDim.patient_id AND patDim.deleted_at is NULL
                LEFT JOIN bills_recipient_dim AS bilRecDim ON bilFac.bill_id = bilRecDim.bill_id AND bilRecDim.deleted_at is NULL
                LEFT JOIN insurance_dim AS insDim ON bilRecDim.insurance_id = insDim.insurance_id AND insDim.deleted_at is NULL
                WHERE 
                ${whereClause}      
                ORDER BY
                  denTypDim.denial_type_name DESC
                )
                SELECT 
                ${group},
                ${commonSelectClause2}
                from
                updated_table
                where
                row_num > 0
                GROUP BY
                ${groupedData}
                ${queryClause}`



            const results: object = await sequelize.query(DenialQuery_All_data);
            let result1: any[] = results[0];
            const summaryResults: object[] = result1.filter(
                (result) => result.resulttype === "Summary"
            );
            const detailResults: object[] = result1.filter(
                (result) => result.resulttype === "Detail"
            );
            const combinedResult = {
                detailResults: detailResults,
                summaryResults: summaryResults,
            };
            return combinedResult;
        } catch (error) {
            throw error;
        }
    };

    public denialDetailReport = async (reportFilters?) => {
        try {
            let {
                denial_reason,
                denial_type_id,
                columnName,
                group_by_name,
                maingroup_by_id,
                mainsubgroup_by_id,
                group_by_id,
                subgroup_by_id,
                sub_group_by_name,
                date_range_type_id,
                facility_location_ids,
                date_type,
                start_date,
                end_date,
                case_type_ids,
                patient_ids,
                insurance_ids,
                doctor_ids,

            }: ReportRequest["Denial_detail_report_Object"] = reportFilters;



            // let whereclause: string = `Denial_Reason = '${denial_reason}'`;
            let whereclause: string = '';
            let mainWhereClause: string = `bilFac.denials_count IS NOT NULL AND bilFac.denials_count != 0
            AND bilFac.deleted_at is NULL AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != ${ExcludedUser.QaUser}) 
            AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != ${ExcludedUser.QaUser}) 
            ${qaLocationsFilter('bilFac')}
            ${qaSpecialitiesFilter('bilFac')}`

            let queryClause: string = ''
            let selectClause: string = 'denTypDim.denial_type_name AS Denial_Reason,denTypDim.denial_type_id AS Denial_Type_Id'
            let orderByClause: string = 'Denial_Reason'
            let groupedData: string = 'Denial_Reason,Denial_Type_Id'

            const escapedDenialReason: string = this.escapeSqlValue(denial_reason);
            const groupBy: string = this.escapeSqlValue(group_by_name);
            const subGroupBy: string = this.escapeSqlValue(sub_group_by_name);
            if (columnName == 'total_denied_amount') {
                queryClause = ` ARRAY_AGG(BILL_ID) AS BILL_ID_total, 
                                ARRAY_AGG(Billed_Date) AS Billed_Date_total,
                                ARRAY_AGG(case_id) AS case_id_total,
                                ARRAY_AGG(DOS_From_Date) AS DOS_From_Date_total,
                                ARRAY_AGG(DOS_To_Date) AS DOS_To_Date_total,
                                ARRAY_AGG(Paid_Amount) AS Paid_Amount_total,
                                ARRAY_AGG(Write_OFF_Amount) AS Write_OFF_Amount_total,
                                ARRAY_AGG(billed_amount) AS billed_amount_total,
                                ARRAY_AGG(Total_Denied_Amount) AS denied_amount_total,
                                ARRAY_AGG(DOA) AS DOA_total,
                                ARRAY_AGG(Case_Type) AS Case_Type_total,
                                ARRAY_AGG(Patient_Name) AS Patient_Name_total,
                                ARRAY_AGG(Provider_Name) AS Provider_Name_total,
                                ARRAY_AGG(Practice_Location) AS Practice_Location_total,
                                ARRAY_AGG(Posted_Date) AS Posted_Date_total,
                                ARRAY_AGG(Denial_Date) AS Denial_Date_total,
                                ARRAY_AGG(Bill_Recipient_Name) AS Bill_Recipient_Name_total`
            } else {
                queryClause = this.getQueryClause(columnName);
            }
            const dynamicobject = {
                [`${GroupByID.Denial_Reason}`]: `,denTypDim.denial_type_name AS group_by_name,denTypDim.denial_type_id AS group_by_id`,
                [`${GroupByID.Insurance}`]: `,insDim.insurance_name AS group_by_name,insDim.insurance_id AS group_by_id`,
                [`${GroupByID.Denial_Reason}_${GroupByID.Provider}`]: `,denTypDim.denial_type_name AS group_by_name,denTypDim.denial_type_id AS group_by_id,CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS sub_group_by_name,usrDim.user_id AS subgroup_by_id`,
                [`${GroupByID.Denial_Reason}_${GroupByID.Insurance}`]: `,denTypDim.denial_type_name AS group_by_name,denTypDim.denial_type_id AS group_by_id ,insDim.insurance_name AS sub_group_by_name,insDim.insurance_id AS subgroup_by_id `,
                [`${GroupByID.Denial_Reason}_${GroupByID.Patient}`]: `,denTypDim.denial_type_name AS group_by_name,denTypDim.denial_type_id AS group_by_id,CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS sub_group_by_name,patDim.patient_id AS subgroup_by_id`,
                [`${GroupByID.Insurance}_${GroupByID.Provider}`]: `,insDim.insurance_name AS group_by_name,insDim.insurance_id AS group_by_id,CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS sub_group_by_name,usrDim.user_id AS subgroup_by_id`,
                [`${GroupByID.Insurance}_${GroupByID.Denial_Reason}`]: `,insDim.insurance_name AS group_by_name,insDim.insurance_id AS group_by_id ,denTypDim.denial_type_name AS sub_group_by_name,denTypDim.denial_type_id AS subgroup_by_id`,
                [`${GroupByID.Insurance}_${GroupByID.Patient}`]: `,insDim.insurance_name AS group_by_name,insDim.insurance_id AS group_by_id,CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS sub_group_by_name,patDim.patient_id AS subgroup_by_id`,
            };
            let dynamicSelectValue: string = '';

            if (date_range_type_id && date_range_type_id != DateRange.Custom) {
                const dateRangeLimit = dateRangeClause[date_range_type_id];
                mainWhereClause += ` AND denDim.denial_date >= CURRENT_DATE - INTERVAL '${dateRangeLimit}' AND denDim.denial_date < CURRENT_DATE`;
            }
            if (facility_location_ids && facility_location_ids.length > 0) {
                mainWhereClause += ` AND bilFac.facility_location_id IN (${facility_location_ids})`;
            }
            if (case_type_ids && case_type_ids.length > 0) {
                mainWhereClause += ` AND bilFac.case_type_id IN (${case_type_ids})`;
            }
            if (patient_ids && patient_ids.length > 0) {
                mainWhereClause += ` AND patDim.patient_id IN (${patient_ids})`;
            }
            if (insurance_ids && insurance_ids.length > 0) {
                mainWhereClause += ` AND insDim.insurance_id IN (${insurance_ids})`;
            }
            if (doctor_ids && doctor_ids.length > 0) {
                mainWhereClause += ` AND usrDim.user_id IN (${doctor_ids})`;
            }
            if (date_range_type_id == DateRange.Custom) {
                switch (date_type) {
                    case date_type = DateType.DOS:
                        mainWhereClause += ` AND bilFac.dos_from_date >= '${start_date}' AND bilFac.dos_to_date <= '${end_date}'`;
                        break;
                    case date_type = DateType.BilledDate:
                        mainWhereClause += ` AND bilFac.bill_date >= '${start_date}' AND bilFac.bill_date <= '${end_date}'`;
                        break;
                    case DateType.PostedDate:
                        mainWhereClause += ` AND denDim.created_at::date >= '${start_date}' AND denDim.created_at::date <= '${end_date}'`;
                        break;
                }
            }

            if (!group_by_id && !subgroup_by_id) {
                whereclause = `Denial_Type_Id = ${denial_type_id}`;
                mainWhereClause += ` AND denTypDim.denial_type_id IS NOT NULL `;

            }
            if (group_by_id && subgroup_by_id) {
                dynamicSelectValue = dynamicobject[`${maingroup_by_id}_${mainsubgroup_by_id}`];
                selectClause += `${dynamicSelectValue}`;
                mainWhereClause += ` AND denTypDim.denial_type_id IS NOT NULL AND insDim.insurance_id IS NOT NULL`;
                groupedData = `group_by_name,group_by_id,sub_group_by_name,subgroup_by_id`;
                orderByClause = `group_by_name`;
                whereclause = `group_by_id = ${group_by_id} AND subgroup_by_id = ${subgroup_by_id}`
            }
            if (group_by_id && !subgroup_by_id) {
                dynamicSelectValue = dynamicobject[`${maingroup_by_id}`];
                selectClause += `${dynamicSelectValue}`;
                groupedData = `group_by_name,group_by_id`;
                whereclause = `group_by_id = ${group_by_id}`
                orderByClause = `group_by_name`;
                mainWhereClause += ` AND denTypDim.denial_type_id IS NOT NULL AND insDim.insurance_id IS NOT NULL`;
            }

            const detailquery: string = `
                with newtable AS ( 
                    Select 
                        bilFac.outstanding_amount AS Denied_Amount,
                        ${selectClause},
                        bilFac.bill_id AS BILL_ID,
                        TO_CHAR(bilFac.bill_date,'MM-DD-YY') AS Billed_Date,
                        bilFac.case_id AS case_id,
                        TO_CHAR(bilFac.dos_from_date,'MM-DD-YY') AS DOS_From_Date,
                        TO_CHAR(bilFac.dos_to_date,'MM-DD-YY') AS DOS_To_Date,
                        bilFac.paid_amount AS Paid_Amount,
                        bilFac.write_off_amount AS Write_OFF_Amount,
                        bilFac.bill_amount AS billed_amount,
                        TO_CHAR(caseFac.accident_date,'MM-DD-YY') AS DOA,
                        casTypDim.name AS Case_Type,
                        CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS Patient_Name,
                        CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS Provider_Name,
                        CONCAT(FacDim.facility_qualifier,'-',facLocDim.facility_location_name) AS Practice_Location,
                        TO_CHAR(DATE(denDim.created_at),'MM-DD-YY') AS Posted_Date,
                        TO_CHAR(denDim.denial_date,'MM-DD-YY') AS Denial_Date,
                        CONCAT(bilRecDim.bill_recipient_f_name,' ',bilRecDim.bill_recipient_m_name,' ',bilRecDim.bill_recipient_l_name) AS Bill_Recipient_Name,
                        (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE <= 30 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_0_to_29_Days,
                        (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 30 AND CURRENT_DATE - (denDim.denial_date)::DATE <= 60 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_30_to_59_Days,
                        (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 60 AND CURRENT_DATE - (denDim.denial_date)::DATE <= 90 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_60_to_89_Days,
                        (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 90 AND CURRENT_DATE - (denDim.denial_date )::DATE <= 120 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_90_to_119_Days,
                        (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 120 AND CURRENT_DATE - (denDim.denial_date )::DATE <= 150 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_120_to_149_Days,
                        (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 150 AND CURRENT_DATE - (denDim.denial_date )::DATE <= 182 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_150_to_179_Days,
                        (CASE WHEN CURRENT_DATE - (denDim.denial_date)::DATE > 182 THEN bilFac.outstanding_amount ELSE 0 END) AS Balance_180PlusDays,
                        (bilFac.outstanding_amount) AS Total_Denied_Amount,
                            ROW_NUMBER() OVER (PARTITION BY denTypDim.denial_type_name ORDER BY denDim.denial_date) AS row_num
                            from
                            bills_fact_new AS bilFac
                LEFT JOIN (
                    SELECT 
                      bill_id,denial_id,denial_date,created_at
                     from denial_dim
                      where deleted_at is null
                    )denDim ON bilFac.bill_id = denDim.bill_id
                    
                    LEFT JOIN(
                    SELECT DISTINCT ON (denial_id)
                        denial_id,denial_type_id,
                     denial_type_name
                    from denial_type_dim 
                    where deleted_at is null
                    )denTypDim on denTypDim.denial_id = denDim.denial_id
                LEFT JOIN case_fact_new AS caseFac ON bilFac.case_id = caseFac.case_id AND caseFac.deleted_at is NULL
                LEFT JOIN case_types_dim AS casTypDim ON bilFac.case_type_id = casTypDim.case_type_id AND casTypDim.deleted_at is NULL
                LEFT JOIN facilities_dim AS FacDim ON bilFac.facility_id = FacDim.facility_id AND FacDim.deleted_at is NULL
                LEFT JOIN facility_location_dim AS facLocDim ON bilFac.facility_location_id = facLocDim.facility_location_id AND facLocDim.deleted_at is NULL
                LEFT JOIN users_dim AS usrDim ON bilFac.doctor_id = usrDim.user_id AND usrDim.deleted_at is NULL
                LEFT JOIN patient_dim AS patDim ON bilFac.patient_id = patDim.patient_id AND patDim.deleted_at is NULL
                LEFT JOIN bills_recipient_dim AS bilRecDim ON bilFac.bill_id = bilRecDim.bill_id AND bilRecDim.deleted_at is NULL
                LEFT JOIN insurance_dim AS insDim ON bilRecDim.insurance_id = insDim.insurance_id AND insDim.deleted_at is NULL
                            WHERE
                            ${mainWhereClause}
                             )
                SELECT 
                'DenialDetailData'::TEXT AS ResultType,
                    ${groupedData},
                    ${queryClause}
                        FROM 
                        newtable
                        WHERE 
                        ${whereclause}
                        GROUP BY
                        ${groupedData}
                        ORDER BY
                        ${orderByClause}`




            const result: any[] = await sequelize.query(detailquery);
            let result1: any[] = result[0];
            const denialdetailResults: object[] = result1.filter(
                (result) => result.resulttype === "DenialDetailData"
            );
            const combinedResult: object = {
                denialdetailResults: denialdetailResults
            };
            return combinedResult;
        } catch (error) {
            throw error;
        }
    }

    public getStatusReport = async (reportFilters, excel?: Boolean): Promise<any> => {
        try {
            const {
                case_type_ids,
                facility_location_ids,
                visit_type_ids,
                patient_ids,
                insurance_ids,
                doctor_ids,
                start_date,
                end_date,
                speciality_ids,
                appointment_status_ids,
                case_ids,
                clinic_location_ids,
                page,
                per_page,
                in_house
            }: ReportRequest["ReportObject"] = reportFilters;
            let limit: string = '';
            // let totalCountClause = `,COUNT(*) OVER () AS total_count`;
            let createdByClause: string = `json_build_object(
                'first_name', cb.first_name,
                'middle_name', cb.middle_name,
                    'last_name', cb.last_name
                ) AS created_by_name`;
            let updatedByClause: string = `json_build_object(
                    'first_name', ub.first_name,
                    'middle_name', ub.middle_name,
                    'last_name', ub.last_name
                ) AS updated_by_name`;

            let scheduledDateExcel: string = `appFac.scheduled_date_time`
            if (excel) {
                scheduledDateExcel = `DATE(appFac.scheduled_date_time)`
                createdByClause = `CONCAT_WS(' ', cb.first_name, cb.middle_name, cb.last_name) AS created_by_name`;
                updatedByClause = `CONCAT_WS(' ', ub.first_name, ub.middle_name, ub.last_name) AS updated_by_name`;
            }
            // Start with a default WHERE clause
            let whereClause: string = `appFac.is_cancelled = 0 AND appFac.case_type_id IS NOT NULL AND appFac.speciality_id IS NOT NULL AND appFac.facility_location_id IS NOT NULL AND appFac.patient_id IS NOT NULL AND appFac.case_id IS NOT NULL AND appFac.deleted_at IS NULL AND (appFac.created_by::integer IS NULL OR appFac.created_by::integer != 13) AND (appFac.updated_by::integer IS NULL OR appFac.updated_by::integer != 13) ${qaLocationsFilter('appFac')} ${qaSpecialitiesFilter('appFac')}`;  // A default condition to start with
            // If case_type_ids are provided, filter by them
            let joinCondition: string = `LEFT`
            if (in_house) {
                if (in_house == 'is_referral') {
                    // joinCondition = `INNER`;
                    joinCondition = 'INNER'
                }
                else if (in_house == 'in_house') {
                    whereClause += ' AND phyClinDim.facility_id IS NOT NULL '
                }
            }

            if (case_type_ids && case_type_ids.length > 0) {
                whereClause += ` AND appFac.case_type_id IN (${case_type_ids})`;
            }

            if (facility_location_ids && facility_location_ids.length > 0) {
                whereClause += ` AND appFac.facility_location_id IN (${facility_location_ids})`;
            }

            if (speciality_ids && speciality_ids.length > 0) {
                whereClause += ` AND appFac.speciality_id IN (${speciality_ids})`;
            }

            if (doctor_ids && doctor_ids.length > 0) {
                whereClause += ` AND appFac.provider_id IN (${doctor_ids})`;
            }
            if (visit_type_ids && visit_type_ids.length > 0) {
                whereClause += ` AND appTypDim.appointment_type_id IN (${visit_type_ids})`;
            }
            if (appointment_status_ids && appointment_status_ids.length > 0) {
                whereClause += ` AND appFac.appointment_status_id IN (${appointment_status_ids})`;
            }
            if (case_ids && case_ids.length > 0) {
                whereClause += ` AND appFac.case_id IN (${case_ids})`;
            }
            if (patient_ids && patient_ids.length > 0) {
                whereClause += ` AND patDim.patient_id IN (${patient_ids})`;
            }
            if (insurance_ids && insurance_ids.length > 0) {
                whereClause += ` AND casFac.insurances ?| ARRAY['${insurance_ids.join("','")}']`;
            }
            if (clinic_location_ids && clinic_location_ids.length > 0) {
                whereClause += ` AND phyClinDim.clinic_locations_id IN (${clinic_location_ids})`;
            }

            if (start_date && end_date) {
                const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(start_date, end_date);
                whereClause += ` AND appFac.scheduled_date_time >= '${fromDateAdjusted}' AND appFac.scheduled_date_time <= '${toDateAdjusted}'`;
            }
            if (per_page && page) {
                const offset = (page - 1) * per_page;
                limit += `LIMIT ${per_page} OFFSET ${offset}`;
            }
            let SummaryQuery: string = `SELECT 
                    appFac.case_id AS case_id,
                    CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name) AS Patient_Name,
                    patDim.home_phone as patient_phone_no,
                    patDim.cell_phone as patient_cell_no,
                    (SELECT value->>'name' FROM jsonb_each(casFac.insurances) ORDER BY key::int LIMIT 1) AS insurance_name,
                    casFac.accident_date AS accident_date,
                    casTypDim.name AS case_type_name,
                    ${scheduledDateExcel} AS scheduled_date_time,
                    DATE(appFac.scheduled_date_time) AS appointment_date,
                    CONCAT_WS(' ', facDim.facility_qualifier, facLocDim.facility_location_qualifier) AS facility_location,
                    specDim.name AS speciality_name,
                    appTypDim.name AS appointment_type,
                    CONCAT_WS(' ', pro.first_name, pro.middle_name, pro.last_name) AS provider_name,
                    CONCAT_WS(' ', physicians.first_name, physicians.middle_name, physicians.last_name) AS physician_name,
                    CONCAT_WS(' ', fac.facility_qualifier, fl.facility_location_qualifier) AS In_house_name,
                    CONCAT_WS(' ', fl.facility_location_address, fl.facility_location_floor, fl.facility_location_city, fl.facility_location_state, fl.facility_location_zip) AS In_house_address,
                    CONCAT_WS(' ', clinDim.name) AS outside_referring_name,
                    CONCAT_WS(' ', clinLocDim.address, clinLocDim.floor, clinLocDim.city, clinLocDim.state, clinLocDim.zip) AS outside_referring_address,
                    appStatDim.name AS appointment_status_name,
                    visSesStatDim.visit_session_state_name AS visit_status,
                    appCodeDim.code_type_name as code_type_name,
                    CONCAT_WS('-',appCodeDim.billing_code_id,REPLACE(appCodeDim.description, ';', '-')) AS code_description,
                    ${createdByClause},
                    ${updatedByClause},
                    DATE(appFac.created_at) AS created_at,
                    DATE(appFac.updated_at) AS updated_at
                    FROM appointment_fact appFac
                        LEFT JOIN visits_fact visFac ON appFac.appointment_id = visFac.appointment_id AND visFac.deleted_at IS NULL
                        INNER JOIN case_fact_new casFac ON casFac.case_id = appFac.case_id AND casFac.deleted_at IS NULL
                        INNER JOIN patient_dim AS patDim ON appFac.patient_id = patDim.patient_id AND patDim.deleted_at is NULL
                        LEFT JOIN case_types_dim casTypDim ON casTypDim.case_type_id = casFac.case_type_id AND casTypDim.deleted_at IS NULL
                        LEFT JOIN facility_location_dim facLocDim ON facLocDim.facility_location_id = appFac.facility_location_id AND facLocDim.deleted_at IS NULL
                        LEFT JOIN facilities_dim facDim ON facDim.facility_id = appFac.facility_id AND facDim.deleted_at IS NULL
                        LEFT JOIN specialities_dim specDim ON specDim.specialty_id = appFac.speciality_id AND specDim.deleted_at IS NULL
                        LEFT JOIN appointment_type_dim appTypDim ON appTypDim.appointment_type_id = appFac.appointment_type_id AND appTypDim.deleted_at IS NULL
                        LEFT JOIN users_dim AS pro ON pro.user_id = appFac.provider_id AND pro.deleted_at IS NULL
                        LEFT JOIN users_dim AS cb ON cb.user_id = appFac.created_by::integer AND cb.deleted_at IS NULL
                        LEFT JOIN users_dim AS ub ON ub.user_id = appFac.updated_by::integer AND ub.deleted_at IS NULL
                        ${joinCondition} JOIN physician_clinics_dim phyClinDim ON phyClinDim.physician_id = appFac.physician_id AND phyClinDim.deleted_at IS NULL
                        LEFT JOIN physician_dim physicians ON physicians.physician_id = phyClinDim.physician_id AND physicians.deleted_at IS NULL
                        LEFT JOIN facility_location_dim AS fl ON fl.facility_location_id = phyClinDim.facility_location_id AND fl.deleted_at IS NULL
                        LEFT JOIN facilities_dim AS fac ON fac.facility_id = phyClinDim.facility_id AND fac.deleted_at IS NULL
                        LEFT JOIN clinic_location_dim clinLocDim ON clinLocDim.clinic_locations_id = phyClinDim.clinic_locations_id AND clinLocDim.deleted_at IS NULL
                        LEFT JOIN clinics_dim clinDim ON clinDIm.clinic_id = phyClinDim.clinic_id AND clinDIm.deleted_at IS NULL
                        LEFT JOIN appointment_status_dim appStatDim ON appStatDim.appointment_status_id = appFac.appointment_status_id AND appStatDim.deleted_at IS NULL
                        LEFT JOIN appointment_priority_dim appPrioDim ON appPrioDim.appointment_priority_id = appFac.appointment_priority_id AND appPrioDim.deleted_at IS NULL
                        LEFT JOIN visit_session_state_dim visSesStatDim ON visSesStatDim.visit_session_state_id = visFac.visit_session_state_id AND visSesStatDim.deleted_at IS NULL
                        LEFT JOIN appointments_codes_dim appCodeDim ON appCodeDim.appointment_id = appFac.appointment_id AND appCodeDim.deleted_at IS NULL
                    WHERE ${whereClause} 
                    GROUP BY
                        appFac.case_id,
                        CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name),
                        patDim.home_phone ,
                        patDim.cell_phone,
                        (SELECT value->>'name' FROM jsonb_each(casFac.insurances) ORDER BY key::int LIMIT 1) ,
                        casFac.accident_date,
                        casTypDim.name ,
                        appFac.scheduled_date_time ,
                        DATE(appFac.scheduled_date_time),
                        CONCAT_WS(' ', facDim.facility_qualifier, facLocDim.facility_location_qualifier) ,
                        specDim.name ,
                        appTypDim.name,
                        CONCAT_WS(' ', pro.first_name, pro.middle_name, pro.last_name),
                        CONCAT_WS(' ', physicians.first_name, physicians.middle_name, physicians.last_name),
                        CONCAT_WS(' ', fac.facility_qualifier, fl.facility_location_qualifier) ,
                        CONCAT_WS(' ', fl.facility_location_address, fl.facility_location_floor, fl.facility_location_city, fl.facility_location_state, fl.facility_location_zip),
                        CONCAT_WS(' ', clinDim.name) ,
                        CONCAT_WS(' ', clinLocDim.address, clinLocDim.floor, clinLocDim.city, clinLocDim.state, clinLocDim.zip),
                        appStatDim.name ,
                        visSesStatDim.visit_session_state_name ,
                        appCodeDim.code_type_name ,
                        appCodeDim.billing_code_id,
                        appCodeDim.description,
                        cb.first_name,
                        cb.middle_name,
                        cb.last_name,
                        ub.first_name,
                        ub.middle_name,
                        ub.last_name,
                        DATE(appFac.created_at) ,
                        DATE(appFac.updated_at) ,
                        appFac.appointment_id
                    ORDER BY 
                        appFac.appointment_id ASC
                    ${limit}`;
            // diving into two queries to improve performance 
            let countQuery: string = `SELECT 
                COUNT(*) AS count
                FROM (SELECT 
                    appFac.case_id
                    FROM appointment_fact appFac
                        LEFT JOIN visits_fact visFac ON appFac.appointment_id = visFac.appointment_id AND visFac.deleted_at IS NULL
                        INNER JOIN case_fact_new casFac ON casFac.case_id = appFac.case_id AND casFac.deleted_at IS NULL
                        INNER JOIN patient_dim AS patDim ON appFac.patient_id = patDim.patient_id AND patDim.deleted_at is NULL
                        LEFT JOIN case_types_dim casTypDim ON casTypDim.case_type_id = casFac.case_type_id AND casTypDim.deleted_at IS NULL
                        LEFT JOIN facility_location_dim facLocDim ON facLocDim.facility_location_id = appFac.facility_location_id AND facLocDim.deleted_at IS NULL
                        LEFT JOIN facilities_dim facDim ON facDim.facility_id = appFac.facility_id AND facDim.deleted_at IS NULL
                        LEFT JOIN specialities_dim specDim ON specDim.specialty_id = appFac.speciality_id AND specDim.deleted_at IS NULL
                        LEFT JOIN appointment_type_dim appTypDim ON appTypDim.appointment_type_id = appFac.appointment_type_id AND appTypDim.deleted_at IS NULL
                        LEFT JOIN users_dim AS pro ON pro.user_id = appFac.provider_id AND pro.deleted_at IS NULL
                        LEFT JOIN users_dim AS cb ON cb.user_id = appFac.created_by::integer AND cb.deleted_at IS NULL
                        LEFT JOIN users_dim AS ub ON ub.user_id = appFac.updated_by::integer AND ub.deleted_at IS NULL
                        ${joinCondition} JOIN physician_clinics_dim phyClinDim ON phyClinDim.physician_id = appFac.physician_id AND phyClinDim.deleted_at IS NULL
                        LEFT JOIN physician_dim physicians ON physicians.physician_id = phyClinDim.physician_id AND physicians.deleted_at IS NULL
                        LEFT JOIN facility_location_dim AS fl ON fl.facility_location_id = phyClinDim.facility_location_id AND fl.deleted_at IS NULL
                        LEFT JOIN facilities_dim AS fac ON fac.facility_id = phyClinDim.facility_id AND fac.deleted_at IS NULL
                        LEFT JOIN clinic_location_dim clinLocDim ON clinLocDim.clinic_locations_id = phyClinDim.clinic_locations_id AND clinLocDim.deleted_at IS NULL
                        LEFT JOIN clinics_dim clinDim ON clinDIm.clinic_id = phyClinDim.clinic_id AND clinDIm.deleted_at IS NULL
                        LEFT JOIN appointment_status_dim appStatDim ON appStatDim.appointment_status_id = appFac.appointment_status_id AND appStatDim.deleted_at IS NULL
                        LEFT JOIN appointment_priority_dim appPrioDim ON appPrioDim.appointment_priority_id = appFac.appointment_priority_id AND appPrioDim.deleted_at IS NULL
                        LEFT JOIN visit_session_state_dim visSesStatDim ON visSesStatDim.visit_session_state_id = visFac.visit_session_state_id AND visSesStatDim.deleted_at IS NULL
                        LEFT JOIN appointments_codes_dim appCodeDim ON appCodeDim.appointment_id = appFac.appointment_id AND appCodeDim.deleted_at IS NULL
                    WHERE ${whereClause}
                    GROUP BY
                        appFac.case_id,
                        CONCAT(patDim.first_name, ' ', patDim.middle_name, ' ', patDim.last_name),
                        patDim.home_phone ,
                        patDim.cell_phone,
                        (SELECT value->>'name' FROM jsonb_each(casFac.insurances) ORDER BY key::int LIMIT 1) ,
                        casFac.accident_date,
                        casTypDim.name ,
                        appFac.scheduled_date_time ,
                        DATE(appFac.scheduled_date_time),
                        CONCAT_WS(' ', facDim.facility_qualifier, facLocDim.facility_location_qualifier) ,
                        specDim.name ,
                        appTypDim.name,
                        CONCAT_WS(' ', pro.first_name, pro.middle_name, pro.last_name),
                        CONCAT_WS(' ', physicians.first_name, physicians.middle_name, physicians.last_name),
                        CONCAT_WS(' ', fac.facility_qualifier, fl.facility_location_qualifier) ,
                        CONCAT_WS(' ', fl.facility_location_address, fl.facility_location_floor, fl.facility_location_city, fl.facility_location_state, fl.facility_location_zip),
                        CONCAT_WS(' ', clinDim.name) ,
                        CONCAT_WS(' ', clinLocDim.address, clinLocDim.floor, clinLocDim.city, clinLocDim.state, clinLocDim.zip),
                        appStatDim.name ,
                        visSesStatDim.visit_session_state_name ,
                        appCodeDim.code_type_name ,
                        appCodeDim.billing_code_id,
                        appCodeDim.description,
                        cb.first_name,
                        cb.middle_name,
                        cb.last_name,
                        ub.first_name,
                        ub.middle_name,
                        ub.last_name,
                        DATE(appFac.created_at) ,
                        DATE(appFac.updated_at),
                        appFac.appointment_id) as grouped_data`
            const summaryResult: object = await sequelize.query(SummaryQuery);
            const totalCountResult: object = await sequelize.query(countQuery);
            const result = [...summaryResult[0], ...totalCountResult[0]]
            return result;
        } catch (error) {
            throw error;
        }
    };

    public getAppointmentSummaryReport = async (reportFilters): Promise<any> => {
        //--------------------------------------------HelperFunctions-----------------------------------------------------

        try {
            const {
                case_type_ids, case_ids, facility_location_ids, patient_ids, insurance_ids, start_date, end_date, speciality_ids, group_by_id, view_by_id, subgroup_by_id, in_house, isPdfClicked, appointment_type_ids, doctor_ids, appointment_status_ids
            } = reportFilters;
            let inHouseFilter: referralFilter = this.createEmptyReferralFilter();
            let inReferralFilter: referralFilter = this.createEmptyReferralFilter();
            // check for AND

            let whereClause: string = `appFac.is_cancelled = 0 AND appFac.case_type_id IS NOT NULL AND appFac.speciality_id IS NOT NULL AND appFac.facility_location_id IS NOT NULL AND appFac.patient_id IS NOT NULL AND appFac.case_id IS NOT NULL AND appFac.deleted_at IS NULL AND (appFac.created_by::integer IS NULL OR appFac.created_by::integer != 13) AND (appFac.updated_by::integer IS NULL OR appFac.updated_by::integer != 13) ${qaLocationsFilter('appFac')} ${qaSpecialitiesFilter('appFac')}`
            if (in_house == 'all' || !in_house) {
                whereClause = `AND ${whereClause}`;
            }
            else {
                whereClause = `${whereClause}`;
            }

            let groupByClause: string = ``;
            let selectClause: string = ``;
            let subGroupByClause: string = ``;
            inHouseFilter.joinCondition = `LEFT`
            inReferralFilter.joinCondition = 'INNER'
            let joinClause: string = ``;
            let commonCondition: string = '', commonSelect: string = ''


            if (in_house) {
                if (in_house.length > 1) {
                    inHouseFilter.joinCondition = 'LEFT';
                    inReferralFilter.joinCondition = 'INNER';
                    inHouseFilter.whereClause += `AND phyClinDim.facility_id IS NOT NULL AND  `;
                    inReferralFilter.extraSelect = ` fac.facility_name as facility_name,fac.facility_qualifier as facility_qualifier,facLoc.facility_location_name AS facility_location_name, 
                        CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip) AS facility_address, 
                        ${this.formattedPhoneQuery('phone')},${this.formattedPhoneQuery('fax')}  , CONCAT_WS(' ', clinDim.name ) AS outside_referring, CONCAT_WS(' ',clincLocDim.address,clincLocDim.floor, clincLocDim.city, clincLocDim.state, clincLocDim.zip) as outside_referring_address,clincLocDim.fax as outside_fax, clincLocDim.phone as outside_phone `
                    inReferralFilter.extraJoins = `
                        LEFT JOIN  clinics_dim AS clinDim ON  clinDim.clinic_id = phyClinDim.clinic_id AND clinDim.deleted_at IS NULL
                        LEFT JOIN  clinic_location_dim AS  clincLocDim ON clincLocDim.clinic_locations_id = phyClinDim.clinic_locations_id AND clincLocDim.deleted_at IS NULL
                        `
                    inReferralFilter.extraGroupBy = `,fac.facility_name,fac.facility_qualifier ,facLoc.facility_location_name,  
                CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip), 
                facLoc.facility_location_phone, 
                facLoc.facility_location_fax,clinDim.name, clincLocDim.address,clincLocDim.floor, clincLocDim.city, clincLocDim.state, clincLocDim.zip, clincLocDim.fax , clincLocDim.phone`
                    inReferralFilter.whereClause += ` AND clinDim.name IS NOT NULL AND
                    clincLocDim.address IS NOT NULL AND `

                    inHouseFilter.extraJoins = `
                    LEFT JOIN  clinics_dim AS clinDim ON  clinDim.clinic_id = phyClinDim.clinic_id AND clinDim.deleted_at IS NULL
                    LEFT JOIN  clinic_location_dim AS  clincLocDim ON clincLocDim.clinic_locations_id = phyClinDim.clinic_locations_id AND clincLocDim.deleted_at IS NULL
                    `
                    inHouseFilter.extraSelect = ` fac.facility_name as facility_name,fac.facility_qualifier as facility_qualifier,facLoc.facility_location_name AS facility_location_name, 
                
                    CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip) AS facility_address, 
                
                    ${this.formattedPhoneQuery('phone')},${this.formattedPhoneQuery('fax')}, CONCAT_WS(' ', clinDim.name ) AS outside_referring, CONCAT_WS(' ',clincLocDim.address,clincLocDim.floor, clincLocDim.city, clincLocDim.state, clincLocDim.zip) as outside_referring_address,clincLocDim.fax as outside_fax, clincLocDim.phone as outside_phone `

                    inHouseFilter.extraGroupBy = `,fac.facility_name,fac.facility_qualifier ,facLoc.facility_location_name,                CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip),           facLoc.facility_location_phone,             facLoc.facility_location_fax,clinDim.name, clincLocDim.address,clincLocDim.floor, clincLocDim.city, clincLocDim.state, clincLocDim.zip, clincLocDim.fax , clincLocDim.phone`
                    inHouseFilter.whereClause += `  clinDim.name IS NOT NULL AND  clincLocDim.address IS NOT NULL AND `
                    let viewBySelect = ``;

                    commonSelect = `
                	COALESCE(is_referral_data.facility_name , in_house_data.facility_name) as facility_name,
					COALESCE(is_referral_data.facility_qualifier, in_house_data.facility_qualifier ) as facility_qualifier,
					COALESCE(is_referral_data.facility_location_name, in_house_data.facility_location_name ) AS facility_location_name,
                    COALESCE(is_referral_data.outside_referring,in_house_data.outside_referring) as outside_referring,
                    COALESCE(is_referral_data.outside_referring_address,in_house_data.outside_referring_address) as outside_referring_address,
                    COALESCE(is_referral_data.outside_fax,in_house_data.outside_fax ) as outside_fax,
                    COALESCE(is_referral_data.outside_phone,in_house_data.outside_phone) as outside_phone,
                    COALESCE(in_house_data.facility_address, is_referral_data.facility_address) AS facility_address,
                    ${this.formattedPhoneQueryReferal('phone')},
                    ${this.formattedPhoneQueryReferal('fax')},`
                    commonCondition = `
                    ON in_house_data.outside_referring = is_referral_data.outside_referring
                    AND is_referral_data.facility_name = in_house_data.facility_name
					AND is_referral_data.facility_qualifier = in_house_data.facility_qualifier 
					AND is_referral_data.facility_location_name = in_house_data.facility_location_name
                    AND in_house_data.outside_referring_address = is_referral_data.outside_referring_address
                    AND in_house_data.outside_fax = is_referral_data.outside_fax 
                    AND in_house_data.facility_address = is_referral_data.facility_address
                    AND in_house_data.facility_phone = is_referral_data.facility_phone
                    AND in_house_data.facility_fax = is_referral_data.facility_fax`;
                    if (view_by_id != null && !isPdfClicked) {
                        commonSelect += `COALESCE(is_referral_data.view_by_name , in_house_data.view_by_name) as view_by_name,`
                        commonCondition += ` AND in_house_data.view_by_name = is_referral_data.view_by_name`
                    }
                }
                else {
                    if (in_house == 'is_referral') {
                        inReferralFilter.joinCondition = `INNER`;
                        inReferralFilter.extraSelect = `fac.facility_name as facility_name,fac.facility_qualifier as facility_qualifier,facLoc.facility_location_name AS facility_location_name, 
                        CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip) AS facility_address,
                        ${this.formattedPhoneQuery('phone')},${this.formattedPhoneQuery('fax')} , CONCAT_WS(' ', clinDim.name ) AS outside_referring, CONCAT_WS(' ',clincLocDim.address,clincLocDim.floor, clincLocDim.city, clincLocDim.state, clincLocDim.zip) as outside_referring_address,clincLocDim.fax as outside_fax, clincLocDim.phone as outside_phone `
                        inReferralFilter.extraJoins = `
                                LEFT JOIN  clinics_dim AS clinDim ON  clinDim.clinic_id = phyClinDim.clinic_id AND clinDim.deleted_at IS NULL
                                LEFT JOIN  clinic_location_dim AS  clincLocDim ON clincLocDim.clinic_locations_id = phyClinDim.clinic_locations_id AND clincLocDim.deleted_at IS NULL
                                `
                        inReferralFilter.extraGroupBy = `,fac.facility_name,fac.facility_qualifier ,facLoc.facility_location_name,
                            CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip), 
                            facLoc.facility_location_phone,facLoc.facility_location_fax,clinDim.name, clincLocDim.address,clincLocDim.floor, clincLocDim.city, clincLocDim.state, clincLocDim.zip, clincLocDim.fax , clincLocDim.phone`
                        inReferralFilter.whereClause += ` AND clinDim.name IS NOT NULL AND
                                                clincLocDim.address IS NOT NULL AND `
                    }
                    else if (in_house == 'in_house') {
                        inHouseFilter.extraSelect = `fac.facility_name as facility_name,fac.facility_qualifier as facility_qualifier,facLoc.facility_location_name AS facility_location_name, 
                                CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip) AS facility_address,
                                ${this.formattedPhoneQuery('phone')},${this.formattedPhoneQuery('fax')}  , CONCAT_WS(' ', clinDim.name ) AS outside_referring, CONCAT_WS(' ',clincLocDim.address,clincLocDim.floor, clincLocDim.city, clincLocDim.state, clincLocDim.zip) as outside_referring_address,clincLocDim.fax as outside_fax, clincLocDim.phone as outside_phone `
                        inHouseFilter.extraJoins = `
                                LEFT JOIN  clinics_dim AS clinDim ON  clinDim.clinic_id = phyClinDim.clinic_id AND clinDim.deleted_at IS NULL
                                LEFT JOIN  clinic_location_dim AS  clincLocDim ON clincLocDim.clinic_locations_id = phyClinDim.clinic_locations_id AND clincLocDim.deleted_at IS NULL`
                        inHouseFilter.extraGroupBy = `,fac.facility_name,fac.facility_qualifier ,facLoc.facility_location_name,
                                CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip), 
                                facLoc.facility_location_phone,facLoc.facility_location_fax,clinDim.name, clincLocDim.address,clincLocDim.floor, clincLocDim.city, clincLocDim.state, clincLocDim.zip, clincLocDim.fax , clincLocDim.phone`
                        inHouseFilter.whereClause += `AND phyClinDim.facility_id IS NOT NULL AND  `;
                    }

                }
            }

            if (doctor_ids && doctor_ids.length > 0) {
                whereClause += ` AND appFac.provider_id IN (${doctor_ids})`;
            }
            if (appointment_status_ids && appointment_status_ids.length > 0) {
                whereClause += ` AND appFac.appointment_status_id IN (${appointment_status_ids})`;
            }
            // Filter by case type
            if (case_type_ids && case_type_ids.length > 0) {
                whereClause += ` AND appFac.case_type_id IN (${case_type_ids.join(', ')})`;
                joinClause += `LEFT JOIN case_types_dim casTypDim ON casTypDim.case_type_id = casFac.case_type_id AND casTypDim.deleted_at IS NULL`
            }

            //Filter by case
            if (case_ids && case_ids.length > 0) {
                whereClause += ` AND appFac.case_id IN (${case_ids})`;
                joinClause += `INNER JOIN case_fact_new casFac ON casFac.case_id = appFac.case_id AND casFac.deleted_at IS NULL`;
            }

            // Filter by facility location
            if (facility_location_ids && facility_location_ids.length > 0) {
                whereClause += ` AND facLoc.facility_location_id IN (${facility_location_ids.join(', ')})`;
            }

            if (appointment_type_ids && appointment_type_ids.length > 0) {
                whereClause += ` AND appType.appointment_type_id IN (${appointment_type_ids.join(', ')})`;
            }

            if (speciality_ids && speciality_ids.length > 0) {
                whereClause += ` AND appFac.speciality_id IN (${speciality_ids})`;
            }

            if (patient_ids && patient_ids.length > 0) {
                whereClause += ` AND patDim.patient_id IN (${patient_ids})`;
                joinClause += ` LEFT JOIN patient_dim AS patDim ON appFac.patient_id = patDim.patient_id AND patDim.deleted_at is NULL `;
            }
            if (insurance_ids && insurance_ids.length > 0) {
                whereClause += ` AND casFac.insurances ?| ARRAY['${insurance_ids.join("','")}']`;
            }
            if (start_date && end_date) {
                const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(start_date, end_date);
                whereClause += ` AND appFac.scheduled_date_time >= '${fromDateAdjusted} ' AND appFac.scheduled_date_time <= '${toDateAdjusted}'`;
            }

            // Dynamic View By
            if (view_by_id != null && !isPdfClicked) {
                switch (view_by_id) {
                    case viewbyIDForAppt.month:
                        selectClause = `TO_CHAR(appFac.scheduled_date_time, 'Month YYYY') AS view_by_name,`;
                        groupByClause = `TO_CHAR(appFac.scheduled_date_time, 'Month YYYY'),`;
                        break;
                    case viewbyIDForAppt.visit_type:
                        selectClause = `appType.name AS view_by_name,`;
                        groupByClause = `appType.name,`;
                        break;
                    case viewbyIDForAppt.specialty:
                        selectClause = `specDim.name AS view_by_name,`;
                        groupByClause = `specDim.name,`;
                        break;
                    default:
                        selectClause = ``;
                        groupByClause = ``;
                        break;
                }
            }
            if (isPdfClicked) {
                const facilitySelect: string = `fac.facility_name as facility_name, fac.facility_qualifier as facility_qualifier, 
                    facLoc.facility_location_name AS facility_location_name, 
                    CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', 
                    facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip) AS facility_address, 
                    ${this.formattedPhoneQuery('phone')},${this.formattedPhoneQuery('fax')}`;

                const facilityGroupBy: string = `fac.facility_name, fac.facility_qualifier, facLoc.facility_location_name, 
                    CONCAT(facLoc.facility_location_address, ' ', facLoc.facility_location_floor, ' ', 
                    facLoc.facility_location_city, ' ', facLoc.facility_location_state, ' ', facLoc.facility_location_zip), 
                    facLoc.facility_location_phone, facLoc.facility_location_fax`;

                if (!in_house || in_house.length < 1) {
                    selectClause += `${facilitySelect}, `;
                    groupByClause += `${facilityGroupBy}, `;

                    if (in_house && in_house.length < 1) {
                        selectClause += `, ${facilitySelect}`;
                    }
                }
            }
            // Dynamic grouping
            if (group_by_id != null) {
                switch (group_by_id) {
                    case GroupByID.Office:
                        break;
                    case GroupByID.Practice_Location:
                        selectClause += ` CONCAT_WS(' ',fac.facility_qualifier, facLoc.facility_location_name) AS group_by_name`;
                        groupByClause += ` facLoc.facility_location_name, fac.facility_qualifier`;
                        break;
                    case GroupByID.Visit_Type:
                        selectClause += ` appType.name AS group_by_name, appType.qualifier AS group_by_qualifier`;
                        groupByClause += ` appType.name, appType.qualifier`;
                        break;
                    case GroupByID.Specialty:
                        selectClause += ` specDim.name AS group_by_name, specDim.qualifier AS group_by_qualifier`;
                        groupByClause += ` specDim.name, specDim.qualifier`;
                        break;
                    case GroupByID.Appointment_Status:
                        selectClause += ` appStatus.name AS group_by_name`;
                        groupByClause += ` appStatus.name`;
                        break;
                    case GroupByID.Provider:
                        selectClause += ` CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS group_by_name`;
                        groupByClause += ` CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name)`
                        break;
                    default:
                        selectClause = ``;
                        groupByClause = ``;
                        break;
                }
            }

            // Dynamic sub-grouping
            if (subgroup_by_id != null) {
                switch (subgroup_by_id) {
                    case GroupByID.Practice_Location:
                        subGroupByClause = `, facLoc.facility_location_name AS subgroup_by_name`;
                        groupByClause += `, facLoc.facility_location_name `;
                        break;
                    case GroupByID.Visit_Type:
                        if (!in_house) {
                            subGroupByClause = `, appType.name AS subgroup_by_name, appType.qualifier AS subgroup_by_qualifier `;
                            groupByClause += ` ,appType.name , appType.qualifier`;
                        } else {
                            commonSelect += `COALESCE(in_house_data.subgroup_by_name, is_referral_data.subgroup_by_name) AS subgroup_by_name,
                            COALESCE(in_house_data.subgroup_by_qualifier, is_referral_data.subgroup_by_qualifier) AS subgroup_by_qualifier,`
                            commonCondition += ` AND is_referral_data.subgroup_by_name = in_house_data.subgroup_by_name
                            AND in_house_data.subgroup_by_qualifier = is_referral_data.subgroup_by_qualifier `
                            subGroupByClause = `, appType.name AS subgroup_by_name, appType.qualifier AS subgroup_by_qualifier `;
                            groupByClause += ` appType.name , appType.qualifier`;
                        }
                        break;
                    case GroupByID.Specialty:
                        if (group_by_id == GroupByID.Office) {
                            subGroupByClause = `, specDim.name AS subgroup_by_name, specDim.qualifier as subgroup_by_qualifier`;
                            groupByClause += ` specDim.name, specDim.qualifier`;
                            commonSelect += `COALESCE(in_house_data.subgroup_by_name, is_referral_data.subgroup_by_name) AS subgroup_by_name,
                                         COALESCE(in_house_data.subgroup_by_qualifier, is_referral_data.subgroup_by_qualifier) AS subgroup_by_qualifier,`
                            commonCondition += ` AND is_referral_data.subgroup_by_name = in_house_data.subgroup_by_name
                                            AND in_house_data.subgroup_by_qualifier = is_referral_data.subgroup_by_qualifier `
                        } else {
                            subGroupByClause = `, specDim.name AS subgroup_by_name, specDim.qualifier as subgroup_by_qualifier`;
                            groupByClause += `, specDim.name, specDim.qualifier`;
                        }
                        break;
                    case GroupByID.Appointment_Status:
                        subGroupByClause = `, appStatus.name AS subgroup_by_name , appStatus.qualifier as subgroup_by_qualifier`;
                        groupByClause += `, appStatus.name,  appStatus.qualifier`;
                        break;

                    case GroupByID.Provider:
                        subGroupByClause = `, CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) AS subgroup_by_name`;
                        groupByClause += `, CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name)`;
                        break;
                    default:
                        subGroupByClause = ``;
                        break;
                }
            };
            inHouseFilter.selectClause += selectClause;
            inHouseFilter.subGroupByClause += subGroupByClause
            inHouseFilter.joinClause += joinClause;
            inHouseFilter.whereClause += ` ${whereClause}`;
            inHouseFilter.groupByClause += ` ${groupByClause}`;
            inReferralFilter.selectClause += selectClause;
            inReferralFilter.subGroupByClause += subGroupByClause
            inReferralFilter.joinClause += joinClause;
            inReferralFilter.whereClause += whereClause;
            inReferralFilter.groupByClause += ` ${groupByClause}`;

            let appointmentSummaryQuery = '';
            if (in_house && in_house.length > 1) {
                const inHouseQuery: string = this.createSummaryStatusQuery(inHouseFilter);
                const isreferralQuery: string = this.createSummaryStatusQuery(inReferralFilter)
                appointmentSummaryQuery = `
                WITH in_house_data AS ( ${inHouseQuery} ),
                is_referral_data AS ( ${isreferralQuery} )
                SELECT 
                ${commonSelect}
                COALESCE(in_house_data.VC, 0) + COALESCE(is_referral_data.VC, 0) AS VC,
                COALESCE(in_house_data.SC, 0) + COALESCE(is_referral_data.SC, 0) AS SC,
                COALESCE(in_house_data.NS, 0) + COALESCE(is_referral_data.NS, 0) AS NS,
                COALESCE(in_house_data.Total, 0) + COALESCE(is_referral_data.Total, 0) AS Total
                    FROM in_house_data
                    FULL OUTER JOIN is_referral_data 
                    ${commonCondition} ;
                `
            } else if (in_house == 'is_referral') {
                appointmentSummaryQuery = this.createSummaryStatusQuery(inReferralFilter)
            } else {
                appointmentSummaryQuery = this.createSummaryStatusQuery(inHouseFilter)
            }
            const results: any = await sequelize.query(appointmentSummaryQuery);
            let data: any = results[0];
            // let data: any = results[0];
            if (view_by_id != null && !isPdfClicked) {
                let groupBy = 'Total';
                const viewTotals: Record<string, any> = {};
                const groupByCondition: string = GroupByID.Office ? 'outside_referring' : 'group_by_name';
                data.forEach((entry: any) => {
                    if (entry.view_by_name) {
                        if (!viewTotals[entry.view_by_name]) {
                            viewTotals[entry.view_by_name] = {
                                [groupByCondition]: groupBy,
                                subgroup_by_name: null,
                                vc: 0,
                                sc: 0,
                                ns: 0,
                                total: 0
                            };
                        }

                        viewTotals[entry.view_by_name].vc += parseFloat(entry.vc);
                        viewTotals[entry.view_by_name].sc += parseFloat(entry.sc);
                        viewTotals[entry.view_by_name].ns += parseFloat(entry.ns);
                        viewTotals[entry.view_by_name].total += parseFloat(entry.total);
                    }
                });

                // Sorting the data based on view_by_name
                const sortedDataArray = Object.entries(viewTotals).sort((a, b) => {
                    return a[0].localeCompare(b[0]);
                });

                const sortedData: Record<string, any> = {};
                sortedDataArray.forEach(([key, value]) => {
                    sortedData[key] = value;
                });

                // Rearrange the array with totals followed by respective view_by_name objects
                const arrangedData: any[] = [];
                Object.keys(sortedData).forEach((view_by_name: string) => {
                    arrangedData.push({
                        view_by_name,
                        ...sortedData[view_by_name]
                    });

                    data.forEach((entry: any) => {
                        if (entry.view_by_name === view_by_name) {
                            arrangedData.push(entry);
                        }
                    });
                });

                arrangedData.forEach((entry: any) => {
                    if (GroupByID.Office ? entry.outside_referring != 'Total' : entry.group_by_name != 'Total') {
                        delete entry.view_by_name;
                    }
                });

                const lastRowData: any = this.appointmentsSumCalculator(results[0]);
                arrangedData.push(lastRowData);
                return arrangedData;
            };


            const lastRowData: any = this.appointmentsSumCalculator(results[0]);
            results[0].push(lastRowData);
            return results[0];
        } catch (error) {
            throw error;
        }
    };

    public generatePDF = async (reportFilters): Promise<any> => {

        try {

            const { start_date, end_date } = reportFilters
            const reportData = await this.getAppointmentSummaryReport(reportFilters);
            const updatedEndDate = this.dateFormatModifier(end_date);
            let htmlnewPage: string = '';
            const newFacilities2 = this.summaryPDFGroupData(reportData, reportFilters)
            htmlnewPage = newgenerateSummaryHTMLPages(newFacilities2, reportFilters, updatedEndDate, start_date, end_date);

            if (!htmlnewPage) {
                return `No data to generate PDF`
            }
            const browser = await puppeteer.launch({
                executablePath: '/usr/bin/google-chrome'
            })
            const page = await browser.newPage();

            await page.setContent(htmlnewPage, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                landscape: true,
            });

            await browser.close();
            const base64Data = Buffer.from(pdfBuffer).toString("base64");

            return { data: base64Data };
        } catch (error) {
            throw error;
        };
    };

    public generateStatusPDF = async (reportFilters): Promise<any> => {
        try {
            const { startDate, endDate } = reportFilters;
            const reportData = await this.getStatusReport(reportFilters, false);
            const totalCount: number = reportData.pop()?.count;
            const { facilities, calculatedStartDate, calculatedEndDate } = this.groupByFacilityAppointmentAndPatient(reportData);
            const finalStartDate = startDate || calculatedStartDate;
            const finalEndDate = endDate || calculatedEndDate;
            const htmlContent = generateHTMLPages(facilities, finalStartDate, finalEndDate);
            const browser = await puppeteer.launch({
                executablePath: '/usr/bin/google-chrome'
            })
            const page = await browser.newPage();

            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
            });

            await browser.close();
            const base64Data = Buffer.from(pdfBuffer).toString("base64");

            return { data: base64Data };

        } catch (error) {
            throw error;
        };
    };

}

