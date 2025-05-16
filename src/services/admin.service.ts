import * as Sequelize from 'sequelize';
import { sequelize } from '../config/database';
import * as typings from '../interfaces';
import { ExportChartDetail, timeSpanMappings } from '../interfaces';
import { GlobalFiltersRequest } from "../interfaces/contracts/request_model";
import { Helper, Http } from "../shared";
import { chartsDetails } from '../shared/chart-details';
import { BillStatus } from '../shared/dashboard.enum';
import { PayerRecepientType, Filter } from '../shared/dashboards.enums';
import { InvoiceRecipients, qaLocationsFilter, qaSpecialitiesFilter } from '../shared/filter-clause';
import { GlobalFilterQueryHelper } from "../shared/global.filter.query.helper";
export class AdminService extends Helper {
  public __http: Http;
  public constructor(

    public http: typeof Http
  ) {
    super();
    this.__http = new http();
  }
  public getTopTenBilledSpecialities = async (reqData: typings.GenericReqObjI) => {
    try {
      let whereClause = GlobalFilterQueryHelper(reqData);
      // Construct the SQL query

      let sqlQuery: string = `WITH SpecialityTotals AS ( SELECT specDim.name AS speciality_name,
         SUM(bilFac.bill_amount) AS bill_amount, ROW_NUMBER() OVER (ORDER BY SUM(bilFac.bill_amount) DESC) AS row_num 
         FROM specialities_dim specDim 
         INNER JOIN bills_fact_new bilFac ON bilFac.speciality_id = specDim.specialty_id AND bilFac.deleted_at is NULL
          where ${whereClause} ${qaSpecialitiesFilter('bilFac')}
          AND specDim.deleted_at IS NULL AND specDim.name is NOT NULL
          GROUP BY speciality_name 
          ORDER BY bill_amount DESC LIMIT 10 ),
          ProvidersTotals AS ( SELECT concat(p.first_name,' ', p.middle_name, ' ',p.last_name) AS provider_name,
          SUM(bilFac.bill_amount) AS provider_bill_amount, 
           ROW_NUMBER() OVER (ORDER BY SUM(bilFac.bill_amount) DESC) AS row_num 
           FROM users_dim p INNER JOIN bills_fact_new bilFac ON bilFac.doctor_id = p.user_id
            where ${whereClause} GROUP BY provider_name ORDER BY provider_bill_amount DESC LIMIT 10 )
            SELECT specTot.speciality_name, specTot.bill_amount, PT.provider_name, PT.provider_bill_amount
            FROM SpecialityTotals specTot FULL JOIN ProvidersTotals PT ON specTot.row_num = PT.row_num`;

      // Execute the SQL query and get the results
      const results: object = await sequelize.query(sqlQuery);
      // Return the results
      return results[0];
    } catch (error) {
      // Handle any errors and log them
      throw error;
    }
  }
  // #region Summary Chart for admin
  public getSummaryChart = async (reqData: typings.GenericReqObjI) => {
    try {
      // Destructure request data
      const { time_span_id, month_id, facility_location_ids, speciality_ids, provider_ids, case_type_ids, fromDate, toDate }: GlobalFiltersRequest["user"] = reqData;

      // Initialize variables
      let newFromDate: string;
      let newToDate: string;
      let prevTime: string;
      let time: string;
      let invoiceJoin: string = `LEFT JOIN invoices_dim inv ON inv.bills @> to_jsonb(bilFac.bill_id)
        AND inv.bills IS NOT NULL AND inv.deleted_at IS NULL  `;
      let whereClause: string = `AND bilFac.deleted_at IS NULL AND bilFac.case_type_id IS NOT NULL 
        AND bilFac.speciality_id IS NOT NULL
        AND bilFac.facility_location_id IS NOT NULL AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13) ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}`;
      let billCurTime: string = 'bilFac.deleted_at IS NULL';
      let billPreTime: string = 'bilFac.deleted_at IS NULL';
      let payCurTime: string = 'payFac.deleted_at IS NULL';
      let payPreTime: string = 'payFac.deleted_at IS NULL';

      // Check if time_span_id exists
      if (time_span_id) {
        const timeMapping: timeSpanMappings = {
          1: { time: '1 week', prevTime: '2 week' },
          2: { time: '1 month', prevTime: '2 month' },
          3: { time: '6 month', prevTime: '12 month' },
          4: { time: '1 year', prevTime: '2 year' },
          5: {
            time: (() => {
              const currentDate: Date = new Date();
              const totalCurrentDate: number = currentDate.getDate();
              return totalCurrentDate + ' days';
            })(),
            prevTime: (() => {
              const currentDate: Date = new Date();
              const totalCurrentDate: number = currentDate.getDate();
              return (2 * totalCurrentDate) + ' days';
            })()
          },
          default: { time: '1 week', prevTime: '2 week' }
        };

        const { time, prevTime } = timeMapping[time_span_id] || timeMapping.default;

        // Construct time intervals for SQL queries
        billCurTime = `bilFac.bill_date >=  (current_date - INTERVAL '${time}')  AND bilFac.bill_date <= current_date `;
        billPreTime = `bilFac.bill_date >= (current_date - INTERVAL '${prevTime}') AND bilFac.bill_date <= current_date - INTERVAL '${time}'`;
        payCurTime = `check_date >=  (current_date - INTERVAL '${time}')  AND check_date <= current_date `;
        payPreTime = `check_date >= (current_date - INTERVAL '${prevTime}') AND check_date <= (current_date - INTERVAL '${time}')`;
      }

      // Check if facility_location_ids exist
      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND facility_location_id IN (${facility_location_ids}) `;
      }

      // Check if speciality_ids exist
      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND speciality_id IN (${speciality_ids})`;
      }

      // Check if provider_ids exist
      if (provider_ids && provider_ids.length > 0) {
        whereClause += ` AND doctor_id IN (${provider_ids})`;
      }

      // Check if case_type_ids exist
      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND case_type_id IN (${case_type_ids}) `;
      }
      // Check if fromdate, todate are provided and not empty
      if (fromDate && toDate) {
        ({ billCurTime, billPreTime } = this.fromDateToDate(fromDate, toDate));
        ({ payCurTime, payPreTime } = this.fromDateToDate(fromDate, toDate, true));
        // Convert provided dates to Date objects
      }
      // Check if month_id is provided and not 0
      if (month_id && month_id != 0) {
        ({ billCurTime, billPreTime } = this.monthId(month_id));
        ({ payCurTime, payPreTime } = this.monthId(month_id, true));
      }

      // Construct the main SQL query
      const query: string = `
          WITH interest_amount AS (
            SELECT
              (SELECT SUM(COALESCE(inv.interest_amount, bilFac.interest_amount)) FROM bills_fact_new bilFac ${invoiceJoin} 
              AND COALESCE(inv.interest_amount, bilFac.interest_amount) IS NOT NULL WHERE ${billCurTime} ${whereClause}
              )AS current_interest,
              (SELECT SUM(COALESCE(inv.interest_amount, bilFac.interest_amount)) FROM bills_fact_new bilFac ${invoiceJoin} 
              AND COALESCE(inv.interest_amount, bilFac.interest_amount) IS NOT NULL WHERE ${billPreTime} ${whereClause}
              ) AS previous_interest
          ),
          total_billed_amount AS (
            SELECT
              (SELECT SUM(bilFac.bill_amount) FROM bills_fact_new bilFac WHERE bill_amount IS NOT NULL AND ${billCurTime} ${whereClause}
              ) AS current_billed,
              (SELECT SUM(bill_amount) FROM bills_fact_new bilFac WHERE bilFac.bill_amount IS NOT NULL AND ${billPreTime} ${whereClause}
              ) AS previous_billed
          ),
          total_payments_received AS (
            SELECT
              (SELECT SUM(COALESCE(payFacInv.check_amount, payFac.check_amount)) FROM bills_fact_new bilFac 
              LEFT JOIN invoices_dim inv ON inv.bills @> to_jsonb(bilFac.bill_id)  
              AND inv.bills IS NOT NULL AND inv.deleted_at IS NULL  
              LEFT JOIN payment_fact payFac ON bilFac.bill_id = payFac.bill_id AND payFac.bill_id is not null AND payFac.recipient_id is not null
              AND payFac.deleted_at IS NULL AND payFac.invoice_id IS NULL
              LEFT JOIN payment_fact payFacInv ON inv.invoice_id = payFacInv.invoice_id  AND
              payFacInv.deleted_at IS NULL AND payFacInv.recipient_id is not null
              WHERE bilFac.paid_amount IS NOT NULL AND ${payCurTime.replace(/check_date/g, 'payFac.check_date')} ${whereClause}
              ) AS total_payment_received,
              (SELECT SUM(COALESCE(payFacInv.check_amount, payFac.check_amount)) FROM bills_fact_new bilFac 
              LEFT JOIN invoices_dim inv ON inv.bills @> to_jsonb(bilFac.bill_id) 
              AND inv.bills IS NOT NULL AND inv.deleted_at IS NULL  
              LEFT JOIN payment_fact payFac ON bilFac.bill_id = payFac.bill_id AND payFac.bill_id is NOT null AND payFac.recipient_id is not null
              AND payFac.deleted_at IS NULL AND payFac.invoice_id IS NULL
              LEFT JOIN payment_fact payFacInv ON inv.invoice_id = payFacInv.invoice_id AND
              payFacInv.deleted_at IS NULL AND payFacInv.recipient_id is not null
              WHERE bilFac.paid_amount IS NOT NULL AND ${payPreTime.replace(/check_date/g, 'payFac.check_date')} ${whereClause}
              ) AS previous_payment_received
          ),
          total_account_receivables AS (
            SELECT
              (SELECT SUM(COALESCE(inv.outstanding_amount, bilFac.outstanding_amount)) FROM bills_fact_new bilFac ${invoiceJoin} 
              AND COALESCE(inv.outstanding_amount, bilFac.outstanding_amount) IS NOT NULL WHERE ${billCurTime} ${whereClause}
              )AS current_account_receivable,
              (SELECT SUM(COALESCE(inv.outstanding_amount, bilFac.outstanding_amount)) FROM bills_fact_new bilFac ${invoiceJoin} 
              AND COALESCE(inv.outstanding_amount, bilFac.outstanding_amount) IS NOT NULL WHERE ${billPreTime} ${whereClause}
              ) AS previous_account_receivable 
          ),
          write_off_amount AS (
            SELECT
              (SELECT SUM(COALESCE(inv.write_off_amount, bilFac.write_off_amount)) FROM bills_fact_new bilFac ${invoiceJoin} 
              AND COALESCE(inv.write_off_amount, bilFac.write_off_amount) IS NOT NULL WHERE ${billCurTime} ${whereClause}
              )AS current_writeoff,
              (SELECT SUM(COALESCE(inv.write_off_amount, bilFac.write_off_amount)) FROM bills_fact_new bilFac ${invoiceJoin} 
              AND COALESCE(inv.write_off_amount, bilFac.write_off_amount) IS NOT NULL WHERE ${billPreTime} ${whereClause}
              ) AS previous_writeoff
          )
          SELECT
            current_interest, previous_interest,
            current_billed, previous_billed,
            total_payment_received, previous_payment_received,
            current_account_receivable,previous_account_receivable,
            current_writeoff,previous_writeoff
          FROM interest_amount, total_billed_amount, total_payments_received, total_account_receivables, write_off_amount;
        `;

      // Execute the SQL query and retrieve data\
      const info: object[] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
      // Assuming you have retrieved the data into the queryData object
      if (info[0]) {
        const data: any = info[0];
        // Code Before Refactoring
        // Transform data into a flat structure
        const flatData: typings.ResponseObject = {
          current_interest: parseFloat(data.current_interest),
          previous_interest: parseFloat(data.previous_interest),
          current_billed: parseFloat(data.current_billed),
          previous_billed: parseFloat(data.previous_billed),
          total_payment_received: parseFloat(data.total_payment_received),
          previous_payment_received: parseFloat(data.previous_payment_received),
          current_account_receivable: parseFloat(data.current_account_receivable),
          previous_account_receivable: parseFloat(data.previous_account_receivable),
          current_writeoff: parseFloat(data.current_writeoff),
          previous_writeoff: parseFloat(data.previous_writeoff),
          interest_difference: 0,
          billed_difference: 0,
          payment_received_difference: 0,
          account_receivable_difference: 0,
          writeoff_difference: 0,
          isInterestPositive: false,
          isBilledPositive: false,
          isPaymentPositive: false,
          isReceivablesPositive: false,
          isWriteoffPositive: false,
        };

        // Calculate percentage difference and update the flatData object
        flatData.interest_difference = ((flatData.current_interest - flatData.previous_interest) / flatData.previous_interest) * 100;
        flatData.billed_difference = ((flatData.current_billed - flatData.previous_billed) / flatData.previous_billed) * 100;
        flatData.payment_received_difference = ((flatData.total_payment_received - flatData.previous_payment_received) / flatData.previous_payment_received) * 100;
        flatData.account_receivable_difference = ((flatData.current_account_receivable - flatData.previous_account_receivable) / flatData.previous_account_receivable) * 100;
        flatData.writeoff_difference = ((flatData.current_writeoff - flatData.previous_writeoff) / flatData.previous_writeoff) * 100;
        flatData.isInterestPositive = flatData.interest_difference >= 0;
        flatData.isBilledPositive = flatData.billed_difference >= 0;
        flatData.isPaymentPositive = flatData.payment_received_difference >= 0;
        flatData.isReceivablesPositive = flatData.account_receivable_difference >= 0;
        flatData.isWriteoffPositive = flatData.writeoff_difference >= 0;

        // Create a response object with absolute values
        const responseObject: typings.ResponseObject = {
          current_interest: Math.abs(flatData.current_interest) || 0,
          previous_interest: Math.abs(flatData.previous_interest) || 0,
          current_billed: Math.abs(flatData.current_billed) || 0,
          previous_billed: Math.abs(flatData.previous_billed) || 0,
          total_payment_received: Math.abs(flatData.total_payment_received) || 0,
          previous_payment_received: Math.abs(flatData.previous_payment_received) || 0,
          current_account_receivable: Math.abs(flatData.current_account_receivable) || 0,
          previous_account_receivable: Math.abs(flatData.previous_account_receivable) || 0,
          current_writeoff: Math.abs(flatData.current_writeoff) || 0,
          previous_writeoff: Math.abs(flatData.previous_writeoff) || 0,
          interest_difference: Math.abs(flatData.interest_difference) || 0,
          billed_difference: Math.abs(flatData.billed_difference) || 0,
          payment_received_difference: Math.abs(flatData.payment_received_difference) || 0,
          account_receivable_difference: Math.abs(flatData.account_receivable_difference) || 0,
          writeoff_difference: Math.abs(flatData.writeoff_difference) || 0,
          isInterestPositive: flatData.isInterestPositive,
          isBilledPositive: flatData.isBilledPositive,
          isPaymentPositive: flatData.isPaymentPositive,
          isReceivablesPositive: flatData.isReceivablesPositive,
          isWriteoffPositive: flatData.isWriteoffPositive,
        };
        // Format the response object and return
        const result = {};
        for (const key in responseObject) {
          if (typeof responseObject[key] === 'number') {
            result[key] = responseObject[key].toFixed(2);
          } else {
            result[key] = responseObject[key];
          }
        }
        return result;
      } else {
        throw new Error("Invalid structure");
      }

    } catch (error) {
      // Handle errors and return a message
      throw error;
    }
  }

  // #region revenue by location
  public getRevenueLocation = async (reqData: typings.GenericReqObjI) => {
    try {
      // Destructure request data
      const { time_span_id, month_id, facility_location_ids, speciality_ids, provider_ids, case_type_ids, fromDate, toDate }: GlobalFiltersRequest["user"] = reqData;
      // Initialize variables
      let whereClause: string = `AND bilFac.deleted_at IS NULL AND bilFac.case_type_id IS NOT NULL 
      AND bilFac.speciality_id IS NOT NULL
      AND bilFac.facility_location_id IS NOT NULL AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13) ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}`;
      let billCurTime: string;
      let billPreTime: string;
      let daysDifference: string;

      // Refactored Code


      const timeMappings: timeSpanMappings = {
        1: { time: '1 week', prevTime: '2 weeks' },
        2: { time: '1 month', prevTime: '2 months' },
        3: { time: '6 months', prevTime: '12 months' },
        4: { time: '1 year', prevTime: '2 years' },
        5: {
          time: `${this.getCurrentDate()} days`,
          prevTime: `${2 * this.getCurrentDate()} days`,
        },
        default: { time: '1 week', prevTime: '2 weeks' },
      };

      const { time, prevTime } = timeMappings[time_span_id] || timeMappings.default;

      // Update the existing variables
      billCurTime = `bilFac.bill_date >= (current_date - INTERVAL '${time}') AND bilFac.bill_date <= current_date`;
      billPreTime = `bilFac.bill_date >= (current_date - INTERVAL '${prevTime}') AND bilFac.bill_date <= (current_date - INTERVAL '${time}')`;


      // Check if facility_location_ids exist
      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND bilFac.facility_location_id IN (${facility_location_ids}) `;
      }

      // Check if speciality_ids exist
      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND bilFac.speciality_id IN (${speciality_ids})`;
      }

      // Check if provider_ids exist
      if (provider_ids && provider_ids.length > 0) {
        whereClause += ` AND bilFac.doctor_id IN (${provider_ids})`;
      }

      // Check if case_type_ids exist
      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND bilFac.case_type_id IN (${case_type_ids}) `;
      }

      if (fromDate && toDate) {
        ({ billCurTime, billPreTime } = this.fromDateToDate(fromDate, toDate));
        // Convert provided dates to Date objects
      }
      // Check if month_id is provided and not 0
      if (month_id && month_id != 0) {
        // ({ billCurTime, billPreTime } = this.monthId(month_id));

        const year: number = (new Date).getFullYear();
        billCurTime = ` EXTRACT('month' from bilFac.bill_date) = ${month_id} 
                          AND EXTRACT('year' from bilFac.bill_date)= ${year}`; // Fetch data of the selected month
      }

      // Construct the main SQL query
      const query: string = `
      WITH DATAH AS (
        SELECT
              facDim.facility_id,
              facLocDim.facility_location_id,
              COALESCE(SUM(payFacInv.check_amount), 0.00) AS revenueInv,
              COALESCE(SUM(payFac.check_amount), 0.00) AS revenueR,
              SUM(bilFac.bill_amount) AS billed_amount,
              facLocDim.facility_location_name,
              facLocDim.facility_location_qualifier,
              facDim.facility_qualifier

          FROM bills_fact_new bilFac
          LEFT JOIN (
              SELECT
                  payFac.bill_id,
                  SUM(payFac.check_amount) AS check_amount
              FROM
                  payment_fact payFac
              WHERE
              payFac.deleted_at IS NULL AND recipient_id IS NOT NULL AND bill_id IS NOT NULL AND invoice_id IS NULL
              GROUP BY
              payFac.bill_id
            ) payFac ON bilFac.bill_id = payFac.bill_id
          LEFT JOIN (
                SELECT
                  inv.invoice_id,
                  inv.bills,
                  inv.invoice_from_facility_location_ids::integer AS facility_location_ids,
                  inv.invoice_from_facility_id AS facility_id,
                  inv.deleted_at,
                  inv.invoice_category,
                  inv.invoice_to_locations
                FROM invoices_dim inv
                WHERE inv.bills IS NOT NULL AND inv.deleted_at IS NULL 
                  ) inv ON inv.bills @> to_jsonb(bilFac.bill_id)
          LEFT JOIN (
                SELECT
              payFacInv.invoice_id,
              payFacInv.bill_id,
              SUM(payFacInv.check_amount) AS check_amount
                FROM
                  payment_fact payFacInv
                WHERE
                  payFacInv.deleted_at IS NULL  AND recipient_id is not null AND invoice_id IS NOT NULL
                GROUP BY
                  payFacInv.bill_id,payFacInv.invoice_id
            ) payFacInv ON payFacInv.invoice_id = inv.invoice_id

        LEFT JOIN facility_location_dim facLocDim ON COALESCE(inv.facility_location_ids::integer, bilFac.facility_location_id) = facLocDim.facility_location_id
        AND facLocDim.deleted_at IS NULL AND facLocDim.facility_location_name is NOT NULL
        LEFT JOIN facilities_dim facDim ON COALESCE(inv.facility_id, facLocDim.facility_id) = facDim.facility_id AND facDim.deleted_at IS NULL

        where ${billCurTime} ${whereClause}
        AND facLocDim.facility_location_name IS NOT NULL 
        AND facLocDim.facility_location_id NOT IN ('33','34','35','38','41','43','11','46','48','49','77','92','99')
        GROUP BY facLocDim.facility_location_qualifier, facLocDim.facility_location_name,facDim.facility_qualifier,facDim.facility_id,facLocDim.facility_location_id
        )
          SELECT 
            DATAH.facility_id,
            DATAH.facility_location_id,
            SUM(DATAH.revenueInv) + SUM(DATAH.revenueR)  AS revenue,
            DATAH.billed_amount AS billed_amount,
            DATAH.facility_location_name,
            DATAH.facility_location_qualifier,
            DATAH.facility_qualifier
          FROM DATAH
          GROUP BY DATAH.facility_id,DATAH.facility_location_id,DATAH.billed_amount,
          DATAH.facility_location_name,DATAH.facility_location_qualifier, DATAH.facility_qualifier,DATAH.revenueInv,DATAH.revenueR
          ORDER BY revenue DESC
      `;

      //  MAX(payFacInv.deleted_at) AS maxInv_deleted_at,
      // Execute the SQL query and retrieve data
      const info: object[] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
      return info;

    } catch (error) {
      // Handle errors and return an error message
      throw error;
    }
  }
  // #region Sum of Amounts by Case Type

  public getSumOfAmounts = async (reqData: typings.GenericReqObjI): Promise<object> => {
    try {
      // Destructure the input data
      const {
        speciality_ids,
        case_type_ids,
        provider_ids,
        facility_location_ids,
        recipient_id,
        fromDate,
        toDate,
        time_span_id,
        month_id
      }: GlobalFiltersRequest["user"] = reqData;


      // Start with a default WHERE clause
      let whereClause: string = `bilFac.deleted_at IS NULL AND bilFac.case_type_id IS NOT NULL 
      AND bilFac.speciality_id IS NOT NULL
      AND bilFac.facility_location_id IS NOT NULL AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13) ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}`;
      let billRecClause: string = ``;
      let InvoiceRecClause: string = ``;
      let leftClause: string = `LEFT`;

      // If speciality_ids are provided, filter by them
      // bilRecDim.bill_recipient_type_id = 1
      if (recipient_id) {
        leftClause = ``
        billRecClause = `AND bill_recipient_type_id::integer IN (${recipient_id})`;
        InvoiceRecClause = `AND jsonb_path_exists(invoice_to_locations, '$.* ? (@.invoice_to_label == "${InvoiceRecipients(recipient_id)}")')`
      }
      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND bilFac.speciality_id IN (${speciality_ids})`;
      }
      // If provider_ids are provided, filter by them
      if (provider_ids && provider_ids.length > 0) {
        whereClause += ` AND bilFac.doctor_id IN (${provider_ids})`;
      }

      // If facility_location_ids are provided, filter by them
      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND bilFac.facility_location_id IN (${facility_location_ids})`;
      }
      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND bilFac.case_type_id IN (${case_type_ids}) `;
      }
      if (month_id) {
        const year: number = (new Date).getFullYear();
        whereClause += ` AND EXTRACT('month' from bilFac.bill_date) = ${month_id} 
                          AND EXTRACT('year' from bilFac.bill_date)= ${year}`; // Fetch data of the selected month
      }
      if (fromDate && toDate) {
        whereClause += ` AND bilFac.bill_date >= '${fromDate}' AND bilFac.bill_date <= '${toDate}'`;
      }
      if (time_span_id) {
        let interval: string = '';
        const currentDate: Date = new Date();
        const firstDayOfMonth: Date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const daysDifference: number = Math.floor((currentDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));

        const timeSpanMappings: timeSpanMappings = {
          1: '1 week',
          2: '1 month',
          3: '6 months',
          4: '1 year',
          5: `${daysDifference} days`,
          default: '1 week',
        };
        interval = timeSpanMappings[time_span_id] || timeSpanMappings.default;
        whereClause += ` AND bilFac.bill_date >= current_date - interval '${interval}'
                        AND bilFac.bill_date <= current_date`;
      }

      //     SELECT
      //     SUM(bilFac.outstanding_amount) AS Total_Outstanding_Amount,
      // (current_date - bilFac.bill_date + 1) AS date_difference
      //   FROM
      //   ${whereClause} bills_fact_new bilFac
      //   LEFT JOIN case_types_dim casTypDim ON casTypDim.case_type_id = bilFac.case_type_id
      //   JOIN bills_recipient_dim bilRecDim ON bilRecDim.bill_id = bilFac.bill_id
      //   WHERE
      //      AND bilRecDim.deleted_at IS NULL
      //   GROUP BY
      //      date_difference
      //   ORDER BY
      //      date_difference;

      // Construct the SQL query
      const sqlQuery: string = `
        SELECT
          COALESCE(SUM(CASE WHEN inv.invoice_id IS NULL THEN bilFac.outstanding_amount ELSE 0 END), 0) AS Total_Bill_Outstanding_Amount,
          COALESCE(SUM(inv.outstanding_amount), 0) AS Total_Invoice_Outstanding_Amount,
          (current_date - bilFac.bill_date + 1) AS date_difference
        FROM
          bills_fact_new bilFac
        ${recipient_id != 5 ? `${leftClause} JOIN ( SELECT bill_id FROM bills_recipient_dim WHERE deleted_at IS NULL ${billRecClause} GROUP BY bill_id ) bilRecDim ON bilRecDim.bill_id = bilFac.bill_id` : ''}
        LEFT JOIN (
          SELECT 
            inv.invoice_id,
            inv.outstanding_amount,
            inv.bills
          FROM invoices_dim inv
          WHERE inv.deleted_at IS NULL AND inv.bills is not null  ${InvoiceRecClause} 
                ) inv ON inv.bills @> to_jsonb(bilFac.bill_id) 
        WHERE ${whereClause}
        GROUP BY
          date_difference
        ORDER BY
          date_difference
      `;
      // Execute the SQL query and get the results

      const results: object = await sequelize.query(sqlQuery);

      const obj: object = { "0-30": { bill: 0, invoice: 0 }, "31-60": { bill: 0, invoice: 0 }, "61-90": { bill: 0, invoice: 0 }, "91-120": { bill: 0, invoice: 0 }, "121-150": { bill: 0, invoice: 0 }, "151-180": { bill: 0, invoice: 0 }, "181-210": { bill: 0, invoice: 0 }, "211-240": { bill: 0, invoice: 0 }, "241-270": { bill: 0, invoice: 0 }, "270+": { bill: 0, invoice: 0 } };
      const ranges = [
        { range: '0-30', min: 0, max: 30 },
        { range: '31-60', min: 31, max: 60 },
        { range: '61-90', min: 61, max: 90 },
        { range: '91-120', min: 91, max: 120 },
        { range: '121-150', min: 121, max: 150 },
        { range: '151-180', min: 151, max: 180 },
        { range: '181-210', min: 181, max: 210 },
        { range: '211-240', min: 211, max: 240 },
        { range: '241-270', min: 241, max: 270 },
        { range: '270+', min: 271, max: 3000 },
      ];
      if (Array.isArray(results[0])) {
        results[0].forEach((item: any) => {
          for (const { range, min, max } of ranges) {
            if (item.date_difference >= min && item.date_difference <= max) {
              obj[range] = { bill: (Number(obj[range]['bill']) + Number(item.total_bill_outstanding_amount)), invoice: (Number(obj[range]['invoice']) + Number(item.total_invoice_outstanding_amount)) };
              break; // Break the loop once the range is found
            }
          }
        });

        // Now obj contains the accumulated values based on the specified ranges

        // Return the results

        return obj;
      } else {
        throw new Error("Invalid structure");
      }
    } catch (error) {
      throw error;
    }



  }
  // #End region

  // #region Claims overview

  public getClaimsOverview = async (reqData: typings.GenericReqObjI): Promise<object> => {
    try {
      // Destructure the input data
      const {
        time_span_id,
        month_id,
        speciality_ids,
        provider_ids,
        facility_location_ids,
        recipient_id,
        case_type_ids,
        fromDate,
        toDate
      }: GlobalFiltersRequest["user"] = reqData;

      // Start with a default WHERE clause
      let whereClause: string = `bilFac.deleted_at IS NULL AND bilFac.case_type_id IS NOT NULL 
      AND bilFac.speciality_id IS NOT NULL
      AND bilFac.facility_location_id IS NOT NULL AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13) ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')} `;
      let leftClause: string = `LEFT`;
      let billRecClause: string = ``;
      let InvoiceRecClause: string = ``;

      if (recipient_id) {
        leftClause = ``
        billRecClause = `AND bill_recipient_type_id IN (${recipient_id})`;
        InvoiceRecClause = `AND jsonb_path_exists(invoice_to_locations, '$.* ? (@.invoice_to_label == "${InvoiceRecipients(recipient_id)}")')`
      }
      // If speciality_ids are provided, filter by them

      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND bilFac.speciality_id IN (${speciality_ids})`;
      }
      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND bilFac.case_type_id IN (${case_type_ids}) `;
      }
      // If month_id is provided, filter by the specified month
      if (month_id) {
        const year: number = (new Date).getFullYear();
        const create_startDate: Date = new Date(year, month_id - 1, 1);
        const create_endDate: Date = new Date(year, month_id - 1, 1);
        create_endDate.setMonth(create_startDate.getMonth() + 1);
        create_endDate.setDate(create_endDate.getDate() - 1);
        const startDate: string = create_startDate.toISOString().split('T')[0];
        const endDate: string = create_endDate.toISOString().split('T')[0];
        // whereClause += ` AND bilFac.bill_date >= '${startDate}'::DATE AND bilFac.bill_date <= '${endDate}'::DATE `;

        whereClause += ` AND EXTRACT('month' from bilFac.bill_date) = ${month_id} 
                          AND EXTRACT('year' from bilFac.bill_date)= ${year}`; // Fetch data of the selected month
      }

      // If provider_ids are provided, filter by them
      if (provider_ids && provider_ids.length > 0) {
        whereClause += ` AND bilFac.doctor_id IN (${provider_ids})`;
      }

      // If facility_location_ids are provided, filter by them
      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND bilFac.facility_location_id IN (${facility_location_ids})`;
      }

      // If fromDate and toDate are provided, filter by date range
      if (fromDate && toDate) {
        whereClause += ` AND bill_date >= '${fromDate}' AND bill_date <= '${toDate}' `;
      }

      if (time_span_id) {
        const timeMappings: timeSpanMappings = {
          1: '1 week',
          2: '1 month',
          3: '6 months',
          4: '1 year',
          5: (() => {
            const currentDate: Date = new Date();
            const firstDayOfMonth: Date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const daysDifference: number = Math.floor((currentDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
            return `${daysDifference} days`;
          })(),
          default: '1 week',
        };

        const interval = timeMappings[time_span_id] || timeMappings.default;

        // Filter by the calculated interval
        whereClause += ` AND bill_date >= current_date - interval '${interval}' AND bill_date <= current_date`;
      }
      // Construct the SQL query
      const sqlQuery: string = `
      WITH Claims AS (
        SELECT
        SUM(CASE WHEN bill_status_id = ${BillStatus.Billed} AND packet_created_count = 0 AND pom_generate_count = 0 AND pom_received_count = 0 AND verification_sent_count = 0 AND verification_received_count = 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL  THEN bilFac.bill_amount ELSE 0 END) AS Billed,
        COUNT(CASE WHEN bill_status_id = ${BillStatus.Billed} AND packet_created_count =  0 AND pom_generate_count = 0 AND pom_received_count = 0 AND verification_sent_count = 0 AND verification_received_count = 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL  THEN 1 ELSE NULL END) AS Billed_Count,
        SUM(CASE WHEN (packet_created_count > 0 OR bill_status_id = ${BillStatus.PacketCreated} ) AND pom_generate_count = 0 AND pom_received_count = 0 AND verification_sent_count = 0 AND verification_received_count = 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN bilFac.bill_amount ELSE 0 END) AS Packet_Created,
        COUNT(CASE WHEN (packet_created_count > 0 OR bill_status_id = ${BillStatus.PacketCreated} ) AND pom_generate_count = 0 AND pom_received_count = 0 AND verification_sent_count = 0 AND verification_received_count = 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN 1 ELSE NULL END) AS Packet_Created_Count,
        SUM(CASE WHEN (pom_generate_count > 0 OR (bill_status_id = ${BillStatus.PomGenerated}  AND packet_created_count = 0)) AND pom_received_count = 0 AND verification_sent_count = 0 AND verification_received_count = 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN bilFac.bill_amount ELSE 0 END) AS POM_Generated,
        COUNT(CASE WHEN (pom_generate_count > 0 OR (bill_status_id = ${BillStatus.PomGenerated}  AND packet_created_count = 0))  AND pom_received_count = 0 AND verification_sent_count = 0 AND verification_received_count = 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN 1 ELSE NULL END) AS POM_Generated_Count,
        SUM(CASE WHEN pom_received_count > 0 AND verification_received_count = 0 AND verification_sent_count = 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN bilFac.bill_amount ELSE 0 END) AS POM_Received,
        COUNT(CASE WHEN pom_received_count > 0 AND verification_received_count = 0 AND verification_sent_count = 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN 1 ELSE NULL END) AS POM_Received_Count,
        SUM(CASE WHEN verification_received_count > 0 AND verification_sent_count = 0 AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN bilFac.bill_amount ELSE 0 END) AS Verification_Sent,
        COUNT(CASE WHEN verification_received_count > 0 AND verification_sent_count = 0 AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN 1 ELSE NULL END) AS Verification_Sent_Count,
        SUM(CASE WHEN verification_sent_count > 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN bilFac.bill_amount ELSE 0 END) AS Verification_Received,
        COUNT(CASE WHEN verification_sent_count > 0 AND denial_status_id IS NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN 1 ELSE NULL END) AS Verification_Received_Count,
        SUM(CASE WHEN denial_status_id IS NOT NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN bilFac.bill_amount ELSE 0 END) AS Denied,
        COUNT(CASE WHEN denial_status_id IS NOT NULL AND COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) IS NULL THEN 1 ELSE NULL END) AS Denied_Count,
        SUM(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 1 THEN bilFac.bill_amount ELSE 0 END) AS Partially_Paid,
        COUNT(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 1 THEN 1 ELSE NULL END) AS Partially_Paid_Count,
        SUM(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 2 THEN bilFac.bill_amount ELSE 0 END) AS Fully_Paid,
        COUNT(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 2 THEN 1 ELSE NULL END) AS Fully_Paid_Count,
        SUM(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 3 THEN bilFac.bill_amount ELSE 0 END) AS Paid_Per_Fee,
        COUNT(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 3 THEN 1 ELSE NULL END) AS Paid_Per_Fee_Count,
        SUM(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 4 THEN bilFac.bill_amount ELSE 0 END) AS Paid_Per_Pro,
        COUNT(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 4 THEN 1 ELSE NULL END) AS Paid_Per_Pro_Count,
        SUM(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 6 THEN bilFac.bill_amount ELSE 0 END) AS Pending,
        COUNT(CASE WHEN COALESCE(inv.invoice_payment_status_id, bilFac.payment_status_id) = 6 THEN 1 ELSE NULL END) AS Pending_Count,
        SUM(COALESCE(inv.write_off_amount, bilFac.write_off_amount)) AS Write_Off,
        COUNT(CASE WHEN COALESCE(inv.write_off_amount, bilFac.write_off_amount) > 0 THEN 1 ELSE NULL END) AS Write_Off_Count,
        SUM(COALESCE(inv.over_amount, bilFac.over_payment)) AS over_payment,
        COUNT(CASE WHEN COALESCE(inv.over_amount, bilFac.over_payment) > 0 THEN 1 ELSE NULL END) AS over_payment_Count,
        SUM(COALESCE(inv.interest_amount, bilFac.interest_amount)) AS interest,
        COUNT(CASE WHEN COALESCE(inv.interest_amount, bilFac.interest_amount) > 0 THEN 1 ELSE NULL END) AS interest_Count
		  	  
      FROM
            bills_fact_new bilFac
      ${recipient_id != 5 ? `${leftClause} JOIN ( SELECT bill_id FROM bills_recipient_dim WHERE deleted_at IS NULL ${billRecClause} GROUP BY bill_id ) bilRecDim ON bilRecDim.bill_id = bilFac.bill_id` : ''}
	    LEFT JOIN (
            SELECT 
              inv.write_off_amount,
              inv.invoice_amount,
              inv.over_amount,
              inv.interest_amount,
              inv.invoice_payment_status_id,
              inv.bills,
              inv.deleted_at,
              inv.invoice_category,
              inv.invoice_to_locations
            FROM invoices_dim inv
            WHERE inv.bills IS NOT NULL AND inv.deleted_at IS NULL  
          ) inv ON inv.bills @> to_jsonb(bilFac.bill_id)  
		AND inv.deleted_at IS NULL   
		${InvoiceRecClause} 
		WHERE  ${whereClause}
    ), total AS(
      SELECT
        SUM(bilFac.bill_amount) AS Total_billed_Amount
      FROM 
        bills_fact_new bilFac
       ),
       current_total AS(
       SELECT
        SUM(bilFac.bill_amount) AS Total_Billed,
        COUNT(bilFac.bill_amount) AS Total_Billed_Count
      FROM 
        bills_fact_new bilFac
       ${leftClause} JOIN (
          SELECT
            bill_id,
            MAX(deleted_at) AS max_deleted_at
          FROM
            bills_recipient_dim
          WHERE
            deleted_at IS NULL ${billRecClause}
          GROUP BY
            bill_id
        ) bilRecDim ON bilRecDim.bill_id = bilFac.bill_id
        WHERE  ${whereClause}
       )
    SELECT
      Billed,Billed_Count,Packet_Created,Packet_Created_Count,POM_Generated,POM_Generated_Count,POM_Received,POM_Received_Count,Verification_Sent,Verification_Sent_Count,Verification_Received,Verification_Received_Count,
      Partially_Paid,Partially_Paid_Count,Fully_Paid,Fully_Paid_Count,Paid_Per_Fee,Paid_Per_Fee_Count,Paid_Per_Pro,Paid_Per_Pro_Count,Pending,Pending_Count,Write_Off, Write_Off_Count,Total_Billed,Total_Billed_Count,Total_billed_Amount,Denied,Denied_Count,over_payment,interest,
      over_payment_Count,interest_Count
        
    FROM Claims,total,current_total
              `;

      const results: object = await sequelize.query(sqlQuery);
      if (results[0]) {
        const obj = {
          total_amount: results[0][0]['total_billed_amount'],
          billed_amount: results[0][0]['total_billed'],
          Claims: []
        };

        const claimStatuses = ['Billed', 'Packet Created', 'POM Generated', 'POM Received', 'Verification Sent', 'Verification Received', 'Denied', 'Partially Paid', 'Fully Paid', 'Paid Per Fee', 'Paid Per Pro', 'Pending', 'Over Payment', 'Interest', 'Write Off'];

        obj.Claims = claimStatuses.map((status) => {
          const key: string = status.toLowerCase().replace(/\s/g, '_');
          const noOfClaims: number = results[0][0][`${key}_count`];
          const amountOfClaim: number = results[0][0][key];
          const percent: string = ((amountOfClaim / obj.billed_amount) * 100).toFixed(2);
          return {
            claimStatus: status,
            noOfClaims: noOfClaims,
            amountOfClaim: amountOfClaim ? amountOfClaim : 0,
            percentage: isNaN(parseFloat(percent)) ? '0.00' : percent
          };
        });
        const paidPercent: number = Number((((Number(results[0][0]['fully_paid']) + Number(results[0][0]['partially_paid']) - Number(results[0][0]['write_off']) + Number(results[0][0]['over_payment'])) / obj.billed_amount) * 100).toFixed(2));
        obj['paidPercentage'] = isNaN(paidPercent) ? 0 : paidPercent;
        // Return the results

        return obj;
      } else {
        throw new Error("Invalid structure");
      }
    } catch (error) {
      throw error;
    }
  }

  // #End regionF
  //#region Billed_amount vs payment_amount for admin
  public getbilledpayments = async (reqData: typings.GenericReqObjI) => {
    try {
      const {
        recipient_id,
        case_type_ids,
        time_span_id,
        month_id,
        speciality_ids,
        provider_ids,
        facility_location_ids,
        fromDate,
        toDate,
        granularity_type_id,
      }: GlobalFiltersRequest["user"] = reqData;
      let whereClause: string = `bilFac.deleted_at IS NULL AND bilFac.case_type_id IS NOT NULL 
      AND bilFac.speciality_id IS NOT NULL
      AND bilFac.facility_location_id IS NOT NULL AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13) ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}`;
      let selectClause: string = `DATE(bilFac.bill_date) AS BILL_date`;
      let groupbyClause: string = `BILL_date`
      let billRecClause: string = ``;
      let InvoiceRecClause: string = ``;
      let leftClause: string = `LEFT`;

      if (recipient_id) {
        leftClause = ``
        billRecClause = `AND bill_recipient_type_id::integer IN (${recipient_id})`;
        InvoiceRecClause = `AND jsonb_path_exists(invoice_to_locations, '$.* ? (@.invoice_to_label == "${InvoiceRecipients(recipient_id)}")')`

      }

      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND bilFac.speciality_id IN (${speciality_ids})`;
      }
      if (month_id) {
        const year: number = (new Date).getFullYear();
        // ({ billCurTime, billPreTime } = this.monthId(month_id));
        whereClause += `AND EXTRACT('month' from bilFac.bill_date) = ${month_id}
      AND EXTRACT('year' from bilFac.bill_date)= ${year}`; // fetches data of selected month
        selectClause = `DATE(DATE_TRUNC('week',bilFac.bill_date)) AS BILL_date`
        groupbyClause = `DATE(DATE_TRUNC('week', BILL_date))`
      }
      if (provider_ids && provider_ids.length > 0) {
        whereClause += ` AND bilFac.doctor_id IN (${provider_ids})`;
      }

      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND bilFac.case_type_id IN (${case_type_ids})`;
      }

      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND bilFac.facility_location_id IN (${facility_location_ids})`;
      }
      if (fromDate && toDate) {
        whereClause += ` AND bilFac.bill_date >= '${fromDate}' AND bilFac.bill_date <= '${toDate} '`;
      }
      if (time_span_id) {
        let interval: string = '';
        switch (time_span_id) {
          case 1:
            interval = '1 week';
            break;
          case 2:
            interval = '1 month';
            selectClause = `DATE(DATE_TRUNC('week',bilFac.bill_date)) AS BILL_date`
            groupbyClause = `DATE(DATE_TRUNC('week', BILL_date))`
            break;
          case 3:
            interval = '6 months';
            selectClause = `DATE(DATE_TRUNC('month',bilFac.bill_date)) AS BILL_date`
            groupbyClause = `DATE(DATE_TRUNC('month', BILL_date))`
            break;
          case 4:
            interval = '1 year';
            selectClause = `DATE(DATE_TRUNC('month',bilFac.bill_date)) AS BILL_date`
            groupbyClause = `DATE(DATE_TRUNC('month', BILL_date))`
            break;
          case 5:
            const currentDate: Date = new Date();
            const firstDayOfMonth: Date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const daysDifference: number = Math.floor((currentDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
            interval = `${daysDifference} days`; // extracts days from start of month to cuurent date
            selectClause = `DATE(DATE_TRUNC('week',bilFac.bill_date)) AS BILL_date`
            groupbyClause = `DATE(DATE_TRUNC('week', BILL_date))`
            break;
          default:
            interval = '1 week';
        }
        whereClause += ` AND bilFac.bill_date >= current_date - interval '${interval}'
                AND bilFac.bill_date <= current_date`;
      }
      if (granularity_type_id) {
        switch (granularity_type_id) {

          case 1:
            selectClause = `DATE(bilFac.bill_date) AS BILL_date`;
            groupbyClause = `DATE(BILL_date)`;
            break;
          case 2:
            selectClause = `DATE(DATE_TRUNC('week',bilFac.bill_date)) AS BILL_date`;
            groupbyClause = `DATE(DATE_TRUNC('week', BILL_date)) `;
            break;
          case 3:
            selectClause = `DATE(DATE_TRUNC('month',bilFac.bill_date)) AS BILL_date`;
            groupbyClause = `DATE(DATE_TRUNC('month', BILL_date)) `;
            break;
          case 4:
            selectClause = `DATE(DATE_TRUNC('year',bilFac.bill_date)) AS BILL_date`;
            groupbyClause = `DATE(DATE_TRUNC('year', BILL_date))`;
            break;
          default:
            selectClause = `DATE(bilFac.bill_date) AS BILL_date`;
            groupbyClause = `DATE(BILL_date)`;

        }
      }
      const payment_detail_query: string = `
      WITH bills AS (
        SELECT DISTINCT
          bilFac.bill_id,
          ${selectClause},
          bilFac.bill_amount AS Billed_Amount,
          COALESCE(SUM(payFac.check_amount), 0.00) AS payment_Received,
          COALESCE(SUM(inv.invoice_amount), 0.00) AS invoice_amount,
          COALESCE(SUM(payFacInv.check_amount), 0.00) AS invoice_payment_Received
        FROM
          bills_fact_new bilFac
      ${recipient_id != 5 ? `${leftClause} JOIN ( SELECT bill_id FROM bills_recipient_dim WHERE deleted_at IS NULL ${billRecClause} GROUP BY bill_id ) bilRecDim ON bilRecDim.bill_id = bilFac.bill_id` : ''}
          LEFT JOIN (
              SELECT
                 payFac.bill_id,
              	SUM(payFac.check_amount) AS check_amount
              FROM
                  payment_fact payFac
              WHERE
              payFac.deleted_at IS NULL AND recipient_id IS NOT NULL AND invoice_id IS NULL
              GROUP BY
              payFac.bill_id
            ) payFac ON bilFac.bill_id = payFac.bill_id
           LEFT JOIN (
                SELECT
                  inv.invoice_id,
			   inv.invoice_amount,
			   inv.bills
                FROM invoices_dim inv
                WHERE inv.bills IS NOT NULL AND inv.deleted_at IS NULL
			   ${InvoiceRecClause}
                  ) inv ON inv.bills @> to_jsonb(bilFac.bill_id)
          LEFT JOIN (
                SELECT
              payFacInv.invoice_id,
			  SUM(payFacInv.check_amount) AS check_amount
                FROM
                  payment_fact payFacInv
                WHERE
                  payFacInv.deleted_at IS NULL  AND recipient_id is not null AND invoice_id IS NOT NULL
                GROUP BY
                  payFacInv.invoice_id
            ) payFacInv ON payFacInv.invoice_id = inv.invoice_id

          WHERE ${whereClause}
          GROUP BY
              ${groupbyClause},bilFac.bill_id,Billed_Amount
      )
      SELECT 
        ${groupbyClause} AS BILL_date, 
        SUM(Billed_Amount) AS Original_Billed_Amount, 
        SUM(payment_Received) AS payment_Received,
        SUM(payment_Received) + SUM(invoice_payment_Received) AS total_payment_Received,
        SUM(invoice_payment_Received) AS invoice_payment_Received,
        SUM(invoice_amount) AS invoice_amount,
        SUM(Billed_Amount) - SUM(invoice_amount) AS Billed_Amount
      FROM bills
      GROUP BY
      ${groupbyClause}
      ORDER BY 
      ${groupbyClause};`
      const days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; // Labels for days
      const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // Labels for months

      const output: object = await sequelize.query(payment_detail_query);
      let isFirstDate: Boolean = true;
      if (Array.isArray(output[0])) {
        output[0].forEach(function (value: any) {
          let dateLabel = value.bill_date;
          if (time_span_id) {
            const day: Date = new Date(value.bill_date);
            let dateLabel: string;
            const timeSpanMappings: timeSpanMappings = {
              1: days[day.getDay()],
              2: value.bill_date,
              3: months[day.getMonth()],
              4: months[day.getMonth()],
              5: value.bill_date,
              default: days[day.getDay()],
            };
            dateLabel = timeSpanMappings[time_span_id] || timeSpanMappings.default;
            value.bill_date = dateLabel;
          }
          if (month_id && isFirstDate) {
            const year: number = (new Date(value.bill_date)).getFullYear();
            const adjustedDate: string = `${year}-${month_id < 10 ? '0' + month_id : month_id}-01`
            value.bill_date = adjustedDate;
            isFirstDate = false;
          }
          if (granularity_type_id) {

            const yearDate: number = new Date(value.bill_date).getFullYear();
            const year: number = (new Date(value.bill_date)).getFullYear();
            const billDate: Date = new Date(value.bill_date)
            if (granularity_type_id == 2 && isFirstDate) {
              const date: Date = new Date(fromDate);
              const adjustedDate: string = date.toISOString().split('T')[0];
              dateLabel = adjustedDate;
              isFirstDate = false;
            } else {
              const granularityMappings: timeSpanMappings = {
                2: value.bill_date,
                3: `${months[new Date(value.bill_date).getMonth()]} ${yearDate}`,
                4: year,
              };

              dateLabel = granularityMappings[granularity_type_id] || dateLabel;
            }
            value.bill_date = dateLabel
          }


        });
        return output[0]
      } else {
        throw new Error("Invalid structure");
      }

    } catch (error) {

      throw error
    }
  }

  //#region Highest Payers
  public getHigherPayerTypeService = async (reqData: typings.GenericReqObjI): Promise<object> => {
    try {
      let pushANDConditions: string[] = [`bilFac.deleted_at IS NULL AND bilFac.case_type_id IS NOT NULL 
    AND bilFac.speciality_id IS NOT NULL
    AND bilFac.facility_location_id IS NOT NULL AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13) ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}`];
      const oneWeek: string = `COALESCE(payFacInv.check_date >=(CURRENT_DATE - INTERVAL '1 week') AND payFacInv.check_date <= CURRENT_DATE ,payFac.check_date >=(CURRENT_DATE - INTERVAL '1 week') AND payFac.check_date <= CURRENT_DATE)`;
      const oneMonth: string = `COALESCE((payFacInv.check_date >= CURRENT_DATE - INTERVAL '1 month') AND payFacInv.check_date <= CURRENT_DATE ,(payFac.check_date >= CURRENT_DATE - INTERVAL '1 month') AND payFac.check_date <= CURRENT_DATE)`;
      const sixMonths: string = `COALESCE((CURRENT_DATE - INTERVAL '6 months' <= payFacInv.check_date) AND payFacInv.check_date <= CURRENT_DATE ,(CURRENT_DATE - INTERVAL '6 months' <= payFac.check_date) AND payFac.check_date <= CURRENT_DATE)`;
      const oneYear: string = `COALESCE((CURRENT_DATE - INTERVAL '1 year') <= payFacInv.check_date AND payFacInv.check_date <= CURRENT_DATE ,(CURRENT_DATE - INTERVAL '1 year') <= payFac.check_date AND payFac.check_date <= CURRENT_DATE)`;
      const MTD: string = `COALESCE((payFacInv.check_date >= DATE_TRUNC('month', CURRENT_DATE) AND payFacInv.check_date <= CURRENT_DATE) ,(payFac.check_date >= DATE_TRUNC('month', CURRENT_DATE) AND payFac.check_date <= CURRENT_DATE)`;
      const specificMonth: string = `COALESCE(EXTRACT(YEAR FROM payFacInv.check_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM payFacInv.check_date) = , EXTRACT(YEAR FROM payFac.check_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM payFac.check_date) = )`;
      const {
        time_span_id,
        month_id,
        speciality_ids,
        provider_ids,
        facility_location_ids,
        case_type_ids,
        fromDate,
        recipient_id,
        toDate,
      }: GlobalFiltersRequest["user"] = reqData;

      let payerName: string = '';
      let payerJoin: string = '';
      let payerGroupBy: string = '';
      let payerRecipientType: number;
      let invoiceRecipientType: string = '';
      //   Update pushAndCondition based on time_span_id enums { 1, 2, 3, 4, 5}
      if (time_span_id) {
        const timeSpanMappings: timeSpanMappings = {
          1: oneWeek,
          2: oneMonth,
          3: sixMonths,
          4: oneYear,
          5: MTD,
        };

        const condition = timeSpanMappings[time_span_id];
        if (condition) {
          pushANDConditions.push(`${condition}`);
        }
      }

      ///////   request object with month_id enums { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
      if (month_id && (month_id != 0)) {
        pushANDConditions.push(`COALESCE(EXTRACT(YEAR FROM payFacInv.check_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM payFacInv.check_date) = ${month_id}, EXTRACT(YEAR FROM payFac.check_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM payFac.check_date) = ${month_id} )`);
      }

      ///////   request object with speciality_ids array of integers
      if (speciality_ids && speciality_ids.length > 0) {
        pushANDConditions.push(`bilFac.speciality_id IN (${speciality_ids})`);
      }

      ///////   request object with provider_ids array of integers
      if (provider_ids && provider_ids.length > 0) {
        pushANDConditions.push(`bilFac.doctor_id::integer IN (${provider_ids})`);
      }

      ///////   request object with facility_location_ids array of integers
      if (facility_location_ids && facility_location_ids.length > 0) {
        pushANDConditions.push(`bilFac.facility_location_id::integer IN (${facility_location_ids})`);
      }

      ///////   request object with case_type_ids array of integers
      if (case_type_ids && case_type_ids.length > 0) {
        pushANDConditions.push(`bilFac.case_type_id IN (${case_type_ids})`);
      }

      ///////   request object with fromDate for starting date of fetching data
      if (fromDate) {
        pushANDConditions.push(`COALESCE(payFacInv.check_date>= '${fromDate}',payFac.check_date>= '${fromDate}')`);
      }
      ///////   request object with toDate for ending date of fetching data
      if (toDate) {
        pushANDConditions.push(`COALESCE(payFacInv.check_date <='${toDate}', payFac.check_date <='${toDate}')`);
      }

      switch (recipient_id) {
        case PayerRecepientType.Patient:
          payerRecipientType = PayerRecepientType.Patient;
          invoiceRecipientType = PayerRecepientType.InvPatient;
          payerName = `COALESCE((patInv.first_name || ' ' || COALESCE(patInv.middle_name || ' ', '') || patInv.last_name ), (pat.first_name || ' ' || COALESCE(pat.middle_name || ' ', '') || pat.last_name) ) AS name`;
          payerJoin = `
            LEFT JOIN patient_dim pat ON payFac.recipient_id =pat.patient_id AND pat.deleted_at IS NULL
            LEFT JOIN patient_dim patInv ON payFacInv.recipient_id =patInv.patient_id AND patInv.deleted_at IS NULL`;
          payerGroupBy = `patInv.first_name,pat.first_name, patInv.middle_name,pat.middle_name,patInv.last_name,pat.last_name`;
          break;
        case PayerRecepientType.Employer:
          payerRecipientType = PayerRecepientType.Employer;
          invoiceRecipientType = PayerRecepientType.InvEmployer;
          payerName = `COALESCE(empInv.employer_name, emp.employer_name) AS name`;
          payerJoin = `
            LEFT JOIN employer_dim emp ON payFac.recipient_id =emp.employer_id AND emp.deleted_at IS NULL
            LEFT JOIN employer_dim empInv ON payFacInv.recipient_id =empInv.employer_id AND empInv.deleted_at IS NULL`;
          payerGroupBy = `empInv.employer_name, emp.employer_name`;
          break;
        case PayerRecepientType.Insurance:
          payerRecipientType = PayerRecepientType.Insurance;
          invoiceRecipientType = PayerRecepientType.InvInsurance;
          payerName = `COALESCE(insInv.insurance_name, ins.insurance_name) AS name`;
          payerJoin = `
            LEFT JOIN insurance_dim ins ON payFac.recipient_id =ins.insurance_id AND ins.deleted_at IS NULL
            LEFT JOIN insurance_dim insInv ON payFacInv.recipient_id =insInv.insurance_id AND insInv.deleted_at IS NULL`;
          payerGroupBy = `insInv.insurance_name , ins.insurance_name`;
          break;
        case PayerRecepientType.LawFirm:
          payerRecipientType = PayerRecepientType.LawFirm;
          invoiceRecipientType = PayerRecepientType.InvLawFirm;
          payerName = `COALESCE(firmsInv.firm_name, firms.firm_name) AS name`;
          payerJoin = `
            LEFT JOIN firms_dim firms ON payFac.recipient_id = firms.firm_id AND firms.deleted_at IS NULL
            LEFT JOIN firms_dim firmsInv ON payFacInv.recipient_id = firmsInv.firm_id AND firmsInv.deleted_at IS NULL`;
          payerGroupBy = `firmsInv.firm_name, firms.firm_name`;
          break;

        default:
          payerRecipientType = PayerRecepientType.Insurance;
          invoiceRecipientType = PayerRecepientType.InvInsurance;
          payerName = `COALESCE(insInv.insurance_name, ins.insurance_name) AS name`;
          payerJoin = `
            LEFT JOIN insurance_dim ins ON payFac.recipient_id =ins.insurance_id AND ins.deleted_at IS NULL
            LEFT JOIN insurance_dim insInv ON payFacInv.recipient_id =insInv.insurance_id AND insInv.deleted_at IS NULL`;
          payerGroupBy = `insInv.insurance_name , ins.insurance_name`;
          break;
      }
      ///////   Query
      let query: string = `
        SELECT
        ${payerName},
        COALESCE(payFacInv.recipient_id,payFac.recipient_id) AS id,
        COUNT(DISTINCT payFac.bill_id) AS bills_count,
		    SUM(COALESCE(payFacInv.check_amount,payFac.check_amount)) AS paid_amount
        from
        bills_fact_new bilFac
          LEFT JOIN  payment_fact payFac ON bilFac.bill_id = payFac.bill_id AND payFac.deleted_at IS NULL AND payFac.recipient_id IS NOT NULL AND payFac.bill_id IS NOT NULL AND payFac.invoice_id is null
            AND payFac.payment_by_id = ${payerRecipientType}
          LEFT JOIN invoices_dim inv ON inv.bills @> to_jsonb(bilFac.bill_id) AND inv.bills IS NOT NULL AND inv.deleted_at IS NULL
            AND jsonb_path_exists(invoice_to_locations, '$.* ? (@.invoice_to_label == "${invoiceRecipientType}")') 
          LEFT JOIN payment_fact payFacInv ON payFacInv.invoice_id = inv.invoice_id AND payFacInv.deleted_at IS NULL AND payFacInv.recipient_id is not null AND payFacInv.invoice_id IS NOT NULL
            AND payFacInv.payment_by_id = ${payerRecipientType}
        ${payerJoin}
        where  ${pushANDConditions.join(' AND ')}
        group by COALESCE(payFacInv.recipient_id,payFac.recipient_id) , ${payerGroupBy}
        order by paid_amount desc limit 10

  `;
      ///////   Retrieve data
      const result: object[] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
      return result;
    } catch (error) {

      throw error
    }
  }

  //#endregion

  //#endregion
  public generateExports = async (reqData: typings.GenericReqObjI): Promise<object> => {
    // Destructure filters from the request data
    try {
      const { recipient_id, chartName, time_span_id, month_id, facility_location_ids,
        case_type_ids, speciality_ids, provider_ids, fromDate, toDate } = reqData;


      // Get chart details from the JSON structure
      const chart: ExportChartDetail = chartsDetails[chartName];
      if (!chart) {
        throw new Error(`Chart not found: ${chartName}`);
      }

      let whereClauseArray: string[] = chart?.explicitChecks;
      let whereClause: string = ''
      if (whereClauseArray) {
        whereClause = whereClauseArray.join(' AND ')
      }
      const alias: string = chart.alias;
      const filterAlias: string = chart.filterAlias;
      whereClause += ` AND ${filterAlias}.patient_id IS NOT NULL AND ${filterAlias}.deleted_at IS NULL AND (${alias}.created_by::integer IS NULL OR ${filterAlias}.created_by::integer != 13) AND (${alias}.updated_by::integer IS NULL OR ${alias}.updated_by::integer != 13) ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}`;
      if (chartName === 'revenueByLocation') {
        whereClause += `AND facLocDim.facility_location_name IS NOT NULL`
      }
      let selectClause: string = chart.toSelect.join(', ');



      // Regex to handle COALESCE, CONCAT, and CAST
      const aggregateRegex = /\b(?:COUNT|SUM|AVG|MIN|MAX|ARRAY_AGG)\s*\(/i;
      const coalesceRegex = /COALESCE\s*\((?:CONCAT\('?\$\s*'?\s*,\s*(\w+\.\w+)|CONCAT\('inv-',\s*CAST\((\w+\.\w+)\s+AS\s+VARCHAR\)|(\w+\.\w+))\s*,\s*(\w+\.\w+)\s*\)/gi;

      // Array to store extracted column names
      const columns = [];

      // Match all instances of COALESCE and extract column names
      let match;
      while ((match = coalesceRegex.exec(selectClause)) !== null) {
        // Capture necessary parts (columns)
        if (match[1]) columns.push(match[1]);  // Columns like invDim.invoice_amount from CONCAT
        if (match[2]) columns.push(match[2]);  // invDim.invoice_id from CAST
        if (match[3]) columns.push(match[3]);  // Direct column references in COALESCE
        if (match[4]) columns.push(match[4]);  // The second column in COALESCE
      }

      // Add any standalone column that doesn't use COALESCE
      selectClause.split(',').forEach(item => {
        if (!item.includes('COALESCE') && !item.includes('CONCAT') && !item.includes('CAST') && !aggregateRegex) {
          const columnName = item.trim().split(' ')[0];
          if (columnName) columns.push(columnName);
        }
      });


      // Remove duplicates and clean up the list
      const filteredColumns = [...new Set(columns)]
        .map(col => {
          return col.replace(/\)+$/, '').replace(/CONCAT\('\$\s*',\s*/, '').replace(/CAST\((\w+\.\w+)\s+AS\s+VARCHAR\)/, '$1').trim();
        }).filter(col => col !== '');




      let toSelect = filteredColumns.length > 0 ? filteredColumns.join(', ') : '';
      let joinClause: string = '';
      let joinToSelect: string = '';
      let groupByClause: string = '';
      let query: string = '';
      // Map each filter to the corresponding SQL condition
      const filters: Filter = {
        speciality_ids,
        provider_ids,
        case_type_ids,
        facility_location_ids,
        fromDate,
        toDate,
        month_id,
        time_span_id,
      };

      const innerfilters: object = {
        recipient_id
      }
      if (chart.innerJoin) {
        for (const [tableName, joinDetails] of Object.entries(chart.innerJoin)) {
          if (joinDetails['joinChecks']) {
            joinClause += ` INNER JOIN ${tableName} AS ${joinDetails["alias"]} ON ${joinDetails["joinChecks"].join(' AND ')}`;
          }
          if (joinDetails['toSelect']) {
            // Append to the selectClause
            selectClause += `, ${joinDetails['toSelect'].join(', ')}`;

            // Filter out aggregated columns and remove aliases for joinToSelect
            const filteredJoinToSelectColumns = joinDetails['toSelect']
              .filter(column => !aggregateRegex.test(column)) // Filter out aggregated columns
              .map(column => column.replace(/\s+as\s+.*$/i, '')); // Remove alias part

            // Add the filtered columns to joinToSelect
            if (filteredJoinToSelectColumns.length > 0) {
              if (joinToSelect === '') {
                joinToSelect = filteredJoinToSelectColumns.join(', ');
              } else {
                joinToSelect += `, ${filteredJoinToSelectColumns.join(', ')}`;
              }
            }
          }
        }

        // Build the groupByClause ensuring no trailing commas

        if (toSelect && joinToSelect) {
          groupByClause = `${toSelect}, ${joinToSelect}`;
        } else if (toSelect && !joinToSelect) {
          groupByClause = toSelect;
        } else if (joinToSelect) {
          groupByClause = joinToSelect;
        }
      }
      if (chart.leftJoin) {
        for (const [tableName, joinDetails] of Object.entries(chart.leftJoin)) {
          if (joinDetails['joinChecks'] && !joinDetails['subjoincondition']) {
            joinClause += ` LEFT JOIN ${tableName} AS ${joinDetails["alias"]} ON ${joinDetails["joinChecks"].join(' AND ')}`;
          }
          if (joinDetails['joinChecks'] && joinDetails['subjoincondition']) {
            if (chartName !== 'accountReceivableAging') {
              joinClause += ` LEFT JOIN ${joinDetails['subjoincondition']} ${joinDetails["alias"]} ON ${joinDetails['joinChecks'].join(' AND ')}`;
            }
            else if (chartName === 'accountReceivableAging' && recipient_id !== 0) {
              selectClause = `${joinDetails['toSelect']}`;
              selectClause += `, ${chart.toSelect.join(', ')},invDim.invoice_category AS Invoice_category`;

              joinClause += ` LEFT JOIN ( SELECT bills,invoice_id,invoice_date,invoice_amount, paid_amount,write_off_amount,outstanding_amount,over_amount,
              interest_amount,invoice_category  FROM invoices_dim WHERE deleted_at IS NULL  AND bills IS NOT NULL ) invDim ON invDim.bills @> to_jsonb(bilFac.bill_id)
              LEFT JOIN ${joinDetails['subjoincondition']}
                 WHERE deleted_at IS NULL AND bill_recipient_type_id IN (${recipient_id})
                 GROUP BY bill_id) ${joinDetails["alias"]} ON ${joinDetails['joinChecks'].join(' AND ')}`;
            } else if (chartName === 'accountReceivableAging' && recipient_id === 0) {
              selectClause = `'All' as Bill_Invoice_Recipient_Name,'All' as Bill_Invoice_Recipient_Type_Name `;
              selectClause += `, ${chart.toSelect.join(', ')},invDim.invoice_category AS Invoice_category`;

              joinClause += ` LEFT JOIN ( SELECT bills,invoice_id,invoice_date,invoice_amount, paid_amount,write_off_amount,outstanding_amount,over_amount,
              interest_amount,invoice_category  FROM invoices_dim WHERE deleted_at IS NULL  AND bills IS NOT NULL ) invDim ON invDim.bills @> to_jsonb(bilFac.bill_id)
              LEFT JOIN ${joinDetails['subjoincondition']}
                 WHERE deleted_at IS NULL AND bill_recipient_type_id IN (${recipient_id})
                 GROUP BY bill_id) ${joinDetails["alias"]} ON ${joinDetails['joinChecks'].join(' AND ')}`;
            }
          }
          if (joinDetails['toSelect']) {
            // Append to the selectClause
            selectClause += `, ${joinDetails['toSelect'].join(', ')}`;

            // Filter out aggregated columns and remove aliases for joinToSelect
            let filteredJoinToSelectColumns = joinDetails['toSelect']
              .filter(column => !aggregateRegex.test(column)) // Filter out aggregated columns
              .map(column => column.replace(/\s+as\s+.*$/i, '')); // Remove alias part

            // Add the filtered columns to joinToSelect
            if (filteredJoinToSelectColumns.length > 0) {
              if (joinToSelect === '') {
                joinToSelect = filteredJoinToSelectColumns.join(', ');
              } else {
                joinToSelect += `, ${filteredJoinToSelectColumns.join(', ')}`;
              }
            }
          }
        }
        if (toSelect && joinToSelect) {
          groupByClause = `${toSelect}, ${joinToSelect}`;
        } else if (toSelect && !joinToSelect) {
          groupByClause = toSelect;
        } else if (joinToSelect) {
          groupByClause = joinToSelect;
        }

      }

      for (const [filterName, filterValue] of Object.entries(filters)) {

        if (filterValue && (Array.isArray(filterValue) ? filterValue.length > 0 : true)) {
          const filterDetails = chart.filters[filterName];
          switch (filterDetails.type) {
            case 'IN':
              whereClause += ` AND ${filterDetails.filtersAlias}.${filterDetails.column} IN (${filterValue.join(', ')})`;
              break;
            case 'DATE_RANGE_START':
              whereClause += ` AND ${filterDetails.filtersAlias}.${filterDetails.column} >= '${filterValue}'`;
              break;
            case 'DATE_RANGE_END':
              whereClause += ` AND ${filterDetails.filtersAlias}.${filterDetails.column} <= '${filterValue}'`;
              break;
            case 'MONTH':
              const year = new Date().getFullYear();
              whereClause += ` AND EXTRACT('month' from ${filterDetails.filtersAlias}.${filterDetails.column}) = ${filterValue} 
                          AND EXTRACT('year' from ${filterDetails.filtersAlias}.${filterDetails.column})= ${year}`;
              break;
            case 'IN_ARRAY':
              whereClause += ` AND ${filterDetails.filtersAlias}.${filterDetails.column} ?| ARRAY['${filterValue.join("','")}']`
              break;
            case 'TIME_SPAN':
              const timeSpans = {
                1: { interval: '1 week' },
                2: { interval: '1 month' },
                3: { interval: '6 months' },
                4: { interval: '1 year' },
                default: {
                  interval: (() => {
                    const currentDate = new Date();
                    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const daysDifference = Math.floor((currentDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
                    return `${daysDifference} days`;
                  })(),
                },
              };
              const selectedTimeSpan = timeSpans[filterValue] || timeSpans.default;
              whereClause += ` AND ${filterDetails.filtersAlias}.${filterDetails.column} >= current_date - interval '${selectedTimeSpan.interval}'
                           AND ${filterDetails.filtersAlias}.${filterDetails.column} <= current_date `;
              break;
            case 'GRANULARITY':
              const granularityTypes = {
                1: `DATE(${filterDetails.column}) AS appointment_date`,
                2: `DATE(DATE_TRUNC('week',${filterDetails.column})) AS appointment_date`,
                3: `DATE(DATE_TRUNC('month',${filterDetails.column})) AS appointment_date`,
                4: `DATE(DATE_TRUNC('year',${filterDetails.column})) AS appointment_date`,
                default: `DATE(${filterDetails.column}) AS appointment_date`,
              };
              selectClause += granularityTypes[filterValue] || granularityTypes.default;
              break;
          }
        }
      }

      // Set of chart names that should bypass the filtering logic
      const excludedCharts = new Set(['topBillingProviders', 'topBillingSpecialities', 'revenueByLocation', 'higestPayerPatient', 'higestPayerEmployer', 'higestPayerInsurance', 'higestPayerFirm']);

      for (const [filterName, filterValue] of Object.entries(innerfilters)) {
        // Skip excluded charts
        if (!excludedCharts.has(chartName)) {
          // Check if the filter value is valid (non-empty if array, truthy otherwise)
          const isValidFilter = Array.isArray(filterValue) ? filterValue.length > 0 : !!filterValue;

          if (isValidFilter) {
            const filterDetails = chart.innerfilters[filterName];

            // Proceed only if the filterDetails have a 'type' and it's not for 'accountReceivableAging'
            if (filterDetails?.type && chartName !== 'accountReceivableAging') {
              whereClause += ` AND ${filterDetails.filterAlias}.${filterDetails.column} IN (${filterValue})`;
            }
          }
        }
      }

      const orderby: string = `order by ${chart.orderby}`;

      /////////////////////dynamic query handling for multiple charts with different queries /////////////////////////////////////////////////////////////
      const dynamicGroupByClause = `Bill_Recipient_Name, Bill_Recipient_Type_Name, invDim.invoice_category`;
      const dynamicGroupByClause2 = `facDim.facility_qualifier, bilFac.facility_location_id,facLocDim.facility_location_name, facLocDim.facility_location_qualifier, facLocDim.facility_location_name`;
      const queryTemplates = {
        maindistinctOncharts: (selectClause, tableName, joinClause, whereClause, orderby) =>
          `SELECT DISTINCT ON (bilFac.bill_label) ${selectClause} FROM ${tableName} ${joinClause} 
           WHERE ${whereClause} GROUP BY invDim.invoice_id, bilFac.bill_label, ${groupByClause} ${orderby}`,

        distinctPayments: (selectClause, tableName, joinClause, whereClause, orderby) =>
          `SELECT DISTINCT ON (payFac.payment_id) ${selectClause} FROM ${tableName} ${joinClause} 
           WHERE ${whereClause} GROUP BY invDim.invoice_id, bilFac.bill_label, ${groupByClause} ${orderby}`,

        nonDistinctCharts: (selectClause, tableName, joinClause, whereClause, orderby) =>
          `SELECT ${selectClause} FROM ${tableName} ${joinClause} 
           WHERE ${whereClause} GROUP BY ${groupByClause} ${orderby}`,

        arChart: (selectClause, tableName, joinClause, whereClause, orderby) =>
          `SELECT ${selectClause} FROM ${tableName} ${joinClause} 
           WHERE ${whereClause} GROUP BY ${dynamicGroupByClause} ${orderby}`,

        revenueCharts: (selectClause, tableName, joinClause, whereClause, orderby) =>
          `SELECT ${selectClause} FROM ${tableName} ${joinClause} 
           WHERE ${whereClause} GROUP BY ${dynamicGroupByClause2} ${orderby}`
      };

      const chartCategories = {
        maindistinctOncharts: ['totalBilledExport', 'totalAccountReceivableExport', 'totalInterestExport', 'totalWriteOffExport', 'billedvsCheckAmount', 'claimsOverView'],
        distinctPayments: ['totalPaymentExport'],
        nonDistinctCharts: ['topBillingSpecialities', 'topBillingProviders', 'higestPayerPatient', 'higestPayerEmployer', 'higestPayerInsurance', 'higestPayerFirm'],
        revenueCharts: ['revenueByLocation'],
        arChart: ['accountReceivableAging']

      };

      for (const [key, chartNames] of Object.entries(chartCategories)) {
        if (chartNames.includes(chartName)) {
          if (key === 'arChart' && recipient_id !== 0) {
            whereClause += ` AND Bill_Recipient_Name IS NOT NULL AND Bill_Recipient_Type_Name IS NOT NULL`;
          }
          query = queryTemplates[key](selectClause, chart.tableName, joinClause, whereClause, orderby);
          break;
        }
      }



      const info: object[] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
      if (info && info.length > 0) {
        return info;
      } else {
        throw new Error('No Data to Export')
      }

    } catch (error) {
      throw error
    }
  }
}