import { Model, Table } from 'sequelize-typescript';

enum Months {
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  ' October',
  ' November',
  ' December',
};

export interface GlobalsI {
  time_span_id: number;
  month_id?: Months;
  speciality_ids?: number[];
  provider_ids?: number[];
  facility_location_ids?: number[];
  fromDate?: Date;
  toDate?: Date;
  granularity_type_id?: number;
}
@Table({})
export class Globals extends Model<GlobalsI> {

} 
