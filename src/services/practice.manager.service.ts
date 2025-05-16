import * as Sequelize from 'sequelize';
import { sequelize } from '../config/database';
import * as typings from '../interfaces';
import { ExportChartDetail, GranularDataItem, timeSpanMappings } from '../interfaces';
import { GlobalFiltersRequest } from "../interfaces/contracts/request_model";
import { qaLocationsFilter, qaProvidersFilter, qaSpecialitiesFilter } from '../shared/filter-clause';
import { chartsDetails } from '../shared/chart-details';
import { Helper, Http } from "../shared";
import { Filter } from '../shared/dashboards.enums';


export class PracticeManagerService extends Helper {
  public __http: Http;
  public constructor(

    public http: typeof Http
  ) {
    super();
    this.__http = new http();

  }


  public getSummaryChart = async (reqData: typings.GenericReqObjI): Promise<object> => {
    try {
      const { time_span_id, month_id, facility_location_ids, speciality_ids, case_type_ids, provider_ids, fromDate, toDate }: GlobalFiltersRequest["user"] = reqData;
      let fromdate: string;
      let todate: string;
      let prevTime: string;
      let change: number;
      let time: string;
      let whereClause: string = `AND case_type_id IS NOT NULL AND speciality_id IS NOT NULL AND facility_location_id IS NOT NULL AND patient_id IS NOT NULL AND case_id IS NOT NULL AND deleted_at IS NULL AND (created_by::integer IS NULL OR created_by::integer != 13) AND (updated_by::integer IS NULL OR updated_by::integer != 13) ${qaLocationsFilter()} ${qaSpecialitiesFilter()}`;
      let billsWhereClause: string = `AND deleted_at IS NULL AND (created_by::integer IS NULL OR created_by::integer != 13) AND (updated_by::integer IS NULL OR updated_by::integer != 13) ${qaLocationsFilter()} ${qaSpecialitiesFilter()}`;
      let schCurTime: string;
      let schPreTime: string;
      let visitCurTime: string;
      let visitPreTime: string;
      let createCurTime: string;
      let createPreTime: string;
      let daysDifference: string;

      if (time_span_id) {
        const timeMappings: timeSpanMappings = {
          1: { time: '1 week', prevTime: '2 week' },
          2: { time: '1 month', prevTime: '2 month' },
          3: { time: '6 month', prevTime: '1 year' },
          4: { time: '1 year', prevTime: '2 year' },
          5: (() => {
            const currentDate = new Date();
            const totalCurrentDate = currentDate.getDate();
            return { time: totalCurrentDate + ' days', prevTime: (2 * totalCurrentDate) + ' days' };
          })(),
          default: { time: '1 week', prevTime: '2 week' },
        };

        const { time, prevTime } = timeMappings[time_span_id] || timeMappings.default;

        // Construct time intervals for SQL queries
        schCurTime = `scheduled_date_time >= (current_date - INTERVAL '${time}') AND scheduled_date_time <= current_date`;
        schPreTime = `scheduled_date_time >= (current_date - INTERVAL '${prevTime}') AND scheduled_date_time <= (current_date - INTERVAL '${time}')`;
        visitCurTime = `visit_date >= (current_date - INTERVAL '${time}') AND visit_date <= current_date`;
        visitPreTime = `visit_date >= (current_date - INTERVAL '${prevTime}') AND visit_date <= (current_date - INTERVAL '${time}')`;
        createCurTime = `created_at >= (current_date - INTERVAL '${time}') AND created_at <= current_date`;
        createPreTime = `created_at >= (current_date - INTERVAL '${prevTime}') AND created_at <= (current_date - INTERVAL '${time}')`;
      }

      // Check if facility_location_ids exist
      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND facility_location_id IN (${facility_location_ids}) `;
        billsWhereClause += ` AND facility_location_id IN (${facility_location_ids}) `;
      }

      // Check if case_type_ids exist
      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND case_type_id IN (${case_type_ids}) `;
        billsWhereClause += ` AND case_type_id IN (${case_type_ids}) `;
      }

      // Check if speciality_ids exist
      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND speciality_id IN (${speciality_ids})`;
        billsWhereClause += ` AND speciality_id IN (${speciality_ids})`;
      }

      // Check if provider_ids exist
      if (provider_ids && provider_ids.length > 0) {
        // Create quoted provider_ids for SQL query
        const quotedprovider_ids: string = provider_ids.map(id => `${id}`).join(', ');
        whereClause += ` AND provider_id IN (${quotedprovider_ids})`;
        billsWhereClause += ` AND doctor_id IN (${quotedprovider_ids})`;
      }
      if (fromDate && toDate) {
        const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(fromDate, toDate);
        const fromdateObj: Date = new Date(fromDateAdjusted);
        const todateObj: Date = new Date(toDateAdjusted);
        const dateDifferenceMilliseconds: number = todateObj.getTime() - fromdateObj.getTime(); // Calculate the difference in milliseconds

        daysDifference = (dateDifferenceMilliseconds / (1000 * 60 * 60 * 24)) + ' days'; // Convert milliseconds to days
        schCurTime = ` scheduled_date_time >= '${fromDateAdjusted}'::timestamp AND scheduled_date_time <= '${toDateAdjusted}'::timestamp `;
        schPreTime = ` scheduled_date_time >= ('${fromDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND scheduled_date_time <= '${fromDateAdjusted}'::timestamp `;
        visitCurTime = ` visit_date >= '${fromDate}'::DATE  AND visit_date <= '${toDate}'::DATE  `;
        visitPreTime = ` visit_date >= ('${fromDate}'::DATE - INTERVAL '${daysDifference}') AND visit_date <= '${fromDate}'::DATE `;
        createCurTime = ` created_at >= '${fromDateAdjusted}'::timestamp AND created_at <= '${toDateAdjusted}'::timestamp `;


        createPreTime = ` created_at >= ('${fromDate}'::DATE - INTERVAL '${daysDifference}') AND created_at <= '${fromDate}'::DATE `;
      }

      // Check if month_id is provided and not 0
      if (month_id && month_id != 0) {
        let dayInMonth: typings.MonthInfo;
        const currentDate: Date = new Date();
        const currentYear: number = currentDate.getFullYear();
        const currentMonth: number = currentDate.getMonth() + 1;
        // Calculate the total days and start/end dates for the specified month
        dayInMonth = this.daysInMonth(currentYear, month_id);
        fromdate = this.formatDateToYYYYMMDD(dayInMonth.startDate);
        todate = this.formatDateToYYYYMMDD(dayInMonth.endDate);
        const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(fromdate, todate);
        daysDifference = dayInMonth.totalDays + ' days';

        // Construct time intervals for SQL queries based on the specified month
        schCurTime = ` scheduled_date_time >= '${fromDateAdjusted}'::timestamp AND scheduled_date_time <= '${toDateAdjusted}'::timestamp `;
        schPreTime = ` scheduled_date_time >= ('${fromDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND scheduled_date_time <= '${fromDateAdjusted}'::timestamp `;
        visitCurTime = ` visit_date >= '${fromdate}'::DATE  AND visit_date <= '${todate}'::DATE  `;
        visitPreTime = ` visit_date >= ('${fromdate}'::DATE - INTERVAL '${daysDifference}') AND visit_date <= '${fromdate}'::DATE  `;
        createCurTime = ` created_at >= '${fromDateAdjusted}'::timestamp AND created_at <= '${toDateAdjusted}'`;
        createPreTime = ` created_at >= ('${fromDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND created_at <= '${fromDateAdjusted}'::timestamp `;
      }

      // SQL query to retrieve summary chart data
      const query: string = `WITH subquery AS (
                SELECT
                    (SELECT COUNT(*)
 FROM appointment_fact WHERE appointment_status_id = 13 AND is_cancelled != '1' AND ${schCurTime} ${whereClause} ) AS current_appointments,
                    (SELECT COUNT(*)
 FROM appointment_fact WHERE appointment_status_id IS NOT NULL AND ${schCurTime} ${whereClause}) AS current_total_appointments,
                    (SELECT COUNT(*)
 FROM appointment_fact WHERE appointment_status_id = 13 AND is_cancelled != '1' AND ${schPreTime} ${whereClause}) AS previous_appointments,
                    (SELECT COUNT(*)
 FROM appointment_fact WHERE appointment_status_id IS NOT NULL AND ${schPreTime} ${whereClause}) AS previous_total_appointments
            ),
            subquery2 AS (
                SELECT
                    (SELECT COUNT(*)
 FROM appointment_fact WHERE ${schCurTime} ${whereClause}) AS cancel_total,
                    (SELECT COUNT(*)
 FROM appointment_fact WHERE is_cancelled = '1' AND ${schCurTime} ${whereClause}) AS current_cancel,
                    (SELECT COUNT(*)
 FROM appointment_fact WHERE ${schPreTime} ${whereClause}) AS previous_total,
                    (SELECT COUNT(*)
 FROM appointment_fact WHERE is_cancelled = '1' AND ${schPreTime} ${whereClause}) AS previous_cancel
            ),
            subquery3 AS (
                SELECT
                (SELECT ROUND(AVG((EXTRACT(HOUR FROM (evaluation_date_time - scheduled_date_time)) * 60 +
                EXTRACT(MINUTE FROM (evaluation_date_time - scheduled_date_time)))),2)
                FROM appointment_fact
                WHERE ${schCurTime} ${whereClause}) AS current_wait_time,
                (SELECT ROUND(AVG((EXTRACT(HOUR FROM (evaluation_date_time - scheduled_date_time)) * 60 +
                EXTRACT(MINUTE FROM (evaluation_date_time - scheduled_date_time)))),2)
                FROM appointment_fact
                WHERE ${schPreTime} ${whereClause}) AS previous_wait_time
            ),
            subquery4 AS (
                SELECT
                    (SELECT COUNT(*)
 FROM bills_fact_new WHERE denial_status_id IS NOT NULL AND ${createCurTime} ${billsWhereClause}) AS current_denial,
                    (SELECT COUNT(*)
 FROM bills_fact_new WHERE ${createCurTime} ${billsWhereClause}) AS current_denial_total,
                    (SELECT COUNT(*)
 FROM bills_fact_new WHERE denial_status_id IS NOT NULL AND ${createPreTime} ${billsWhereClause}) AS previous_denial,
                    (SELECT COUNT(*)
 FROM bills_fact_new WHERE ${createPreTime} ${billsWhereClause}) AS previous_denial_total
            ),
            subquery5 AS (
                SELECT
                    (SELECT COUNT(*)
 FROM visits_fact WHERE visit_session_state_id IN (1,2) AND ${visitCurTime} ${whereClause}) AS current_unbilled,
                    (SELECT COUNT(*)
 FROM visits_fact WHERE ${visitCurTime} ${whereClause}) AS current_unbilled_total,
                    (SELECT COUNT(*)
 FROM visits_fact WHERE visit_session_state_id IN (1,2) AND ${visitPreTime} ${whereClause}) AS previous_unbilled,
                    (SELECT COUNT(*)
 FROM visits_fact WHERE ${visitPreTime} ${whereClause}) AS previous_unbilled_total
            )
            
            SELECT
                current_appointments,current_total_appointments,
                previous_appointments,previous_total_appointments,
                cancel_total,current_cancel,previous_total,previous_cancel,
                current_wait_time,previous_wait_time,current_wait_time - previous_wait_time AS changed_wait_time,
                current_denial,current_denial_total,previous_denial,previous_denial_total,
                current_unbilled,current_unbilled_total,previous_unbilled,previous_unbilled_total
            FROM subquery,subquery2,subquery3,subquery4,subquery5;`

      const info: object[] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
      if (info[0]) {
        let queryData: object = info[0];

        // Code without Refcatoring
        const Denial_Rate_current: number = ((queryData['current_denial'] / queryData['current_denial_total']) * 100) || 0;
        const Denial_Rate_previous: number = (queryData['previous_denial'] / queryData['previous_denial_total']) * 100 || 0;
        change = Denial_Rate_current - Denial_Rate_previous;
        const Denial_Rate_changed: number = Math.abs((change / Denial_Rate_previous) * 100) || 0;
        const Denial_is_Positive: boolean = (change) >= 0;

        // Calculate Cancel metrics
        const Cancel_current: number = (queryData['current_cancel'] / queryData['cancel_total']) * 100 || 0;
        const Cancel_previous: number = (queryData['previous_cancel'] / queryData['previous_total']) * 100 || 0;
        change = Cancel_current - Cancel_previous
        const Cancel_changed: number = Math.abs((change / Cancel_previous) * 100) || 0;
        const Cancel_is_Positive: boolean = (change) >= 0;

        // Calculate Unbilled Visit metrics
        const Unbilled_Visit_current: number = (queryData['current_unbilled'] / queryData['current_unbilled_total']) * 100 || 0;
        const Unbilled_Visit_previous: number = (queryData['previous_unbilled'] / queryData['previous_unbilled_total']) * 100 || 0;
        change = Unbilled_Visit_current - Unbilled_Visit_previous;
        const Unbilled_Visit_changed: number = Math.abs((change / Unbilled_Visit_previous) * 100) || 0;
        const Unbilled_is_Positive: boolean = (change) >= 0;

        // Calculate Appointment metrics
        const Appointment_current: number = (queryData['current_appointments'] / queryData['current_total_appointments']) * 100 || 0;
        const Appointment_previous: number = (queryData['previous_appointments'] / queryData['previous_total_appointments']) * 100 || 0;
        change = Appointment_current - Appointment_previous;
        const Appointment_changed: number = Math.abs((change / Appointment_previous) * 100) || 0;
        const Appointment_is_Positive: boolean = (change) >= 0;

        // Calculate WaitTime metrics
        const WaitTime_current: number = queryData['current_wait_time'] || 0;
        const WaitTime_previous: number = queryData['previous_wait_time'] || 0;
        const WaitTime_changed: number = Math.abs(((WaitTime_current - WaitTime_previous) / WaitTime_previous) * 100) || 0;
        const WaitTime_is_Positive: boolean = (queryData['changed_wait_time']) >= 0;

        // Converting query data into required flat data as in contracts.
        const flatData: typings.PmSummaryResponseObject = {
          Denial_Rate_current_number: queryData['current_denial'] || 0,
          Denial_Rate_current_total_number: queryData['current_denial_total'] || 0,
          Denial_Rate_previous_number: queryData['previous_denial'] || 0,
          Denial_Rate_previous_total_number: queryData['previous_denial_total'] || 0,
          Denial_Rate_current,
          Denial_Rate_previous,
          Denial_Rate_changed,
          Denial_is_Positive,

          Cancel_current_number: queryData['current_cancel'] || 0,
          Cancel_current_total_number: queryData['cancel_total'] || 0,
          Cancel_previous_number: queryData['previous_cancel'] || 0,
          Cancel_previous_total_number: queryData['previous_total'] || 0,
          Cancel_current,
          Cancel_previous,
          Cancel_changed,
          Cancel_is_Positive,

          Unbilled_Visit_current_number: queryData['current_unbilled'],
          Unbilled_Visit_current_total_number: queryData['current_unbilled_total'] || 0,
          Unbilled_Visit_previous_number: queryData['previous_unbilled'] || 0,
          Unbilled_Visit_previous_total_number: queryData['previous_unbilled_total'] || 0,
          Unbilled_Visit_current,
          Unbilled_Visit_previous,
          Unbilled_Visit_changed,
          Unbilled_is_Positive,

          Appointment_current_number: queryData['current_appointments'] || 0,
          Appointment_current_total_number: queryData['current_total_appointments'] || 0,
          Appointment_previous_number: queryData['previous_appointments'] || 0,
          Appointment_previous_total_number: queryData['previous_total_appointments'] || 0,
          Appointment_current,
          Appointment_previous,
          Appointment_changed,
          Appointment_is_Positive,

          WaitTime_current,
          WaitTime_previous,
          WaitTime_changed,
          WaitTime_is_Positive,
        };
        const result = {};
        for (const key in flatData) {
          if (typeof flatData[key] === 'number') {
            result[key] = flatData[key].toFixed(2);
          } else {
            result[key] = flatData[key];
          }
        }
        return result;
      } else {
        throw new Error("Invalid structure");
      }
    } catch (error) {
      throw error;
    }
  }

  public getPatientTrends = async (reqData: typings.GenericReqObjI): Promise<object> => {
    try {
      // Destructure request parameters
      const { time_span_id, month_id, facility_location_ids, case_type_ids, speciality_ids, provider_ids, fromDate, toDate }: GlobalFiltersRequest["user"] = reqData;
      let fromdate: Date | string = fromDate;
      let todate: Date | string = toDate;
      let prevTime: string;
      let time: string;
      let whereClause: string = `AND patients.deleted_at IS NULL AND (patients.created_by::integer IS NULL OR patients.created_by::integer != 13) AND (patients.updated_by::integer IS NULL OR patients.updated_by::integer != 13) ${qaLocationsFilter('appFac')} ${qaSpecialitiesFilter('appFac')}`;
      let createCurTime: string;
      let createPreTime: string;
      let daysDifference: string;
      let internalPreWhereClause: string;
      let internalCurWhereClause: string;
      let externalCreateCurTime: string;
      let externalCreatePreTime: string;
      let returningWhereClause: string = `deleted_at IS NULL`;

      const timeSpans: timeSpanMappings = {
        1: { time: '1 week', prevTime: '2 week' },
        2: { time: '1 month', prevTime: '2 month' },
        3: { time: '6 month', prevTime: '1 year' },
        4: { time: '1 year', prevTime: '2 year' },
        5: {
          time: (() => {
            const currentDate: Date = new Date();
            let totalCurrentDate: number = currentDate.getDate();
            return totalCurrentDate + ' days';
          })(),
          prevTime: (() => {
            const currentDate: Date = new Date();
            let totalCurrentDate: number = currentDate.getDate();
            return (2 * totalCurrentDate) + ' days';
          })(),
        },
        default: { time: '1 week', prevTime: '2 week' },
      };
      if (time_span_id) {
        const selectedTimeSpan = timeSpans[time_span_id] || timeSpans.default;
        const { time, prevTime, } = selectedTimeSpan;
        externalCreateCurTime = `patients.created_at >= (current_date - INTERVAL '${time}') AND patients.created_at <= current_date `;
        externalCreatePreTime = ` patients.created_at >= (current_date - INTERVAL '${prevTime}') AND patients.created_at <= (current_date - INTERVAL '${time}') `;
        internalCurWhereClause = `WHERE created_at <= current_date - INTERVAL '${time}'`;
        internalPreWhereClause = `WHERE created_at <= current_date - INTERVAL '${prevTime}'`;
        createCurTime = ` casFac.created_at >= (current_date - INTERVAL '${time}') AND casFac.created_at <= current_date `;
        createPreTime = `casFac.created_at >= (current_date - INTERVAL '${prevTime}') AND casFac.created_at <= (current_date - INTERVAL '${time}') `;
      }
      // Handle facility location filtering
      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND casFac.practice_locations ?| ARRAY['${facility_location_ids.join("','")}'] `;
        returningWhereClause += ` AND casFac.practice_locations ?| ARRAY['${facility_location_ids.join("','")}'] `;
      }
      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND appFac.speciality_id IN (${speciality_ids})`;
        returningWhereClause += ` AND speciality_id IN (${speciality_ids})`;

      }
      if (provider_ids && provider_ids.length > 0) {
        whereClause += ` AND appFac.provider_id IN (${provider_ids})`;
        returningWhereClause += ` AND provider_id IN (${provider_ids})`;
      }
      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND casFac.case_type_id IN (${case_type_ids}) `;
        returningWhereClause += ` AND case_type_id IN (${case_type_ids}) `;

      }
      // Handle date range filtering
      if (fromDate && toDate) {
        const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(fromDate, toDate);
        const fromdateObj: Date = new Date(fromDateAdjusted);
        const todateObj: Date = new Date(toDateAdjusted);
        const dateDifferenceMilliseconds = todateObj.getTime() - fromdateObj.getTime(); // Calculate the difference in milliseconds
        daysDifference = (dateDifferenceMilliseconds / (1000 * 60 * 60 * 24)) + ' days'; // Convert milliseconds to days
        internalCurWhereClause = `WHERE created_at <= ('${fromDateAdjusted}') `;
        internalPreWhereClause = `WHERE created_at <= ('${fromDateAdjusted}')::timestamp - INTERVAL '${daysDifference}' `;
        externalCreateCurTime = ` patients.created_at >= ('${toDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND patients.created_at <= '${toDateAdjusted}'::timestamp `;
        externalCreatePreTime = ` patients.created_at >= ('${fromDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND patients.created_at <= '${fromDateAdjusted}'::timestamp `;
        createCurTime = ` casFac.created_at >= '${fromDateAdjusted}'::timestamp AND casFac.created_at <= '${toDateAdjusted}' `;
        createPreTime = ` casFac.created_at >= ('${fromDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND casFac.created_at <= '${fromDateAdjusted}'::timestamp `;
      }
      // Handle month filtering
      if (month_id && month_id != 0) {
        const currentDate: Date = new Date();
        const currentYear: number = currentDate.getFullYear();
        // Calculate the total days and start/end dates for the specified month
        const daysinMonth = this.daysInMonth(currentYear, month_id);
        fromdate = this.formatDateToYYYYMMDD(daysinMonth.startDate);
        todate = this.formatDateToYYYYMMDD(daysinMonth.endDate);
        const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(fromdate, todate);
        daysDifference = daysinMonth.totalDays + ' days';
        internalCurWhereClause = `WHERE created_at <= ('${fromDateAdjusted}'::timestamp) `;
        internalPreWhereClause = `WHERE created_at <= ('${fromDateAdjusted}'::timestamp) - INTERVAL '${daysDifference}' `;
        externalCreateCurTime = ` patients.created_at >= ('${toDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND patients.created_at <= '${toDateAdjusted}'::timestamp `;
        externalCreatePreTime = ` patients.created_at >= ('${fromDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND patients.created_at <= '${fromDateAdjusted}'::timestamp `;
        createCurTime = ` casFac.created_at >= '${fromDateAdjusted}'::timestamp AND casFac.created_at <= '${toDateAdjusted}'::timestamp `;
        createPreTime = ` casFac.created_at >= ('${fromDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND casFac.created_at <= '${fromDateAdjusted}'::timestamp `;
      }
      const query = `
    SELECT
    (SELECT COUNT(DISTINCT patients.patient_id)
      FROM patient_dim patients 
      INNER JOIN case_fact_new casFac ON patients.patient_id = casFac.patient_id AND patients.deleted_at IS NULL
      LEFT JOIN appointment_fact appFac ON patients.patient_id = appFac.patient_id AND appFac.deleted_at IS NULL AND appFac.patient_id IS NOT NULL
       WHERE ${createCurTime} ${whereClause} ) AS newpatients,


      (SELECT COUNT(DISTINCT patients.patient_id)
      FROM patient_dim patients 
      INNER JOIN case_fact_new casFac ON patients.patient_id = casFac.patient_id AND casFac.deleted_at IS NULL AND casFac.patient_id IS NOT NULL
      LEFT JOIN appointment_fact appFac ON patients.patient_id = appFac.patient_id AND appFac.deleted_at IS NULL AND appFac.patient_id IS NOT NULL
      WHERE ${createPreTime} ${whereClause}) AS previouspatients,


            (SELECT COUNT(DISTINCT repeated_patients.patient_id) AS returning_patients_current
      FROM (
          SELECT casFac.patient_id
          FROM case_fact_new casFac
          INNER JOIN patient_dim patients ON patients.patient_id = casFac.patient_id AND patients.deleted_at IS NULL
          LEFT JOIN appointment_fact appFac ON patients.patient_id = appFac.patient_id AND appFac.deleted_at IS NULL AND appFac.patient_id IS NOT NULL
          WHERE ${createCurTime} ${whereClause}
          GROUP BY casFac.patient_id
          HAVING COUNT(DISTINCT casFac.case_id) > 1
      ) AS repeated_patients),
      (SELECT COUNT(DISTINCT repeated_patients.patient_id) AS returning_patients_previous
      FROM (
          SELECT casFac.patient_id
          FROM case_fact_new casFac
          INNER JOIN patient_dim patients ON patients.patient_id = casFac.patient_id AND patients.deleted_at IS NULL
          LEFT JOIN appointment_fact appFac ON patients.patient_id = appFac.patient_id AND appFac.deleted_at IS NULL AND appFac.patient_id IS NOT NULL
          WHERE ${createPreTime} ${whereClause}
          GROUP BY casFac.patient_id
          HAVING COUNT(DISTINCT casFac.case_id) > 1
      ) AS repeated_patients), 


              (SELECT COUNT(DISTINCT casFac.case_id)
                FROM case_fact_new casFac
                INNER JOIN patient_dim patients ON casFac.patient_id = patients.patient_id AND patients.deleted_at IS NULL
                LEFT JOIN appointment_fact appFac ON patients.patient_id = appFac.patient_id AND appFac.deleted_at IS NULL AND appFac.patient_id IS NOT NULL
                WHERE ${createCurTime} ${whereClause} AND casFac.deleted_at IS NULL AND patients.deleted_at IS NULL) AS new_cases,

                (SELECT COUNT(DISTINCT casFac.case_id)
     FROM case_fact_new casFac
     INNER JOIN patient_dim patients ON casFac.patient_id = patients.patient_id AND patients.deleted_at IS NULL
     LEFT JOIN appointment_fact appFac ON patients.patient_id = appFac.patient_id AND appFac.deleted_at IS NULL AND appFac.patient_id IS NOT NULL
     WHERE ${createPreTime} ${whereClause} AND casFac.deleted_at IS NULL AND patients.deleted_at IS NULL) AS previous_cases;
`

      // Extract data from the query result
      const info: object[] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
      if (info[0]) {
        const queryData: object = info[0];
        // Function to replace null with zero in query results
        const replaceNullIntegerWithZero = (value) => (value === null ? 0 : parseInt(value));
        const returningPatientsCurrent: number = replaceNullIntegerWithZero(queryData['returning_patients_current']);
        const returningPatientsPrevious: number = replaceNullIntegerWithZero(queryData['returning_patients_previous']);
        const newPatients: number = replaceNullIntegerWithZero(queryData['newpatients']);
        const previousPatients: number = replaceNullIntegerWithZero(queryData['previouspatients']);
        //changes to be made (this data is not coming from database (query incorrect))
        const newCases: number = replaceNullIntegerWithZero(queryData['new_cases']);
        const previousCases: number = replaceNullIntegerWithZero(queryData['previous_cases']);
        // Calculate percentage changes and positivity for each metric
        const newPatientChanged: number = previousPatients !== 0
          ? parseFloat((((newPatients - previousPatients) / previousPatients) * 100).toFixed(2))
          : (newPatients !== 0 ? 100 : 0);

        const newPatientIsPositive: boolean = newPatientChanged >= 0;
        const returningPatientsChanged: number = returningPatientsPrevious !== 0
          ? parseFloat((((returningPatientsCurrent - returningPatientsPrevious) / returningPatientsPrevious) * 100).toFixed(2))
          : (returningPatientsCurrent !== 0 ? 100 : 0);
        const returningPatientsIsPositive: boolean = returningPatientsChanged >= 0;
        const newCasesChanged: number = previousCases !== 0
          ? parseFloat((((newCases - previousCases) / previousCases) * 100).toFixed(2))
          : (newCases !== 0 ? 100 : 0);

        const newCasesIsPositive: boolean = newCasesChanged >= 0;
        // Create a flat data object for the response
        const flatData: typings.PatientResponseObject = {
          newPatients,
          newPateintsPrevious: previousPatients,
          newPatientChanged: newPatientChanged === Infinity ? 0 : Math.abs(newPatientChanged),
          newPatientIsPositive,
          returningPatients: returningPatientsCurrent,
          returningPateintsPrevious: returningPatientsPrevious,
          returningPatientsChanged: returningPatientsChanged === Infinity ? 0 : Math.abs(returningPatientsChanged),
          returningPatientsIsPositive,
          newCases,
          previousCases,
          newCasesChanged: newCasesChanged === Infinity ? 0 : Math.abs(newCasesChanged),
          newCasesIsPositive,
        };
        return flatData;
      } else {
        throw new Error("Invalid structure");
      }
    }
    catch (error) {
      throw error;
    }
  }
  // #region Appointment Trend Analysis

  public getAppointmentTrends = async (reqData: typings.GenericReqObjI): Promise<object> => {

    try {
      // Extracting filters from the request body
      const {
        time_span_id,
        month_id,
        speciality_ids,
        provider_ids,
        facility_location_ids,
        case_type_ids,
        fromDate,
        toDate,
        granularity_type_id,
      }: GlobalFiltersRequest["user"] = reqData;

      // Initialize the WHERE clause for appointments and the SELECT clause
      let whereClause: string = `appointFact.case_type_id IS NOT NULL AND appointFact.speciality_id IS NOT NULL AND appointFact.facility_location_id IS NOT NULL AND appointFact.patient_id IS NOT NULL AND appointFact.case_id IS NOT NULL AND appointFact.deleted_at IS NULL AND (appointFact.created_by::integer IS NULL OR appointFact.created_by::integer != 13) AND (appointFact.updated_by::integer IS NULL OR appointFact.updated_by::integer != 13) ${qaLocationsFilter('appointFact')} ${qaSpecialitiesFilter('appointFact')}`;  // A default condition to start with
      let selectClause: string = `DATE(scheduled_date_time) AS appointment_date`;

      // If speciality_ids are provided, filter by them in the WHERE clause
      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND appointFact.speciality_id IN (${speciality_ids})`;
      }

      // If month_id is provided, filter by the specified month and update the SELECT clause
      if (month_id) {
        const year: number = (new Date).getFullYear();
        whereClause += ` AND EXTRACT('month' from scheduled_date_time) = ${month_id} 
                              AND EXTRACT('year' from scheduled_date_time)= ${year} `; // Fetch data of the selected month
        selectClause = `DATE(DATE_TRUNC('week',scheduled_date_time)) AS appointment_date`;
      }

      // If provider_ids are provided, filter by them in the WHERE clause
      if (provider_ids && provider_ids.length > 0) {
        whereClause += ` AND appointFact.provider_id IN (${provider_ids})`;
      }

      // If case_type_ids are provided, filter by them in the WHERE clause
      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND appointFact.case_type_id IN (${case_type_ids})`;
      }

      // If facility_location_ids are provided, filter by them in the WHERE clause
      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND appointFact.facility_location_id IN (${facility_location_ids})`;
      }

      // If fromDate and toDate are provided, filter by date range in the WHERE clause
      if (fromDate && toDate) {

        whereClause += ` AND scheduled_date_time >= '${fromDate}'AND scheduled_date_time <= '${toDate}' `;
      }
      let interval: string = '';
      const timeSpans: timeSpanMappings = {
        1: { interval: '1 week', selectClause: `DATE(scheduled_date_time) AS appointment_date` },
        2: { interval: '1 month', selectClause: `DATE(DATE_TRUNC('week',scheduled_date_time)) AS appointment_date` },
        3: { interval: '6 months', selectClause: `DATE(DATE_TRUNC('month',scheduled_date_time)) AS appointment_date` },
        4: { interval: '1 year', selectClause: `DATE(DATE_TRUNC('month',scheduled_date_time)) AS appointment_date` },
        5: {
          interval: (() => {
            const currentDate: Date = new Date();
            const firstDayOfMonth: Date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const daysDifference: number = Math.floor((currentDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
            return `${daysDifference} days`;
          })(),
          selectClause: `DATE(DATE_TRUNC('week',scheduled_date_time)) AS appointment_date`,
        },
        default: { interval: '1 week', selectClause: `DATE(scheduled_date_time) AS appointment_date` },
      };

      if (time_span_id) {
        const selectedTimeSpan = timeSpans[time_span_id] || timeSpans.default;

        const {
          interval: selectedInterval,
          selectClause: selectedSelectClause,
        } = selectedTimeSpan;

        interval = selectedInterval;
        selectClause = selectedSelectClause;

        whereClause += ` AND scheduled_date_time >= current_date - interval '${interval}'
                 AND scheduled_date_time <= current_date `;

      }
      const granularityTypes: timeSpanMappings = {
        1: `DATE(scheduled_date_time) AS appointment_date`,
        2: `DATE(DATE_TRUNC('week',scheduled_date_time)) AS appointment_date`,
        3: `DATE(DATE_TRUNC('month',scheduled_date_time)) AS appointment_date`,
        4: `DATE(DATE_TRUNC('year',scheduled_date_time)) AS appointment_date`,
        default: `DATE(scheduled_date_time) AS appointment_date`,
      };

      if (granularity_type_id) {
        selectClause = granularityTypes[granularity_type_id] || granularityTypes.default;
      }

      // Construct the SQL query
      const sqlQuery: string = `
              WITH Appointments AS (
                SELECT
                  ${selectClause},
                  appointstat.slug AS appointment_status,
                  CASE WHEN appointFact.is_cancelled::boolean THEN 'Cancelled' ELSE 'Not Cancelled' END AS cancellation_status
                FROM
                  appointment_fact appointFact
                JOIN appointment_status_dim appointstat ON appointFact.appointment_status_id = appointstat.appointment_status_id AND appointstat.deleted_at IS NULL AND appointstat.name IS NOT NULL
                WHERE
                  ${whereClause} AND appointstat.deleted_at IS NULL
              )
              SELECT
                appointment_date,
                appointment_status AS Label,
                COUNT(*) AS Count
              FROM
                Appointments
              WHERE
                appointment_status IN ('completed', 'no_show', 're_scheduled','scheduled') AND cancellation_status = 'Not Cancelled'
              GROUP BY
                appointment_date, appointment_status
              UNION ALL
              SELECT
                appointment_date,
                'Cancelled' AS Label,
                COUNT(*) AS Count
              FROM
                Appointments
              WHERE
                cancellation_status = 'Cancelled'
              GROUP BY
                appointment_date
              UNION ALL
              SELECT
                appointment_date,
                'Total Appointments' AS Label,
                COUNT(*) AS Count
              FROM
                Appointments
              GROUP BY
                appointment_date
              ORDER BY
              appointment_date;
            `;

      const obj = { granular_data: [] };
      const days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; // Labels for days
      const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // Labels for months
      const [results] = await sequelize.query(sqlQuery);
      let isFirstDate: Boolean = true;
      let storedAppoinDate: Date = null;
      if (Array.isArray(results)) {
        results.forEach(function (value: any) {
          // Calculating totals for each status
          if (!(value.label in obj)) {
            obj[value.label] = Number(value.count);
          } else {
            obj[value.label] += Number(value.count);
          }
          let dateLabel: string | number | Date = value.appointment_date;

          if (time_span_id) {
            const day: Date = new Date(value.appointment_date);
            const monthSemester: Date = new Date(value.appointment_date);
            const monthYear: Date = new Date(value.appointment_date);
            const def: Date = new Date(value.appointment_date);

            const timeSpanMappings: timeSpanMappings = {
              1: days[day.getDay()],
              2: value.appointment_date,
              3: months[monthSemester.getMonth()],
              4: months[monthYear.getMonth()],
              5: value.appointment_date,
              default: days[def.getDay()],
            };

            dateLabel = timeSpanMappings[time_span_id] || timeSpanMappings.default;
          }

          if (month_id) {
            const year: number = new Date(value.appointment_date).getFullYear();
            let appointmentDate: Date = null;
            if (isFirstDate) {
              appointmentDate = value.appointment_date;
              storedAppoinDate = new Date(appointmentDate);
              const adjustedDate: string = `${year}-${month_id < 10 ? '0' + month_id : month_id}-01`;
              dateLabel = adjustedDate;
              isFirstDate = false;
            }
            if (!isFirstDate && storedAppoinDate) {
              const newAppoinDate: Date = new Date(value.appointment_date);
              if (storedAppoinDate.getTime() === newAppoinDate.getTime()) {
                const adjustedDate: string = `${year}-${month_id < 10 ? '0' + month_id : month_id}-01`;
                dateLabel = adjustedDate;
              }
            }
          }

          if (granularity_type_id) {
            const yearDate: number = new Date(value.appointment_date).getFullYear();
            const year: number = new Date(value.appointment_date).getFullYear();
            const month: number = new Date(value.appointment_date).getMonth();
            const appointmentDate = new Date(value.appointment_date)
            const week: string = (new Date(appointmentDate.getTime() + 6000 * 60 * 60 * 24)).toLocaleDateString();
            if (granularity_type_id == 2) {
              let appointmentDate = null;
              if (isFirstDate) {
                appointmentDate = value.appointment_date;
                storedAppoinDate = new Date(appointmentDate);
                const date: Date = new Date(fromDate);
                const adjustedDate: string = date.toISOString().split('T')[0];
                dateLabel = adjustedDate;
                isFirstDate = false;
              }
              if (!isFirstDate && storedAppoinDate != null) {
                const newAppoinDate = new Date(value.appointment_date);
                if (storedAppoinDate.getTime() === newAppoinDate.getTime()) {
                  const date: Date = new Date(fromDate);
                  const adjustedDate: string = date.toISOString().split('T')[0];
                  dateLabel = adjustedDate;
                }
              }
            } else {
              const granularityMappings: timeSpanMappings = {
                2: week,
                3: `${months[new Date(value.appointment_date).getMonth()]} ${yearDate}`,
                4: year,
              };

              dateLabel = granularityMappings[granularity_type_id] || dateLabel;
            }
          }

          if (value.label != "scheduled") {
            const existingDateObj: GranularDataItem = obj.granular_data.find(
              (dateObj: any) => dateObj.date_label === dateLabel
            );
            let dateObject: GranularDataItem;
            if (!existingDateObj) {
              dateObject = {
                date_label: dateLabel,
              };

              if (value.label === "Total Appointments") {
                dateObject.Scheduled = Number(value.count);
              } else if (value.label === "no_show" || value.label === "Cancelled") {
                dateObject.Cancelled_Noshows = (dateObject.Cancelled_Noshows || 0) + Number(value.count);
              } else {
                dateObject[value.label] = Number(value.count);
              }
              obj.granular_data.push(dateObject);
            } else {
              dateObject = existingDateObj;
              if (value.label === "Total Appointments") {
                dateObject.Scheduled = Number(value.count);
              } else if (value.label === "no_show" || value.label === "Cancelled") {
                dateObject.Cancelled_Noshows = (dateObject.Cancelled_Noshows || 0) + Number(value.count);
              } else {
                dateObject[value.label] = Number(value.count);
              }
            }
          }
        });
        return obj;
      }
      else {
        throw new Error("Invalid structure");
      }
    } catch (error) {
      throw error;
    }
  }

  // #End region

  // #region Average Gap & Duration
  public getGapDuration = async (reqData: typings.GenericReqObjI): Promise<object> => {
    try {
      // Destructure the input data
      const {
        time_span_id,
        month_id,
        speciality_ids,
        provider_ids,
        facility_location_ids,
        case_type_ids,
        fromDate,
        toDate
      }: GlobalFiltersRequest["user"] = reqData;

      // Initialize WHERE clauses for bills and appointments
      let billsWhereClause: string = `billFact.case_type_id IS NOT NULL AND billFact.speciality_id IS NOT NULL AND billFact.facility_location_id IS NOT NULL AND billFact.patient_id IS NOT NULL AND billFact.case_id IS NOT NULL AND billFact.deleted_at IS NULL AND (billFact.created_by::integer IS NULL OR billFact.created_by::integer != 13) AND (billFact.updated_by::integer IS NULL OR billFact.updated_by::integer != 13) ${qaLocationsFilter('billFact')} ${qaSpecialitiesFilter('billFact')} `;  // A default condition to start with
      let appointmentWhereClause: string = `appointFact.time_of_check_in IS NULL AND appointFact.case_type_id IS NOT NULL AND appointFact.speciality_id IS NOT NULL AND appointFact.facility_location_id IS NOT NULL AND appointFact.patient_id IS NOT NULL AND appointFact.case_id IS NOT NULL AND appointFact.deleted_at IS NULL AND (appointFact.created_by::integer IS NULL OR appointFact.created_by::integer != 13) AND (appointFact.updated_by::integer IS NULL OR appointFact.updated_by::integer != 13) ${qaLocationsFilter('appointFact')} ${qaSpecialitiesFilter('appointFact')} `;

      // If speciality_ids are provided, filter by them in both WHERE clauses
      if (speciality_ids && speciality_ids.length > 0) {
        billsWhereClause += ` AND billFact.speciality_id IN (${speciality_ids})`;
        appointmentWhereClause += ` AND appointFact.speciality_id IN (${speciality_ids})`;
      }

      // If month_id is provided, filter by the specified month in both WHERE clauses
      if (month_id) {
        const year: number = (new Date).getFullYear();
        const create_startDate: Date = new Date(year, month_id - 1, 1);
        const create_endDate: Date = new Date(year, month_id - 1, 1);
        create_endDate.setMonth(create_startDate.getMonth() + 1);
        create_endDate.setDate(create_endDate.getDate() - 1);
        const startDate: string = create_startDate.toISOString().split('T')[0];
        const endDate: string = create_endDate.toISOString().split('T')[0];
        const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(startDate, endDate);
        billsWhereClause += `AND billFact.bill_date >= '${startDate}'::DATE AND billFact.bill_date <= '${endDate}'::DATE `;
        appointmentWhereClause += `AND scheduled_date_time >= '${fromDateAdjusted}' AND scheduled_date_time <= '${toDateAdjusted}' `;
      }

      // If provider_ids are provided, filter by them in both WHERE clauses
      if (provider_ids && provider_ids.length > 0) {
        billsWhereClause += ` AND billFact.doctor_id IN (${provider_ids})`;
        appointmentWhereClause += ` AND appointFact.provider_id IN (${provider_ids})`;
      }

      // If case_type_ids are provided, filter by them in the WHERE clause
      if (case_type_ids && case_type_ids.length > 0) {
        billsWhereClause += ` AND billFact.case_type_id IN (${case_type_ids})`;
        appointmentWhereClause += ` AND appointFact.case_type_id IN (${case_type_ids})`;
      }

      // If facility_location_ids are provided, filter by them in both WHERE clauses
      if (facility_location_ids && facility_location_ids.length > 0) {
        billsWhereClause += ` AND billFact.facility_location_id IN (${facility_location_ids})`;
        appointmentWhereClause += ` AND appointFact.facility_location_id IN (${facility_location_ids})`;
      }

      // If fromDate and toDate are provided, filter by date range in both WHERE clauses
      if (fromDate && toDate) {
        const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(fromDate, toDate);
        billsWhereClause += ` AND bill_date >= '${fromDate}' AND bill_date <= '${toDate}' `;
        appointmentWhereClause += ` AND scheduled_date_time >= '${fromDateAdjusted}' AND scheduled_date_time <= '${toDateAdjusted}' `;
      }
      // If time_span_id is provided, calculate the interval and filter by it in both WHERE clauses
      if (time_span_id) {
        const intervalMapping: timeSpanMappings = {
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

        const interval = intervalMapping[time_span_id] || intervalMapping.default;

        billsWhereClause += ` AND bill_date >= current_date - interval '${interval}'
                             AND bill_date <= current_date `;
        appointmentWhereClause += ` AND scheduled_date_time >= current_date - interval '${interval}'
                             AND scheduled_date_time <= current_date `;
      }
      // Construct the SQL query
      const sqlQuery: string = `
              WITH AppointmentDurations AS (
                SELECT
                    ROUND(AVG(EXTRACT(EPOCH FROM (time_of_check_out - time_of_check_in)/60)), 2) AS average_time,
                    ROUND(MIN(EXTRACT(EPOCH FROM (time_of_check_out - time_of_check_in)/60)), 2) AS minimum_time,
                    ROUND(MAX(EXTRACT(EPOCH FROM (time_of_check_out - time_of_check_in)/60)), 2) AS maximum_time
                FROM
                    appointment_fact appointFact
                WHERE ${appointmentWhereClause}
              ),
              BillVisitDurations AS (
                SELECT
                    billFact.bill_id,
                    (billFact.bill_date - visitFact.visit_date)::integer AS gap_days
                FROM
                    bills_fact_new billFact
                    JOIN bills_visit_dim billVisitDim ON billFact.bill_id = billVisitDim.bill_id
                    JOIN visits_fact visitFact ON billVisitDim.bill_visit_session_id = visitFact.visit_id
                WHERE ${billsWhereClause} 
              )
              SELECT
                  (SELECT average_time FROM AppointmentDurations) AS average_duration_time,
                  (SELECT minimum_time FROM AppointmentDurations) AS minimum_duration_time,
                  (SELECT maximum_time FROM AppointmentDurations) AS maximum_duration_time,
                  ROUND(AVG(gap_days), 0) AS average_gap_days,
                  MIN(gap_days) AS minimum_gap_days,
                  MAX(gap_days) AS maximum_gap_days
              FROM
                  BillVisitDurations;
            `;
      // Execute the raw query

      const results: object = await sequelize.query(sqlQuery);

      return results[0];
    } catch (error) {
      // Handle any errors and log them
      throw error;
    }


  }
  // #End region

  //#region  "Visit_Status_Analysis"

  public getVisitStatus = async (reqData: typings.GenericReqObjI): Promise<object> => {
    try {
      const {
        case_type_ids,
        time_span_id,
        month_id,
        speciality_ids,
        provider_ids,
        facility_location_ids,
        granularity_type_id,
        fromDate,
        toDate,
        //  granularity_type_id,
      }: GlobalFiltersRequest["user"] = reqData;
      let whereClause: string = `case_type_id IS NOT NULL AND facility_location_id IS NOT NULL AND speciality_id IS NOT NULL AND patient_id IS NOT NULL AND case_id IS NOT NULL AND deleted_at IS NULL AND (created_by::integer IS NULL OR created_by::integer != 13) AND (updated_by::integer IS NULL OR updated_by::integer != 13)  ${qaLocationsFilter()} ${qaSpecialitiesFilter()}`;
      let selectClause: string = `DATE(visit_date) AS Visit_date`;
      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND speciality_id IN (${speciality_ids})`;
      }
      if (month_id) {
        const year: number = (new Date).getFullYear();
        whereClause += `AND EXTRACT('month' from visit_date) = ${month_id}
        AND EXTRACT('year' from visit_date)= ${year} `; // fetches data of selected month
        selectClause = `DATE(DATE_TRUNC('week',visit_date)) AS Visit_date`
      }
      if (provider_ids && provider_ids.length > 0) {
        whereClause += ` AND provider_id IN (${provider_ids})`;
      }
      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND case_type_id IN (${case_type_ids})`;
      }
      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND facility_location_id IN (${facility_location_ids})`;
      }
      if (fromDate && toDate) {
        whereClause += ` AND visit_date >= '${fromDate}' AND visit_date <= '${toDate}' `;
      }

      let interval: string = '';
      const timeSpans: timeSpanMappings = {
        1: { interval: '1 week', selectClause: `DATE(visit_date) AS Visit_date` },
        2: { interval: '1 month', selectClause: `DATE(DATE_TRUNC('week',visit_date)) AS Visit_date` },
        3: { interval: '6 months', selectClause: `DATE(DATE_TRUNC('month',visit_date)) AS Visit_date` },
        4: { interval: '1 year', selectClause: `DATE(DATE_TRUNC('month',visit_date)) AS Visit_date` },
        5: {
          interval: (() => {
            const currentDate: Date = new Date();
            const firstDayOfMonth: Date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const daysDifference: number = Math.floor((currentDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
            return `${daysDifference} days`;
          })(),
          selectClause: `DATE(DATE_TRUNC('week',visit_date)) AS Visit_date`,
        },
        default: { interval: '1 week', selectClause: `DATE(visit_date) AS Visit_date` },
      };

      if (time_span_id) {
        const selectedTimeSpan = timeSpans[time_span_id] || timeSpans.default;
        const {
          interval: selectedInterval,
          selectClause: selectedSelectClause,
        } = selectedTimeSpan;

        interval = selectedInterval;
        selectClause = selectedSelectClause;

        whereClause += ` AND visit_date >= current_date - interval '${interval}'
                        AND visit_date <= current_date `;
      }

      const granularityTypes: timeSpanMappings = {
        1: `DATE(visit_date) AS Visit_date`,
        2: `DATE(DATE_TRUNC('week',visit_date)) AS Visit_date`,
        3: `DATE(DATE_TRUNC('month',visit_date)) AS Visit_date`,
        4: `DATE(DATE_TRUNC('year',visit_date)) AS Visit_date`,
        default: `DATE(visit_date) AS Visit_date`,
      };

      if (granularity_type_id) {
        selectClause = granularityTypes[granularity_type_id] || granularityTypes.default;
      }
      const visit_status_query: string = `
        WITH visits AS (
        SELECT
            ${selectClause},
            CASE
                WHEN visit_session_state_id = 1 THEN 'un_finalized'
                WHEN visit_session_state_id = 2 THEN 'finalized'
                WHEN visit_session_state_id = 3 THEN 'bill_created'
            END AS label
        FROM visits_fact
        WHERE ${whereClause}
    )
    SELECT Visit_date, label, COUNT(*) AS count
    FROM visits
    GROUP BY Visit_date, label
    ORDER BY Visit_date, label;
        `;
      let Output = [];


      const days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [results] = await sequelize.query(visit_status_query);
      if (Array.isArray(results)) {
        results.forEach(function (value: any) {
          let dateLabel: string | Date = value.visit_date;
          let label: string = value.label
          let count: number = Number(value.count);
          if (time_span_id) {
            const day: Date = new Date(value.visit_date);
            const monthSemester: Date = new Date(value.visit_date);
            const monthYear: Date = new Date(value.visit_date);
            const def: Date = new Date(value.visit_date);

            const timeSpanMappings: timeSpanMappings = {
              1: days[day.getDay()],
              2: value.visit_date,
              3: months[monthSemester.getMonth()],
              4: months[monthYear.getMonth()],
              5: value.visit_date,
              default: days[def.getDay()],
            };

            dateLabel = timeSpanMappings[time_span_id] || timeSpanMappings.default;
          }

          if (granularity_type_id) {
            const yearDate: number = new Date(value.visit_date).getFullYear();
            const year: number = new Date(value.visit_date).getFullYear();
            const visitDate: Date = new Date(value.visit_date)
            const week: string = (new Date(visitDate.getTime() + 6000 * 60 * 60 * 24)).toLocaleDateString();
            const granularityMappings: timeSpanMappings = {
              2: week,
              3: `${months[new Date(value.visit_date).getMonth()]} ${yearDate}`,
              4: year,
            };

            dateLabel = granularityMappings[granularity_type_id] || dateLabel;
          }



          const existingDateObj: object = Output.find(
            (dateObj) => dateObj.date_label === dateLabel
          );
          if (!existingDateObj) {
            Output.push({
              Visit_Timeline: dateLabel,
              [label]: count,
            });
          } else {
            existingDateObj[label] += count;
          }
        })
      }
      else {
        throw new Error("Invalid structure");
      }
      const finaloutput = Output;
      const transformedOutput: Object = finaloutput.reduce((result, item) => {
        const { Visit_Timeline, ...rest } = item;
        const existingEntry = result.find((entry) => entry.Visit_Timeline === Visit_Timeline);
        if (existingEntry) {
          Object.assign(existingEntry, rest);
        } else {
          result.push({
            Visit_Timeline,
            ...rest
          });
        }
        return result;
      }, []);
      return transformedOutput
    } catch (error) {
      throw error
    }
  }

  public getBillStatus = async (reqData: typings.GenericReqObjI): Promise<object> => {
    try {
      const {
        case_type_ids,
        month_id,
        speciality_ids,
        provider_ids,
        fromDate,
        toDate,
        time_span_id,
        facility_location_ids
      }: GlobalFiltersRequest["user"] = reqData;
      let whereClause: string = `visitFact.case_type_id IS NOT NULL AND visitFact.facility_location_id IS NOT NULL AND visitFact.speciality_id IS NOT NULL AND visitFact.patient_id IS NOT NULL AND visitFact.case_id IS NOT NULL AND visitFact.deleted_at IS NULL AND (visitFact.created_by::integer IS NULL OR visitFact.created_by::integer != 13) AND (visitFact.updated_by::integer IS NULL OR visitFact.updated_by::integer != 13)  ${qaLocationsFilter()} ${qaSpecialitiesFilter()}`;
      if (provider_ids && provider_ids.length > 0) {
        whereClause += `AND provider_id IN (${provider_ids}) `;
      }
      if (speciality_ids && speciality_ids.length > 0) {
        whereClause += ` AND speciality_id IN (${speciality_ids})`;
      }
      if (facility_location_ids && facility_location_ids.length > 0) {
        whereClause += ` AND facility_location_id IN (${facility_location_ids})`;
      }
      if (month_id) {
        const year: number = (new Date).getFullYear();
        whereClause += ` AND EXTRACT('month' from visitFact.visit_date) = ${month_id}  
                              AND EXTRACT('year' from visitFact.visit_date)= ${year}`; // Fetch data of the selected month
      }
      if (case_type_ids && case_type_ids.length > 0) {
        whereClause += ` AND case_type_id IN (${case_type_ids})`;
      }

      if (fromDate && toDate) {
        whereClause += ` AND visitFact.visit_date >= '${fromDate}' AND visitFact.visit_date <= '${toDate}'`;
      }
      if (time_span_id) {
        const intervalMapping: timeSpanMappings = {
          1: () => '1 week',
          2: () => '1 month',
          3: () => '6 months',
          4: () => '1 year',
          5: this.calculateCustomInterval,
          default: () => '1 week',
        };
        const interval = (intervalMapping[time_span_id] || intervalMapping.default)?.();
        whereClause += ` AND visitFact.visit_date >= current_date - interval '${interval}'
                                 AND visitFact.visit_date <= current_date`;
      }
      const bill_status_Query: string = `
            SELECT
            COUNT(*) AS unfinalized_visit,
            current_date - visitFact.visit_date AS date_difference
            FROM
                visits_fact AS visitFact
            WHERE
            ${whereClause} AND visit_session_state_id = 1
            GROUP BY
                date_difference
            ORDER BY
                date_difference;
            `;


      const [results] = await sequelize.query(bill_status_Query);
      return results;
    } catch (error) {
      throw error
    }
  }
  //#endregion
  //#region  Percentage of denials against each denial type
  public getDenialTypesService = async (reqData: typings.GenericReqObjI, _authorization: string): Promise<object> => {
    try {
      let dropdownQuery: boolean = false;
      let pushANDConditions: string[] = [];
      let pushANDConditionsDropdowns: string[] = ['denDim.denial_id::integer = denTypeDim.denial_id::integer'];
      const oneWeek: string = `denDim.denial_date >=(CURRENT_DATE - INTERVAL '1 week')`;
      const oneMonth: string = `(denDim.denial_date >= CURRENT_DATE - INTERVAL '1 month')`;
      const sixMonths: string = `(CURRENT_DATE - INTERVAL '6 months' <= denDim.denial_date)`;
      const oneYear: string = `(CURRENT_DATE - INTERVAL '1 year') <= denDim.denial_date`;
      const MTD: string = `(denDim.denial_date >= DATE_TRUNC('month', CURRENT_DATE) AND denDim.denial_date <= CURRENT_DATE)`;
      const specificMonth: string = `EXTRACT(YEAR FROM denDim.denial_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM denDim.denial_date) = `;
      const {
        time_span_id,
        month_id,
        speciality_ids,
        provider_ids,
        facility_location_ids,
        case_type_ids,
        fromDate,
        toDate,
      }: GlobalFiltersRequest["user"] = reqData;
      ///////   request object with time_span_id enums { 1, 2, 3, 4, 5}

      const timeSpanMappings: timeSpanMappings = {
        1: oneWeek,
        2: oneMonth,
        3: sixMonths,
        4: oneYear,
        5: MTD,
        default: oneMonth,
      };

      if (time_span_id && time_span_id !== 0) {
        const conditionToAdd = timeSpanMappings[time_span_id];
        if (conditionToAdd) {
          pushANDConditions.push(conditionToAdd);
        }
      }

      ///////   request object with month_id enums { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
      if (month_id && (month_id != 0)) {
        pushANDConditions.push(`${specificMonth}${month_id}`);
      }

      ///////   request object with speciality_ids array of integers
      if (speciality_ids && speciality_ids.length > 0) {
        dropdownQuery = true;
        pushANDConditionsDropdowns.push(`billFact.speciality_id IN (${speciality_ids})`);
        pushANDConditions.push(`billFac.speciality_id::integer IN (${speciality_ids})`);
      }

      ///////   request object with provider_ids array of integers
      if (provider_ids && provider_ids.length > 0) {
        dropdownQuery = true;
        pushANDConditionsDropdowns.push(`billFact.doctor_id::integer IN (${provider_ids})`);
        pushANDConditions.push(`billFac.doctor_id::integer IN (${provider_ids})`);
      }

      ///////   request object with facility_location_ids array of integers
      if (facility_location_ids && facility_location_ids.length > 0) {
        dropdownQuery = true;
        pushANDConditionsDropdowns.push(`billFact.facility_location_id::integer IN (${facility_location_ids})`);
        pushANDConditions.push(`billFac.facility_location_id::integer IN (${facility_location_ids})`);
      }
      ///////   request object with case_type_ids array of integers
      if (case_type_ids && case_type_ids.length > 0) {
        dropdownQuery = true;
        pushANDConditionsDropdowns.push(`billFact.case_type_id IN (${case_type_ids})`);
        pushANDConditions.push(`billFac.case_type_id::integer IN (${case_type_ids})`);
      }
      ///////   request object with fromDate for starting date of fetching data


      if (fromDate && toDate) {
        pushANDConditions.push(`denDim.denial_date >= '${fromDate}'`);
        pushANDConditions.push(`denDim.denial_date <='${toDate}'`);
      }
      ///////   Query
      let query: string = `
        WITH partialData AS (
            SELECT
                denTypeDim.denial_type_id,
                denTypeDim.denial_type_name,
                COUNT(*) AS denial_count
            FROM denial_type_dim AS denTypeDim
            LEFT JOIN denial_dim denDim ON denTypeDim.denial_id::integer = denDim.denial_id AND denDim.deleted_at IS NULL AND denDim.denial_id IS NOT NULL
            LEFT JOIN bills_fact_new billFac ON denDim.bill_id::integer = billFac.bill_id AND billFac.deleted_at IS NULL AND denDim.bill_id IS NOT NULL
            WHERE ${pushANDConditions.join(' AND ')} AND (billFac.created_by::integer IS NULL OR billFac.created_by::integer != 13) AND (billFac.updated_by::integer IS NULL OR billFac.updated_by::integer != 13) ${qaLocationsFilter('billFac')} ${qaSpecialitiesFilter('billFac')} ${qaProvidersFilter(false, 'billFac')} AND denDim.deleted_at IS NULL AND denTypeDim.deleted_at IS NULL AND billFac.deleted_at IS NULL
            GROUP BY denTypeDim.denial_type_name, denTypeDim.denial_type_id
        )${dropdownQuery ? ` ,
        dropdownFilter AS (
            SELECT DISTINCT denTypeDim.denial_type_id
            FROM denial_type_dim AS denTypeDim
            WHERE EXISTS (
                SELECT 1
                FROM bills_fact_new AS billFact
                JOIN denial_dim AS denDim ON denDim.bill_id::integer = billFact.bill_id::integer
                WHERE  ${pushANDConditionsDropdowns.join(' AND ')} AND (billFact.created_by::integer IS NULL OR billFact.created_by::integer != 13) AND (billFact.updated_by::integer IS NULL OR billFact.updated_by::integer != 13) ${qaLocationsFilter('billFact')} ${qaSpecialitiesFilter('billFact')} AND denDim.deleted_at IS NULL
            )
        )`: ''}
        SELECT
            pd.denial_type_id,
            pd.denial_type_name,
            pd.denial_count,
            (pd.denial_count * 100.0) / SUM(pd.denial_count) OVER() AS denial_percentage
        FROM
            partialData AS pd
            ${dropdownQuery ? `WHERE pd.denial_type_id IN (SELECT denial_type_id FROM dropdownFilter)` : ''}
        ORDER BY pd.denial_count DESC
        LIMIT 10;
        `;

      ///////   Retrieve data

      const result: object[] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
      ///////   Reset condition Arrays
      dropdownQuery = false;
      pushANDConditions = [];
      pushANDConditionsDropdowns = [];
      ////// Change payload
      if ((result && result?.length !== 0)) {
        const sum = result.reduce((acc, entry) => acc + Number(entry['denial_count']), 0);
        const paylaod = {
          fullData: result,
          labels: result.map(entry => `${entry['denial_type_name']}`),
          labelVals: result.map(entry => entry['denial_count']),
          labelPercentage: result.map(entry => parseFloat(((Number(entry['denial_count']) / sum) * 100).toFixed(2)))
        };
        return paylaod;
      } else {
        const paylaod = {
          fullData: [],
          labels: [],
          labelVals: [],
          labelPercentage: []
        };
        return paylaod;
      }
    }
    catch (error) {
      throw error
    }

  }
  //#endregion
  public generateExports = async (reqData: typings.GenericReqObjI, _authorization: string): Promise<object> => {
    // Destructure filters from the request data
    try {
      const { chartName, time_span_id, month_id, facility_location_ids, case_type_ids, speciality_ids, provider_ids, fromDate, toDate } = reqData;
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
      whereClause += ` AND ${filterAlias}.patient_id IS NOT NULL AND ${filterAlias}.deleted_at IS NULL AND (${alias}.created_by::integer IS NULL OR ${filterAlias}.created_by::integer != 13) AND (${alias}.updated_by::integer IS NULL OR ${alias}.updated_by::integer != 13) ${qaLocationsFilter(filterAlias)} ${qaSpecialitiesFilter(filterAlias)}`;
      let selectClause: string = chart.toSelect.join(', ');


      // Regular expression to match the column names and ignore the aliases
      const cleanedColumns = chart.toSelect.map(item => {
        // Strip any expression or alias using regex
        const match = item.match(/(\w+\.\w+)/);
        return match ? match[0] : null;
      }).filter(Boolean);  // Filter out null values

      const groupBy = cleanedColumns.join(', ');

      if (chart.selectAggregate) {
        selectClause += ` , ${chart.selectAggregate.join(', ')}`
      }
      let joinClause: string = '';
      let joinToSelect: string = '';
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
      if (chart.innerJoin) {
        for (const [tableName, joinDetails] of Object.entries(chart.innerJoin)) {
          if (joinDetails['joinChecks']) {
            joinClause += ` INNER JOIN ${tableName} AS ${joinDetails["alias"]} ON ${joinDetails["joinChecks"].join(' AND ')}`;
          }
          if (joinDetails['toSelect']) {
            selectClause += `, ${joinDetails['toSelect'].join(', ')}`;
            joinToSelect += `, ${joinDetails['toSelect'].map(column => column.replace(/\s+as\s+.*$/i, '')).join(', ')}`;
          }
        }
      }
      if (chart.leftJoin) {
        for (const [tableName, joinDetails] of Object.entries(chart.leftJoin)) {
          if (joinDetails['joinChecks']) {
            joinClause += ` LEFT JOIN ${tableName} AS ${joinDetails["alias"]} ON ${joinDetails["joinChecks"].join(' AND ')}`;
          }
          if (joinDetails['toSelect']) {
            selectClause += `, ${joinDetails['toSelect'].join(', ')}`;
            joinToSelect += `, ${joinDetails['toSelect'].map(column => column.replace(/\s+as\s+.*$/i, '')).join(', ')}`;
          }
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
      let orderby: string = `order by ${chart.orderby}`;
      if (chart.having) {
        orderby = `having ${chart.having} order by ${chart.orderby}`
      }
      const query: string = `SELECT ${selectClause} FROM ${chart.tableName} ${joinClause} WHERE ${whereClause} group by ${groupBy} ${joinToSelect} ${orderby}`;

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
