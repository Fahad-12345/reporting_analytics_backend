'use strict';

var dbm;
var type;
var seed;
var Promise;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};
exports.up = function(db) {
  const sql = `
  CREATE SEQUENCE public.physician_clinics_dim_physician_clinics_dim_id_seq INCREMENT BY 1 START WITH 1 MINVALUE 1 MAXVALUE 2147483647;
  CREATE TABLE  physician_clinics_dim (physician_clinics_dim_id integer DEFAULT nextval('physician_clinics_dim_physician_clinics_dim_id_seq'::regclass),
   physician_clinics_id integer NOT NULL,
   clinic_id integer,
   clinic_locations_id integer,
   physician_id integer,
   facility_id integer,
   facility_location_id integer,
   created_by character varying(255),
   updated_by character varying(255),
   created_at timestamp with time zone ,
   updated_at timestamp with time zone ,
   deleted_at timestamp with time zone,
   dumb_date date DEFAULT CURRENT_DATE ,
   PRIMARY KEY (physician_clinics_dim_id, physician_clinics_id));
   ALTER TABLE visit_codes_dim ADD code_id INTEGER;
   ALTER TABLE case_fact_new ADD insurances JSONB;
   ALTER TABLE case_fact_new ADD employers JSONB;
   ALTER TABLE case_fact_new ADD practice_locations JSONB;
  
   ALTER TABLE facility_location_dim ADD is_primary_location BOOLEAN;
  
   ALTER TABLE case_info_dim ADD case_practice_location_id INTEGER;
   ALTER TABLE case_info_dim ADD CONSTRAINT unique_case_info_dim_case_practice_location_id UNIQUE (case_practice_location_id);
   
   ALTER TABLE appointment_fact ADD physician_clinics_id INTEGER;
  
  CREATE INDEX idx_practice_locations ON case_fact_new USING gin (practice_locations);
  CREATE INDEX idx_insurances ON case_fact_new USING gin (insurances);
  CREATE INDEX idx_employers ON case_fact_new USING gin (employers);`

   return db.runSql(sql);
};
exports.down = function(db) {
    const sql = 
    `
    ALTER TABLE appointment_fact DROP COLUMN IF EXISTS physician_clinics_id;
    
    ALTER TABLE case_info_dim DROP CONSTRAINT unique_case_info_dim_case_practice_location_id;
    ALTER TABLE case_info_dim DROP COLUMN IF EXISTS case_practice_location_id;
    
    ALTER TABLE facility_location_dim DROP COLUMN IF EXISTS is_primary_location;

    DROP INDEX IF EXISTS idx_practice_locations;
    DROP INDEX IF EXISTS idx_insurances;
    DROP INDEX IF EXISTS idx_employers;
    
    ALTER TABLE case_fact_new DROP COLUMN IF EXISTS practice_locations;
    ALTER TABLE case_fact_new DROP COLUMN IF EXISTS employers;
    ALTER TABLE case_fact_new DROP COLUMN IF EXISTS insurances;

    
    
    ALTER TABLE visit_codes_dim DROP COLUMN IF EXISTS code_id;
    
    DROP TABLE IF EXISTS physician_clinics_dim;
    DROP SEQUENCE IF EXISTS public.physician_clinics_dim_physician_clinics_dim_id_seq;`

    return db.runSql(sql);
};

exports._meta = {
  "version": 1
};
