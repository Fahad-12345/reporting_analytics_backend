require('dotenv').config({ path: '../../.env' })
const config = {
    dev: {
        driver: "pg",
        user: process.env.WRITE_DATABASE_USERNAME,
        password: process.env.WRITE_DATABASE_PASSWORD,
        host: process.env.WRITE_DATABASE_HOST,
        database: process.env.WRITE_DATABASE_NAME,
        port: process.env.WRITE_DATABASE_PORT,
        ssl : {
            require : true,
            rejectUnauthorized : false
        }
    }
};
module.exports = config

