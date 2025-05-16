import * as Sequelize from 'sequelize';
import { sequelize } from '../config/database';
import * as typings from '../interfaces';
import { ExportChartDetail, timeSpanMappings } from '../interfaces';
import { GlobalFiltersRequest } from "../interfaces/contracts/request_model";
import { Helper, Http } from "../shared";
import { qaLocationsFilter, qaSpecialitiesFilter } from '../shared/filter-clause';
import { chartsDetails } from '../shared/chart-details';


export class ProviderService extends Helper {
    public __http: Http;
    public constructor(

        public http: typeof Http
    ) {
        super();
        this.__http = new http();
    }

    public getAppointments = async (reqData: typings.GenericReqObjI): Promise<object> => {

        try {
            // Extracting filters from the request body
            const {
                time_span_id,
                provider_ids,
                case_type_ids,
                speciality_ids,
                facility_location_ids
            }: GlobalFiltersRequest["user"] = reqData;

            // Initialize the WHERE clause for appointments and the SELECT clause
            let whereClause: string = `appoinFac.case_type_id IS NOT NULL AND appoinFac.speciality_id IS NOT NULL AND appoinFac.facility_location_id IS NOT NULL AND appoinFac.patient_id IS NOT NULL AND appoinFac.case_id IS NOT NULL AND appoinFac.deleted_at IS NULL AND (appoinFac.created_by::integer IS NULL OR appoinFac.created_by::integer != 13) AND (appoinFac.updated_by::integer IS NULL OR appoinFac.updated_by::integer != 13) ${qaLocationsFilter('appoinFac')} ${qaSpecialitiesFilter('appoinFac')}`;
            if (provider_ids.length === 1) {
                whereClause += ` AND provider_id = ${provider_ids} `;
            }
            if (facility_location_ids && facility_location_ids.length > 0) {
                whereClause += ` AND facility_location_id IN (${facility_location_ids}) `;
            }
            if (speciality_ids && speciality_ids.length > 0) {
                whereClause += ` AND appoinFac.speciality_id IN (${speciality_ids})`;
            }
            if (case_type_ids && case_type_ids.length > 0) {
                whereClause += ` AND appoinFac.case_type_id IN (${case_type_ids})`;
            }
            if (time_span_id || time_span_id == null) {
                const timeSpanMappings: timeSpanMappings = {
                    1: '1 week',
                    2: '1 month',
                    default: '1 week',
                };

                const interval = timeSpanMappings[time_span_id] || timeSpanMappings.default;
                whereClause += ` AND scheduled_date_time::date >= current_date ::date + interval '${interval}'`;
            }
            // Construct the SQL query
            const sqlQuery: string = `
            WITH Appointments AS (
                SELECT
                  DISTINCT scheduled_date_time AS appointment_date,
                  appoinStatDim.slug AS appointment_status,
                  CASE WHEN appoinFac.is_cancelled::boolean THEN 'Cancelled' ELSE 'Not Cancelled' END AS cancellation_status,
				  CASE WHEN appoinFac.confirmation_status_id::boolean THEN 'Confirmed' ELSE 'Not Confimed' END AS confirmation_status,
                  specDim.qualifier  AS specialty_name,
				  patDim.first_name || ' ' || patDim.last_name AS patient_name,
				  patDim.age AS patient_age,
				  patDim.gender AS patient_gender,
				  caseTypeDim.name AS case_type,
				  appoinTypeDim.qualifier AS visit_type,
				  appoinFac.case_id AS case_no
                FROM
                  appointment_fact appoinFac
                JOIN appointment_status_dim appoinStatDim ON appoinFac.appointment_status_id = appoinStatDim.appointment_status_id AND appoinStatDim.deleted_at IS NULL AND appoinStatDim.name IS NOT NULL
                JOIN specialities_dim specDim ON appoinFac.speciality_id = specDim.specialty_id  AND specDim.deleted_at IS NULL AND specDim.name is NOT NULL
				JOIN patient_dim patDim ON appoinFac.patient_id = patDim.patient_id AND patDim.deleted_at IS NULL AND appoinFac.patient_id IS NOT NULL
				JOIN case_types_dim caseTypeDim ON appoinFac.case_type_id = caseTypeDim.case_type_id AND caseTypeDim.deleted_at IS NULL
				JOIN appointment_type_dim appoinTypeDim ON appoinFac.appointment_type_id = appoinTypeDim.appointment_type_id AND appoinTypeDim.deleted_at IS NULL
                WHERE ${whereClause} 
                AND appoinTypeDim.deleted_at IS NULL
              )
              SELECT
                appointment_date,
                appointment_status,
				confirmation_status,
				cancellation_status,
				specialty_name,
				patient_name,
				patient_age,
				patient_gender,
				case_type,
				visit_type,
				case_no
              FROM
                Appointments
              WHERE
                appointment_status IN ('re_scheduled','scheduled') 
                `;
            const [results] = await sequelize.query(sqlQuery);

            const obj = {
                Cancelled: 0,
                re_scheduled: 0,
                scheduled: 0,
                Cancelled_list: [],
                re_scheduled_list: [],
                scheduled_list: [],
            };
            if (Array.isArray(results)) {
                results.forEach(function (value: any) {
                    // Calculating totals for each status
                    if (value.cancellation_status == 'Not Cancelled') {
                        obj[value.appointment_status] += 1;
                        if (value.appointment_status == 'scheduled') {
                            obj.scheduled_list.push(value)
                        } else {
                            obj.re_scheduled_list.push(value)
                        }
                    } else {
                        obj[value.cancellation_status] += 1;
                        obj.Cancelled_list.push(value)
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

    public getAppointmentsAnalysis = async (reqData: typings.GenericReqObjI): Promise<object> => {

        try {
            // Extracting filters from the request body
            const {
                time_span_id,
                month_id,
                speciality_ids,
                provider_ids,
                case_type_ids,
                fromDate,
                toDate,
                granularity_type_id,
                facility_location_ids
            }: GlobalFiltersRequest["user"] = reqData;

            // Initialize the WHERE clause for appointments and the SELECT clause
            let whereClause: string = `appoinFac.case_type_id IS NOT NULL AND appoinFac.speciality_id IS NOT NULL AND appoinFac.facility_location_id IS NOT NULL AND appoinFac.patient_id IS NOT NULL AND appoinFac.case_id IS NOT NULL AND appoinFac.deleted_at IS NULL AND (appoinFac.created_by::integer IS NULL OR appoinFac.created_by::integer != 13) AND (appoinFac.updated_by::integer IS NULL OR appoinFac.updated_by::integer != 13) ${qaLocationsFilter('appoinFac')} ${qaSpecialitiesFilter('appoinFac')}`;  // A default condition to start with
            if (provider_ids.length === 1) {
                whereClause += `AND appoinFac.provider_id = ${provider_ids} `;
            }
            let selectClause: string = `DATE(scheduled_date_time) AS appointment_date`;

            // If speciality_ids are provided, filter by them in the WHERE clause
            if (speciality_ids && speciality_ids.length > 0) {
                whereClause += ` AND appoinFac.speciality_id IN (${speciality_ids})`;
            }
            if (facility_location_ids && facility_location_ids.length > 0) {
                whereClause += ` AND appoinFac.facility_location_id IN (${facility_location_ids}) `;
            }

            // If month_id is provided, filter by the specified month and update the SELECT clause
            if (month_id) {
                const year: number = (new Date).getFullYear();
                whereClause += ` AND EXTRACT('month' from scheduled_date_time) = ${month_id} 
                                  AND EXTRACT('year' from scheduled_date_time)= ${year}`; // Fetch data of the selected month
                selectClause = `DATE(DATE_TRUNC('week',scheduled_date_time)) AS appointment_date`;
            }

            // If case_type_ids are provided, filter by them in the WHERE clause
            if (case_type_ids && case_type_ids.length > 0) {
                whereClause += ` AND appoinFac.case_type_id IN (${case_type_ids})`;
            }

            // If facility_location_ids are provided, filter by them in the WHERE clause
            // If fromDate and toDate are provided, filter by date range in the WHERE clause
            if (fromDate && toDate) {
                const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(fromDate, toDate);
                whereClause += ` AND scheduled_date_time >= '${fromDateAdjusted}' AND scheduled_date_time <= '${toDateAdjusted}'`;
            }

            if (time_span_id) {
                let interval: string = '';
                let customSelectClause: string | undefined;
                const currentDate = new Date();
                const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const daysDifference = Math.floor((currentDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));

                const timeSpanMappings: timeSpanMappings = {
                    1: { interval: '1 week', selectClause: `DATE(scheduled_date_time) AS appointment_date` },
                    2: { interval: '1 month', selectClause: `DATE(DATE_TRUNC('week',scheduled_date_time)) AS appointment_date` },
                    3: { interval: '6 months', selectClause: `DATE(DATE_TRUNC('month',scheduled_date_time)) AS appointment_date` },
                    4: { interval: '1 year', selectClause: `DATE(DATE_TRUNC('month',scheduled_date_time)) AS appointment_date` },
                    5: { interval: `${daysDifference} days`, selectClause: `DATE(DATE_TRUNC('week',scheduled_date_time)) AS appointment_date` },
                    default: { interval: '1 week', selectClause: `DATE(scheduled_date_time) AS appointment_date` },
                };
                const mapping = timeSpanMappings[time_span_id] || timeSpanMappings.default;
                interval = mapping.interval;
                if (mapping.selectClause) {
                    customSelectClause = mapping.selectClause;
                }
                whereClause += ` AND scheduled_date_time >= current_date - interval '${interval}'
                                 AND scheduled_date_time <= current_date`;

                if (customSelectClause) {
                    selectClause = customSelectClause;
                }
            }
            if (granularity_type_id) {
                const granularityMappings: timeSpanMappings = {
                    1: `DATE(scheduled_date_time) AS appointment_date`,
                    2: `DATE(DATE_TRUNC('week',scheduled_date_time)) AS appointment_date`, // Group data by weeks
                    3: `DATE(DATE_TRUNC('month',scheduled_date_time)) AS appointment_date`, // Group data by months
                    4: `DATE(DATE_TRUNC('year',scheduled_date_time)) AS appointment_date`, // Group data by years
                    default: `DATE(scheduled_date_time) AS appointment_date`,
                };
                selectClause = granularityMappings[granularity_type_id] || granularityMappings.default;
            }
            // Construct the SQL query
            const sqlQuery: string = `
                WITH Appointments AS (
                    SELECT
                    ${selectClause},
                    appoinStatDim.slug AS appointment_status,
                    appoinTypeDim.slug AS visit_type,
                    CASE WHEN appoinFac.is_cancelled::boolean THEN 'Cancelled' ELSE 'Not Cancelled' END AS cancellation_status
                    FROM
                    appointment_fact appoinFac
                    JOIN appointment_status_dim appoinStatDim ON appoinFac.appointment_status_id = appoinStatDim.appointment_status_id
                    JOIN appointment_type_dim appoinTypeDim ON appoinFac.appointment_type_id = appoinTypeDim.appointment_type_id
                    WHERE
                    ${whereClause} AND appoinStatDim.deleted_at IS NULL AND appoinTypeDim.deleted_at IS NULL 
                )
                SELECT
                    appointment_date,
                    appointment_status AS Label,
                    COUNT(*) AS Count
                FROM
                    Appointments
                WHERE
                    appointment_status IN ('completed') AND cancellation_status = 'Not Cancelled'
                GROUP BY
                    appointment_date, appointment_status
                UNION ALL
                SELECT
                    appointment_date,
                    visit_type AS Label,
                    COUNT(*) AS Count
                FROM
                    Appointments
                WHERE
                    visit_type IN ('initial_evaluation', 'follow_up','re_evaluation') AND cancellation_status = 'Not Cancelled' AND appointment_status = 'completed'
                GROUP BY
                    appointment_date, visit_type
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
                    'Scheduled' AS Label,
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
                    let dateLabel: string | number | Date = value.appointment_date; // dateLabel can contain string as Jan, Feb or number as 2023 or Date as it is

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
                    // Refactored Code
                    if (granularity_type_id) {
                        const yearDate: number = new Date(value.appointment_date).getFullYear();
                        const year: number = new Date(value.appointment_date).getFullYear();
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
                                const newAppoinDate: Date = new Date(value.appointment_date);
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
                    if (value.label != "Scheduled" && value.label != "Cancelled") {
                        const existingDateObj: any = obj.granular_data.find(
                            (dateObj: any) => dateObj.date_label === dateLabel
                        );
                        let dateObject: Object;
                        if (!existingDateObj) {
                            dateObject = {
                                date_label: dateLabel,
                            };
                            dateObject[value.label] = Number(value.count);

                            obj.granular_data.push(dateObject);
                        } else {
                            dateObject = existingDateObj;
                            dateObject[value.label] = Number(value.count);
                        }
                    }
                });
                return obj;
            } else {
                throw new Error("Invalid structure");
            }
        } catch (error) {
            throw error;
        }
    }

    public getSummaryChart = async (reqData: typings.GenericReqObjI): Promise<object> => {

        try {
            const { time_span_id, month_id, facility_location_ids, speciality_ids, case_type_ids, provider_ids, fromDate, toDate }: GlobalFiltersRequest["user"] = reqData;
            let fromdate: string | Date = fromDate;
            let todate: string | Date = toDate;
            let prevTime: string;
            let change: number;
            let time: string;
            let whereClause: string = `AND deleted_at IS NULL AND (created_by::integer IS NULL OR created_by::integer != 13) AND (updated_by::integer IS NULL OR updated_by::integer != 13) ${qaLocationsFilter()} ${qaSpecialitiesFilter()}`;
            let schCurTime: string;
            let schPreTime: string;
            let visitCurTime: string;
            let visitPreTime: string;
            let daysDifference: string;
            if (time_span_id) {
                const currentDate: Date = new Date();
                let totalCurrentDate: number = currentDate.getDate();

                const timeSpanMappings: timeSpanMappings = {
                    1: { time: '1 week', prevTime: '2 week' },
                    2: { time: '1 month', prevTime: '2 month' },
                    3: { time: '6 month', prevTime: '12 month' },
                    4: { time: '1 year', prevTime: '2 year' },
                    5: { time: `${totalCurrentDate} days`, prevTime: `${2 * totalCurrentDate} days` },
                    default: { time: '1 week', prevTime: '2 week' },
                };

                const mapping = timeSpanMappings[time_span_id] || timeSpanMappings.default;

                time = mapping.time;
                prevTime = mapping.prevTime;

                schCurTime = ` scheduled_date_time >= (current_date - INTERVAL '${time}') AND scheduled_date_time <= current_date`;
                schPreTime = ` scheduled_date_time >= (current_date - INTERVAL '${prevTime}') AND scheduled_date_time <= current_date - INTERVAL '${time}'`;
                visitCurTime = ` visit_date >= (current_date - INTERVAL '${time}') AND visit_date <= current_date `;
                visitPreTime = ` visit_date >= (current_date - INTERVAL '${prevTime}') AND visit_date <= (current_date - INTERVAL '${time}')`;
            }

            if (facility_location_ids && facility_location_ids.length > 0) {
                whereClause += ` AND facility_location_id IN (${facility_location_ids}) `;
            }
            if (provider_ids && provider_ids.length > 0) {
                whereClause += `AND provider_id IN (${provider_ids})`;
            }
            if (case_type_ids && case_type_ids.length > 0) {
                whereClause += ` AND case_type_id IN (${case_type_ids}) `;
            }
            if (speciality_ids && speciality_ids.length > 0) {
                whereClause += ` AND speciality_id IN (${speciality_ids})`;
            }
            if (fromdate && todate) {
                const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(fromDate, toDate);
                const fromdateObj: Date = new Date(fromDateAdjusted);
                const todateObj: Date = new Date(toDateAdjusted);

                const dateDifferenceMilliseconds: number = todateObj.getTime() - fromdateObj.getTime(); // Calculate the difference in milliseconds

                daysDifference = (dateDifferenceMilliseconds / (1000 * 60 * 60 * 24)) + ' days'; // Convert milliseconds to days
                schCurTime = ` scheduled_date_time >= '${fromDateAdjusted}'::timestamp AND scheduled_date_time <= '${toDateAdjusted}'::timestamp`;
                schPreTime = ` scheduled_date_time >= ('${fromDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND scheduled_date_time <= '${fromDateAdjusted}'::timestamp`;
                visitCurTime = ` visit_date >= '${fromdate}'::DATE  AND visit_date <= '${todate}'::DATE `;
                visitPreTime = ` visit_date >= ('${fromdate}'::DATE - INTERVAL '${daysDifference}') AND visit_date <= '${fromdate}'::DATE`;
            }
            if (month_id && month_id != 0) {
                let dayInMonth: typings.MonthInfo;
                const currentDate: Date = new Date();
                const currentYear: number = currentDate.getFullYear();
                // Calculate the total days and start/end dates for the specified month
                dayInMonth = this.daysInMonth(currentYear, month_id);
                fromdate = this.formatDateToYYYYMMDD(dayInMonth.startDate);
                todate = this.formatDateToYYYYMMDD(dayInMonth.endDate);
                daysDifference = dayInMonth.totalDays + ' days';
                const { fromDateAdjusted, toDateAdjusted } = this.addGMTHours(fromdate, todate);
                schCurTime = ` scheduled_date_time >= '${fromDateAdjusted}'::timestamp AND scheduled_date_time <= '${toDateAdjusted}'::timestamp`;
                schPreTime = ` scheduled_date_time >= ('${fromDateAdjusted}'::timestamp - INTERVAL '${daysDifference}') AND scheduled_date_time <= '${fromDateAdjusted}'::timestamp`;
                visitCurTime = ` visit_date >= '${fromdate}'::DATE  AND visit_date <= '${todate}'::DATE `;
                visitPreTime = ` visit_date >= ('${fromdate}'::DATE - INTERVAL '${daysDifference}') AND visit_date <= '${fromdate}'::DATE`;
            }

            const query: string = `WITH subquery AS (
                SELECT
                    (SELECT COUNT(*) FROM appointment_fact WHERE appointment_status_id = 13  AND is_cancelled != '1' AND ${schCurTime} ${whereClause} ) AS current_appointments,
                    (SELECT COUNT(*) FROM appointment_fact WHERE appointment_status_id IS NOT NULL  AND ${schCurTime} ${whereClause}) AS current_total_appointments,
                    (SELECT COUNT(*) FROM appointment_fact WHERE appointment_status_id = 13 AND is_cancelled != '1'  AND ${schPreTime} ${whereClause}) AS previous_appointments,
                    (SELECT COUNT(*) FROM appointment_fact WHERE appointment_status_id IS NOT NULL AND ${schPreTime} ${whereClause}) AS previous_total_appointments
            ),
            subquery2 AS (
                SELECT
                    (SELECT COUNT(*) FROM appointment_fact WHERE  ${schCurTime} ${whereClause}) AS cancel_total,
                    (SELECT COUNT(*) FROM appointment_fact WHERE is_cancelled = '1' AND ${schCurTime} ${whereClause}) AS current_cancel,
                    (SELECT COUNT(*) FROM appointment_fact WHERE ${schPreTime} ${whereClause}) AS previous_total,
                    (SELECT COUNT(*) FROM appointment_fact WHERE is_cancelled = '1' AND ${schPreTime} ${whereClause}) AS previous_cancel
            ),
            subquery3 AS (
                SELECT  
                    (SELECT COUNT(*) FROM visits_fact WHERE visit_session_state_id IN (1)  AND ${visitCurTime} ${whereClause}) AS current_unfinalized,
                    (SELECT COUNT(*) FROM visits_fact WHERE ${visitCurTime} ${whereClause}  ) AS current_unfinalized_total,
                    (SELECT COUNT(*) FROM visits_fact WHERE visit_session_state_id IN (1) AND ${visitPreTime} ${whereClause}) AS previous_unfinalized,
                    (SELECT COUNT(*) FROM visits_fact WHERE  ${visitPreTime} ${whereClause} ) AS previous_unfinalized_total
            )
            
            SELECT
                current_appointments,current_total_appointments,
                previous_appointments,previous_total_appointments,
                cancel_total,current_cancel,previous_total,previous_cancel,
                current_unfinalized,current_unfinalized_total,previous_unfinalized,previous_unfinalized_total
            FROM subquery,subquery2,subquery3`

            const info: object[] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
            if (info[0]) {
                let queryData = info[0];
                const Cancel_current = (queryData['current_cancel'] / queryData['cancel_total']) * 100 || 0;
                const Cancel_previous = (queryData['previous_cancel'] / queryData['previous_total']) * 100 || 0;
                change = Cancel_current - Cancel_previous
                const Cancel_changed = Math.abs((change / Cancel_previous) * 100) || 0;
                const Cancel_is_Positive = (change) >= 0;

                const Unfinalized_Visit_current = (queryData['current_unfinalized'] / queryData['current_unfinalized_total']) * 100 || 0;
                const Unfinalized_Visit_previous = (queryData['previous_unfinalized'] / queryData['previous_unfinalized_total']) * 100 || 0;
                change = Unfinalized_Visit_current - Unfinalized_Visit_previous;
                const Unfinalized_Visit_changed = Math.abs((change / Unfinalized_Visit_previous) * 100) || 0;
                const Unfinalized_is_Positive = (change) >= 0;

                const Appointment_current = (queryData['current_appointments'] / queryData['current_total_appointments']) * 100 || 0;
                const Appointment_previous = (queryData['previous_appointments'] / queryData['previous_total_appointments']) * 100 || 0;
                change = Appointment_current - Appointment_previous;
                const Appointment_changed = Math.abs((change / Appointment_previous) * 100) || 0;
                let Appointment_is_Positive = (change) >= 0;


                // Converting query data into required flat data as in contracts.
                let flatData: typings.ProviderSummaryResponseObject = {
                    Appointment_current_number: queryData['current_appointments'] || 0,
                    Appointment_current_total_number: queryData['current_total_appointments'] || 0,
                    Appointment_previous_number: queryData['previous_appointments'] || 0,
                    Appointment_previous_total_number: queryData['previous_total_appointments'] || 0,
                    Appointment_current,
                    Appointment_previous,
                    Appointment_changed,
                    Appointment_is_Positive,

                    Cancel_current_number: queryData['current_cancel'] || 0,
                    Cancel_current_total_number: queryData['cancel_total'] || 0,
                    Cancel_previous_number: queryData['previous_cancel'] || 0,
                    Cancel_previous_total_number: queryData['previous_total'] || 0,
                    Cancel_current,
                    Cancel_previous,
                    Cancel_changed,
                    Cancel_is_Positive,

                    Unfinalized_Visit_current_number: queryData['current_unfinalized'],
                    Unfinalized_Visit_current_total_number: queryData['current_unfinalized_total'] || 0,
                    Unfinalized_Visit_previous_number: queryData['previous_unfinalized'] || 0,
                    Unfinalized_Visit_previous_total_number: queryData['previous_unfinalized_total'] || 0,
                    Unfinalized_Visit_current,
                    Unfinalized_Visit_previous,
                    Unfinalized_Visit_changed,
                    Unfinalized_is_Positive,

                };
                const result: object = {};
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


    public generateExports = async (reqData: typings.GenericReqObjI, _authorization: string): Promise<object> => {
        // Destructure filters from the request data
        try {
            const { chartName, time_span_id, month_id, facility_location_ids, case_type_ids, speciality_ids, provider_ids, fromDate, toDate } = reqData;
            // Get chart details from the JSON structure
            const chart: ExportChartDetail = chartsDetails[chartName];
            if (!chart) {
                throw new Error(`Chart not found: ${chartName}`);
            } else {
                let whereClauseArray: string[] = chart?.explicitChecks;
                let whereClause: string = ''
                if (whereClauseArray) {
                    whereClause = whereClauseArray.join(' AND ')
                }
                const alias: string = chart.alias;
                const filterAlias: string = chart.filterAlias;
                whereClause += ` AND ${filterAlias}.patient_id IS NOT NULL AND ${filterAlias}.deleted_at IS NULL AND (${alias}.created_by::integer IS NULL OR ${filterAlias}.created_by::integer != 13) AND (${alias}.updated_by::integer IS NULL OR ${alias}.updated_by::integer != 13) ${qaLocationsFilter(filterAlias)} ${qaSpecialitiesFilter(filterAlias)}`;
                let selectClause: string = chart.toSelect.join(', ');
                const toSelect: string = chart.toSelect.join(', ');
                let joinClause: string = '';
                let joinToSelect: string = '';
                // Map each filter to the corresponding SQL condition
                const filters: Object = {
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
                const orderby: string = `order by ${chart.orderby}`;
                const query: string = `SELECT ${selectClause} FROM ${chart.tableName} ${joinClause} WHERE ${whereClause} group by ${toSelect} ${joinToSelect} ${orderby}`;

                const info: object[] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });

                if (info && info.length > 0) {
                    return info;
                } else {
                    throw new Error('No Data to Export')
                }
            }
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
            let whereClause: string = `visFac.case_type_id IS NOT NULL AND visFac.facility_location_id IS NOT NULL AND visFac.speciality_id IS NOT NULL AND visFac.patient_id IS NOT NULL AND visFac.case_id IS NOT NULL AND visFac.deleted_at IS NULL AND (visFac.created_by::integer IS NULL OR visFac.created_by::integer != 13) AND (visFac.updated_by::integer IS NULL OR visFac.updated_by::integer != 13) ${qaLocationsFilter('visFac')} ${qaSpecialitiesFilter('visFac')}`;
            if (provider_ids.length === 1) {
                whereClause += `AND provider_id = ${provider_ids} `;
            }
            if (facility_location_ids && facility_location_ids.length > 0) {
                whereClause += ` AND facility_location_id IN (${facility_location_ids}) `;
            }
            if (speciality_ids && speciality_ids.length > 0) {
                whereClause += ` AND speciality_id IN (${speciality_ids})`;
            }
            if (month_id) {
                const year: number = (new Date).getFullYear();
                whereClause += ` AND EXTRACT('month' from visFac.visit_date) = ${month_id} 
                                  AND EXTRACT('year' from visFac.visit_date)= ${year}`; // Fetch data of the selected month
            }
            if (case_type_ids && case_type_ids.length > 0) {
                whereClause += ` AND visFac.case_type_id IN (${case_type_ids})`;
            }

            if (fromDate && toDate) {
                whereClause += ` AND visFac.visit_date >= '${fromDate}' AND visFac.visit_date <= '${toDate}'`;
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
                whereClause += ` AND visFac.visit_date >= current_date - interval '${interval}'
                                 AND visFac.visit_date <= current_date`;
            }
            const bill_status_Query: string = `
                SELECT
                COUNT(*) AS unfinalized_visit,
                current_date - visFac.visit_date AS date_difference
                FROM
                    visits_fact AS visFac
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

    public getMissingVisitStatus = async (reqData: typings.GenericReqObjI): Promise<object> => {
        try {
            const {
                month_id,
                speciality_ids,
                provider_ids,
                fromDate,
                toDate,
                time_span_id,
                facility_location_ids
            }: GlobalFiltersRequest["user"] = reqData;
            let whereClause: string = `visFac.case_type_id IS NOT NULL AND visFac.facility_location_id IS NOT NULL AND visFac.speciality_id IS NOT NULL AND visFac.patient_id IS NOT NULL AND visFac.case_id IS NOT NULL AND visFac.deleted_at IS NULL AND (visFac.created_by::integer IS NULL OR visFac.created_by::integer != 13) AND (visFac.updated_by::integer IS NULL OR visFac.updated_by::integer != 13) ${qaLocationsFilter('visFac')} ${qaSpecialitiesFilter('visFac')}`;
            if (provider_ids.length === 1) {
                whereClause += `AND provider_id = ${provider_ids} `;
            }
            if (facility_location_ids && facility_location_ids.length > 0) {
                whereClause += ` AND facility_location_id IN (${facility_location_ids}) `;
            }
            if (speciality_ids && speciality_ids.length > 0) {
                whereClause += ` AND speciality_id IN (${speciality_ids})`;
            }
            if (month_id) {
                const year: number = (new Date).getFullYear();
                whereClause += ` AND EXTRACT('month' from visFac.visit_date) = ${month_id} 
                                  AND EXTRACT('year' from visFac.visit_date)= ${year}`; // Fetch data of the selected month
            }
            if (fromDate && toDate) {
                whereClause += ` AND visFac.visit_date >= '${fromDate}' AND visFac.visit_date <= '${toDate}'`;
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
                    4: '11 months',
                    5: `${daysDifference} days`,
                    default: '1 week',
                };

                interval = timeSpanMappings[time_span_id] || timeSpanMappings.default;

                whereClause += ` AND visFac.visit_date >= current_date - interval '${interval}'
                                 AND visFac.visit_date <= current_date`;
            }
            const visitQuery: string = `
            SELECT
            COALESCE(
                CASE
                    WHEN caseTypeDim.name = 'NoFault/Workers Comp' THEN '50/50'
                    ELSE caseTypeDim.name
                END,
                'Total'
                ) AS case_type_name,
                COUNT(CASE WHEN visFac.visit_icd_code_status::integer = 0 THEN 1 END) AS missing_icd,
                COUNT(CASE WHEN visFac.visit_cpt_code_status::integer = 0 THEN 1 END) AS missing_cpt,
                COUNT(CASE WHEN visFac.document_uploaded::Boolean = false THEN 1 END) AS missing_document  
            FROM
                visits_fact visFac
            JOIN
                case_types_dim caseTypeDim ON visFac.case_type_id = caseTypeDim.case_type_id AND visFac.case_type_id IS NOT NULL
            WHERE ${whereClause} AND caseTypeDim.deleted_at IS NULL
            GROUP BY
                GROUPING SETS ((caseTypeDim.name), ())
            ORDER BY
                CASE WHEN COALESCE(
                        CASE
                            WHEN caseTypeDim.name = 'NoFault/Workers Comp' THEN '50/50'
                            ELSE caseTypeDim.name
                        END,
                        'Total'
                    ) = 'Total' THEN 1 ELSE 0 END,
                    case_type_name;
                `;

            const [results] = await sequelize.query(visitQuery);
            const allCaseTypes = ["50/50", "Corporate", "Lien", "NF", "Private", "Self", "WC", "WC (Employer)", "Total"];
            // Create a map for faster lookup
            const caseTypeMap = new Map<string, any>();
            const resultArray: any[] = [];

            (results as any[]).forEach(value => {
                caseTypeMap.set(value.case_type_name, value);
                resultArray.push(value);
            });
            // Check and add missing case types with "0" values
            allCaseTypes.forEach(caseType => {
                if (!caseTypeMap.has(caseType)) {
                    resultArray.push({
                        "case_type_name": caseType,
                        "missing_icd": "0",
                        "missing_cpt": "0",
                        "missing_document": "0"
                    });
                }
            });
            // Ensure "Total" is at the end
            const totalIndex = resultArray.findIndex(item => item.case_type_name === "Total");
            if (totalIndex !== -1) {
                const totalItem = resultArray.splice(totalIndex, 1)[0];
                resultArray.push(totalItem);
            }
            return resultArray;
        } catch (error) {
            throw error
        }
    }
}