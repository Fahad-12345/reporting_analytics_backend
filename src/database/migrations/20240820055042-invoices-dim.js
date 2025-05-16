'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
    const sql = `
    CREATE SEQUENCE public.invoices_dim_invoices_dim_id_seq INCREMENT BY 1 START WITH 1 MINVALUE 1 MAXVALUE 2147483647;
    CREATE TABLE  invoices_dim (invoices_dim_id integer DEFAULT nextval('invoices_dim_invoices_dim_id_seq'::regclass),
    invoice_id integer NOT NULL,
    invoice_category character varying(255),
    invoice_date date,
    dos_start date,
    dos_end date,
    patient_id integer,
    case_id integer,
    bill_ids TEXT,
    bills JSONB,
    specialty_ids character varying(255),
    doctor_ids character varying(512),
    Invoice_from_facility_id integer,
    Invoice_from_facility_location_ids character varying(255),
    invoice_amount numeric,
    paid_amount numeric,
    over_amount numeric,
    outstanding_amount numeric,
    interest_amount numeric,
    write_off_amount numeric,
    litigation_amount numeric,
    invoice_status_id integer,
    invoice_payment_status_id integer,
    created_by character varying(255),
    updated_by character varying(255),
    created_at timestamp with time zone ,
    updated_at timestamp with time zone ,
    deleted_at timestamp with time zone,
    invoice_to_locations JSONB,
    dumb_date date DEFAULT CURRENT_DATE ,
    PRIMARY KEY (invoices_dim_id, invoice_id));

    ALTER TABLE invoices_dim ADD CONSTRAINT unique_invoices_dim_invoice_id UNIQUE (invoice_id);
    ALTER TABLE invoices_dim ADD CONSTRAINT fk_case_id_1 FOREIGN KEY (case_id) REFERENCES case_fact_new (case_id);

    CREATE INDEX idx_invoice_bills_gin ON invoices_dim USING GIN (bills);
    CREATE INDEX idx_invoice_to_locations ON invoices_dim USING gin (invoice_to_locations);
  `;
  return db.runSql(sql);
};

exports.down = function(db) {
    const sql = `
    ALTER TABLE invoices_dim DROP CONSTRAINT unique_invoices_dim_invoice_id;
    ALTER TABLE invoices_dim DROP CONSTRAINT IF EXISTS fk_case_id_1;
    DROP INDEX IF EXISTS idx_invoice_bills_gin;
    DROP INDEX IF EXISTS idx_invoice_to_locations;
    DROP TABLE IF EXISTS public.invoices_dim;
    DROP SEQUENCE IF EXISTS public.invoices_dim_invoices_dim_id_seq;

  `;
  return db.runSql(sql);
};

exports._meta = {
  "version": 1
};
