import { ExportChartsDetails } from "../interfaces";

export const chartsDetails: ExportChartsDetails = {
    completedAppointments: {
        tableName: 'appointment_fact as appfac',
        alias: "appfac",
        toSelect: ['appfac.case_id', 'appfac.scheduled_date_time', 'appfac.evaluation_date_time'],
        explicitChecks: ['appfac.deleted_at IS NULL', 'appfac.appointment_status_id = 13', "appfac.is_cancelled != '1'"],
        leftJoin: {
            patient_dim: {
                alias: 'pd',
                toSelect: [`(pd.first_name || ' ' || COALESCE(pd.middle_name, '') || ' ' || pd.last_name) as patient_name`],
                joinChecks: ["appfac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            case_types_dim: {
                alias: 'c',
                toSelect: [`c.name as case_type_name`],
                joinChecks: ["appfac.case_type_id = c.case_type_id", 'c.deleted_at IS NULL',],
            },
            appointment_status_dim: {
                alias: 'appstatus',
                toSelect: [`appstatus.name as appointment_status`],
                joinChecks: ["appfac.appointment_status_id = appstatus.appointment_status_id", 'appstatus.deleted_at IS NULL',],
            },
            visits_fact: {
                alias: 'vis',
                joinChecks: ["appfac.appointment_id = vis.appointment_id", 'vis.deleted_at IS NULL',],
            },

            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["vis.provider_id = u.user_id", "u.deleted_at is NULL"]
            },

            specialities_dim: {
                alias: 'sp',
                toSelect: ['sp.name as specialty'],
                joinChecks: ["vis.speciality_id = sp.specialty_id", "sp.deleted_at is NULL"]
            },

            facility_location_dim: {
                alias: 'fl',
                toSelect: ['fl.facility_location_name as practice_location'],
                joinChecks: ["appfac.facility_location_id = fl.facility_location_id", 'fl.deleted_at is NULL']
            },
            visit_session_state_dim: {
                alias: 'vissession',
                toSelect: [`vissession.visit_session_state_name as visit_state`],
                joinChecks: ["vis.visit_session_state_id = vissession.visit_session_state_id", 'vissession.deleted_at IS NULL',],
            }

        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'appfac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'appfac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'appfac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'appfac' },
            fromDate: { column: 'scheduled_date_time', type: 'DATE_RANGE_START', filtersAlias: 'appfac' },
            toDate: { column: 'scheduled_date_time', type: 'DATE_RANGE_END', filtersAlias: 'appfac' },
            month_id: { column: 'scheduled_date_time', type: 'MONTH', filtersAlias: 'appfac' },
            time_span_id: { column: 'scheduled_date_time', type: 'TIME_SPAN', filtersAlias: 'appfac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'appfac' },
        },
        filterAlias: 'appfac',
        orderby: 'case_id'
    },
    averageWaitTime: {
        tableName: 'appointment_fact as appfac',
        alias: "appfac",
        toSelect: ['appfac.case_id', 'appfac.is_cancelled', 'appfac.evaluation_date_time', 'appfac.scheduled_date_time',],
        selectAggregate: ['ROUND(AVG((EXTRACT(HOUR FROM (evaluation_date_time - scheduled_date_time)) * 60 + EXTRACT(MINUTE FROM(evaluation_date_time - scheduled_date_time)))), 2) as wait_time'],
        explicitChecks: ['appfac.deleted_at IS NULL'],
        leftJoin: {
            patient_dim: {
                alias: 'pd',
                toSelect: [`(pd.first_name || ' ' || COALESCE(pd.middle_name, '') || ' ' || pd.last_name) as patient_name`],
                joinChecks: ["appfac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            case_types_dim: {
                alias: 'c',
                toSelect: [`c.name as case_type_name`],
                joinChecks: ["appfac.case_type_id = c.case_type_id", 'c.deleted_at IS NULL',],
            },

            visits_fact: {
                alias: 'vis',
                joinChecks: ["appfac.appointment_id = vis.appointment_id", 'vis.deleted_at IS NULL',],
            },

            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["vis.provider_id = u.user_id", "u.deleted_at is NULL"]
            },
            facility_location_dim: {
                alias: 'fl',
                toSelect: ['fl.facility_location_name as practice_location'],
                joinChecks: ["appfac.facility_location_id = fl.facility_location_id", 'fl.deleted_at is NULL']
            },
            appointment_status_dim: {
                alias: 'asd',
                toSelect: ['asd.name as appointment_status_name'],
                joinChecks: ["appfac.appointment_status_id = asd.appointment_status_id", "asd.deleted_at IS NULL"]
            }
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'appfac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'appfac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'appfac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'appfac' },
            fromDate: { column: 'scheduled_date_time', type: 'DATE_RANGE_START', filtersAlias: 'appfac' },
            toDate: { column: 'scheduled_date_time', type: 'DATE_RANGE_END', filtersAlias: 'appfac' },
            month_id: { column: 'scheduled_date_time', type: 'MONTH', filtersAlias: 'appfac' },
            time_span_id: { column: 'scheduled_date_time', type: 'TIME_SPAN', filtersAlias: 'appfac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'appfac' },
        },
        filterAlias: "appfac",
        orderby: 'case_id'
    },
    cancelNoShow: {
        tableName: 'appointment_fact as appfac',
        alias: "appfac",
        toSelect: ['appfac.case_id', 'appfac.scheduled_date_time', 'appfac.evaluation_date_time'],
        explicitChecks: ['appfac.deleted_at IS NULL', "is_cancelled = '1'"],
        leftJoin: {
            patient_dim: {
                alias: 'pd',
                toSelect: [`(pd.first_name || ' ' || COALESCE(pd.middle_name, '') || ' ' || pd.last_name) as patient_name`],
                joinChecks: ["appfac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            case_types_dim: {
                alias: 'c',
                toSelect: [`c.name as case_type_name`],
                joinChecks: ["appfac.case_type_id = c.case_type_id", 'c.deleted_at IS NULL',],
            },
            appointment_status_dim: {
                alias: 'appstatus',
                toSelect: [`appstatus.name as appointment_status`],
                joinChecks: ["appfac.appointment_status_id = appstatus.appointment_status_id", 'appstatus.deleted_at IS NULL',],
            },

            visits_fact: {
                alias: 'vis',
                joinChecks: ["appfac.appointment_id = vis.appointment_id", 'vis.deleted_at IS NULL',],
            },

            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["vis.provider_id = u.user_id", "u.deleted_at is NULL"]
            },

            specialities_dim: {
                alias: 'sp',
                toSelect: ['sp.name as specialty'],
                joinChecks: ["vis.speciality_id = sp.specialty_id", "sp.deleted_at is NULL"]
            },

            facility_location_dim: {
                alias: 'fl',
                toSelect: ['fl.facility_location_name as practice_location'],
                joinChecks: ["appfac.facility_location_id = fl.facility_location_id", 'fl.deleted_at is NULL']
            },
            visit_session_state_dim: {
                alias: 'vissession',
                toSelect: [`vissession.visit_session_state_name as visit_state`],
                joinChecks: ["vis.visit_session_state_id = vissession.visit_session_state_id", 'vissession.deleted_at IS NULL',],
            }

        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'appfac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'appfac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'appfac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'appfac' },
            fromDate: { column: 'scheduled_date_time', type: 'DATE_RANGE_START', filtersAlias: 'appfac' },
            toDate: { column: 'scheduled_date_time', type: 'DATE_RANGE_END', filtersAlias: 'appfac' },
            month_id: { column: 'scheduled_date_time', type: 'MONTH', filtersAlias: 'appfac' },
            time_span_id: { column: 'scheduled_date_time', type: 'TIME_SPAN', filtersAlias: 'appfac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'appfac' },
        },
        filterAlias: 'appfac',
        orderby: 'case_id'
    },
    denialRate: {
        tableName: 'denial_dim as den_dim',
        alias: "den_dim",
        toSelect: ['den_dim.denial_date'],
        explicitChecks: ['billFac.deleted_at IS NULL', "billFac.denial_status_id IS NOT NULL"],
        leftJoin: {
            denial_type_dim: {
                alias: 'denTypDim',
                toSelect: ['denTypDim.denial_type_name'],
                joinChecks: ["den_dim.denial_id = denTypDim.denial_id", 'denTypDim.deleted_at IS NULL',],

            },
            bills_fact_new: {
                alias: 'billFac',
                toSelect: ['billFac.bill_id', 'billFac.bill_date', 'billFac.bill_label', 'billFac.accident_date', 'billFac.dos_from_date', 'billFac.dos_to_date', 'billFac.case_id', 'billFac.paid_amount', 'billFac.outstanding_amount', 'billFac.bill_amount'],
                joinChecks: ["den_dim.bill_id = billFac.bill_id", 'billFac.deleted_at IS NULL',],
            },
            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["billFac.doctor_id = u.user_id", "u.deleted_at is NULL",],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: [`CONCAT(bilRecDim.bill_recipient_f_name,' ',bilRecDim.bill_recipient_m_name,' ',bilRecDim.bill_recipient_l_name) AS Bill_Recipient_Name`],
                joinChecks: ["billFac.bill_id = bilRecDim.bill_id", "bilRecDim.deleted_at is NULL",],
            },

            patient_dim: {
                alias: 'pd',
                toSelect: [`CONCAT(pd.first_name,' ',pd.middle_name,' ',pd.last_name) AS patient_name`],
                joinChecks: ["billFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            case_types_dim: {
                alias: 'c',
                toSelect: [`c.name as case_type_name`],
                joinChecks: ["billFac.case_type_id = c.case_type_id", 'c.deleted_at IS NULL',],
            },
            denial_status_dim: {
                alias: 'den_status',
                toSelect: [`den_status.name as denial_status_name`],
                joinChecks: ["billFac.denial_status_id = den_status.denial_status_id", 'den_status.deleted_at IS NULL',],
            },
            facilities_dim: {
                alias: 'fac',
                joinChecks: ['billFac.facility_id = fac.facility_id', 'fac.deleted_at is NULL']
            },

            facility_location_dim: {
                alias: 'facil',
                toSelect: [`fac.facility_qualifier || ' ' || facil.facility_location_name as practice_location`],
                joinChecks: ["billFac.facility_location_id = facil.facility_location_id", "facil.deleted_at is NULL"]
            },

        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'billFac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'billFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'billFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'billFac' },
            fromDate: { column: 'created_at', type: 'DATE_RANGE_START', filtersAlias: 'billFac' },
            toDate: { column: 'created_at', type: 'DATE_RANGE_END', filtersAlias: 'billFac' },
            month_id: { column: 'created_at', type: 'MONTH', filtersAlias: 'billFac' },
            time_span_id: { column: 'created_at', type: 'TIME_SPAN', filtersAlias: 'billFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'billFac' },
        },
        filterAlias: 'billFac',
        orderby: 'billFac.bill_id'
    },
    appointmentTrends: { //done
        tableName: 'appointment_fact as appfac',
        alias: 'appfac',
        toSelect: ['appfac.case_id', 'appfac.is_cancelled', 'appfac.scheduled_date_time', 'appfac.evaluation_date_time'],
        explicitChecks: ['appfac.deleted_at IS NULL', 'appfac.case_type_id IS NOT NULL', 'appfac.speciality_id IS NOT NULL', 'appfac.facility_location_id IS NOT NULL', 'appfac.case_id IS NOT NULL'],
        leftJoin: {
            patient_dim: {
                alias: 'pd',
                toSelect: [`(pd.first_name || ' ' || COALESCE(pd.middle_name, '') || ' ' || pd.last_name) as patient_name`],
                joinChecks: ["appfac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            case_types_dim: {
                alias: 'c',
                toSelect: [`c.name as case_type_name`],
                joinChecks: ["appfac.case_type_id = c.case_type_id", 'c.deleted_at IS NULL',],
            },
            appointment_status_dim: {
                alias: 'appstatus',
                toSelect: [`appstatus.name as appointment_status`],
                joinChecks: ["appfac.appointment_status_id = appstatus.appointment_status_id", 'appstatus.deleted_at IS NULL',],
            },
            visits_fact: {
                alias: 'vis',
                joinChecks: ["appfac.appointment_id = vis.appointment_id", 'vis.deleted_at IS NULL',],
            },

            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["vis.provider_id = u.user_id", "u.deleted_at is NULL"]
            },

            specialities_dim: {
                alias: 'sp',
                toSelect: ['sp.name as specialty'],
                joinChecks: ["vis.speciality_id = sp.specialty_id", "sp.deleted_at is NULL"]
            },

            facility_location_dim: {
                alias: 'fl',
                toSelect: ['fl.facility_location_name as practice_location'],
                joinChecks: ["appfac.facility_location_id = fl.facility_location_id", 'fl.deleted_at is NULL']
            },
            visit_session_state_dim: {
                alias: 'vissession',
                toSelect: [`vissession.visit_session_state_name as visit_state`],
                joinChecks: ["vis.visit_session_state_id = vissession.visit_session_state_id", 'vissession.deleted_at IS NULL',],
            }

        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'appfac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'appfac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'appfac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'appfac' },
            fromDate: { column: 'scheduled_date_time', type: 'DATE_RANGE_START', filtersAlias: 'appfac' },
            toDate: { column: 'scheduled_date_time', type: 'DATE_RANGE_END', filtersAlias: 'appfac' },
            month_id: { column: 'scheduled_date_time', type: 'MONTH', filtersAlias: 'appfac' },
            time_span_id: { column: 'scheduled_date_time', type: 'TIME_SPAN', filtersAlias: 'appfac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'appfac' },
        },
        filterAlias: 'appfac',
        orderby: 'case_id'
    },
    visitStatusAnalysis: {
        tableName: 'visits_fact as visFac',
        alias: "visFac",
        toSelect: ['visFac.case_id', 'visFac.visit_icd_code_status', 'visFac.visit_cpt_code_status',
            'visFac.accident_date', 'visFac.visit_date', 'visFac.document_uploaded'],
        explicitChecks: ['visFac.deleted_at IS NULL', 'visFac.case_type_id IS NOT NULL', 'visFac.facility_location_id IS NOT NULL', ' visFac.speciality_id IS NOT NULL', 'visFac.patient_id IS NOT NULL', 'visFac.case_id IS NOT NULL'],
        leftJoin: {
            patient_dim: {
                alias: 'pd',
                toSelect: [`CONCAT(pd.first_name,' ',pd.middle_name,' ',pd.last_name) AS patient_name`, 'pd.dob AS DOB'],
                joinChecks: ["visFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            visit_session_state_dim: {
                alias: 'vsd',
                toSelect: [`vsd.visit_session_state_name`],
                joinChecks: ["visFac.visit_session_state_id = vsd.visit_session_state_id", 'vsd.deleted_at IS NULL'],
            },
            appointment_fact: {
                alias: 'appfac',
                toSelect: ["CASE WHEN appfac.billable IS NULL THEN TRUE ELSE appfac.billable END AS billable"],
                joinChecks: ["visFac.appointment_id = appfac.appointment_id", 'appfac.deleted_at IS NULL'],
            },
            appointment_type_dim: {
                alias: 'appTypDim',
                toSelect: ['appTypDim.name AS visit_type'],
                joinChecks: ["appfac.appointment_type_id = appTypDim.appointment_type_id", 'appTypDim.deleted_at IS NULL',],

            },
            facility_location_dim: {
                alias: 'facil',
                toSelect: [`fac.facility_qualifier || ' ' || facil.facility_location_name as practice_location`],
                joinChecks: ["visFac.facility_location_id = facil.facility_location_id", "facil.deleted_at is NULL"]
            },
            facilities_dim: {
                alias: 'fac',
                joinChecks: ['visFac.facility_id = fac.facility_id', 'fac.deleted_at is NULL']
            },
            case_types_dim: {
                alias: 'c',
                toSelect: [`c.name as case_type_name`],
                joinChecks: ["visFac.case_type_id = c.case_type_id", 'c.deleted_at IS NULL',],
            },
            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["visFac.provider_id = u.user_id", "u.deleted_at is NULL",],
            },
            specialities_dim: {
                alias: 'sp',
                toSelect: ['sp.name as specialty'],
                joinChecks: ["visFac.speciality_id = sp.specialty_id", "sp.deleted_at is NULL"]
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'visFac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'visFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'visFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'visFac' },
            fromDate: { column: 'visit_date', type: 'DATE_RANGE_START', filtersAlias: 'visFac' },
            toDate: { column: 'visit_date', type: 'DATE_RANGE_END', filtersAlias: 'visFac' },
            month_id: { column: 'visit_date', type: 'MONTH', filtersAlias: 'visFac' },
            time_span_id: { column: 'visit_date', type: 'TIME_SPAN', filtersAlias: 'visFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'visFac' },
        },
        filterAlias: 'visFac',
        orderby: 'visFac.case_id'
    },
    patientCaseStatus: {
        tableName: 'patient_dim as pd',
        alias: "pd",
        toSelect: ['pd.patient_id', 'pd.first_name', 'pd.middle_name', 'pd.last_name', 'pd.dob'],
        explicitChecks: ['pd.deleted_at IS NULL'],
        leftJoin: {
            appointment_fact: {
                alias: 'appFac',
                joinChecks: ["pd.patient_id = appFac.patient_id", 'appFac.deleted_at IS NULL'],
            }
        },
        innerJoin: {
            case_fact_new: {
                alias: 'casFac',
                joinChecks: ["pd.patient_id = casFac.patient_id", 'casFac.deleted_at IS NULL'],
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'appFac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'appFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'casFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'casFac' },
            fromDate: { column: 'created_at', type: 'DATE_RANGE_START', filtersAlias: 'casFac' },
            toDate: { column: 'created_at', type: 'DATE_RANGE_END', filtersAlias: 'casFac' },
            month_id: { column: 'created_at', type: 'MONTH', filtersAlias: 'casFac' },
            time_span_id: { column: 'created_at', type: 'TIME_SPAN', filtersAlias: 'casFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'appFac' },
        },
        filterAlias: 'appFac',
        orderby: 'patient_id'
    },
    returningPatientStatus: {
        tableName: 'patient_dim as pd',
        alias: "pd",
        toSelect: [
            'pd.patient_id',
            'pd.first_name',
            'pd.middle_name',
            'pd.last_name',
            'pd.dob'
        ],
        explicitChecks: ['pd.deleted_at IS NULL'],
        leftJoin: {
            appointment_fact: {
                alias: 'appFac',
                joinChecks: ["pd.patient_id = appFac.patient_id", 'appFac.deleted_at IS NULL'],
            },
            case_fact_new: {
                alias: 'casFac',
                joinChecks: ["pd.patient_id = casFac.patient_id", 'casFac.deleted_at IS NULL'],
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'appFac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'appFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'casFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'casFac' },
            fromDate: { column: 'created_at', type: 'DATE_RANGE_START', filtersAlias: 'pd' },
            toDate: { column: 'created_at', type: 'DATE_RANGE_END', filtersAlias: 'pd' },
            month_id: { column: 'created_at', type: 'MONTH', filtersAlias: 'pd' },
            time_span_id: { column: 'created_at', type: 'TIME_SPAN', filtersAlias: 'pd' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'pd' },
        },
        filterAlias: 'appFac',
        having: 'COUNT(DISTINCT casFac.case_id) > 1',
        orderby: 'pd.patient_id'
    },
    newCases: {
        tableName: 'case_fact_new as casFac',
        alias: "casFac",
        toSelect: ['casFac.case_id', 'casFac.patient_id', 'casFac.accident_date'],
        explicitChecks: ['casFac.deleted_at IS NULL'],
        leftJoin: {
            patient_dim: {
                alias: 'pd',
                toSelect: [`(pd.first_name || ' ' || COALESCE(pd.middle_name, '') || ' ' || pd.last_name) as patient_name`],
                joinChecks: ["casFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            appointment_fact: {
                alias: 'appFac',
                joinChecks: ["pd.patient_id = appFac.patient_id", "appFac.deleted_at IS NULL", "appFac.patient_id IS NOT NULL"]
            }
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'appFac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'appFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'casFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'casFac' },
            fromDate: { column: 'created_at', type: 'DATE_RANGE_START', filtersAlias: 'casFac' },
            toDate: { column: 'created_at', type: 'DATE_RANGE_END', filtersAlias: 'casFac' },
            month_id: { column: 'created_at', type: 'MONTH', filtersAlias: 'casFac' },
            time_span_id: { column: 'created_at', type: 'TIME_SPAN', filtersAlias: 'casFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'appFac' },
        },
        filterAlias: 'appFac',
        having: 'COUNT(DISTINCT casFac.case_id) <= 1',
        orderby: 'case_id'
    },
    denialTypeAnalysis: {
        tableName: 'denial_dim as denDim',
        alias: "denDim",
        toSelect: ['denDim.denial_date', 'billFac.case_id'],
        explicitChecks: ['denDim.deleted_at IS NULL', 'denDim.denial_id IS NOT NULL', 'billFac.deleted_at IS NULL',],
        leftJoin: {
            denial_type_dim: {
                alias: 'denTypDim',
                toSelect: ['denTypDim.denial_type_name'],
                joinChecks: ["denDim.denial_id = denTypDim.denial_id", 'denTypDim.deleted_at IS NULL',],

            },
            bills_fact_new: {
                alias: 'billFac',
                toSelect: ['billFac.bill_label', 'billFac.accident_date AS DOA', 'billFac.bill_date',
                    'billFac.bill_amount', 'billFac.paid_amount', 'billFac.outstanding_amount',
                    'billFac.over_payment', 'billFac.write_off_amount'
                ],
                joinChecks: ["denDim.bill_id::integer = billFac.bill_id", 'billFac.deleted_at IS NULL', 'denDim.bill_id IS NOT NULL',],
            },
            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["billFac.doctor_id = u.user_id", "u.deleted_at is NULL",],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: [`CONCAT(bilRecDim.bill_recipient_f_name,' ',bilRecDim.bill_recipient_m_name,' ',bilRecDim.bill_recipient_l_name) AS Bill_Recipient_Name`],
                joinChecks: ["billFac.bill_id = bilRecDim.bill_id", "bilRecDim.deleted_at is NULL",],
            },
            patient_dim: {
                alias: 'pd',
                toSelect: [`CONCAT(pd.first_name,' ',pd.middle_name,' ',pd.last_name) AS patient_name`],
                joinChecks: ["billFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            case_types_dim: {
                alias: 'c',
                toSelect: [`c.name as case_type_name`],
                joinChecks: ["billFac.case_type_id = c.case_type_id", 'c.deleted_at IS NULL',],
            },
            facility_location_dim: {
                alias: 'facil',
                toSelect: [`fac.facility_qualifier || ' ' || facil.facility_location_name as practice_location`],
                joinChecks: ["billFac.facility_location_id = facil.facility_location_id", "facil.deleted_at is NULL"]
            },
            facilities_dim: {
                alias: 'fac',
                // toSelect: [`fac.facility_qualifier || ' ' || facil.facility_location_name as practice_location`],
                joinChecks: ["billFac.facility_id = fac.facility_id", "fac.deleted_at is NULL",],
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'billFac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'billFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'billFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'billFac' },
            fromDate: { column: 'denial_date', type: 'DATE_RANGE_START', filtersAlias: 'denDim' },
            toDate: { column: 'denial_date', type: 'DATE_RANGE_END', filtersAlias: 'denDim' },
            month_id: { column: 'denial_date', type: 'MONTH', filtersAlias: 'denDim' },
            time_span_id: { column: 'denial_date', type: 'TIME_SPAN', filtersAlias: 'denDim' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'denDim' },
        },
        filterAlias: 'billFac',
        orderby: 'billFac.bill_label'
    },
    averageCount: {
        tableName: 'bills_fact_new as billFac',
        alias: "billFac",
        toSelect: ['(billFac.bill_date - vis.visit_date) AS no_of_days_gap', 'billFac.bill_label', 'billFac.accident_date', 'billFac.bill_date', 'billFac.case_id',
            'billFac.bill_amount', 'billFac.paid_amount', 'billFac.outstanding_amount',
            'billFac.over_payment', 'billFac.write_off_amount'],
        explicitChecks: ['billFac.deleted_at IS NULL', "billFac.denial_status_id IS NOT NULL"],
        leftJoin: {
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: [`CONCAT(bilRecDim.bill_recipient_f_name,' ',bilRecDim.bill_recipient_m_name,' ',bilRecDim.bill_recipient_l_name) AS Bill_Recipient_Name`],
                joinChecks: ["billFac.bill_id = bilRecDim.bill_id", "bilRecDim.deleted_at is NULL",],
            },
            patient_dim: {
                alias: 'pd',
                toSelect: [`CONCAT(pd.first_name,' ',pd.middle_name,' ',pd.last_name) AS patient_name`],
                joinChecks: ["billFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            appointment_fact: {
                alias: 'appfac',
                joinChecks: ["pd.patient_id = appfac.patient_id"]
            },
            appointment_type_dim: {
                alias: 'appTypDim',
                toSelect: ['appTypDim.name AS visit_type'],
                joinChecks: ["appfac.appointment_type_id = appTypDim.appointment_type_id", 'appTypDim.deleted_at IS NULL',],

            },
            visits_fact: {
                alias: 'vis',
                toSelect: ['vis.visit_date'],
                joinChecks: ["appfac.appointment_id = vis.appointment_id", 'vis.deleted_at IS NULL',],
            },
            facility_location_dim: {
                alias: 'facil',
                toSelect: [`fac.facility_qualifier || ' ' || facil.facility_location_name as practice_location`],
                joinChecks: ["billFac.facility_location_id = facil.facility_location_id", "facil.deleted_at is NULL"]
            },
            facilities_dim: {
                alias: 'fac',
                joinChecks: ['billFac.facility_id = fac.facility_id', 'fac.deleted_at is NULL']
            },
            case_types_dim: {
                alias: 'c',
                toSelect: [`c.name as case_type_name`],
                joinChecks: ["billFac.case_type_id = c.case_type_id", 'c.deleted_at IS NULL',],
            },
            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["billFac.doctor_id = u.user_id", "u.deleted_at is NULL",],
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'billFac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'billFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'billFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'billFac' },
            fromDate: { column: 'created_at', type: 'DATE_RANGE_START', filtersAlias: 'billFac' },
            toDate: { column: 'created_at', type: 'DATE_RANGE_END', filtersAlias: 'billFac' },
            month_id: { column: 'created_at', type: 'MONTH', filtersAlias: 'billFac' },
            time_span_id: { column: 'created_at', type: 'TIME_SPAN', filtersAlias: 'billFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'billFac' },
        },
        filterAlias: 'billFac',
        orderby: 'billFac.bill_label'
    },
    unfinalizedVisits: { //done
        tableName: 'visits_fact as visFac',
        alias: "visFac",
        toSelect: ['visFac.case_id', 'visFac.accident_date', 'visFac.visit_date', 'visFac.document_uploaded', `current_date - visFac.visit_date AS No_of_days`],
        explicitChecks: ['visFac.deleted_at IS NULL', 'visFac.visit_session_state_id = 1', 'visFac.case_type_id IS NOT NULL', 'visFac.facility_location_id IS NOT NULL', 'visFac.speciality_id IS NOT NULL', 'visFac.patient_id IS NOT NULL', 'visFac.case_id IS NOT NULL'],
        leftJoin: {
            patient_dim: {
                alias: 'pd',
                toSelect: [`(pd.first_name || ' ' || COALESCE(pd.middle_name, '') || ' ' || pd.last_name) as patient_name`, `pd.dob as DOB`],
                joinChecks: ["visFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            appointment_fact: {
                alias: 'appFac',
                toSelect: ["CASE WHEN appfac.billable IS NULL THEN TRUE ELSE appfac.billable END AS billable"],
                joinChecks: ['visFac.appointment_id = appFac.appointment_id', 'appFac.deleted_at is NULL']
            },
            facilities_dim: {
                alias: 'fac',
                joinChecks: ['visFac.facility_id = fac.facility_id', 'fac.deleted_at is NULL']
            },

            facility_location_dim: {
                alias: 'facil',
                toSelect: [`fac.facility_qualifier || ' ' || facil.facility_location_name as practice_location`],
                joinChecks: ["visFac.facility_location_id = facil.facility_location_id", "facil.deleted_at is NULL"]
            },


            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["visFac.provider_id = u.user_id", "u.deleted_at is NULL"]
            },

            specialities_dim: {
                alias: 'sp',
                toSelect: ['sp.name as specialty'],
                joinChecks: ["visFac.speciality_id = sp.specialty_id", "sp.deleted_at is NULL"]
            },
            case_fact_new: {
                alias: 'c',
                toSelect: [
                    "(jsonb_each(c.insurances::jsonb)).value->>'name' as insurance_name",
                    "(jsonb_each(c.employers::jsonb)).value->>'name' as employer_name"
                ],
                joinChecks: [
                    "visFac.case_id = c.case_id",
                    "c.deleted_at is NULL"
                ]
            },
            case_info_dim: {
                alias: 'case_info',
                toSelect: ['case_info.claim_no as claim_number', 'case_info.policy_no as primary_policy'],
                joinChecks: ['c.case_id = case_info.case_id', 'case_info.insurance_deleted_at IS NULL', 'case_info.kiosk_case_insurances_id IS NOT NULL', "case_info.insurance_type = 'primary'"]
            },

            firms_dim: {
                alias: 'firm',
                toSelect: ["firm.firm_name as firm"],
                joinChecks: ["c.firm_id = firm.firm_id", "firm.deleted_at is NULL"]
            },
            case_types_dim: {
                alias: 'ct',
                toSelect: ["ct.name as case_type"],
                joinChecks: ["visFac.case_type_id = ct.case_type_id", "ct.deleted_at is NULL"]
            },


            appointment_type_dim: {
                alias: 'appType',
                toSelect: ['appType.name as visit_type'],
                joinChecks: ["appFac.appointment_type_id = appType.appointment_type_id", "appType.deleted_at is NULL"]
            },

            visit_session_state_dim: {
                alias: 'vsd',
                toSelect: [`vsd.visit_session_state_name`],
                joinChecks: ["visFac.visit_session_state_id = vsd.visit_session_state_id", 'vsd.deleted_at IS NULL'],
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'visFac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'visFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'visFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'visFac' },
            fromDate: { column: 'created_at', type: 'DATE_RANGE_START', filtersAlias: 'visFac' },
            toDate: { column: 'created_at', type: 'DATE_RANGE_END', filtersAlias: 'visFac' },
            month_id: { column: 'created_at', type: 'MONTH', filtersAlias: 'visFac' },
            time_span_id: { column: 'created_at', type: 'TIME_SPAN', filtersAlias: 'visFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'visFac' },
        },
        filterAlias: 'visFac',
        orderby: 'case_id'
    },
    unbilledVisit: { //done
        tableName: 'visits_fact as visFac',
        alias: "visFac",
        toSelect: ['visFac.visit_id', 'visFac.case_id', 'visFac.visit_icd_code_status', 'visFac.visit_cpt_code_status',
            'visFac.accident_date', 'visFac.visit_date', 'visFac.document_uploaded'],
        explicitChecks: ['visFac.deleted_at IS NULL', 'visFac.visit_session_state_id IN (1,2)', 'visFac.case_type_id IS NOT NULL', 'visFac.facility_location_id IS NOT NULL', 'visFac.speciality_id IS NOT NULL', 'visFac.patient_id IS NOT NULL', 'visFac.case_id IS NOT NULL'],
        leftJoin: {
            appointment_fact: {
                alias: 'appfac',
                toSelect: ["CASE WHEN appfac.billable IS NULL THEN TRUE ELSE appfac.billable END AS billable"],
                joinChecks: ["visFac.appointment_id = appfac.appointment_id", 'appfac.deleted_at IS NULL',],
            },
            appointment_type_dim: {
                alias: 'appTypDim',
                toSelect: ['appTypDim.name AS visit_type'],
                joinChecks: ["appfac.appointment_type_id = appTypDim.appointment_type_id", 'appTypDim.deleted_at IS NULL',],

            },
            facility_location_dim: {
                alias: 'facil',
                toSelect: [`fac.facility_qualifier || ' ' || facil.facility_location_name as practice_location`],
                joinChecks: ["visFac.facility_location_id = facil.facility_location_id", "facil.deleted_at is NULL",],
            },
            facilities_dim: {
                alias: 'fac',
                // toSelect: [`fac.facility_qualifier || ' ' || facil.facility_location_name as practice_location`],
                joinChecks: ["visFac.facility_id = fac.facility_id", "fac.deleted_at is NULL",],
            },
            case_types_dim: {
                alias: 'c',
                toSelect: [`c.name as case_type_name`],
                joinChecks: ["visFac.case_type_id = c.case_type_id", 'c.deleted_at IS NULL',],
            },
            users_dim: {
                alias: 'u',
                toSelect: [`(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name) as provider_name`],
                joinChecks: ["visFac.provider_id = u.user_id", "u.deleted_at is NULL",],
            },
            specialities_dim: {
                alias: 'sp',
                toSelect: ['sp.name as specialty'],
                joinChecks: ["visFac.speciality_id = sp.specialty_id", "sp.deleted_at is NULL",],
            },
            patient_dim: {
                alias: 'pd',
                toSelect: [`CONCAT(pd.first_name,' ',pd.middle_name,' ',pd.last_name) AS patient_name`],
                joinChecks: ["visFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            },
            visit_session_state_dim: {
                alias: 'vsd',
                toSelect: [`vsd.visit_session_state_name`],
                joinChecks: ["visFac.visit_session_state_id = vsd.visit_session_state_id", 'vsd.deleted_at IS NULL',],
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'visFac' },
            provider_ids: { column: 'provider_id', type: 'IN', filtersAlias: 'visFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'visFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'visFac' },
            fromDate: { column: 'visit_date', type: 'DATE_RANGE_START', filtersAlias: 'visFac' },
            toDate: { column: 'visit_date', type: 'DATE_RANGE_END', filtersAlias: 'visFac' },
            month_id: { column: 'visit_date', type: 'MONTH', filtersAlias: 'visFac' },
            time_span_id: { column: 'visit_date', type: 'TIME_SPAN', filtersAlias: 'visFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'visFac' },
        },
        filterAlias: 'visFac',
        orderby: 'visit_id'
    },
    DenialRate: {
        tableName: 'bills_fact_new as billFac',
        alias: "billFac",
        toSelect: ['billFac.bill_id', 'billFac.bill_label', 'billFac.accident_date', 'billFac.patient_id', 'billFac.denial_status_id', 'billFac.case_id', 'billFac.created_at'],
        explicitChecks: ['billFac.deleted_at IS NULL', "billFac.denial_status_id IS NOT NULL"],
        leftJoin: {
            patient_dim: {
                alias: 'pd',
                toSelect: [`pd.first_name as patient_first_name`, 'pd.middle_name as patient_middle_name', 'pd.last_name as patient_last_name'],
                joinChecks: ["billFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
            }
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN' },
            provider_ids: { column: 'provider_id', type: 'IN' },
            case_type_ids: { column: 'case_type_id', type: 'IN' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN' },
            fromDate: { column: 'created_at', type: 'DATE_RANGE_START' },
            toDate: { column: 'created_at', type: 'DATE_RANGE_END' },
            month_id: { column: 'created_at', type: 'MONTH' },
            time_span_id: { column: 'created_at', type: 'TIME_SPAN' },
            granularity_type_id: { column: '', type: 'GRANULARITY' },
        },
    },
    // DenialRate: {
    //     tableName: 'bills_fact_new as billFac',
    //     alias: "billFac",
    //     toSelect: ['billFac.bill_id', 'billFac.bill_label', 'billFac.accident_date', 'billFac.patient_id', 'billFac.denial_status_id', 'billFac.case_id', 'billFac.created_at'],
    //     explicitChecks: ['billFac.deleted_at IS NULL', "billFac.denial_status_id IS NOT NULL"],
    //     leftJoin: {
    //         patient_dim: {
    //             alias: 'pd',
    //             toSelect: [`pd.first_name as patient_first_name`, 'pd.middle_name as patient_middle_name', 'pd.last_name as patient_last_name'],
    //             joinChecks: ["billFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
    //         }
    //     },
    //     filters: {
    //         speciality_ids: { column: 'speciality_id', type: 'IN' },
    //         provider_ids: { column: 'provider_id', type: 'IN' },
    //         case_type_ids: { column: 'case_type_id', type: 'IN' },
    //         facility_location_ids: { column: 'facility_location_id', type: 'IN' },
    //         fromDate: { column: 'created_at', type: 'DATE_RANGE_START' },
    //         toDate: { column: 'created_at', type: 'DATE_RANGE_END' },
    //         month_id: { column: 'created_at', type: 'MONTH' },
    //         time_span_id: { column: 'created_at', type: 'TIME_SPAN' },
    //         granularity_type_id: { column: '', type: 'GRANULARITY' },
    //     },
    // },
    // DenialRate: {
    //     tableName: 'bills_fact_new as billFac',
    //     alias: "billFac",
    //     toSelect: ['billFac.bill_id', 'billFac.bill_label', 'billFac.accident_date', 'billFac.patient_id', 'billFac.denial_status_id', 'billFac.case_id', 'billFac.created_at'],
    //     explicitChecks: ['billFac.deleted_at IS NULL', "billFac.denial_status_id IS NOT NULL"],
    //     leftJoin: {
    //         patient_dim: {
    //             alias: 'pd',
    //             toSelect: [`pd.first_name as patient_first_name`, 'pd.middle_name as patient_middle_name', 'pd.last_name as patient_last_name'],
    //             joinChecks: ["billFac.patient_id = pd.patient_id", 'pd.deleted_at IS NULL',],
    //         }
    //     },
    //     filters: {
    //         speciality_ids: { column: 'speciality_id', type: 'IN' },
    //         provider_ids: { column: 'provider_id', type: 'IN' },
    //         case_type_ids: { column: 'case_type_id', type: 'IN' },
    //         facility_location_ids: { column: 'facility_location_id', type: 'IN' },
    //         fromDate: { column: 'created_at', type: 'DATE_RANGE_START' },
    //         toDate: { column: 'created_at', type: 'DATE_RANGE_END' },
    //         month_id: { column: 'created_at', type: 'MONTH' },
    //         time_span_id: { column: 'created_at', type: 'TIME_SPAN' },
    //         granularity_type_id: { column: '', type: 'GRANULARITY' },
    //     },
    // },

    // admin dashboard charts 
    billedvsCheckAmount: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        // toSelect: ['bilFac.bill_label', 'bilFac.bill_date', "CONCAT('$',bilFac.bill_amount) AS bill_amount", "CONCAT('$',bilFac.paid_amount) AS paid_amount", "CONCAT('$',bilFac.write_off_amount) AS write_off_amount"
        //     , "CONCAT('$',bilFac.outstanding_amount) AS outstanding_amount", "CONCAT('$',bilFac.over_payment) AS over_payment", "CONCAT('$',bilFac.interest_amount) AS interest_amount", 'bilFac.case_id', 'bilFac.dos_from_date',
        //     'bilFac.dos_to_date'
        // ],
        toSelect: ["COALESCE(CAST(invDim.invoice_id AS VARCHAR), bilFac.bill_label) AS bill_invoice_id,COALESCE(invDim.invoice_date,bilFac.bill_date) AS bill_invoice_date,COALESCE(invDim.invoice_amount,bilFac.bill_amount) AS bill_invoice_amount,COALESCE(invDim.paid_amount, bilFac.paid_amount) AS paid_amount,COALESCE(invDim.write_off_amount , bilFac.write_off_amount ) AS write_off_amount,COALESCE(invDim.outstanding_amount , bilFac.outstanding_amount ) AS outstanding_amount,COALESCE(invDim.over_amount, bilFac.over_payment) AS over_payment,COALESCE(invDim.interest_amount, bilFac.interest_amount) AS interest_amount "],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            },
            payment_fact: {
                alias: 'payFac',
                toSelect: ["CONCAT('$',payFac.check_amount) AS check_amount", 'payFac.check_date', 'payFac.check_no'],
                subjoincondition: ['( SELECT bill_id, SUM(check_amount) as check_amount,MAX(check_date) as check_date,MAX(deleted_at) as deleted_at, MAX(check_no) as check_no,MAX(payment_by_id) as payment_by_id FROM payment_fact WHERE deleted_at is NULL group by bill_id )'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id"],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: ['bilRecDim.Bill_Recipient_Name', 'bilRecDim.bill_recipient_type_name'],
                subjoincondition: ["( SELECT bill_id, bill_recipient_type_id, CONCAT(bill_recipient_f_name,' ',bill_recipient_m_name,' ',bill_recipient_l_name) AS Bill_Recipient_Name, bill_recipient_type_name AS bill_recipient_type_name FROM bills_recipient_dim where deleted_at is NULL )"],
                joinChecks: ["bilFac.bill_id = bilRecDim.bill_id"],
            },
            facility_location_dim: {
                alias: 'FacLocDim',
                toSelect: ['FacLocDim.facility_location_name AS Practice_Location'],
                subjoincondition: ["(SELECT facility_location_id, facility_location_name FROM facility_location_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id']
            },
            case_types_dim: {
                alias: 'casTypDim',
                toSelect: ['casTypDim.name as case_type_name'],
                subjoincondition: ["(SELECT case_type_id,name FROM case_types_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.case_type_id = casTypDim.case_type_id']
            },
            patient_dim: {
                alias: 'patDim',
                toSelect: ["patDim.patient_name"],
                subjoincondition: ["(SELECT patient_id,CONCAT(first_name,' ',middle_name,' ',last_name) AS patient_name FROM patient_dim where deleted_at is NULL)"],
                joinChecks: ['bilFac.patient_id = patDim.patient_id']

            },
            users_dim: {
                alias: 'usrDim',
                toSelect: [`usrDim.provider_name AS provider_name`],
                subjoincondition: ["(SELECT user_id,concat(first_name,' ', middle_name, ' ',last_name) AS provider_name FROM users_dim where deleted_at IS NULL)"],
                joinChecks: ["bilFac.doctor_id = usrDim.user_id"],
            },
            payment_by_dim: {
                alias: 'payByDim',
                toSelect: ['payByDim.payment_by_name'],
                subjoincondition: ["(SELECT payment_by_id,payment_by_name FROM payment_by_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payFac.payment_by_id = payByDim.payment_by_id']
            },
            //new columnsss added by sara umar
            case_fact_new: {
                alias: 'caseFac',
                toSelect: ['caseFac.DOA AS DOA'],
                subjoincondition: ["(SELECT case_id,attorney_id,firm_id,accident_date AS DOA FROM case_fact_new WHERE deleted_at is null)"],
                joinChecks: ['bilFac.case_id = caseFac.case_id']
            },
            attorney_dim: {
                alias: 'attDim',
                toSelect: ["attDim.attorney_name AS attorney_name"],
                subjoincondition: ["(SELECT attorney_id,CONCAT(first_name,'  ',middle_name,'  ',last_name) AS attorney_name FROM attorney_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['attDim.attorney_id = caseFac.attorney_id']
            },
            specialities_dim: {
                alias: 'specDim',
                toSelect: ['specDim.name AS speciality_name'],
                subjoincondition: ["(SELECT specialty_id,name FROM specialities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["specDim.specialty_id = bilFac.speciality_id"],
            },
            firms_dim: {
                alias: 'firms',
                toSelect: ['firms.firm_name AS firm_name'],
                subjoincondition: ["(SELECT firm_id,firm_name FROM firms_dim where deleted_at IS NULL) "],
                joinChecks: ['caseFac.firm_id = firms.firm_id']
            },
            facilities_dim: {
                alias: 'FacDim',
                toSelect: ["FacDim.facility_name AS practice_name"],
                subjoincondition: ["(SELECT facility_id,facility_name FROM facilities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["bilFac.facility_id = FacDim.facility_id"],
            },
            denial_dim: {
                alias: 'denDim',
                // toSelect:
                subjoincondition: ["(SELECT bill_id,denial_id FROM denial_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.bill_id = denDim.bill_id']
            },
            denial_type_dim: {
                alias: 'denTypDim',
                toSelect: ['denTypDim.denial_type_name as denial_type'],
                subjoincondition: ["(SELECT denial_id,denial_type_name FROM denial_type_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['denDim.denial_id = denTypDim.denial_id']
            },
            bill_status_dim: {
                alias: 'bilStatDim',
                toSelect: ['bilStatDim.name AS bill_status'],
                subjoincondition: ["(SELECT bill_status_id,name FROM bill_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.bill_status_id = bilStatDim.bill_status_id']
            },
            denial_status_dim: {
                alias: 'denStatDim',
                toSelect: ['denStatDim.name AS denial_status'],
                subjoincondition: ["(SELECT denial_status_id,name FROM denial_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.denial_status_id = denStatDim.denial_status_id']
            },
            eor_status_dim: {
                alias: 'eorStatDim',
                toSelect: ['eorStatDim.name AS eor_status'],
                subjoincondition: ["(SELECT eor_status_id,name FROM eor_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['eorStatDim.eor_status_id = bilFac.eor_status_id']
            },
            payment_status_dim: {
                alias: 'payStatDim',
                toSelect: ['payStatDim.name AS payment_status'],
                subjoincondition: ["(SELECT payment_status_id,name FROM payment_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payStatDim.payment_status_id = bilFac.payment_status_id']
            },
            verification_status_dim: {
                alias: 'verStatDim',
                toSelect: ['verStatDim.name AS verification_status'],
                subjoincondition: ["(SELECT verification_status_id,name FROM verification_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['verStatDim.verification_status_id = bilFac.verification_status_id']
            }
        },

        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'caseFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        innerfilters: {
            recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        },

        innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'bilFac.bill_label'
    },

    claimsOverView: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        // toSelect: ['bilFac.bill_label', 'bilFac.bill_date', "CONCAT('$',bilFac.bill_amount) AS bill_amount", "CONCAT('$',bilFac.paid_amount) AS paid_amount", "CONCAT('$',bilFac.write_off_amount) AS write_off_amount"
        //     , "CONCAT('$',bilFac.outstanding_amount) AS outstanding_amount", "CONCAT('$',bilFac.over_payment) AS over_payment", "CONCAT('$',bilFac.interest_amount) AS interest_amount", 'bilFac.case_id', 'bilFac.dos_from_date',
        //     'bilFac.dos_to_date'
        // ],
        toSelect: ["COALESCE(CAST(invDim.invoice_id AS VARCHAR), bilFac.bill_label) AS bill_invoice_id,COALESCE(invDim.invoice_date,bilFac.bill_date) AS bill_invoice_date,COALESCE(invDim.invoice_amount,bilFac.bill_amount) AS bill_invoice_amount,COALESCE(invDim.paid_amount, bilFac.paid_amount) AS paid_amount,COALESCE(invDim.write_off_amount , bilFac.write_off_amount ) AS write_off_amount,COALESCE(invDim.outstanding_amount , bilFac.outstanding_amount ) AS outstanding_amount,COALESCE(invDim.over_amount, bilFac.over_payment) AS over_payment,COALESCE(invDim.interest_amount, bilFac.interest_amount) AS interest_amount "],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            },
            payment_fact: {
                alias: 'payFac',
                toSelect: ["CONCAT('$',payFac.check_amount) AS check_amount", 'payFac.check_date', 'payFac.check_no'],
                subjoincondition: ['( SELECT bill_id, SUM(check_amount) as check_amount,MAX(check_date) as check_date,MAX(deleted_at) as deleted_at, MAX(check_no) as check_no,MAX(payment_by_id) as payment_by_id FROM payment_fact WHERE deleted_at is NULL group by bill_id )'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id"],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: ['bilRecDim.Bill_Recipient_Name', 'bilRecDim.bill_recipient_type_name'],
                subjoincondition: ["( SELECT bill_id, bill_recipient_type_id, CONCAT(bill_recipient_f_name,' ',bill_recipient_m_name,' ',bill_recipient_l_name) AS Bill_Recipient_Name, bill_recipient_type_name AS bill_recipient_type_name FROM bills_recipient_dim where deleted_at is NULL )"],
                joinChecks: ["bilFac.bill_id = bilRecDim.bill_id"],
            },
            facility_location_dim: {
                alias: 'FacLocDim',
                toSelect: ['FacLocDim.facility_location_name AS Practice_Location'],
                subjoincondition: ["(SELECT facility_location_id, facility_location_name FROM facility_location_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id']
            },
            case_types_dim: {
                alias: 'casTypDim',
                toSelect: ['casTypDim.name as case_type_name'],
                subjoincondition: ["(SELECT case_type_id,name FROM case_types_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.case_type_id = casTypDim.case_type_id']
            },
            patient_dim: {
                alias: 'patDim',
                toSelect: ["patDim.patient_name"],
                subjoincondition: ["(SELECT patient_id,CONCAT(first_name,' ',middle_name,' ',last_name) AS patient_name FROM patient_dim where deleted_at is NULL)"],
                joinChecks: ['bilFac.patient_id = patDim.patient_id']

            },
            users_dim: {
                alias: 'usrDim',
                toSelect: [`usrDim.provider_name AS provider_name`],
                subjoincondition: ["(SELECT user_id,concat(first_name,' ', middle_name, ' ',last_name) AS provider_name FROM users_dim where deleted_at IS NULL)"],
                joinChecks: ["bilFac.doctor_id = usrDim.user_id"],
            },
            payment_by_dim: {
                alias: 'payByDim',
                toSelect: ['payByDim.payment_by_name'],
                subjoincondition: ["(SELECT payment_by_id,payment_by_name FROM payment_by_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payFac.payment_by_id = payByDim.payment_by_id']
            },
            //new columnsss added by sara umar
            case_fact_new: {
                alias: 'caseFac',
                toSelect: ['caseFac.DOA AS DOA'],
                subjoincondition: ["(SELECT case_id,attorney_id,firm_id,accident_date AS DOA FROM case_fact_new WHERE deleted_at is null)"],
                joinChecks: ['bilFac.case_id = caseFac.case_id']
            },
            attorney_dim: {
                alias: 'attDim',
                toSelect: ["attDim.attorney_name AS attorney_name"],
                subjoincondition: ["(SELECT attorney_id,CONCAT(first_name,'  ',middle_name,'  ',last_name) AS attorney_name FROM attorney_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['attDim.attorney_id = caseFac.attorney_id']
            },
            specialities_dim: {
                alias: 'specDim',
                toSelect: ['specDim.name AS speciality_name'],
                subjoincondition: ["(SELECT specialty_id,name FROM specialities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["specDim.specialty_id = bilFac.speciality_id"],
            },
            firms_dim: {
                alias: 'firms',
                toSelect: ['firms.firm_name AS firm_name'],
                subjoincondition: ["(SELECT firm_id,firm_name FROM firms_dim where deleted_at IS NULL) "],
                joinChecks: ['caseFac.firm_id = firms.firm_id']
            },
            facilities_dim: {
                alias: 'FacDim',
                toSelect: ["FacDim.facility_name AS practice_name"],
                subjoincondition: ["(SELECT facility_id,facility_name FROM facilities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["bilFac.facility_id = FacDim.facility_id"],
            },
            denial_dim: {
                alias: 'denDim',
                // toSelect:
                subjoincondition: ["(SELECT bill_id,denial_id FROM denial_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.bill_id = denDim.bill_id']
            },
            denial_type_dim: {
                alias: 'denTypDim',
                toSelect: ['denTypDim.denial_type_name as denial_type'],
                subjoincondition: ["(SELECT denial_id,denial_type_name FROM denial_type_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['denDim.denial_id = denTypDim.denial_id']
            },
            bill_status_dim: {
                alias: 'bilStatDim',
                toSelect: ['bilStatDim.name AS bill_status'],
                subjoincondition: ["(SELECT bill_status_id,name FROM bill_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.bill_status_id = bilStatDim.bill_status_id']
            },
            denial_status_dim: {
                alias: 'denStatDim',
                toSelect: ['denStatDim.name AS denial_status'],
                subjoincondition: ["(SELECT denial_status_id,name FROM denial_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.denial_status_id = denStatDim.denial_status_id']
            },
            eor_status_dim: {
                alias: 'eorStatDim',
                toSelect: ['eorStatDim.name AS eor_status'],
                subjoincondition: ["(SELECT eor_status_id,name FROM eor_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['eorStatDim.eor_status_id = bilFac.eor_status_id']
            },
            payment_status_dim: {
                alias: 'payStatDim',
                toSelect: ['payStatDim.name AS payment_status'],
                subjoincondition: ["(SELECT payment_status_id,name FROM payment_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payStatDim.payment_status_id = bilFac.payment_status_id']
            },
            verification_status_dim: {
                alias: 'verStatDim',
                toSelect: ['verStatDim.name AS verification_status'],
                subjoincondition: ["(SELECT verification_status_id,name FROM verification_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['verStatDim.verification_status_id = bilFac.verification_status_id']
            }
        },

        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'caseFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        innerfilters: {
            recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        },

        innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'bilFac.bill_label'
    },
    topBillingSpecialities: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        toSelect: ['ROW_NUMBER() OVER (ORDER BY SUM(bilFac.bill_amount) DESC) AS Serial_NO,SUM(bilFac.bill_amount) as Billed_Amount', 'SUM(bilFac.paid_amount) as Paid_Amount'],
        explicitChecks: ['bilFac.deleted_at IS NULL'],
        innerJoin: {
            specialities_dim: {
                alias: 'specDim',
                toSelect: ['specDim.name AS Specialty'],
                joinChecks: ["specDim.specialty_id = bilFac.speciality_id", 'specDim.deleted_at IS NULL AND specDim.name is NOT NULL'],
            },
        },
        // leftJoin: {
        //     facility_location_dim: {
        //         alias: 'FacLocDim',
        //         toSelect: ['MAX(FacLocDim.facility_location_name) AS Practice_Location'],
        //         joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id', 'FacLocDim.deleted_at is NULL']
        //     },

        // },

        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'bilFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        // innerfilters: {
        //     recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        // },

        // innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'Billed_Amount DESC LIMIT 10'
    },
    topBillingProviders: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        toSelect: ['ROW_NUMBER() OVER (ORDER BY SUM(bilFac.bill_amount) DESC) AS Serial_NO,SUM(bilFac.bill_amount) as Billed_Amount', 'SUM(bilFac.paid_amount) as Paid_Amount'],
        explicitChecks: ['bilFac.deleted_at IS NULL'],
        innerJoin: {
            users_dim: {
                alias: 'usrDim',
                toSelect: ["concat(usrDim.first_name,' ', usrDim.middle_name, ' ',usrDim.last_name) AS Provider"],
                joinChecks: ["bilFac.doctor_id = usrDim.user_id", 'usrDim.deleted_at IS NULL'],
            },
            specialities_dim: {
                alias: 'specDim',
                toSelect: ['MAX(specDim.name) AS Specialty'],
                joinChecks: ["specDim.specialty_id = bilFac.speciality_id", 'specDim.deleted_at IS NULL'],
            },
        },
        // leftJoin: {
        //     facility_location_dim: {
        //         alias: 'FacLocDim',
        //         toSelect: ['MAX(FacLocDim.facility_location_name) AS Practice_Location'],
        //         joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id', 'FacLocDim.deleted_at is NULL']
        //     },

        // },

        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'bilFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        // innerfilters: {
        //     recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        // },

        // innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'Billed_Amount DESC LIMIT 10'
    },




    higestPayerPatient: {

        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        toSelect: ['ROW_NUMBER() OVER (ORDER BY SUM(payFac.check_amount) DESC) AS Serial_NO', 'COALESCE(SUM(bilFac.bill_amount), SUM(invDim.invoice_amount)) AS bill_invoice_amount', 'COALESCE(SUM(bilFac.paid_amount),SUM(invDim.paid_amount)) AS paid_amount', 'COUNT(DISTINCT bilFac.bill_id) AS bill_count'],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                // toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            }
        },

        innerJoin: {
            payment_fact: {
                alias: 'payFac',
                toSelect: ['SUM(payFac.check_amount) AS total_check_amount'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id", 'payFac.deleted_at IS NULL', 'payFac.payment_by_id = 1', 'payFac.recipient_id IS NOT NULL']
            },
            patient_dim: {
                alias: 'patDim',
                toSelect: [`CONCAT(patDim.first_name || ' ' || COALESCE(patDim.middle_name || ' ', '') || patDim.last_name) AS patient_name`],
                joinChecks: ["patDim.patient_id = payFac.recipient_id", 'patDim.deleted_at IS NULL']
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'bilFac' },
            fromDate: { column: 'check_date', type: 'DATE_RANGE_START', filtersAlias: 'payFac' },
            toDate: { column: 'check_date', type: 'DATE_RANGE_END', filtersAlias: 'payFac' },
            month_id: { column: 'check_date', type: 'MONTH', filtersAlias: 'payFac' },
            time_span_id: { column: 'check_date', type: 'TIME_SPAN', filtersAlias: 'payFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        filterAlias: 'bilFac',
        orderby: 'total_check_amount DESC LIMIT 10'
    },

    higestPayerEmployer: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        toSelect: ['ROW_NUMBER() OVER (ORDER BY SUM(payFac.check_amount) DESC) AS Serial_NO', 'COALESCE(SUM(bilFac.bill_amount), SUM(invDim.invoice_amount)) AS bill_invoice_amount', 'COALESCE(SUM(bilFac.paid_amount),SUM(invDim.paid_amount)) AS paid_amount', 'COUNT(DISTINCT bilFac.bill_id) AS bill_count'],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                // toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            }
        },
        innerJoin: {
            payment_fact: {
                alias: 'payFac',
                toSelect: ['SUM(payFac.check_amount) AS total_check_amount'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id", 'payFac.deleted_at IS NULL', 'payFac.payment_by_id = 4', 'payFac.recipient_id IS NOT NULL']
            },
            employer_dim: {
                alias: 'empDim',
                toSelect: ['empDim.employer_name AS employer_name'],
                joinChecks: ["empDim.employer_id = payFac.recipient_id", 'empDim.deleted_at IS NULL']
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'bilFac' },
            fromDate: { column: 'check_date', type: 'DATE_RANGE_START', filtersAlias: 'payFac' },
            toDate: { column: 'check_date', type: 'DATE_RANGE_END', filtersAlias: 'payFac' },
            month_id: { column: 'check_date', type: 'MONTH', filtersAlias: 'payFac' },
            time_span_id: { column: 'check_date', type: 'TIME_SPAN', filtersAlias: 'payFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        filterAlias: 'bilFac',
        orderby: 'total_check_amount DESC LIMIT 10'
    },

    higestPayerInsurance: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        toSelect: ['ROW_NUMBER() OVER (ORDER BY SUM(payFac.check_amount) DESC) AS Serial_NO', 'COALESCE(SUM(bilFac.bill_amount), SUM(invDim.invoice_amount)) AS bill_invoice_amount', 'COALESCE(SUM(bilFac.paid_amount),SUM(invDim.paid_amount)) AS paid_amount', 'COUNT(DISTINCT bilFac.bill_id) AS bill_count'],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                // toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            }
        },
        innerJoin: {
            payment_fact: {
                alias: 'payFac',
                toSelect: ['SUM(payFac.check_amount) AS total_check_amount'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id", 'payFac.deleted_at IS NULL', 'payFac.payment_by_id = 2', 'payFac.recipient_id IS NOT NULL']
            },
            insurance_dim: {
                alias: 'insDim',
                toSelect: ['insDim.insurance_name AS insurance_name'],
                joinChecks: ["insDim.insurance_id = payFac.recipient_id", 'insDim.deleted_at IS NULL']
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'bilFac' },
            fromDate: { column: 'check_date', type: 'DATE_RANGE_START', filtersAlias: 'payFac' },
            toDate: { column: 'check_date', type: 'DATE_RANGE_END', filtersAlias: 'payFac' },
            month_id: { column: 'check_date', type: 'MONTH', filtersAlias: 'payFac' },
            time_span_id: { column: 'check_date', type: 'TIME_SPAN', filtersAlias: 'payFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        filterAlias: 'bilFac',
        orderby: 'total_check_amount DESC LIMIT 10'
    },

    higestPayerFirm: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        toSelect: ['ROW_NUMBER() OVER (ORDER BY SUM(payFac.check_amount) DESC) AS Serial_NO', 'COALESCE(SUM(bilFac.bill_amount), SUM(invDim.invoice_amount)) AS bill_invoice_amount', 'COALESCE(SUM(bilFac.paid_amount),SUM(invDim.paid_amount)) AS paid_amount', 'COUNT(DISTINCT bilFac.bill_id) AS bill_count'],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                // toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            }
        },
        innerJoin: {
            payment_fact: {
                alias: 'payFac',
                toSelect: ['SUM(payFac.check_amount) AS total_check_amount'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id", 'payFac.deleted_at IS NULL', 'payFac.payment_by_id = 3', 'payFac.recipient_id IS NOT NULL']
            },
            firms_dim: {
                alias: 'firms',
                toSelect: ['firms.firm_name AS firm_name'],
                joinChecks: ["payFac.recipient_id = firms.firm_id AND firms.deleted_at IS NULL"]
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'bilFac' },
            fromDate: { column: 'check_date', type: 'DATE_RANGE_START', filtersAlias: 'payFac' },
            toDate: { column: 'check_date', type: 'DATE_RANGE_END', filtersAlias: 'payFac' },
            month_id: { column: 'check_date', type: 'MONTH', filtersAlias: 'payFac' },
            time_span_id: { column: 'check_date', type: 'TIME_SPAN', filtersAlias: 'payFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        filterAlias: 'bilFac',
        orderby: 'total_check_amount DESC LIMIT 10'
    },




    accountReceivableAging: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        toSelect: [
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) >= 0 AND (current_date - bilFac.bill_date + 1) <= 30 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "30_days"',
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) > 30 AND (current_date - bilFac.bill_date + 1) <= 60 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "60_days"',
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) > 60 AND (current_date - bilFac.bill_date + 1) <= 90 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "90_days"',
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) > 90 AND (current_date - bilFac.bill_date + 1) <= 120 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "120_days"',
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) > 120 AND (current_date - bilFac.bill_date + 1) <= 150 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "150_days"',
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) > 150 AND (current_date - bilFac.bill_date + 1) <= 180 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "180_days"',
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) > 180 AND (current_date - bilFac.bill_date + 1) <= 210 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "210_days"',
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) > 210 AND (current_date - bilFac.bill_date + 1) <= 240 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "240_days"',
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) > 240 AND (current_date - bilFac.bill_date + 1) <= 270 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "270_days"',
            'SUM(CASE WHEN (current_date - bilFac.bill_date + 1) > 270 THEN COALESCE(invDim.outstanding_amount,bilFac.outstanding_amount) ELSE 0 END) AS "270Plusdays"'
        ],
        explicitChecks: ['bilFac.deleted_at IS NULL'],
        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                toSelect: ['invDim.invoice_category AS Invoice_category'],
                // subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim invDim )'],
                // joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            },
            case_types_dim: {
                alias: 'casTypDim',
                // toSelect: ['MAX(payFac.check_amount)'],
                joinChecks: ["casTypDim.case_type_id = bilFac.case_type_id", 'casTypDim.deleted_at IS NULL AND casTypDim.name IS NOT NULL'],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: ['Bill_Recipient_Name as Bill_Invoice_Recipient_Name', 'Bill_Recipient_Type_Name as Bill_Invoice_Recipient_Type_Name'],
                subjoincondition: ["(SELECT  bill_id,MAX(bilRecDim.bill_recipient_type_id) AS bill_recipient_type_id,MAX(CONCAT(bilRecDim.bill_recipient_f_name, ' ', bilRecDim.bill_recipient_m_name, ' ', bilRecDim.bill_recipient_l_name)) AS Bill_Recipient_Name, MAX(bilRecDim.bill_recipient_type_name) AS Bill_Recipient_Type_Name, MAX(deleted_at) AS deleted_at FROM bills_recipient_dim bilRecDim"],
                joinChecks: ["bilFac.bill_id = bilRecDim.bill_id"],
            },
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'bilFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        innerfilters: {
            recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        },

        innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'Bill_Recipient_Type_Name'
    },


    revenueByLocation: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        toSelect: ['SUM(bilFac.bill_amount) AS billed_amount'],
        explicitChecks: ['bilFac.deleted_at IS NULL'],
        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                toSelect: ['MAX(invDim.invoice_category) AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            },
            payment_fact: {
                alias: 'payFac',
                toSelect: ['COALESCE(SUM(payFac.check_amount), 0) AS revenue'],
                subjoincondition: ['( SELECT bill_id, SUM(check_amount) as check_amount,MAX(deleted_at) as deleted_at FROM payment_fact WHERE deleted_at is NULL group by bill_id )'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id"],
            },
            facility_location_dim: {
                alias: 'FacLocDim',
                toSelect: ["CONCAT(FacDim.facility_qualifier, '-', FacLocDim.facility_location_name) AS Practice_Location"],
                joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id', 'FacLocDim.deleted_at is NULL']
            },
            facilities_dim: {
                alias: 'FacDim',
                // toSelect: ["FacDim.facility_name"],
                joinChecks: ["FacLocDim.facility_id = FacDim.facility_id", 'FacDim.deleted_at is NULL'],
            },

        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'facility_location_id', type: 'IN', filtersAlias: 'bilFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        // innerfilters: {
        //     recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        // },

        // innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'revenue DESC'
    },



    totalBilledExport: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        // toSelect: ['bilFac.bill_label', 'bilFac.bill_date', "CONCAT('$',bilFac.bill_amount) AS bill_amount", "CONCAT('$',bilFac.paid_amount) AS paid_amount", "CONCAT('$',bilFac.write_off_amount) AS write_off_amount"
        //     , "CONCAT('$',bilFac.outstanding_amount) AS outstanding_amount", "CONCAT('$',bilFac.over_payment) AS over_payment", "CONCAT('$',bilFac.interest_amount) AS interest_amount", 'bilFac.case_id', 'bilFac.dos_from_date',
        //     'bilFac.dos_to_date'
        // ],
        toSelect: ["COALESCE(CAST(invDim.invoice_id AS VARCHAR), bilFac.bill_label) AS bill_invoice_id,COALESCE(invDim.invoice_date,bilFac.bill_date) AS bill_invoice_date,COALESCE(invDim.invoice_amount,bilFac.bill_amount) AS bill_invoice_amount,COALESCE(invDim.paid_amount, bilFac.paid_amount) AS paid_amount,COALESCE(invDim.write_off_amount , bilFac.write_off_amount ) AS write_off_amount,COALESCE(invDim.outstanding_amount , bilFac.outstanding_amount ) AS outstanding_amount,COALESCE(invDim.over_amount, bilFac.over_payment) AS over_payment,COALESCE(invDim.interest_amount, bilFac.interest_amount) AS interest_amount "],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            },
            payment_fact: {
                alias: 'payFac',
                toSelect: ["CONCAT('$',payFac.check_amount) AS check_amount", 'payFac.check_date', 'payFac.check_no'],
                subjoincondition: ['( SELECT bill_id, SUM(check_amount) as check_amount,MAX(check_date) as check_date,MAX(deleted_at) as deleted_at, MAX(check_no) as check_no,MAX(payment_by_id) as payment_by_id FROM payment_fact WHERE deleted_at is NULL group by bill_id )'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id"],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: ['bilRecDim.Bill_Recipient_Name', 'bilRecDim.bill_recipient_type_name'],
                subjoincondition: ["( SELECT bill_id, CONCAT(bill_recipient_f_name,' ',bill_recipient_m_name,' ',bill_recipient_l_name) AS Bill_Recipient_Name, bill_recipient_type_name AS bill_recipient_type_name FROM bills_recipient_dim where deleted_at is NULL )"],
                joinChecks: ["bilFac.bill_id = bilRecDim.bill_id"],
            },
            facility_location_dim: {
                alias: 'FacLocDim',
                toSelect: ['FacLocDim.facility_location_name AS Practice_Location'],
                subjoincondition: ["(SELECT facility_location_id, facility_location_name FROM facility_location_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id']
            },
            case_types_dim: {
                alias: 'casTypDim',
                toSelect: ['casTypDim.name as case_type_name'],
                subjoincondition: ["(SELECT case_type_id,name FROM case_types_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.case_type_id = casTypDim.case_type_id']
            },
            patient_dim: {
                alias: 'patDim',
                toSelect: ["patDim.patient_name"],
                subjoincondition: ["(SELECT patient_id,CONCAT(first_name,' ',middle_name,' ',last_name) AS patient_name FROM patient_dim where deleted_at is NULL)"],
                joinChecks: ['bilFac.patient_id = patDim.patient_id']

            },
            users_dim: {
                alias: 'usrDim',
                toSelect: [`usrDim.provider_name AS provider_name`],
                subjoincondition: ["(SELECT user_id,concat(first_name,' ', middle_name, ' ',last_name) AS provider_name FROM users_dim where deleted_at IS NULL)"],
                joinChecks: ["bilFac.doctor_id = usrDim.user_id"],
            },
            payment_by_dim: {
                alias: 'payByDim',
                toSelect: ['payByDim.payment_by_name'],
                subjoincondition: ["(SELECT payment_by_id,payment_by_name FROM payment_by_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payFac.payment_by_id = payByDim.payment_by_id']
            },
            //new columnsss added by sara umar
            case_fact_new: {
                alias: 'caseFac',
                toSelect: ['caseFac.DOA AS DOA'],
                subjoincondition: ["(SELECT case_id,attorney_id,firm_id,accident_date AS DOA FROM case_fact_new WHERE deleted_at is null)"],
                joinChecks: ['bilFac.case_id = caseFac.case_id']
            },
            attorney_dim: {
                alias: 'attDim',
                toSelect: ["attDim.attorney_name AS attorney_name"],
                subjoincondition: ["(SELECT attorney_id,CONCAT(first_name,'  ',middle_name,'  ',last_name) AS attorney_name FROM attorney_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['attDim.attorney_id = caseFac.attorney_id']
            },
            specialities_dim: {
                alias: 'specDim',
                toSelect: ['specDim.name AS speciality_name'],
                subjoincondition: ["(SELECT specialty_id,name FROM specialities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["specDim.specialty_id = bilFac.speciality_id"],
            },
            firms_dim: {
                alias: 'firms',
                toSelect: ['firms.firm_name AS firm_name'],
                subjoincondition: ["(SELECT firm_id,firm_name FROM firms_dim where deleted_at IS NULL) "],
                joinChecks: ['caseFac.firm_id = firms.firm_id']
            },
            facilities_dim: {
                alias: 'FacDim',
                toSelect: ["FacDim.facility_name AS practice_name"],
                subjoincondition: ["(SELECT facility_id,facility_name FROM facilities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["bilFac.facility_id = FacDim.facility_id"],
            },
            denial_dim: {
                alias: 'denDim',
                // toSelect:
                subjoincondition: ["(SELECT bill_id,denial_id FROM denial_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.bill_id = denDim.bill_id']
            },
            denial_type_dim: {
                alias: 'denTypDim',
                toSelect: ['denTypDim.denial_type_name as denial_type'],
                subjoincondition: ["(SELECT denial_id,denial_type_name FROM denial_type_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['denDim.denial_id = denTypDim.denial_id']
            },
            bill_status_dim: {
                alias: 'bilStatDim',
                toSelect: ['bilStatDim.name AS bill_status'],
                subjoincondition: ["(SELECT bill_status_id,name FROM bill_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.bill_status_id = bilStatDim.bill_status_id']
            },
            denial_status_dim: {
                alias: 'denStatDim',
                toSelect: ['denStatDim.name AS denial_status'],
                subjoincondition: ["(SELECT denial_status_id,name FROM denial_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.denial_status_id = denStatDim.denial_status_id']
            },
            eor_status_dim: {
                alias: 'eorStatDim',
                toSelect: ['eorStatDim.name AS eor_status'],
                subjoincondition: ["(SELECT eor_status_id,name FROM eor_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['eorStatDim.eor_status_id = bilFac.eor_status_id']
            },
            payment_status_dim: {
                alias: 'payStatDim',
                toSelect: ['payStatDim.name AS payment_status'],
                subjoincondition: ["(SELECT payment_status_id,name FROM payment_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payStatDim.payment_status_id = bilFac.payment_status_id']
            },
            verification_status_dim: {
                alias: 'verStatDim',
                toSelect: ['verStatDim.name AS verification_status'],
                subjoincondition: ["(SELECT verification_status_id,name FROM verification_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['verStatDim.verification_status_id = bilFac.verification_status_id']
            }
        },

        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'caseFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        innerfilters: {
            recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        },

        innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'bilFac.bill_label'
    },



    totalPaymentExport: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        // toSelect: ['bilFac.bill_label', 'bilFac.bill_date', "CONCAT('$',bilFac.bill_amount) AS bill_amount", "CONCAT('$',bilFac.paid_amount) AS paid_amount", "CONCAT('$',bilFac.write_off_amount) AS write_off_amount"
        //     , "CONCAT('$',bilFac.outstanding_amount) AS outstanding_amount", "CONCAT('$',bilFac.over_payment) AS over_payment", "CONCAT('$',bilFac.interest_amount) AS interest_amount", 'bilFac.case_id', 'bilFac.dos_from_date',
        //     'bilFac.dos_to_date'
        // ],
        toSelect: ["COALESCE(CAST(invDim.invoice_id AS VARCHAR), bilFac.bill_label) AS bill_invoice_id,COALESCE(invDim.invoice_date,bilFac.bill_date) AS bill_invoice_date,COALESCE(invDim.invoice_amount,bilFac.bill_amount) AS bill_invoice_amount,COALESCE(invDim.paid_amount, bilFac.paid_amount) AS paid_amount,COALESCE(invDim.write_off_amount , bilFac.write_off_amount ) AS write_off_amount,COALESCE(invDim.outstanding_amount , bilFac.outstanding_amount ) AS outstanding_amount,COALESCE(invDim.over_amount, bilFac.over_payment) AS over_payment,COALESCE(invDim.interest_amount, bilFac.interest_amount) AS interest_amount "],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            },
            payment_fact: {
                alias: 'payFac',
                toSelect: ["CONCAT('$',payFac.check_amount) AS check_amount", 'payFac.payment_id', 'payFac.check_date', 'payFac.check_no'],
                // subjoincondition: ['( SELECT bill_id, SUM(check_amount) as check_amount,MAX(check_date) as check_date,MAX(deleted_at) as deleted_at, MAX(check_no) as check_no,MAX(payment_by_id) as payment_by_id FROM payment_fact WHERE deleted_at is NULL group by bill_id )'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id", 'payFac.deleted_at is NULL '],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: ['bilRecDim.Bill_Recipient_Name', 'bilRecDim.bill_recipient_type_name'],
                subjoincondition: ["( SELECT bill_id, CONCAT(bill_recipient_f_name,' ',bill_recipient_m_name,' ',bill_recipient_l_name) AS Bill_Recipient_Name, bill_recipient_type_name AS bill_recipient_type_name FROM bills_recipient_dim where deleted_at is NULL )"],
                joinChecks: ["bilFac.bill_id = bilRecDim.bill_id"],
            },
            facility_location_dim: {
                alias: 'FacLocDim',
                toSelect: ['FacLocDim.facility_location_name AS Practice_Location'],
                subjoincondition: ["(SELECT facility_location_id, facility_location_name FROM facility_location_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id']
            },
            case_types_dim: {
                alias: 'casTypDim',
                toSelect: ['casTypDim.name as case_type_name'],
                subjoincondition: ["(SELECT case_type_id,name FROM case_types_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.case_type_id = casTypDim.case_type_id']
            },
            patient_dim: {
                alias: 'patDim',
                toSelect: ["patDim.patient_name"],
                subjoincondition: ["(SELECT patient_id,CONCAT(first_name,' ',middle_name,' ',last_name) AS patient_name FROM patient_dim where deleted_at is NULL)"],
                joinChecks: ['bilFac.patient_id = patDim.patient_id']

            },
            users_dim: {
                alias: 'usrDim',
                toSelect: [`usrDim.provider_name AS provider_name`],
                subjoincondition: ["(SELECT user_id,concat(first_name,' ', middle_name, ' ',last_name) AS provider_name FROM users_dim where deleted_at IS NULL)"],
                joinChecks: ["bilFac.doctor_id = usrDim.user_id"],
            },
            payment_by_dim: {
                alias: 'payByDim',
                toSelect: ['payByDim.payment_by_name'],
                subjoincondition: ["(SELECT payment_by_id,payment_by_name FROM payment_by_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payFac.payment_by_id = payByDim.payment_by_id']
            },
            //new columnsss added by sara umar
            case_fact_new: {
                alias: 'caseFac',
                toSelect: ['caseFac.DOA AS DOA'],
                subjoincondition: ["(SELECT case_id,attorney_id,firm_id,accident_date AS DOA FROM case_fact_new WHERE deleted_at is null)"],
                joinChecks: ['bilFac.case_id = caseFac.case_id']
            },
            attorney_dim: {
                alias: 'attDim',
                toSelect: ["attDim.attorney_name AS attorney_name"],
                subjoincondition: ["(SELECT attorney_id,CONCAT(first_name,'  ',middle_name,'  ',last_name) AS attorney_name FROM attorney_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['attDim.attorney_id = caseFac.attorney_id']
            },
            specialities_dim: {
                alias: 'specDim',
                toSelect: ['specDim.name AS speciality_name'],
                subjoincondition: ["(SELECT specialty_id,name FROM specialities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["specDim.specialty_id = bilFac.speciality_id"],
            },
            firms_dim: {
                alias: 'firms',
                toSelect: ['firms.firm_name AS firm_name'],
                subjoincondition: ["(SELECT firm_id,firm_name FROM firms_dim where deleted_at IS NULL) "],
                joinChecks: ['caseFac.firm_id = firms.firm_id']
            },
            facilities_dim: {
                alias: 'FacDim',
                toSelect: ["FacDim.facility_name AS practice_name"],
                subjoincondition: ["(SELECT facility_id,facility_name FROM facilities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["bilFac.facility_id = FacDim.facility_id"],
            },
            denial_dim: {
                alias: 'denDim',
                // toSelect:
                subjoincondition: ["(SELECT bill_id,denial_id FROM denial_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.bill_id = denDim.bill_id']
            },
            denial_type_dim: {
                alias: 'denTypDim',
                toSelect: ['denTypDim.denial_type_name as denial_type'],
                subjoincondition: ["(SELECT denial_id,denial_type_name FROM denial_type_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['denDim.denial_id = denTypDim.denial_id']
            },
            bill_status_dim: {
                alias: 'bilStatDim',
                toSelect: ['bilStatDim.name AS bill_status'],
                subjoincondition: ["(SELECT bill_status_id,name FROM bill_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.bill_status_id = bilStatDim.bill_status_id']
            },
            denial_status_dim: {
                alias: 'denStatDim',
                toSelect: ['denStatDim.name AS denial_status'],
                subjoincondition: ["(SELECT denial_status_id,name FROM denial_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.denial_status_id = denStatDim.denial_status_id']
            },
            eor_status_dim: {
                alias: 'eorStatDim',
                toSelect: ['eorStatDim.name AS eor_status'],
                subjoincondition: ["(SELECT eor_status_id,name FROM eor_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['eorStatDim.eor_status_id = bilFac.eor_status_id']
            },
            payment_status_dim: {
                alias: 'payStatDim',
                toSelect: ['payStatDim.name AS payment_status'],
                subjoincondition: ["(SELECT payment_status_id,name FROM payment_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payStatDim.payment_status_id = bilFac.payment_status_id']
            },
            verification_status_dim: {
                alias: 'verStatDim',
                toSelect: ['verStatDim.name AS verification_status'],
                subjoincondition: ["(SELECT verification_status_id,name FROM verification_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['verStatDim.verification_status_id = bilFac.verification_status_id']
            }
        },

        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'caseFac' },
            fromDate: { column: 'check_date', type: 'DATE_RANGE_START', filtersAlias: 'payFac' },
            toDate: { column: 'check_date', type: 'DATE_RANGE_END', filtersAlias: 'payFac' },
            month_id: { column: 'check_date', type: 'MONTH', filtersAlias: 'payFac' },
            time_span_id: { column: 'check_date', type: 'TIME_SPAN', filtersAlias: 'payFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'payFac' },
        },
        innerfilters: {
            recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        },

        innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'payFac.payment_id'
    },



    totalAccountReceivableExport: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        // toSelect: ['bilFac.bill_label', 'bilFac.bill_date', "CONCAT('$',bilFac.bill_amount) AS bill_amount", "CONCAT('$',bilFac.paid_amount) AS paid_amount", "CONCAT('$',bilFac.write_off_amount) AS write_off_amount"
        //     , "CONCAT('$',bilFac.outstanding_amount) AS outstanding_amount", "CONCAT('$',bilFac.over_payment) AS over_payment", "CONCAT('$',bilFac.interest_amount) AS interest_amount", 'bilFac.case_id', 'bilFac.dos_from_date',
        //     'bilFac.dos_to_date'
        // ],
        toSelect: ["COALESCE(CAST(invDim.invoice_id AS VARCHAR), bilFac.bill_label) AS bill_invoice_id,COALESCE(invDim.invoice_date,bilFac.bill_date) AS bill_invoice_date,COALESCE(invDim.invoice_amount,bilFac.bill_amount) AS bill_invoice_amount,COALESCE(invDim.paid_amount, bilFac.paid_amount) AS paid_amount,COALESCE(invDim.write_off_amount , bilFac.write_off_amount ) AS write_off_amount,COALESCE(invDim.outstanding_amount , bilFac.outstanding_amount ) AS outstanding_amount,COALESCE(invDim.over_amount, bilFac.over_payment) AS over_payment,COALESCE(invDim.interest_amount, bilFac.interest_amount) AS interest_amount "],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            },
            payment_fact: {
                alias: 'payFac',
                toSelect: ["CONCAT('$',payFac.check_amount) AS check_amount", 'payFac.check_date', 'payFac.check_no'],
                subjoincondition: ['( SELECT bill_id, SUM(check_amount) as check_amount,MAX(check_date) as check_date,MAX(deleted_at) as deleted_at, MAX(check_no) as check_no,MAX(payment_by_id) as payment_by_id FROM payment_fact WHERE deleted_at is NULL group by bill_id )'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id"],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: ['bilRecDim.Bill_Recipient_Name', 'bilRecDim.bill_recipient_type_name'],
                subjoincondition: ["( SELECT bill_id, CONCAT(bill_recipient_f_name,' ',bill_recipient_m_name,' ',bill_recipient_l_name) AS Bill_Recipient_Name, bill_recipient_type_name AS bill_recipient_type_name FROM bills_recipient_dim where deleted_at is NULL )"],
                joinChecks: ["bilFac.bill_id = bilRecDim.bill_id"],
            },
            facility_location_dim: {
                alias: 'FacLocDim',
                toSelect: ['FacLocDim.facility_location_name AS Practice_Location'],
                subjoincondition: ["(SELECT facility_location_id, facility_location_name FROM facility_location_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id']
            },
            case_types_dim: {
                alias: 'casTypDim',
                toSelect: ['casTypDim.name as case_type_name'],
                subjoincondition: ["(SELECT case_type_id,name FROM case_types_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.case_type_id = casTypDim.case_type_id']
            },
            patient_dim: {
                alias: 'patDim',
                toSelect: ["patDim.patient_name"],
                subjoincondition: ["(SELECT patient_id,CONCAT(first_name,' ',middle_name,' ',last_name) AS patient_name FROM patient_dim where deleted_at is NULL)"],
                joinChecks: ['bilFac.patient_id = patDim.patient_id']

            },
            users_dim: {
                alias: 'usrDim',
                toSelect: [`usrDim.provider_name AS provider_name`],
                subjoincondition: ["(SELECT user_id,concat(first_name,' ', middle_name, ' ',last_name) AS provider_name FROM users_dim where deleted_at IS NULL)"],
                joinChecks: ["bilFac.doctor_id = usrDim.user_id"],
            },
            payment_by_dim: {
                alias: 'payByDim',
                toSelect: ['payByDim.payment_by_name'],
                subjoincondition: ["(SELECT payment_by_id,payment_by_name FROM payment_by_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payFac.payment_by_id = payByDim.payment_by_id']
            },
            //new columnsss added by sara umar
            case_fact_new: {
                alias: 'caseFac',
                toSelect: ['caseFac.DOA AS DOA'],
                subjoincondition: ["(SELECT case_id,attorney_id,firm_id,accident_date AS DOA FROM case_fact_new WHERE deleted_at is null)"],
                joinChecks: ['bilFac.case_id = caseFac.case_id']
            },
            attorney_dim: {
                alias: 'attDim',
                toSelect: ["attDim.attorney_name AS attorney_name"],
                subjoincondition: ["(SELECT attorney_id,CONCAT(first_name,'  ',middle_name,'  ',last_name) AS attorney_name FROM attorney_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['attDim.attorney_id = caseFac.attorney_id']
            },
            specialities_dim: {
                alias: 'specDim',
                toSelect: ['specDim.name AS speciality_name'],
                subjoincondition: ["(SELECT specialty_id,name FROM specialities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["specDim.specialty_id = bilFac.speciality_id"],
            },
            firms_dim: {
                alias: 'firms',
                toSelect: ['firms.firm_name AS firm_name'],
                subjoincondition: ["(SELECT firm_id,firm_name FROM firms_dim where deleted_at IS NULL) "],
                joinChecks: ['caseFac.firm_id = firms.firm_id']
            },
            facilities_dim: {
                alias: 'FacDim',
                toSelect: ["FacDim.facility_name AS practice_name"],
                subjoincondition: ["(SELECT facility_id,facility_name FROM facilities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["bilFac.facility_id = FacDim.facility_id"],
            },
            denial_dim: {
                alias: 'denDim',
                // toSelect:
                subjoincondition: ["(SELECT bill_id,denial_id FROM denial_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.bill_id = denDim.bill_id']
            },
            denial_type_dim: {
                alias: 'denTypDim',
                toSelect: ['denTypDim.denial_type_name as denial_type'],
                subjoincondition: ["(SELECT denial_id,denial_type_name FROM denial_type_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['denDim.denial_id = denTypDim.denial_id']
            },
            bill_status_dim: {
                alias: 'bilStatDim',
                toSelect: ['bilStatDim.name AS bill_status'],
                subjoincondition: ["(SELECT bill_status_id,name FROM bill_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.bill_status_id = bilStatDim.bill_status_id']
            },
            denial_status_dim: {
                alias: 'denStatDim',
                toSelect: ['denStatDim.name AS denial_status'],
                subjoincondition: ["(SELECT denial_status_id,name FROM denial_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.denial_status_id = denStatDim.denial_status_id']
            },
            eor_status_dim: {
                alias: 'eorStatDim',
                toSelect: ['eorStatDim.name AS eor_status'],
                subjoincondition: ["(SELECT eor_status_id,name FROM eor_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['eorStatDim.eor_status_id = bilFac.eor_status_id']
            },
            payment_status_dim: {
                alias: 'payStatDim',
                toSelect: ['payStatDim.name AS payment_status'],
                subjoincondition: ["(SELECT payment_status_id,name FROM payment_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payStatDim.payment_status_id = bilFac.payment_status_id']
            },
            verification_status_dim: {
                alias: 'verStatDim',
                toSelect: ['verStatDim.name AS verification_status'],
                subjoincondition: ["(SELECT verification_status_id,name FROM verification_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['verStatDim.verification_status_id = bilFac.verification_status_id']
            }
        },
        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'caseFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        innerfilters: {
            recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        },

        innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'bilFac.bill_label'
    },



    totalInterestExport: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        // toSelect: ['bilFac.bill_label', 'bilFac.bill_date', "CONCAT('$',bilFac.bill_amount) AS bill_amount", "CONCAT('$',bilFac.paid_amount) AS paid_amount", "CONCAT('$',bilFac.write_off_amount) AS write_off_amount"
        //     , "CONCAT('$',bilFac.outstanding_amount) AS outstanding_amount", "CONCAT('$',bilFac.over_payment) AS over_payment", "CONCAT('$',bilFac.interest_amount) AS interest_amount", 'bilFac.case_id', 'bilFac.dos_from_date',
        //     'bilFac.dos_to_date'
        // ],
        toSelect: ["COALESCE(CAST(invDim.invoice_id AS VARCHAR), bilFac.bill_label) AS bill_invoice_id,COALESCE(invDim.invoice_date,bilFac.bill_date) AS bill_invoice_date,COALESCE(invDim.invoice_amount,bilFac.bill_amount) AS bill_invoice_amount,COALESCE(invDim.paid_amount, bilFac.paid_amount) AS paid_amount,COALESCE(invDim.write_off_amount , bilFac.write_off_amount ) AS write_off_amount,COALESCE(invDim.outstanding_amount , bilFac.outstanding_amount ) AS outstanding_amount,COALESCE(invDim.over_amount, bilFac.over_payment) AS over_payment,COALESCE(invDim.interest_amount, bilFac.interest_amount) AS interest_amount "],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            },
            payment_fact: {
                alias: 'payFac',
                toSelect: ["CONCAT('$',payFac.check_amount) AS check_amount", 'payFac.check_date', 'payFac.check_no'],
                subjoincondition: ['( SELECT bill_id, SUM(check_amount) as check_amount,MAX(check_date) as check_date,MAX(deleted_at) as deleted_at, MAX(check_no) as check_no,MAX(payment_by_id) as payment_by_id FROM payment_fact WHERE deleted_at is NULL group by bill_id )'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id"],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: ['bilRecDim.Bill_Recipient_Name', 'bilRecDim.bill_recipient_type_name'],
                subjoincondition: ["( SELECT bill_id, CONCAT(bill_recipient_f_name,' ',bill_recipient_m_name,' ',bill_recipient_l_name) AS Bill_Recipient_Name, bill_recipient_type_name AS bill_recipient_type_name FROM bills_recipient_dim where deleted_at is NULL )"],
                joinChecks: ["bilFac.bill_id = bilRecDim.bill_id"],
            },
            facility_location_dim: {
                alias: 'FacLocDim',
                toSelect: ['FacLocDim.facility_location_name AS Practice_Location'],
                subjoincondition: ["(SELECT facility_location_id, facility_location_name FROM facility_location_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id']
            },
            case_types_dim: {
                alias: 'casTypDim',
                toSelect: ['casTypDim.name as case_type_name'],
                subjoincondition: ["(SELECT case_type_id,name FROM case_types_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.case_type_id = casTypDim.case_type_id']
            },
            patient_dim: {
                alias: 'patDim',
                toSelect: ["patDim.patient_name"],
                subjoincondition: ["(SELECT patient_id,CONCAT(first_name,' ',middle_name,' ',last_name) AS patient_name FROM patient_dim where deleted_at is NULL)"],
                joinChecks: ['bilFac.patient_id = patDim.patient_id']

            },
            users_dim: {
                alias: 'usrDim',
                toSelect: [`usrDim.provider_name AS provider_name`],
                subjoincondition: ["(SELECT user_id,concat(first_name,' ', middle_name, ' ',last_name) AS provider_name FROM users_dim where deleted_at IS NULL)"],
                joinChecks: ["bilFac.doctor_id = usrDim.user_id"],
            },
            payment_by_dim: {
                alias: 'payByDim',
                toSelect: ['payByDim.payment_by_name'],
                subjoincondition: ["(SELECT payment_by_id,payment_by_name FROM payment_by_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payFac.payment_by_id = payByDim.payment_by_id']
            },
            //new columnsss added by sara umar
            case_fact_new: {
                alias: 'caseFac',
                toSelect: ['caseFac.DOA AS DOA'],
                subjoincondition: ["(SELECT case_id,attorney_id,firm_id,accident_date AS DOA FROM case_fact_new WHERE deleted_at is null)"],
                joinChecks: ['bilFac.case_id = caseFac.case_id']
            },
            attorney_dim: {
                alias: 'attDim',
                toSelect: ["attDim.attorney_name AS attorney_name"],
                subjoincondition: ["(SELECT attorney_id,CONCAT(first_name,'  ',middle_name,'  ',last_name) AS attorney_name FROM attorney_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['attDim.attorney_id = caseFac.attorney_id']
            },
            specialities_dim: {
                alias: 'specDim',
                toSelect: ['specDim.name AS speciality_name'],
                subjoincondition: ["(SELECT specialty_id,name FROM specialities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["specDim.specialty_id = bilFac.speciality_id"],
            },
            firms_dim: {
                alias: 'firms',
                toSelect: ['firms.firm_name AS firm_name'],
                subjoincondition: ["(SELECT firm_id,firm_name FROM firms_dim where deleted_at IS NULL) "],
                joinChecks: ['caseFac.firm_id = firms.firm_id']
            },
            facilities_dim: {
                alias: 'FacDim',
                toSelect: ["FacDim.facility_name AS practice_name"],
                subjoincondition: ["(SELECT facility_id,facility_name FROM facilities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["bilFac.facility_id = FacDim.facility_id"],
            },
            denial_dim: {
                alias: 'denDim',
                // toSelect:
                subjoincondition: ["(SELECT bill_id,denial_id FROM denial_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.bill_id = denDim.bill_id']
            },
            denial_type_dim: {
                alias: 'denTypDim',
                toSelect: ['denTypDim.denial_type_name as denial_type'],
                subjoincondition: ["(SELECT denial_id,denial_type_name FROM denial_type_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['denDim.denial_id = denTypDim.denial_id']
            },
            bill_status_dim: {
                alias: 'bilStatDim',
                toSelect: ['bilStatDim.name AS bill_status'],
                subjoincondition: ["(SELECT bill_status_id,name FROM bill_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.bill_status_id = bilStatDim.bill_status_id']
            },
            denial_status_dim: {
                alias: 'denStatDim',
                toSelect: ['denStatDim.name AS denial_status'],
                subjoincondition: ["(SELECT denial_status_id,name FROM denial_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.denial_status_id = denStatDim.denial_status_id']
            },
            eor_status_dim: {
                alias: 'eorStatDim',
                toSelect: ['eorStatDim.name AS eor_status'],
                subjoincondition: ["(SELECT eor_status_id,name FROM eor_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['eorStatDim.eor_status_id = bilFac.eor_status_id']
            },
            payment_status_dim: {
                alias: 'payStatDim',
                toSelect: ['payStatDim.name AS payment_status'],
                subjoincondition: ["(SELECT payment_status_id,name FROM payment_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payStatDim.payment_status_id = bilFac.payment_status_id']
            },
            verification_status_dim: {
                alias: 'verStatDim',
                toSelect: ['verStatDim.name AS verification_status'],
                subjoincondition: ["(SELECT verification_status_id,name FROM verification_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['verStatDim.verification_status_id = bilFac.verification_status_id']
            }
        },

        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'caseFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        innerfilters: {
            recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        },

        innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'bilFac.bill_label'
    },



    totalWriteOffExport: {
        tableName: 'bills_fact_new as bilFac',
        alias: "bilFac",
        // toSelect: ['bilFac.bill_label', 'bilFac.bill_date', "CONCAT('$',bilFac.bill_amount) AS bill_amount", "CONCAT('$',bilFac.paid_amount) AS paid_amount", "CONCAT('$',bilFac.write_off_amount) AS write_off_amount"
        //     , "CONCAT('$',bilFac.outstanding_amount) AS outstanding_amount", "CONCAT('$',bilFac.over_payment) AS over_payment", "CONCAT('$',bilFac.interest_amount) AS interest_amount", 'bilFac.case_id', 'bilFac.dos_from_date',
        //     'bilFac.dos_to_date'
        // ],
        toSelect: ["COALESCE(CAST(invDim.invoice_id AS VARCHAR), bilFac.bill_label) AS bill_invoice_id,COALESCE(invDim.invoice_date,bilFac.bill_date) AS bill_invoice_date,COALESCE(invDim.invoice_amount,bilFac.bill_amount) AS bill_invoice_amount,COALESCE(invDim.paid_amount, bilFac.paid_amount) AS paid_amount,COALESCE(invDim.write_off_amount , bilFac.write_off_amount ) AS write_off_amount,COALESCE(invDim.outstanding_amount , bilFac.outstanding_amount ) AS outstanding_amount,COALESCE(invDim.over_amount, bilFac.over_payment) AS over_payment,COALESCE(invDim.interest_amount, bilFac.interest_amount) AS interest_amount "],
        explicitChecks: ['bilFac.deleted_at IS NULL'],

        leftJoin: {
            invoices_dim: {
                alias: 'invDim',
                toSelect: ['invDim.invoice_category AS Invoice_category'],
                subjoincondition: ['( SELECT bills,invoice_id,invoice_date,invoice_amount,paid_amount,write_off_amount,outstanding_amount,over_amount,interest_amount,invoice_category FROM invoices_dim WHERE deleted_at IS NULL AND bills IS NOT NULL )'],
                joinChecks: ['invDim.bills @> to_jsonb(bilFac.bill_id)']
            },
            payment_fact: {
                alias: 'payFac',
                toSelect: ["CONCAT('$',payFac.check_amount) AS check_amount", 'payFac.check_date', 'payFac.check_no'],
                subjoincondition: ['( SELECT bill_id, SUM(check_amount) as check_amount,MAX(check_date) as check_date,MAX(deleted_at) as deleted_at, MAX(check_no) as check_no,MAX(payment_by_id) as payment_by_id FROM payment_fact WHERE deleted_at is NULL group by bill_id )'],
                joinChecks: ["payFac.bill_id = bilFac.bill_id"],
            },
            bills_recipient_dim: {
                alias: 'bilRecDim',
                toSelect: ['bilRecDim.Bill_Recipient_Name', 'bilRecDim.bill_recipient_type_name'],
                subjoincondition: ["( SELECT bill_id, CONCAT(bill_recipient_f_name,' ',bill_recipient_m_name,' ',bill_recipient_l_name) AS Bill_Recipient_Name, bill_recipient_type_name AS bill_recipient_type_name FROM bills_recipient_dim where deleted_at is NULL )"],
                joinChecks: ["bilFac.bill_id = bilRecDim.bill_id"],
            },
            facility_location_dim: {
                alias: 'FacLocDim',
                toSelect: ['FacLocDim.facility_location_name AS Practice_Location'],
                subjoincondition: ["(SELECT facility_location_id, facility_location_name FROM facility_location_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.facility_location_id = FacLocDim.facility_location_id']
            },
            case_types_dim: {
                alias: 'casTypDim',
                toSelect: ['casTypDim.name as case_type_name'],
                subjoincondition: ["(SELECT case_type_id,name FROM case_types_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.case_type_id = casTypDim.case_type_id']
            },
            patient_dim: {
                alias: 'patDim',
                toSelect: ["patDim.patient_name"],
                subjoincondition: ["(SELECT patient_id,CONCAT(first_name,' ',middle_name,' ',last_name) AS patient_name FROM patient_dim where deleted_at is NULL)"],
                joinChecks: ['bilFac.patient_id = patDim.patient_id']

            },
            users_dim: {
                alias: 'usrDim',
                toSelect: [`usrDim.provider_name AS provider_name`],
                subjoincondition: ["(SELECT user_id,concat(first_name,' ', middle_name, ' ',last_name) AS provider_name FROM users_dim where deleted_at IS NULL)"],
                joinChecks: ["bilFac.doctor_id = usrDim.user_id"],
            },
            payment_by_dim: {
                alias: 'payByDim',
                toSelect: ['payByDim.payment_by_name'],
                subjoincondition: ["(SELECT payment_by_id,payment_by_name FROM payment_by_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payFac.payment_by_id = payByDim.payment_by_id']
            },
            //new columnsss added by sara umar
            case_fact_new: {
                alias: 'caseFac',
                toSelect: ['caseFac.DOA AS DOA'],
                subjoincondition: ["(SELECT case_id,attorney_id,firm_id,accident_date AS DOA FROM case_fact_new WHERE deleted_at is null)"],
                joinChecks: ['bilFac.case_id = caseFac.case_id']
            },
            attorney_dim: {
                alias: 'attDim',
                toSelect: ["attDim.attorney_name AS attorney_name"],
                subjoincondition: ["(SELECT attorney_id,CONCAT(first_name,'  ',middle_name,'  ',last_name) AS attorney_name FROM attorney_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['attDim.attorney_id = caseFac.attorney_id']
            },
            specialities_dim: {
                alias: 'specDim',
                toSelect: ['specDim.name AS speciality_name'],
                subjoincondition: ["(SELECT specialty_id,name FROM specialities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["specDim.specialty_id = bilFac.speciality_id"],
            },
            firms_dim: {
                alias: 'firms',
                toSelect: ['firms.firm_name AS firm_name'],
                subjoincondition: ["(SELECT firm_id,firm_name FROM firms_dim where deleted_at IS NULL) "],
                joinChecks: ['caseFac.firm_id = firms.firm_id']
            },
            facilities_dim: {
                alias: 'FacDim',
                toSelect: ["FacDim.facility_name AS practice_name"],
                subjoincondition: ["(SELECT facility_id,facility_name FROM facilities_dim WHERE deleted_at IS NULL)"],
                joinChecks: ["bilFac.facility_id = FacDim.facility_id"],
            },
            denial_dim: {
                alias: 'denDim',
                // toSelect:
                subjoincondition: ["(SELECT bill_id,denial_id FROM denial_dim WHERE deleted_at is NULL)"],
                joinChecks: ['bilFac.bill_id = denDim.bill_id']
            },
            denial_type_dim: {
                alias: 'denTypDim',
                toSelect: ['denTypDim.denial_type_name as denial_type'],
                subjoincondition: ["(SELECT denial_id,denial_type_name FROM denial_type_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['denDim.denial_id = denTypDim.denial_id']
            },
            bill_status_dim: {
                alias: 'bilStatDim',
                toSelect: ['bilStatDim.name AS bill_status'],
                subjoincondition: ["(SELECT bill_status_id,name FROM bill_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.bill_status_id = bilStatDim.bill_status_id']
            },
            denial_status_dim: {
                alias: 'denStatDim',
                toSelect: ['denStatDim.name AS denial_status'],
                subjoincondition: ["(SELECT denial_status_id,name FROM denial_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['bilFac.denial_status_id = denStatDim.denial_status_id']
            },
            eor_status_dim: {
                alias: 'eorStatDim',
                toSelect: ['eorStatDim.name AS eor_status'],
                subjoincondition: ["(SELECT eor_status_id,name FROM eor_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['eorStatDim.eor_status_id = bilFac.eor_status_id']
            },
            payment_status_dim: {
                alias: 'payStatDim',
                toSelect: ['payStatDim.name AS payment_status'],
                subjoincondition: ["(SELECT payment_status_id,name FROM payment_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['payStatDim.payment_status_id = bilFac.payment_status_id']
            },
            verification_status_dim: {
                alias: 'verStatDim',
                toSelect: ['verStatDim.name AS verification_status'],
                subjoincondition: ["(SELECT verification_status_id,name FROM verification_status_dim WHERE deleted_at IS NULL)"],
                joinChecks: ['verStatDim.verification_status_id = bilFac.verification_status_id']
            }
        },

        filters: {
            speciality_ids: { column: 'speciality_id', type: 'IN', filtersAlias: 'bilFac' },
            provider_ids: { column: 'doctor_id', type: 'IN', filtersAlias: 'bilFac' },
            case_type_ids: { column: 'case_type_id', type: 'IN', filtersAlias: 'bilFac' },
            facility_location_ids: { column: 'practice_locations', type: 'IN_ARRAY', filtersAlias: 'caseFac' },
            fromDate: { column: 'bill_date', type: 'DATE_RANGE_START', filtersAlias: 'bilFac' },
            toDate: { column: 'bill_date', type: 'DATE_RANGE_END', filtersAlias: 'bilFac' },
            month_id: { column: 'bill_date', type: 'MONTH', filtersAlias: 'bilFac' },
            time_span_id: { column: 'bill_date', type: 'TIME_SPAN', filtersAlias: 'bilFac' },
            granularity_type_id: { column: '', type: 'GRANULARITY', filtersAlias: 'bilFac' },
        },
        innerfilters: {
            recipient_id: { column: 'bill_recipient_type_id', type: 'IN', filterAlias: 'bilRecDim' },
        },

        innerfilteralias: 'bilRecDim',
        filterAlias: 'bilFac',
        orderby: 'bilFac.bill_label'
    }
};
