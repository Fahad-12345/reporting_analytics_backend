import { qaLocationsFilter, qaProvidersFilter, qaSpecialitiesFilter } from "./filter-clause";
import { GlobalFiltersRequest } from "../interfaces/contracts/request_model";

export function GlobalFilterQueryHelper(reqData: any) {
  // Destructure the input data
  const {
    time_span_id,
    month_id,
    speciality_ids,
    provider_ids,
    facility_location_ids,
    fromDate,
    toDate,
    case_type_ids,
  }: GlobalFiltersRequest["user"] = reqData;

  // Start with a default WHERE clause
  let whereClause = `bilFac.deleted_at is NULL AND bilFac.case_type_id IS NOT NULL 
  AND bilFac.speciality_id IS NOT NULL
  AND bilFac.facility_location_id IS NOT NULL AND (bilFac.created_by::integer IS NULL OR bilFac.created_by::integer != 13) AND (bilFac.updated_by::integer IS NULL OR bilFac.updated_by::integer != 13)  ${qaLocationsFilter('bilFac')} ${qaSpecialitiesFilter('bilFac')}`;

  // If speciality_ids are provided, filter by them
  if (speciality_ids && speciality_ids.length > 0) {
    whereClause += ` AND bilFac.speciality_id IN (${speciality_ids})`;
  }
  if (case_type_ids && case_type_ids.length > 0) {
    whereClause += ` AND bilFac.case_type_id IN (${case_type_ids})`;
  }

  // If month_id is provided, filter by the specified month
  if (month_id) {
    const year = (new Date).getFullYear();
    const create_startDate = new Date(year, month_id - 1, 1);
    const create_endDate = new Date(year, month_id - 1, 1);
    create_endDate.setMonth(create_startDate.getMonth() + 1);
    create_endDate.setDate(create_endDate.getDate() - 1);
    const startDate = create_startDate.toISOString().split('T')[0];
    const endDate = create_endDate.toISOString().split('T')[0];
    whereClause += ` AND bilFac.bill_date >= '${startDate}'::DATE AND bilFac.bill_date <= '${endDate}'::DATE `;
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

  // If time_span_id is provided, filter by the specified time span
  if (time_span_id) {
    let interval = '';
    switch (time_span_id) {
      case 1:
        interval = '1 week';
        break;
      case 2:
        interval = '1 month';
        break;
      case 3:
        interval = '6 months';
        break;
      case 4:
        interval = '1 year';
        break;
      case 5:
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const daysDifference = Math.floor((currentDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
        interval = `${daysDifference} days`;
        break;
      default:
        interval = '1 week';
    }
    // Filter by the calculated interval
    whereClause += ` AND bill_date >= current_date - interval '${interval}' AND bill_date <= current_date`;
  }
  return whereClause;
}

