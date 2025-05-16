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
    ALTER TABLE bills_fact_new ADD bill_icd_codes JSONB;

    CREATE INDEX idx_bill_icd_codes_bills_fact_new_gin ON bills_fact_new USING GIN (bill_icd_codes);
  `;
  return db.runSql(sql);
};

exports.down = function(db) {
    const sql = `
    DROP INDEX IF EXISTS idx_bill_icd_codes_bills_fact_new_gin;

    ALTER TABLE bills_fact_new DROP COLUMN IF EXISTS bill_icd_codes;
  `;
  return db.runSql(sql);
};


exports._meta = {
  "version": 1
};
