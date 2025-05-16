import * as typings from '../interfaces';
import { referralFilter } from '../interfaces';

export class Helper {

    protected filterNonEmpty = <T>(arr: T[]): T[] => arr.filter((value: T): boolean => JSON.stringify(value) !== '[]');

    protected filterNonNull = <T>(arr: T[]): T[] => arr.filter((e: T): boolean => e !== null && e !== undefined);

    protected filterUnique = <T>(data: T[]): T[] => data.filter((v: T, i: number, a: T[]): boolean => a.indexOf(v) === i);

    protected cutomPaginate = <T, Y>(array: T[], page_size: number, page_number: number): T[] => array.slice((page_number - 1) * page_size, page_number * page_size);

    protected shallowCopy = <T>(data: T): T => JSON.parse(JSON.stringify(data));

    protected sort = <T, Y>(items: T[], attribute: Y): T[] => items.sort((a: T, b: T): number => a[`${String(attribute)}`] - b[`${String(attribute)}`]);

    protected fromDateToDate = (fromDate: Date, toDate: Date, isPayment?: Boolean) => {
        const fromdateObj: Date = new Date(fromDate);
        const todateObj: Date = new Date(toDate);
        // Calculate the difference in milliseconds between todate and fromdate
        const dateDifferenceMilliseconds: number = todateObj.getTime() - fromdateObj.getTime();
        // Convert milliseconds to days
        const daysDifference: string = (dateDifferenceMilliseconds / (1000 * 60 * 60 * 24)) + ' days';
        if (isPayment) {
            const payCurTime: string = `check_date >= '${fromDate}'::DATE  AND check_date <= '${toDate}'::DATE `;
            const payPreTime: string = `check_date >= ('${fromDate}'::DATE - INTERVAL '${daysDifference}') AND check_date <= '${fromDate}'::DATE`;
            return { payCurTime, payPreTime }
        }
        const billCurTime: string = `bill_date >= '${fromDate}'::DATE  AND bill_date <= '${toDate}'::DATE `;
        const billPreTime: string = `bill_date >= ('${fromDate}'::DATE - INTERVAL '${daysDifference}') AND bill_date <= '${fromDate}'::DATE`;
        return { billCurTime, billPreTime }
    }
    protected getCurrentDate = () => {
        const currentDate: Date = new Date();
        const totalCurrentDate: number = currentDate.getDate();
        return totalCurrentDate;
    };
    protected removeCountEntries(obj: object) {
        for (const key in obj) {
            if (obj[key].hasOwnProperty('countEntries')) {
                delete obj[key].countEntries;
            }
        }
    }

