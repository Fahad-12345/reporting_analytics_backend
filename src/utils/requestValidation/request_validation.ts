import { GlobalFiltersRequest } from "../../interfaces/contracts/request_model";



export let validateQuery = (query) => {
    try {

        let toDateCheck: Date, fromDateCheck: Date;
        // !query && query.length <= 0
        if (!query && query.length <= 0 || ((query.time_span_id === '' || query.time_span_id === 0) && (query.month_id === '' || query.month_id === 0) && (query.speciality_ids).length === 0 && (query.case_type_ids).length === 0 && (query.provider_ids).length === 0 && (query.facility_location_ids).length === 0 && query.fromDate === '' && query.toDate === '' && (query.granularity_type_id === '' || query.granularity_type_id === 0))) {
            return "query is empty. Need at least one date filter";
        }
        else {

            // validating filter size and names
            const newInterface: GlobalFiltersRequest["user"] = {
                time_span_id: 0,
                month_id: 0,
                facility_location_ids: [],
                speciality_ids: [],
                provider_ids: [],
                case_type_ids: [],
                fromDate: new Date,
                toDate: new Date,
                granularity_type_id: 0,
                chartName: ''
            };
            const keysInInterface: string[] = Object.keys(newInterface);
            // const requestKeys: string[] = Object.keys(query);
            // const keysInInterface = ['time_span_id','month_id','facility_location_ids','speciality_ids','provider_ids','fromDate','toDate','granularity_type_id'];
            const keysInRequest = Object.keys(query);

            const missingKeys = keysInInterface.filter(key => !keysInRequest.includes(key));
            if (missingKeys.length > 0) {
                return `${missingKeys} Invalid arguments`;
            }
            // Check if there are any extra keys in the requestfromdateto
            const extraKeys = keysInRequest.filter(key => !keysInInterface.includes(key));
            if (extraKeys.length > 0) {
                return `Invalid filters in the request: ${extraKeys.join(', ')}`;
            }

            const { time_span_id, month_id, facility_location_ids, speciality_ids, provider_ids, fromDate, toDate, granularity_type_id, case_type_ids } = query;

            if (time_span_id) {

            }
            if ((time_span_id && month_id) || (month_id && (fromDate || toDate)) || (time_span_id && (fromDate || toDate))) {
                return "Cannot pass more than one date filter"
            }
            else if ((fromDate && !toDate) || (toDate && !fromDate)) {
                return "both fromDate and toDate required"
            }
            else if ((fromDate && toDate) && !granularity_type_id) {
                return 'gran required with dates'
            }
            else if ((granularity_type_id && !(fromDate && toDate)) || (granularity_type_id && (month_id || time_span_id))) {
                return " Granularity can only be given with fromDate and toDate"
            }
            else {
                if (time_span_id) {
                    if (typeof (time_span_id) != "number") {

                        return "time_span_id must be a number";
                    }
                    if (time_span_id > 5 || time_span_id <= 0) {
                        return "time_span_id must lie between 1 and 5"
                    }
                }
                if (month_id) {
                    const date = new Date();
                    let month = date.getMonth() + 1;
                    if (typeof (month_id) != "number") {
                        return "month_id must be a number";
                    }
                    if (month_id > month || month_id <= 0) {
                        return `month_id must lie between 1 and ${month}`
                    }
                }
                if (granularity_type_id) {
                    if (typeof (granularity_type_id) != "number") {
                        return "granularity_type_id must be a number";
                    }
                    if (granularity_type_id > 4 || granularity_type_id < 1) {
                        return "granularity_type_id must lie between 1 and 4"
                    }
                }
                if (facility_location_ids && facility_location_ids.length > 0 && (!(Array.isArray(facility_location_ids)) || facility_location_ids.every((item) => typeof item != 'number'))) {
                    return "facility_location_ids must be an array of numbers";
                }
                if (speciality_ids && speciality_ids.length > 0 && (!(Array.isArray(speciality_ids)) || speciality_ids.every((item) => typeof item != 'number'))) {
                    return "speciality_ids must be an array of numbers";
                }
                if (provider_ids && provider_ids.length > 0 && (!(Array.isArray(provider_ids)) || provider_ids.every((item) => typeof item != 'number'))) {
                    return "provider_ids must be an array of numbers";
                }
                if (case_type_ids && case_type_ids.length > 0 && (!(Array.isArray(case_type_ids)) || case_type_ids.every((item) => typeof item != 'number'))) {
                    return "case_type_ids must be an array of numbers";
                }
                if (fromDate && (typeof fromDate === "string")) {
                    const dateParts = fromDate.split("-");
                    if (dateParts.length === 3) {
                        const year = parseInt(dateParts[0], 10);
                        const month = parseInt(dateParts[1], 10);
                        const day = parseInt(dateParts[2], 10);
                        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                            fromDateCheck = new Date(`${year}-${month}-${day}`);
                            if (isNaN(fromDateCheck.getTime())) {
                                return "invalid FROM-DATE"
                            }
                        }
                    }
                    else {
                        return 'Invalid Date Parts in FROM-DATE';
                    }
                }

                if (toDate && (typeof toDate === "string")) {
                    const dateParts = toDate.split("-");
                    if (dateParts.length === 3) {
                        const year = parseInt(dateParts[0], 10);
                        const month = parseInt(dateParts[1], 10);
                        const day = parseInt(dateParts[2], 10);
                        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                            toDateCheck = new Date(`${year}-${month}-${day}`);

                            if (isNaN(toDateCheck.getTime())) {
                                return "invalid TO-DATE"
                            }
                        }
                    }
                    else {
                        return 'Invalid Date Parts in TO-DATE';
                    }
                }

                if (toDateCheck < fromDateCheck) {
                    return "toDate must be equal or greater than from date"

                }
                else {
                    return true
                }
            }
        }
    }
    catch (error) {
        return "error";
    }
}