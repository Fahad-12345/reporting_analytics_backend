import { ANY } from '../interfaces/types';

export const responses: ANY = {
    en: {
        SUCCESS: {
            message: 'success',
            status: 200
        },
        INTERNAL_SERVER_ERROR: {
            message: 'Internal server error',
            status: 500
        },
        INVALID_SPECIALITY_IDS: {
            message: 'Invalid specialty id(s)',
            status: 406
        },
        LOGGED_IN_NOT_FOUND: {
            message: 'Logged-In User not found!',
            status: 406
        },
        LOGGED_IN_NOT_PROVIDER: {
            message: 'Logged In user is not a provider.',
            status: 406
        },
        NO_RECORD_FOUND: {
            message: 'No record exists in the system.',
            status: 406
        },
        UNKNOWN_QUERY_PARAMS: {
            message: 'Unrecognized query params',
            status: 406
        },
        USER_EXISTS: {
            message: 'User Already exists',
            status: 406
        },
        validator: {
            body: {
                BODY_NOT_EMPTY: 'request body should not empty',
                DOCTOR_ID_INTEGER: 'doctor_id must be integer',
                DOCTOR_ID_REQUIRED: 'doctor_id must cannot be empty',
                SPECIALITY_ID_INTEGER: 'speciality_id must be integer',
                SPECIALITY_ID_REQUIRED: 'speciality_id cannot be empty',
                USER_ID_INTEGER: 'user_id must be integer',
                USER_ID_REQUIRED: 'user_id must cannot be empty',
            },
            query: {
                CASE_IS_NOT_VALID: 'case_id must cannot be integer',
                CHECK_IS_NOT_VALID: 'check must be [daily, weekly, previous, upcomming]',
                DATE_IS_NOT_VALID: 'date must be 0000-00-00',
                PAGE_IS_NOT_VALID: 'page must be integer',
                PAGINATE_IS_NOT_VALID: 'paginate must be boolean',
                PATIENT_ID_REQUIRED: 'patient_id must cannot be empty',
                PER_PAGE_IS_NOT_VALID: 'per_page must be integer',
                TEST: 'test'
            }
        },
    }

};