    protected getQueryClauseForAr(columnName: string) {
        const timePeriodMapping = {
            'Balance_0_to_29_Days': '0_to_29_days',
            'Balance_30_to_59_Days': '30_to_59_days',
            'Balance_60_to_89_Days': '60_to_89_days',
            'Balance_90_to_119_Days': '90_to_119_days',
            'Balance_120_to_149_Days': '120_to_149_days',
            'Balance_150PlusDays': '150plusdays',
            'total_outstanding_amount': 'total'
        };
        if (!(columnName in timePeriodMapping)) {
            return ``;
        }
        const timePeriod = timePeriodMapping[columnName];
        return `
            ARRAY_AGG(bill_ID) FILTER (WHERE ${columnName} > 0) AS Bill_label_${timePeriod},
            ARRAY_AGG(case_ID) FILTER (WHERE ${columnName} > 0) AS case_id_${timePeriod},
            ARRAY_AGG(Billed_date) FILTER (WHERE ${columnName} > 0) AS Billed_Date_${timePeriod},
            ARRAY_AGG(Bill_Status) FILTER (WHERE ${columnName} > 0) AS Bill_Status_${timePeriod},
            ARRAY_AGG(Accident_Date) FILTER (WHERE ${columnName} > 0) AS Accident_Date_${timePeriod},
            ARRAY_AGG(Denial_Status) FILTER (WHERE ${columnName} > 0) AS Denial_Status_${timePeriod},
            ARRAY_AGG(EOR_Status) FILTER (WHERE ${columnName} > 0) AS EOR_Status_${timePeriod},
            ARRAY_AGG(Payment_Status) FILTER (WHERE ${columnName} > 0) AS Payment_Status_${timePeriod},
            ARRAY_AGG(Verification_Status) FILTER (WHERE ${columnName} > 0) AS Verification_Status_${timePeriod},
            ARRAY_AGG(Patient_Name) FILTER (WHERE ${columnName} > 0) AS Patient_Name_${timePeriod},
            ARRAY_AGG(Case_Type) FILTER (WHERE ${columnName} > 0) AS Case_Type_${timePeriod},
            ARRAY_AGG(Practice_location) FILTER (WHERE ${columnName} > 0) AS Practice_location_${timePeriod},
            ARRAY_AGG(specialty) FILTER (WHERE ${columnName} > 0) AS speciality_${timePeriod},
            ARRAY_AGG(Provider_Name) FILTER (WHERE ${columnName} > 0) AS Provider_Name_${timePeriod},
            ARRAY_AGG(Dos_From_Date) FILTER (WHERE ${columnName} > 0) AS Dos_From_Date_${timePeriod},
            ARRAY_AGG(Dos_To_Date) FILTER (WHERE ${columnName} > 0) AS Dos_To_Date_${timePeriod},     
            ARRAY_AGG(Check_Date) FILTER (WHERE ${columnName} > 0) AS Check_Date_${timePeriod},
            ARRAY_AGG(Check_Amount) FILTER (WHERE ${columnName} > 0) AS Check_Amount_${timePeriod},
            ARRAY_AGG(billed_amount) FILTER (WHERE ${columnName} > 0) AS billed_amount_${timePeriod},
            ARRAY_AGG(paid_amount) FILTER (WHERE ${columnName} > 0) AS paid_amount_${timePeriod},
            ARRAY_AGG(outstanding_amount) FILTER (WHERE ${columnName} > 0) AS outstanding_amount_${timePeriod},
            ARRAY_AGG(write_Off) FILTER (WHERE ${columnName} > 0) AS write_Off_${timePeriod},
            ARRAY_AGG(overpayment) FILTER (WHERE ${columnName} > 0) AS overpayment_${timePeriod},
            ARRAY_AGG(Interest) FILTER (WHERE ${columnName} > 0) AS Interest_${timePeriod},
            ARRAY_AGG(Attorney_Name) FILTER (WHERE ${columnName} > 0) AS Attorney_Name_${timePeriod},
            ARRAY_AGG(Firm_Name) FILTER (WHERE ${columnName} > 0) AS Firm_Name_${timePeriod},
            ARRAY_AGG(Bill_Recipient_Name) FILTER (WHERE ${columnName} > 0) AS Bill_Recipient_Name_${timePeriod},
            ARRAY_AGG(Denial_Type) FILTER (WHERE ${columnName} > 0) AS Denial_Type_${timePeriod}`;
    }

