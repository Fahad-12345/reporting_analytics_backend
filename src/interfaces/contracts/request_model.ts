import { Request } from 'express';

export interface GlobalFiltersRequest extends Request {
    // Define additional properties you want to add to the request object
    // For example, you can add a user property to represent the authenticated user
    user: {
        time_span_id?: number;
        month_id: number;
        facility_location_ids: number[];
        speciality_ids: number[];
        provider_ids: number[];
        case_type_ids: number[];
        fromDate: Date;
        recipient_id?: number;
        toDate: Date;
        granularity_type_id: number;
        chartName?: string;
    };
    auth: {
        user_id: number;
    }
}

