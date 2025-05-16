const { Pool } = require('pg');
const fs = require('fs');
const faker = require('faker');
const pgPool = new Pool({
  user: 'postgres',
  database: 'ovada_analytics_dev',
  password: '12345',
  host: '127.0.0.1',
  port: 5432,
});

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const generateRandomNumber = (length) => [...Array(length)].map(() => Math.floor(Math.random() * 10)).join('');

fs.readFile('tableColumns.json', 'utf8', (err, jsonString) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  async function appointmentFact() {
    try {
      let labelArray = [];
      let dataArray = [];
      let counter = 6188486;
      let counter2 = 346459;
      const data = JSON.parse(jsonString);
      for (let key in data) {
        if (key == 'appointment_fact') {
          if (data.hasOwnProperty(key)) {
            const columnsArray = data[key];
            const now = new Date();
            const startDate = new Date('2020-01-01');
            for (let i = 0; i < 1732295; i++) {
              labelArray = [];
              dataArray = [];
              columnsArray.forEach(element => {
                labelArray.push(element.column_name)
                let randomData;
                const randomDate = getRandomDate(startDate, now);
                const formattedDate = randomDate.toISOString().slice(0, 10);
                const textLength = Math.floor(Math.random() * 10) + 1;
                const textLength1 = Math.floor(Math.random() * 2) + 1;
                switch (element.column_name) {
                  case 'appointment_fact_id':
                    randomData = counter;
                    counter++;
                    break;
                  case 'appointment_id':
                    randomData = counter2;
                    counter2++;
                    break;
                  case 'patient_id':
                    randomData = Math.floor(Math.random() * 96850) + 1
                    break;
                  case 'case_id':
                    randomData = Math.floor(Math.random() * 101745) + 1
                    break;
                  case 'accident_date':
                    randomData = "'" + formattedDate + "'";
                    break;
                  case 'case_type_id':
                    randomData = Math.floor(Math.random() * 9) + 1
                    break;
                  case 'facility_id':
                    randomData = Math.floor(Math.random() * 6) + 1
                    break;
                  case 'facility_location_id':
                    randomData = Math.floor(Math.random() * 12) + 1
                    break;
                  case 'speciality_id':
                    randomData = Math.floor(Math.random() * 37) + 1
                    break;
                  case 'appointment_type_id':
                    randomData = Math.floor(Math.random() * 22) + 1
                    break;
                  case 'provider_id':
                    randomData = Math.floor(Math.random() * 876) + 1
                    break;
                  case 'technician_id':
                    randomData = Math.floor(Math.random() * 861) + 1
                    break;
                  case 'reading_provider_id':
                    randomData = Math.floor(Math.random() * 861) + 1
                    break;
                  case 'physician_id':
                    randomData = Math.floor(Math.random() * 100) + 1
                    break;
                  case 'clinic_id':
                    randomData = Math.floor(Math.random() * 778) + 1
                    break;
                  case 'clinic_location_id':
                    randomData = Math.floor(Math.random() * 788) + 1
                    break;
                  case 'cd_image':
                    randomData = Math.floor(Math.random() * 1) + 1
                    break;
                  case 'patient_appointment_status_id':
                    randomData = Math.floor(Math.random() * 10) + 1
                    break;
                  case 'appointment_status_id':
                    randomData = 13
                    break;
                  case 'appointment_priority_id':
                    randomData = Math.floor(Math.random() * 2) + 1
                    break;
                  case 'confirmation_status_id':
                    randomData = Math.floor(Math.random() * 1)
                    break;
                  case 'cancelled_id':
                    randomData = Math.floor(Math.random() * 1)
                    break;
                  case 'cancelled_comments':
                    randomData = "'" + Array.from({ length: textLength }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'is_speciality_base':
                    randomData = Math.random() < 0.5;
                    break;
                  case 'billable':
                    randomData = Math.random() < 0.5;
                    break;
                  case 'pickup_type':
                    randomData = "'" + Array.from({ length: textLength }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'pickup_address':
                    let e = `${faker.address.streetAddress()}`;
                    randomData = `'${e.replace(/'/g, '')}'`;
                    break;
                  case 'pickup_suite':
                    randomData = "'" + Array.from({ length: textLength }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'pickup_city':
                    let d = `${faker.address.city()}`;
                    randomData = `'${d.replace(/'/g, '')}'`;
                    break;
                  case 'pickup_state':

                    randomData = `'${faker.random.arrayElement(['NY', 'CT', 'GA'])}'`;
                    break;
                  case 'pickup_zip':
                    randomData = `'${faker.address.zipCode()}'`;
                    break;
                  case 'dropoff_type':
                    randomData = "'" + Array.from({ length: textLength }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'dropoff_address':
                    let a = `${faker.address.streetAddress()}`;
                    randomData = `'${a.replace(/'/g, '')}'`;
                    break;
                  case 'dropoff_suite':
                    randomData = "'" + Array.from({ length: textLength }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'dropoff_city':
                    let c = `${faker.address.city()}`;
                    randomData = `'${c.replace(/'/g, '')}'`;
                    break;
                  case 'dropoff_state':
                    randomData = `'${faker.random.arrayElement(['NY', 'CT', 'GA'])}'`;
                    break;
                  case 'dropoff_zip':
                    randomData = `'${faker.address.zipCode()}'`;
                    break;
                  case 'comments':
                    randomData = `'N/A'`
                    break;
                  case 'created_by':
                    randomData = Math.floor(Math.random() * 800) + 1
                    break;
                  case 'updated_by':
                    randomData = Math.floor(Math.random() * 800) + 1
                    break;
                  case 'deleted_at':
                    randomData = 'null';
                    break;
                  case 'time_id':
                    randomData = Math.floor(Math.random() * 10) + 1
                    break;
                  case 'scheduled_date_time':
                  case 'evaluation_date_time':
                  case 'date_of_check_in':
                  case 'time_of_check_in':
                  case 'date_of_check_out':
                  case 'time_of_check_out':
                  case 'created_at':
                  case 'updated_at':
                  case 'dumb_date':
                    randomData = "'" + formattedDate + "'";
                    break;
                  default:
                    randomData = null;
                    break;
                }
                dataArray.push(randomData)
              })
              const query = `INSERT INTO ${key} (${labelArray}) VALUES (${dataArray})`;
              console.log('-', query)
              await pgPool.query(query);

            }

          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }

  async function patientsDim() {
    try {
      let labelArray = [];
      let dataArray = [];
      let counter = 64302;
      let counter2 = 16142;
      const data = JSON.parse(jsonString);
      for (let key in data) {
        if (key == 'patient_dim') {
          if (data.hasOwnProperty(key)) {
            const columnsArray = data[key];
            const now = new Date();
            const startDate = new Date('2020-01-01');
            for (let i = 0; i < 80710; i++) {
              labelArray = [];
              dataArray = [];
              columnsArray.forEach(element => {
                labelArray.push(element.column_name)
                let randomData;
                const randomDate = getRandomDate(startDate, now);
                const formattedDate = randomDate.toISOString().slice(0, 10);
                const textLength = Math.floor(Math.random() * 10) + 1;
                const textLength1 = Math.floor(Math.random() * 2) + 1;
                switch (element.column_name) {
                  case 'patient_dim_id':
                    randomData = counter;
                    counter++;
                    break;
                  case 'patient_id':
                    randomData = counter2;
                    counter2++;
                    break;
                  case 'first_name':
                    let a = `${faker.name.firstName()}`;
                    randomData = `'${a.replace(/'/g, '')}'`;
                    break;
                  case 'middle_name':
                    randomData = `'${faker.name.middleName()}'`;
                    break;
                  case 'last_name':
                    let c = `${faker.name.lastName()}`;
                    randomData = `'${c.replace(/'/g, '')}'`;
                    break;
                  case 'dob':
                    const start = new Date('2005-01-01');
                    const end = new Date('1950-01-01');
                    const randomDate1 = getRandomDate(end, start);
                    const formattedDate1 = randomDate1.toISOString().slice(0, 10);
                    randomData = "'" + formattedDate1 + "'";
                    break;
                  case 'gender':
                    randomData = `'${faker.random.arrayElement(['Male', 'Female'])}'`;
                    break;
                  case 'age':
                    randomData = Math.floor(Math.random() * 90) + 1
                    break;
                  case 'ssn':
                    randomData = generateRandomNumber(8);
                    break;
                  case 'cell_phone':
                    randomData = generateRandomNumber(11);
                    break;
                  case 'home_phone':
                    randomData = generateRandomNumber(11);
                    break;
                  case 'work_phone':
                    randomData = generateRandomNumber(11);
                    break;
                  case 'height_in':
                    randomData = Math.floor(Math.random() * 70) + 1
                    break;
                  case 'height_ft':
                    randomData = Math.floor(Math.random() * 7) + 1
                    break;
                  case 'weight_lbs':
                    randomData = (Math.random() * 999).toFixed(2);
                    break;
                  case 'marital_status':
                    randomData = `'${faker.random.arrayElement(['Single', 'Divorced', 'Married'])}'`;
                    break;
                  case 'is_law_enforcement_agent':
                    randomData = Math.random() < 0.5;
                    break;
                  case 'is_pregnant':
                    randomData = `'${faker.random.arrayElement(['no', 'not_sure', 'yes'])}'`;
                    break;
                  case 'patient_notes':
                    randomData = "'" + Array.from({ length: textLength }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'patient_status':
                    randomData = `'open'`
                    break;
                  case 'is_soft_registered':
                    randomData = Math.random() < 0.5;
                    break;
                  case 'creation_source':
                    randomData = `'${faker.random.arrayElement(['1', '2'])}'`;
                    break;
                  case 'is_active':
                    randomData = Math.random() < 0.5;
                    break;
                  case 'created_by':
                    randomData = Math.floor(Math.random() * 800) + 1
                    break;
                  case 'updated_by':
                    randomData = Math.floor(Math.random() * 800) + 1
                    break;
                  case 'deleted_at':
                    randomData = 'null';
                    break;
                  case 'created_at':
                  case 'updated_at':
                  case 'dumb_date':
                    randomData = "'" + formattedDate + "'";
                    break;
                  default:
                    randomData = null;
                    break;
                }
                dataArray.push(randomData)
              })
              const query = `INSERT INTO ${key} (${labelArray}) VALUES (${dataArray})`;
              console.log('-', query)
              await pgPool.query(query);

              // console.log(dataArray)
              // console.log(labelArray)
            }

          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }

  async function caseFact() {
    try {
      let labelArray = [];
      let dataArray = [];
      let counter = 66092;
      let counter2 = 16958;
      const data = JSON.parse(jsonString);
      for (let key in data) {
        if (key == 'case_fact_new') {
          if (data.hasOwnProperty(key)) {
            const columnsArray = data[key];
            const now = new Date();
            const startDate = new Date('2020-01-01');
            for (let i = 0; i < 84790; i++) {
              labelArray = [];
              dataArray = [];
              columnsArray.forEach(element => {
                labelArray.push(element.column_name)
                let randomData;
                const randomDate = getRandomDate(startDate, now);
                const formattedDate = randomDate.toISOString().slice(0, 10);
                const textLength = Math.floor(Math.random() * 10) + 1;
                switch (element.column_name) {
                  case 'case_dim_id':
                    randomData = counter;
                    counter++;
                    break;
                  case 'case_id':
                    randomData = counter2;
                    counter2++;
                    break;
                  case 'patient_id':
                    randomData = Math.floor(Math.random() * 96850) + 1
                    break;
                  case 'case_categroy_id':
                    randomData = Math.floor(Math.random() * 3) + 1
                    break;
                  case 'case_purpose_of_visit_id':
                    randomData = Math.floor(Math.random() * 5) + 1
                    break;
                  case 'case_type_id':
                    randomData = Math.floor(Math.random() * 9) + 1
                    break;
                  case 'case_status_id':
                    randomData = Math.floor(Math.random() * 10) + 1
                    break;
                  case 'is_transfer_case':
                    randomData = Math.random() < 0.5;
                    break;
                  case 'firm_id':
                    randomData = Math.floor(Math.random() * 100) + 1
                    break;
                  case 'firm_location_id':
                    randomData = Math.floor(Math.random() * 100) + 1
                    break;
                  case 'attorney_id':
                    randomData = Math.floor(Math.random() * 100) + 1
                    break;
                  case 'attorney_created_by':
                    randomData = Math.floor(Math.random() * 800) + 1
                    break;
                  case 'attorney_updated_by':
                    randomData = Math.floor(Math.random() * 800) + 1
                    break;

                  case 'mailing_address':
                    let b = `${faker.address.streetAddress()}`;
                    randomData = `'${b.replace(/'/g, '')}'`;
                    break;
                  case 'mailing_apartment':
                    randomData = "'" + Array.from({ length: textLength }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'mailing_city':
                    let c = `${faker.address.city()}`;
                    randomData = `'${c.replace(/'/g, '')}'`;
                    break;
                  case 'mailing_state':
                    randomData = `'${faker.random.arrayElement(['NY', 'CT', 'GA'])}'`;
                    break;
                  case 'mailing_zip':
                    randomData = `'${faker.address.zipCode()}'`;
                    break;
                  case 'residential_address':
                    let a = `${faker.address.streetAddress()}`;
                    randomData = `'${a.replace(/'/g, '')}'`;
                    break;
                  case 'residential_apartment':
                    randomData = "'" + Array.from({ length: textLength }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'residential_city':
                    let d = `${faker.address.city()}`;
                    randomData = `'${d.replace(/'/g, '')}'`;
                    break;
                  case 'residential_state':
                    randomData = `'${faker.random.arrayElement(['NY', 'CT', 'GA'])}'`;
                    break;
                  case 'residential_zip':
                    randomData = `'${faker.address.zipCode()}'`;
                    break;
                  case 'creation_source':
                    randomData = `'${faker.random.arrayElement(['1', '2'])}'`;
                    break;
                  case 'created_by':
                    randomData = Math.floor(Math.random() * 800) + 1
                    break;
                  case 'updated_by':
                    randomData = Math.floor(Math.random() * 800) + 1
                    break;
                  case 'deleted_at':
                    randomData = 'null';
                    break;
                  case 'date_of_admission':
                  case 'accident_date':
                  case 'attorney_created_at':
                  case 'attorney_updated_at':
                  case 'attorney_deleted_at':
                  case 'created_at':
                  case 'updated_at':
                  case 'dumb_date':
                    randomData = "'" + formattedDate + "'";
                    break;
                  case 'pom_generate_count':
                    randomData = Math.floor(Math.random() * 8000) + 1
                    break;
                  case 'pom_recieved_count':
                    randomData = Math.floor(Math.random() * 8000) + 1
                    break;
                  default:
                    randomData = null;
                    break;
                }
                dataArray.push(randomData)
              })
              const query = `INSERT INTO ${key} (${labelArray}) VALUES (${dataArray})`;
              console.log('-', query)
              await pgPool.query(query);

              // console.log(dataArray)
              // console.log(labelArray)
            }

          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }


  async function visitsFact() {
    try {
      let labelArray = [];
      let dataArray = [];
      let counter = 2940665;
      let counter2 = 311259;
      const data = JSON.parse(jsonString);
      for (let key in data) {
        if (key == 'visits_fact') {
          if (data.hasOwnProperty(key)) {
            const columnsArray = data[key];
            const now = new Date();
            const startDate = new Date('2020-01-01');
            for (let i = 0; i < 1556290; i++) {
              labelArray = [];
              dataArray = [];
              columnsArray.forEach(element => {
                labelArray.push(element.column_name)
                let randomData;
                const randomDate = getRandomDate(startDate, now);
                const formattedDate = randomDate.toISOString().slice(0, 10);
                switch (element.column_name) {
                  case 'visit_fact_id':
                    randomData = counter;
                    counter++;
                    break;
                  case 'visit_id':
                    randomData = counter2;
                    counter2++;
                    break;
                  case 'appointment_id':
                    randomData = Math.floor(Math.random() * 2078753) + 346459;
                    break;
                  case 'patient_id':
                    randomData = Math.floor(Math.random() * 96850) + 1;
                    break;
                  case 'case_id':
                    randomData = Math.floor(Math.random() * 101745) + 1;
                    break;
                  case 'case_type_id':
                    randomData = Math.floor(Math.random() * 10) + 1;
                    break;
                  case 'facility_id':
                    randomData = Math.floor(Math.random() * 6) + 1;
                    break;
                  case 'facility_location_id':
                    randomData = Math.floor(Math.random() * 12) + 1;
                    break;
                  case 'speciality_id':
                    randomData = Math.floor(Math.random() * 10) + 1;
                    break;
                  case 'appointment_type_id':
                    randomData = Math.floor(Math.random() * 22) + 1;
                    break;
                  case 'provider_id':
                    randomData = Math.floor(Math.random() * 876) + 1;
                    break;
                  case 'technician_id':
                    randomData = Math.floor(Math.random() * 861) + 1;
                    break;
                  case 'reading_provider_id':
                    randomData = Math.floor(Math.random() * 861) + 1;
                    break;
                  case 'cd_image':
                    let c = `${faker.random.word()}`;
                    randomData = `'${c.replace(/'/g, '')}'`;
                    break;
                    break;
                  case 'visit_session_state_id':
                    randomData = Math.floor(Math.random() * 3) + 1;
                    break;
                  case 'is_amended':
                    randomData = Math.random() < 0.5;
                    break;
                  case 'template_type':
                    let d = `${faker.random.word()}`;
                    randomData = `'${d.replace(/'/g, '')}'`;
                    break;
                  case 'visit_charges':
                    randomData = (Math.random() * 1000).toFixed(2);
                    break;
                  case 'document_uploaded':
                    randomData = Math.random() < 0.5;
                    break;
                  case 'accident_date':
                  case 'visit_date':
                  case 'created_at':
                  case 'updated_at':
                  case 'dumb_date':
                  case 'last_uploaded_document_date':
                    randomData = "'" + formattedDate + "'";
                    break;
                  case 'created_by':
                    randomData = Math.floor(Math.random() * 800) + 1;
                    break;
                  case 'updated_by':
                    randomData = Math.floor(Math.random() * 800) + 1;
                    break;
                  case 'deleted_at':
                    randomData = 'null';
                    break;
                  case 'time_id':
                    randomData = Math.floor(Math.random() * 10) + 1;
                    break;
                  case 'visit_cpt_code_status':
                    randomData = `'${faker.random.arrayElement(['0', '1'])}'`;
                    break;
                  case 'visit_icd_code_status':
                    randomData = `'${faker.random.arrayElement(['0', '1'])}'`;
                    break;
                  default:
                    randomData = null;
                    break;
                }
                dataArray.push(randomData)
              })
              const query = `INSERT INTO ${key} (${labelArray}) VALUES (${dataArray})`;
              console.log('-', query)
              await pgPool.query(query);

              // console.log(dataArray)
              // console.log(labelArray)
            }

          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }
  async function billsFact() {
    try {
      let labelArray = [];
      let dataArray = [];
      let counter = 1881433;
      let counter2 = 244472;
      const data = JSON.parse(jsonString);
      for (let key in data) {
        if (key == 'bills_fact_new') {
          if (data.hasOwnProperty(key)) {
            const columnsArray = data[key];
            const now = new Date();
            const startDate = new Date('2020-01-01');
            for (let i = 0; i < 824160; i++) {
              labelArray = [];
              dataArray = [];
              columnsArray.forEach(element => {
                labelArray.push(element.column_name)
                let randomData;
                const randomDate = getRandomDate(startDate, now);
                const formattedDate = randomDate.toISOString().slice(0, 10);
                switch (element.column_name) {
                  case 'bill_fact_id':
                    randomData = counter;
                    counter++;
                    break;
                  case 'bill_id':
                    randomData = counter2;
                    break;
                  case 'bill_label':
                    randomData = `'CIT-BRO-${counter2}'`;
                    counter2++;
                    break;
                  case 'patient_id':
                    randomData = Math.floor(Math.random() * 96850) + 1;
                    break;
                  case 'case_id':
                    randomData = Math.floor(Math.random() * 101748) + 1;
                    break;
                  case 'case_type_id':
                    randomData = Math.floor(Math.random() * 9) + 1;
                    break;
                  case 'accident_date':
                  case 'bill_date':
                  case 'dos_from_date':
                  case 'dos_to_date':
                  case 'created_at':
                  case 'updated_at':
                  case 'dumb_date':
                    randomData = "'" + formattedDate + "'";
                    break;
                  case 'deleted_at':
                    randomData = 'null';
                    break;
                  // case 'bill_day':
                  //   randomData = Math.floor(Math.random() * 31) + 1;
                  //   break;
                  // case 'bill_month':
                  //   randomData = Math.floor(Math.random() * 12) + 1;
                  //   break;
                  // case 'bill_week':
                  //   randomData = Math.floor(Math.random() * 52) + 1;
                  //   break;
                  // case 'bill_year':
                  //   randomData = Math.floor(Math.random() * 10) + 2015;
                  //   break;
                  case 'facility_id':
                    randomData = Math.floor(Math.random() * 6) + 1;
                    break;
                  case 'facility_location_id':
                    randomData = Math.floor(Math.random() * 12) + 1;
                    break;
                  case 'doctor_id':
                    randomData = Math.floor(Math.random() * 876) + 1;
                    break;
                  case 'speciality_id':
                    randomData = Math.floor(Math.random() * 10) + 1;
                    break;
                  case 'bill_status_id':
                    randomData = Math.floor(Math.random() * 11) + 1;
                    break;
                  case 'payment_status_id':
                    randomData = Math.floor(Math.random() * 6) + 1;
                    break;
                  case 'eor_status_id':
                    randomData = Math.floor(Math.random() * 7) + 1;
                    break;
                  case 'denial_status_id':
                    randomData = Math.floor(Math.random() * 7) + 1;
                    break;
                  case 'verification_status_id':
                    randomData = Math.floor(Math.random() * 3) + 1;
                    break;
                  case 'packet_created_count':
                  case 'pom_generate_count':
                  case 'pom_received_count':
                  case 'verification_received_count':
                  case 'verification_sent_count':
                  case 'eor_count':
                  case 'denials_count':
                  case 'payment_count':
                    randomData = Math.floor(Math.random() * 2);
                    break;
                  case 'bill_amount':
                  case 'paid_amount':
                  case 'outstanding_amount':
                    randomData = (Math.random() * 300).toFixed(2);
                    break;
                  case 'interest_amount':
                    randomData = (Math.random() * 50).toFixed(2);
                    break;
                  case 'over_payment':
                    randomData = (Math.random() * 100).toFixed(2);
                    break;
                  case 'write_off_amount':
                    randomData = (Math.random() * 50).toFixed(2);
                    break;
                  case 'duration':
                    const rand = Math.floor(Math.random() * 9) + 1;
                    randomData = `'00:00:0${rand}'`
                    // randomData = `'anas'`;
                    break;
                  case 'created_by':
                  case 'updated_by':
                    randomData = Math.floor(Math.random() * 800) + 1;
                    break;
                  case 'time_id':
                    randomData = Math.floor(Math.random() * 10) + 1;
                    break;
                  default:
                    randomData = null;
                    break;
                }
                dataArray.push(randomData)
              })
              const query = `INSERT INTO ${key} (${labelArray}) VALUES (${dataArray})`;
              console.log('-', query)
              await pgPool.query(query);

              // console.log(dataArray)
              // console.log(labelArray)
            }

          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }
  async function billsRecipientDim() {
    try {
      let labelArray = [];
      let dataArray = [];
      let counter = 1400832;
      // let counter2 = 14072;
      const data = JSON.parse(jsonString);
      for (let key in data) {
        if (key == 'bills_recipient_dim') {
          if (data.hasOwnProperty(key)) {
            const columnsArray = data[key];
            const now = new Date();
            const startDate = new Date('2020-01-01');
            let billRecipient = 1;
            for (let i = 0; i < 886635; i++) {
              labelArray = [];
              dataArray = [];
              columnsArray.forEach(element => {
                labelArray.push(element.column_name)
                let randomData;
                const randomDate = getRandomDate(startDate, now);
                const formattedDate = randomDate.toISOString().slice(0, 10);
                switch (element.column_name) {
                  case 'bill_recipient_dim_id':
                    randomData = counter;
                    counter++;  
                    break;
                  case 'bill_recipient_id':
                    randomData = Math.floor(Math.random() * 3000) + 1;
                    break;
                  case 'bill_id':
                    randomData = Math.floor(Math.random() * 824150) + 164832;
                    break;
                  case 'bill_recipient_type_id':
                    billRecipient = `'${faker.random.arrayElement(['1', '2', '3', '4'])}'`;
                    randomData = billRecipient;
                    break;
                  case 'bill_recipient_type_name':
                    switch (billRecipient) {
                      case `'1'`:
                        randomData = `'Patient'`
                        break;
                      case `'2'`:
                        randomData = `'Employer'`
                        break;
                      case `'3'`:
                        randomData = `'Insurance'`
                        break;
                      case `'4'`:
                        randomData = `'Firm Name'`
                        break;
                    }
                    break;
                  case 'patient_id':
                    randomData = Math.floor(Math.random() * 14000) + 1;
                    break;
                  case 'employer_id':
                    randomData = Math.floor(Math.random() * 26) + 213;
                    break;
                  case 'firm_id':
                    randomData = Math.floor(Math.random() * 6) + 1;
                    break;
                  case 'firm_location_id':
                    randomData = Math.floor(Math.random() * 300) + 1;
                    break;
                  case 'insurance_id':
                    randomData = Math.floor(Math.random() * 12) + 1;
                    break;
                  case 'insurance_location_id':
                    randomData = Math.floor(Math.random() * 12) + 1;
                    break;
                  case 'bill_recipient_name':
                    let d = `${faker.random.word()}`;
                    randomData = `'${d.replace(/'/g, '')}'`;
                    break;
                  case 'bill_recipient_location_name':
                    let c = `${faker.random.word()}`;
                    randomData = `'${c.replace(/'/g, '')}'`;
                    break;
                  case 'bill_recipient_street_address':
                    let a = `${faker.address.streetAddress()}`;
                    randomData = `'${a.replace(/'/g, '')}'`;
                    break;
                  case 'bill_recipient_floor':
                    let b = `${faker.random.word()}`;
                    randomData = `'${b.replace(/'/g, '')}'`;
                    break;
                  case 'bill_recipient_city':
                    let e = `${faker.address.city()}`;
                    randomData = `'${e.replace(/'/g, '')}'`;
                    break;
                  case 'bill_recipient_state':
                    randomData = `'${faker.random.arrayElement(['NY', 'CT', 'GA'])}'`;
                    break;
                  case 'bill_recipient_zip':
                    randomData = `'${faker.address.zipCode()}'`;
                    break;
                  case 'created_at':
                  case 'updated_at':
                  case 'dumb_date':
                    randomData = "'" + formattedDate + "'";
                    break;
                  case 'deleted_at':
                    randomData = 'null';
                    break;
                  case 'created_by':
                  case 'updated_by':
                    randomData = Math.floor(Math.random() * 800) + 1;
                    break;
                  default:
                    randomData = null;
                    break;
                }
                dataArray.push(randomData)
              })
              const query = `INSERT INTO ${key} (${labelArray}) VALUES (${dataArray})`;
              console.log('-', query)
              await pgPool.query(query);

              // console.log(dataArray)
              // console.log(labelArray)
            }

          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }

  async function denialDim() {
    try {
      let labelArray = [];
      let dataArray = [];
      let counter = 244867;
      let counter2 = 66897;
      const data = JSON.parse(jsonString);
      for (let key in data) {
        if (key == 'denial_dim') {
          if (data.hasOwnProperty(key)) {
            const columnsArray = data[key];
            const now = new Date();
            const startDate = new Date('2020-01-01');
            // const textLength = Math.floor(Math.random() * 10) + 1;
            let billRecipient = 1;
            for (let i = 0; i < 334485; i++) {
              labelArray = [];
              dataArray = [];
              columnsArray.forEach(element => {
                labelArray.push(element.column_name)
                let randomData;
                const randomDate = getRandomDate(startDate, now);
                const formattedDate = randomDate.toISOString().slice(0, 10);
                switch (element.column_name) {
                  case 'denial_dim_id':
                    randomData = counter;
                    counter++;
                    break;
                  case 'denial_id':
                    randomData = counter2;
                    counter2++;
                    break;
                  case 'bill_id':
                    randomData = Math.floor(Math.random() * 824150) + 164832;
                    break;
                  case 'denial_status_id':
                    randomData = Math.floor(Math.random() * 7) + 1;
                    break;
                  case 'reason':
                    randomData = "'" + Array.from({ length: 10 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'comments':
                    randomData = "'" + Array.from({ length: 10 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('') + "'";
                    break;
                  case 'denial_date':
                  case 'created_at':
                  case 'updated_at':
                  case 'dumb_date':
                    randomData = "'" + formattedDate + "'";
                    break;
                  case 'deleted_at':
                    randomData = 'null';
                    break;
                  case 'created_by':
                  case 'updated_by':
                    randomData = Math.floor(Math.random() * 800) + 1;
                    break;
                  default:
                    randomData = null;
                    break;
                }
                dataArray.push(randomData)
              })
              const query = `INSERT INTO ${key} (${labelArray}) VALUES (${dataArray})`;
              console.log('-', query)
              await pgPool.query(query);

              // console.log(dataArray)
              // console.log(labelArray)
            }

          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }

  // async function denialTypeDim() {
  //   try {
  //     let labelArray = [];
  //     let dataArray = [];
  //     let counter = 284817;
  //     let counter2 = 73101;
  //     const data = JSON.parse(jsonString);
  //     for (let key in data) {
  //       if (key == 'denial_type_dim') {
  //         if (data.hasOwnProperty(key)) {
  //           const columnsArray = data[key];
  //           const now = new Date();
  //           const startDate = new Date('2020-01-01');
  //           // const textLength = Math.floor(Math.random() * 10) + 1;
  //           let billRecipient = 1;
  //           for (let i = 0; i < 363000; i++) {
  //             labelArray = [];
  //             dataArray = [];
  //             columnsArray.forEach(element => {
  //               labelArray.push(element.column_name)
  //               let randomData;
  //               const randomDate = getRandomDate(startDate, now);
  //               const formattedDate = randomDate.toISOString().slice(0, 10);
  //               switch (element.column_name) {
  //                 case 'denial_type_dim_id':
  //                   randomData = counter;
  //                   counter++;
  //                   break;
  //                 case 'denial_type_ids_id':
  //                   randomData = counter2;
  //                   counter2++;
  //                   break;
  //                 case 'denial_id':
  //                   randomData = Math.floor(Math.random() * 372300) + 62304;
  //                   break;
  //                 case 'denial_type_id':
  //                   billRecipient = `'${faker.random.arrayElement(['51', '44', '35', '27', '28', '7', '8', '11'])}'`;
  //                   randomData = billRecipient;
  //                   break;
  //                 case 'denial_type_name':
  //                   switch (billRecipient) {
  //                     case `'51'`:
  //                       randomData = `'Treatment provided was not causally related to the compensable injury'`
  //                       break;
  //                     case `'44'`:
  //                       randomData = `'Reimbursement may not exceed 12-0 RVUs'`
  //                       break;
  //                     case `'35'`:
  //                       randomData = `'No Coverage'`
  //                       break;
  //                     case `'27'`:
  //                       randomData = `'Fee Exceeds maximum allowance'`
  //                       break;
  //                     case `'28'`:
  //                       randomData = `'Fee is not in accordance with medical fee schedule'`
  //                       break;
  //                     case `'7'`:
  //                       randomData = `'IME Cut off'`
  //                       break;
  //                     case `'8'`:
  //                       randomData = `'IME No Show'`
  //                       break;
  //                     case `'11'`:
  //                       randomData = `'Others'`
  //                       break;
  //                   }
  //                   break;
  //                 case 'created_at':
  //                 case 'updated_at':
  //                 case 'dumb_date':
  //                   randomData = "'" + formattedDate + "'";
  //                   break;
  //                 case 'deleted_at':
  //                   randomData = null;
  //                   break;
  //                 case 'created_by':
  //                 case 'updated_by':
  //                   randomData = Math.floor(Math.random() * 800) + 1;
  //                   break;
  //                 default:
  //                   randomData = null;
  //                   break;
  //               }
  //               dataArray.push(randomData)
  //             })
  //             const query = `INSERT INTO ${key} (${labelArray}) VALUES (${dataArray})`;
  //             console.log('-', query)
  //             await pgPool.query(query);

  //             // console.log(dataArray)
  //             // console.log(labelArray)
  //           }

  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error parsing JSON:', error);
  //   }
  // }

  async function paymentFact() {
    try {
      let labelArray = [];
      let dataArray = [];
      let counter = 581484;
      let counter2 = 66349;
      const data = JSON.parse(jsonString);
      for (let key in data) {
        if (key == 'payment_fact') {
          if (data.hasOwnProperty(key)) {
            const columnsArray = data[key];
            const now = new Date();
            const startDate = new Date('2020-01-01');
            // const textLength = Math.floor(Math.random() * 10) + 1;
            let billRecipient = 1;
            for (let i = 0; i < 331745; i++) {
              labelArray = [];
              dataArray = [];
              columnsArray.forEach(element => {
                labelArray.push(element.column_name)
                let randomData;
                const randomDate = getRandomDate(startDate, now);
                const formattedDate = randomDate.toISOString().slice(0, 10);
                switch (element.column_name) {
                  case 'payment_fact_id':
                    randomData = counter;
                    counter++;
                    break;
                  case 'payment_id':
                    randomData = counter2;
                    counter2++;
                    break;
                  case 'bill_id':
                    randomData = Math.floor(Math.random() * 824150) + 164832;
                    break;
                  case 'action_type_id':
                    randomData = `'1'`
                    break;
                  case 'payment_type_id':
                    randomData = Math.floor(Math.random() * 4) + 1;
                    break;
                  case 'payment_by_id':
                    randomData = Math.floor(Math.random() * 4) + 1;
                    break;
                  case 'payment_status_id':
                    randomData = Math.floor(Math.random() * 6) + 1;
                    break;
                  case 'invoice_id':
                    randomData = Math.floor(Math.random() * 6) + 1;
                  case 'bulk_payment_id':
                    randomData = Math.floor(Math.random() * 10) + 1;
                    break;
                  // case 'check_day':
                  // case 'posted_day':
                  //   randomData = Math.floor(Math.random() * 31) + 1;
                  //   break;
                  // case 'check_month':
                  // case 'posted_month':
                  //   randomData = Math.floor(Math.random() * 12) + 1;
                  //   break;
                  // case 'check_week':
                  // case 'posted_week':
                  //   randomData = Math.floor(Math.random() * 52) + 1;
                  //   break;
                  // case 'check_year':
                  // case 'posted_year':
                  //   randomData = Math.floor(Math.random() * 10) + 2015;
                  //   break;
                  case 'check_no':
                    randomData = generateRandomNumber(8);
                    break;
                  case 'check_amount':
                    randomData = (Math.random() * 1000).toFixed(2);
                    break;
                  case 'description':
                    let b = `${faker.random.word()}`;
                    randomData = `'${b.replace(/'/g, '')}'`;
                    break;
                  case 'bulk_payment':
                    randomData = Math.random() < 0.5;
                    break;
                  case 'check_date':
                  case 'posted_date':
                  case 'created_at':
                  case 'updated_at':
                  case 'dumb_date':
                    randomData = "'" + formattedDate + "'";
                    break;
                  case 'deleted_at':
                    randomData = 'null';
                    break;
                  case 'created_by':
                  case 'updated_by':
                    randomData = Math.floor(Math.random() * 800) + 1;
                    break;
                  default:
                    randomData = null;
                    break;
                }
                dataArray.push(randomData)
              })
              const query = `INSERT INTO ${key} (${labelArray}) VALUES (${dataArray})`;
              // console.log('-', query)
              await pgPool.query(query);

            }

          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }




  async function executeFunctions() {
    await patientsDim();        
    await caseFact();           
    await appointmentFact();   
    await visitsFact();          
    await billsFact();        
    await billsRecipientDim();  
    await denialDim();          
    // await denialTypeDim();      
    await paymentFact();       
  }

  executeFunctions();
});