    protected escapeSqlValue = (value: any): string => {
        if (!value) {
            return null;
        }
        const parts: string[] = `${value}`.split(',');
        const concatenatedValue: string = parts.join(' ');
        const escapedValue: string = concatenatedValue.replace(/'/g, "''");
        return escapedValue;
    };


    protected getQueryClause(columnName: string) {
        const mapping = {
            'Balance_0_to_29_Days': '0_to_29_days',
            'Balance_30_to_59_Days': '30_to_59_days',
            'Balance_60_to_89_Days': '60_to_89_days',
            'Balance_90_to_119_Days': '90_to_119_days',
            'Balance_120_to_149_Days': '120_to_149_days',
            'Balance_150_to_179_Days': '150_to_179_days',
            'Balance_180PlusDays': '180plusdays',
        };

        const daysRange = mapping[columnName];
        if (!daysRange) {
            return ``;
        }

        return `
            ARRAY_AGG(BILL_ID) FILTER (WHERE ${columnName} > 0) AS BILL_ID_${daysRange},
            ARRAY_AGG(Billed_Date) FILTER (WHERE ${columnName} > 0) AS Billed_Date_${daysRange},
            ARRAY_AGG(case_id) FILTER (WHERE ${columnName} > 0) AS case_id_${daysRange},
            ARRAY_AGG(DOS_From_Date) FILTER (WHERE ${columnName} > 0) AS DOS_From_Date_${daysRange},
            ARRAY_AGG(DOS_To_Date) FILTER (WHERE ${columnName} > 0) AS DOS_To_Date_${daysRange},
            ARRAY_AGG(Paid_Amount) FILTER (WHERE ${columnName} > 0) AS Paid_Amount_${daysRange},
            ARRAY_AGG(Write_OFF_Amount) FILTER (WHERE ${columnName} > 0) AS Write_OFF_Amount_${daysRange},
            ARRAY_AGG(billed_amount) FILTER (WHERE ${columnName} > 0) AS billed_amount_${daysRange},
            ARRAY_AGG(denied_amount) FILTER (WHERE ${columnName} > 0) AS denied_amount_${daysRange},
            ARRAY_AGG(DOA) FILTER (WHERE ${columnName} > 0) AS DOA_${daysRange},
            ARRAY_AGG(Case_Type) FILTER (WHERE ${columnName} > 0) AS Case_Type_${daysRange},
            ARRAY_AGG(Patient_Name) FILTER (WHERE ${columnName} > 0) AS Patient_Name_${daysRange},
            ARRAY_AGG(Provider_Name) FILTER (WHERE ${columnName} > 0) AS Provider_Name_${daysRange},
            ARRAY_AGG(Practice_Location) FILTER (WHERE ${columnName} > 0) AS Practice_Location_${daysRange},
            ARRAY_AGG(Posted_Date) FILTER (WHERE ${columnName} > 0) AS Posted_Date_${daysRange},
            ARRAY_AGG(Denial_Date) FILTER (WHERE ${columnName} > 0) AS Denial_Date_${daysRange},
            ARRAY_AGG(Bill_Recipient_Name) FILTER (WHERE ${columnName} > 0) AS Bill_Recipient_Name_${daysRange}
            `;

    }

    protected calculateCustomInterval = () => {
        const currentDate: Date = new Date();
        const firstDayOfMonth: Date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const daysDifference: number = Math.floor((currentDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
        return `${daysDifference} days`;
    };
    protected monthId = (month_id: number, isPayment?: Boolean) => {
        let dayInMonth: typings.MonthInfo;
        // Get current date information
        const currentDate: Date = new Date();
        const currentYear: number = currentDate.getFullYear()
        // Calculate the total days and start/end dates for the specified month
        dayInMonth = this.daysInMonth(currentYear, month_id);
        const newFromDate: string = this.formatDateToYYYYMMDD(dayInMonth.startDate);
        const newToDate: string = this.formatDateToYYYYMMDD(dayInMonth.endDate);
        const daysDifference: string = dayInMonth.totalDays + ' days';
        if (isPayment) {
            const payCurTime: string = `check_date >= '${newFromDate}'::DATE  AND check_date <= '${newToDate}'::DATE `;
            const payPreTime: string = `check_date >= ('${newFromDate}'::DATE - INTERVAL '${daysDifference}') AND check_date <= '${newFromDate}'::DATE`;
            return { payCurTime, payPreTime }
        }
        // Construct time intervals for SQL queries based on the specified month
        const billCurTime: string = `bill_date >= '${newFromDate}'::DATE  AND bill_date <= '${newToDate}'::DATE `;
        const billPreTime: string = `bill_date >= ('${newFromDate}'::DATE - INTERVAL '${daysDifference}') AND bill_date <= '${newFromDate}'::DATE`;
        return { billCurTime, billPreTime }
    }

    protected addGMTHours = (fromDate: Date | string, toDate: Date | string) => {
        const startDate: Date = new Date(fromDate);
        const endDate: Date = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1)
        const startHour: number = startDate.getTimezoneOffset() === 300 ? 5 : 4;
        const endHour: number = endDate.getTimezoneOffset() === 300 ? 4 : 3;

        startDate.setUTCHours(startHour, 0, 0, 0);
        endDate.setUTCHours(startHour, 59, 59, 999);
        const fromDateAdjusted: string = startDate.toISOString();
        const toDateAdjusted: string = endDate.toISOString();
        return { fromDateAdjusted, toDateAdjusted }
    }

    protected daysInMonth = (year: number, month: number) => {
        let nextMonth: number, nextYear: number;
        nextMonth = month + 1;
        nextYear = year;

        // Get the first day of the next month (start of the current month)
        const startOfMonth: Date = new Date(year, month - 1, 1); // Month is 0-indexed

        // Calculate the last day of the current month (subtract 1 day from the start of next month)
        const endOfMonth: Date = new Date(nextYear, nextMonth - 1, 0);

        // Special case: if the specified month is the current month, set endDate to the current date
        if (startOfMonth.getMonth() === new Date().getMonth()) {
            startOfMonth.setHours(0, 0, 0, 0); // Set time to midnight
            endOfMonth.setHours(0, 0, 0, 0); // Set time to midnight
            endOfMonth.setDate(new Date().getDate()); // Set endDate to the current date
        }

        const totalDays = (endOfMonth.getDate() - startOfMonth.getDate()) + 1;

        return {
            totalDays: totalDays,
            startDate: startOfMonth,
            endDate: endOfMonth,
        };
    }
    protected formatDateToYYYYMMDD(date: Date) {
        return date.toISOString().split('T')[0];
    }
    protected createEmptyReferralFilter(): referralFilter {
        return {
            selectClause: '',
            subGroupByClause: '',
            joinCondition: '',
            joinClause: '',
            whereClause: '',
            groupByClause: '',
            extraJoins: '',
            extraSelect: '',
            extraGroupBy: '',
            extraWhereClause: ''
        };
    }
    protected formattedPhoneQuery(phoneOrFax: string): string {
        return `CASE 
                    WHEN facLoc.facility_location_${phoneOrFax} IS NULL THEN NULL 
                    ELSE CONCAT(
                        '(', 
                        SUBSTRING(facLoc.facility_location_${phoneOrFax}, 1, 3), ') ', 
                        SUBSTRING(facLoc.facility_location_${phoneOrFax}, 4, 3), '-', 
                        SUBSTRING(facLoc.facility_location_${phoneOrFax}, 7, 4)
                    ) 
                END AS facility_${phoneOrFax}`;
    }

    protected formattedPhoneQueryReferal(phoneOrFax: string): string {
        return `CASE 
                    WHEN COALESCE(in_house_data.facility_${phoneOrFax}, is_referral_data.facility_${phoneOrFax}) IS NULL THEN NULL 
                    ELSE CONCAT(
                        '(', 
                        SUBSTRING(COALESCE(in_house_data.facility_${phoneOrFax}, is_referral_data.facility_${phoneOrFax}), 1, 3), ') ', 
                        SUBSTRING(COALESCE(in_house_data.facility_${phoneOrFax}, is_referral_data.facility_${phoneOrFax}), 4, 3), '-', 
                        SUBSTRING(COALESCE(in_house_data.facility_${phoneOrFax}, is_referral_data.facility_${phoneOrFax}), 7, 4)
                    ) 
                END AS facility_${phoneOrFax}`;
    }

    protected createSummaryStatusQuery = (incomingFilters) => {
        const localAppointmentSummaryQuery = `
        SELECT
            ${incomingFilters?.selectClause} ${incomingFilters?.extraSelect} ${incomingFilters?.subGroupByClause},         
            SUM (
                CASE 
                WHEN appStatus.slug = 'completed' 
                OR appStatus.slug = 'checked_out' THEN 1
                WHEN appStatus.slug = 'arrived' AND visFac.visit_id IS NOT NULL THEN 1 
                ELSE 0
            END) AS VC,
            
            SUM(CASE 
            WHEN appStatus.slug = 'scheduled' 
            OR appStatus.slug = 're_scheduled' 
            OR (appStatus.slug = 'checked_in' AND visFac.visit_id IS NOT NULL) THEN 1
            ELSE 0 
                END) AS SC,
    
            SUM(
                CASE
                    WHEN appStatus.slug = 'no_show' THEN 1 
                    WHEN appStatus.slug = 'arrived' AND visFac.visit_id IS NULL THEN 1 
                    WHEN appStatus.slug = 'checked_in' AND visFac.visit_id IS NULL THEN 1
                    ELSE 0
                END) AS NS,
            
            SUM(
                CASE 
                    WHEN appStatus.slug = 'completed' 
                    OR appStatus.slug = 'checked_out' THEN 1
                    WHEN appStatus.slug = 'arrived' AND visFac.visit_id IS NOT NULL THEN 1
                    WHEN appStatus.slug = 'scheduled' 
                    OR appStatus.slug = 're_scheduled' THEN 1
                    WHEN appStatus.slug = 'no_show' THEN 1
                    WHEN appStatus.slug = 'arrived' AND visFac.visit_id IS NULL THEN 1
                    WHEN appStatus.slug = 'checked_in' THEN 1 
                    ELSE 0
                END) AS Total
        FROM 
            appointment_fact AS appFac
        INNER JOIN 
            facility_location_dim AS facLoc ON appFac.facility_location_id = facLoc.facility_location_id AND facLoc.deleted_at IS NULL AND facLoc.facility_location_name is NOT NULL
        LEFT JOIN 
            facilities_dim AS fac ON appFac.facility_id = fac.facility_id AND fac.deleted_at IS NULL AND fac.facility_name is NOT NULL
        LEFT JOIN
            appointment_type_dim AS appType ON appFac.appointment_type_id = appType.appointment_type_id AND appType.deleted_at IS NULL
        LEFT JOIN
            visits_fact AS visFac ON appFac.appointment_id = visFac.appointment_id AND visFac.deleted_at IS NULL
        LEFT JOIN 
            appointment_status_dim AS appStatus ON appFac.appointment_status_id = appStatus.appointment_status_id AND appStatus.deleted_at IS NULL
        LEFT JOIN 
            specialities_dim AS specDim ON appFac.speciality_id = specDim.specialty_id AND specDim.deleted_at IS NULL AND specDim.name is NOT NULL
        LEFT JOIN 
            users_dim AS usrDim ON appFac.provider_id = usrDim.user_id AND usrDim.deleted_at IS NULL AND CONCAT(usrDim.first_name, ' ', usrDim.middle_name, ' ', usrDim.last_name) IS NOT NULL
        LEFT JOIN 
            case_fact_new casFac ON appFac.case_id = casFac.case_id AND casFac.deleted_at IS NULL
        ${incomingFilters?.joinCondition}  
        JOIN (
		    SELECT DISTINCT physician_id,
            clinic_id,
            facility_id,
			clinic_locations_id 
		    FROM physician_clinics_dim 
		    WHERE deleted_at IS NULL
		) AS phyClinDim ON phyClinDim.physician_id = appFac.physician_id 
               ${incomingFilters?.joinClause}
               ${incomingFilters?.extraJoins}
            WHERE 
            appFac.is_cancelled = 0
            ${incomingFilters?.whereClause}
            GROUP BY 
            ${incomingFilters?.groupByClause}
            ${incomingFilters?.extraGroupBy}
        ORDER BY 
            ${incomingFilters?.groupByClause}
        `;

        return localAppointmentSummaryQuery;
    }
    protected cleanData = obj => {
        if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([key, value]) => {
                if (value && typeof value === 'object') {
                    // Recursively clean nested objects
                    this.cleanData(value);

                    // If the cleaned object is now empty, delete it
                    if (Object.keys(value).length === 0) {
                        delete obj[key];
                    }
                }

                // Remove any keys with null, undefined, or empty string values
                if (value === undefined || value === null || value === '' ||
                    (typeof value === 'object' && Object.keys(value).length === 0)) {
                    delete obj[key];
                }
            });
        }
    };
    protected summaryPDFGroupData = (data, filters) => {
        const { group_by_id, viewbyPdf, subgroup_by_id } = filters;

        let groupedData = {};

        data.forEach(item => {
            let firstLevelKey;
            if (group_by_id === 1 || subgroup_by_id === 1 || viewbyPdf === 'facility') {
                firstLevelKey = item.facility_name;
            }
            else {
                firstLevelKey = item.facility_location_name;
            }



            if (!groupedData[firstLevelKey]) {
                groupedData[firstLevelKey] = {
                    facility_address: item.facility_address,
                    facility_phone: item.facility_phone,
                    facility_fax: item.facility_fax,
                    groups: {}
                };

            }
            let secondLevelKey = item.outside_referring;
            if (group_by_id === 1 || subgroup_by_id === 1) {
                secondLevelKey = item.facility_location_name;
            }
            else if (filters.in_house) {
                secondLevelKey = item.outside_referring;
            }
            else if (!filters.in_house && (item.group_by_qualifier || item.group_by_name) && (group_by_id !== 1 || subgroup_by_id !== 1)) {
                secondLevelKey = item.group_by_qualifier || item.group_by_name;
            }

            if (!groupedData[firstLevelKey].groups[secondLevelKey]) {
                groupedData[firstLevelKey].groups[secondLevelKey] = {};
            }
            if (subgroup_by_id && item.subgroup_by_qualifier) {
                const thirdLevelKey = item.subgroup_by_qualifier;
                // Only add the group if valid data exists
                if (!groupedData[firstLevelKey].groups[secondLevelKey][thirdLevelKey] &&
                    (item.vc || item.sc || item.ns || item.total)) {
                    groupedData[firstLevelKey].groups[secondLevelKey][thirdLevelKey] = {
                        outside_referring_address: item.outside_referring_address || 'N/A',
                        outside_phone: item.outside_phone || 'N/A',
                        outside_fax: item.outside_fax || 'N/A',
                        vc: item.vc || 0,
                        sc: item.sc || 0,
                        ns: item.ns || 0,
                        total: item.total || 0
                    };
                }
            } else {
                // Handle case where no subgroup exists, only add valid values
                if ((item.vc || item.sc || item.ns || item.total) && (group_by_id === 1 || subgroup_by_id === 1)) {
                    groupedData[firstLevelKey].groups[secondLevelKey] = {
                        outside_referring_address: item.facility_address || 'N/A',
                        outside_phone: item.facility_phone || 'N/A',
                        outside_fax: item.facility_fax || 'N/A',
                        vc: item.vc || 0,
                        sc: item.sc || 0,
                        ns: item.ns || 0,
                        total: item.total || 0
                    };
                } else if (item.vc || item.sc || item.ns || item.total) {
                    groupedData[firstLevelKey].groups[secondLevelKey] = {
                        vc: item.vc || 0,
                        sc: item.sc || 0,
                        ns: item.ns || 0,
                        total: item.total || 0
                    };
                }
            }
        });

        // Remove any undefined keys at any level
        // Improved Cleanup Function


        this.cleanData(groupedData);
        groupedData = this.calculateFacilityTotals(groupedData, subgroup_by_id);

        return groupedData;
    }
    protected calculateFacilityTotals(facilityData: any, subgroup_by_id?: number) {
        const updatedData = { ...facilityData };
        function calculateWithGroupById(groups: any) {
            const totals: any = {};
            const grandTotal: any = {};

            for (const groupName in groups) {
                const group = groups[groupName];

                for (const visitType in group) {
                    const visit = group[visitType];

                    if (!totals[visitType]) {
                        totals[visitType] = {
                            vc: 0,
                            sc: 0,
                            ns: 0,
                        };
                        grandTotal[visitType] = {
                            vc: null,
                            sc: 0,
                            ns: null,
                        };
                    }

                    totals[visitType].vc += parseInt(visit.vc, 10);
                    totals[visitType].sc += parseInt(visit.sc, 10);
                    totals[visitType].ns += parseInt(visit.ns, 10);

                    grandTotal[visitType].vc = 'no';
                    grandTotal[visitType].sc += parseInt(visit.vc, 10) + parseInt(visit.sc, 10) + parseInt(visit.ns, 10);
                    grandTotal[visitType].ns = 'no';
                }
            }

            return { totals, grandTotal };
        }

        function calculateWithoutGroupById(groups: any) {
            const totals = {
                vc: 0,
                sc: 0,
                ns: 0,
                total: 0,
            };

            const grandTotal = {
                vc: 0,
                sc: 0,
                ns: 0,
                total: 0,
            };

            for (const groupName in groups) {
                const group = groups[groupName];

                totals.vc += parseInt(group.vc || "0", 10);
                totals.sc += parseInt(group.sc || "0", 10);
                totals.ns += parseInt(group.ns || "0", 10);
                totals.total += parseInt(group.total || "0", 10);

                grandTotal.vc += parseInt(group.vc || "0", 10);
                grandTotal.sc += parseInt(group.sc || "0", 10);
                grandTotal.ns += parseInt(group.ns || "0", 10);
                grandTotal.total += parseInt(group.total || "0", 10);
            }

            return { totals, grandTotal };
        }

        for (const facilityName in updatedData) {
            const facility = updatedData[facilityName];
            const groups = facility.groups;

            let totals, grandTotal;

            if (subgroup_by_id) {
                ({ totals, grandTotal } = calculateWithGroupById(groups));
            } else {
                ({ totals, grandTotal } = calculateWithoutGroupById(groups));
            }

            if (subgroup_by_id) {
                facility.groups["Sub Total"] = totals;
                facility.groups["Grand Total"] = grandTotal;
            } else {
                facility.groups["Sub Total"] = { ...totals };
                facility.groups["Grand Total"] = {
                    vc: 'no',
                    sc: totals.vc + totals.sc + totals.ns,
                    ns: 'no',
                    total: grandTotal.total
                };
            }
        }

        return updatedData;
    }

    protected dateFormatModifier(date) {
        const updatedDate = date.split("-");
        let updatedDateArr = [];
        for (let i = updatedDate.length - 1; i >= 0; i--) {
            updatedDateArr.push(updatedDate[i]);
        }

        const updatedDateString = updatedDateArr.join("/")
        return updatedDateString;
    }

    protected groupByFacilityAppointmentAndPatient = (data) => {
        const facilities = {};
        let calculatedStartDate = '99/99/9999';
        let calculatedEndDate = '00/00/0000'
        data.forEach((item) => {
            const facility = item.facility_location;
            const appointmentDate = item.appointment_date;
            const patient = item.patient_name;
            if (calculatedStartDate > appointmentDate) calculatedStartDate = appointmentDate;
            if (calculatedEndDate < appointmentDate) calculatedEndDate = appointmentDate;
            // Initialize facility if it doesn't exist
            if (!facilities[facility]) {
                facilities[facility] = {};
            }

            // Initialize appointmentDate under the facility if it doesn't exist
            if (!facilities[facility][appointmentDate]) {
                facilities[facility][appointmentDate] = {};
            }

            // Initialize patient under appointmentDate if it doesn't exist
            if (!facilities[facility][appointmentDate][patient]) {
                facilities[facility][appointmentDate][patient] = [];
            }

            // Push the appointment data to the respective patient
            facilities[facility][appointmentDate][patient].push(item);
        });
        return { facilities, calculatedStartDate, calculatedEndDate };

    };

    protected appointmentsSumCalculator(result) {
        let vcTotal: number = 0;
        let scTotal: number = 0;
        let nsTotal: number = 0;

        for (let i = 0; i < result.length; i++) {
            const item = result[i];
            if (item) {
                vcTotal += Number(item['vc']) || 0;
                scTotal += Number(item['sc']) || 0;
                nsTotal += Number(item['ns']) || 0;
            }
        }

        return {
            totalVC: vcTotal,
            totalSC: scTotal,
            totalNS: nsTotal,
            grandTotal: vcTotal + scTotal + nsTotal
        };
    }
}