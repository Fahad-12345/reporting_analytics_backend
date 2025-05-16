import { eachPatientInfo, patientFirstAppointment } from "../../../interfaces/types";
import { image1, image2, logo, newLogo } from "./img/imagesData";
import { statusSummaryReportStyles } from "./styles/reportStyles";

export const generateHTMLPages = (facilities, startDate, endDate) => {

  let pages: string = '';
  let allCount: number = 0;
  Object.keys(facilities).forEach((facility) => {
    let count: number = 0;
    let cptCodesArr: string[] = [];

    Object.keys(facilities[facility]).forEach((appointmentDate) => {
      const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' });
      const formattedDate: string = formatter.format(new Date(appointmentDate));
      let facilityPage: string = `
         <div class="PDF-appointment">
            <div class='header-format'>
              <div class="main-logo">
                 <img src="data:image/png;base64,${newLogo}" width="190" height="165">                 
                </div>
              <div class="main-info">
                  <div class="text-wrapper-2">Appointment Status Report </div>
                  <p class="from"><span class="span">From ${startDate} To ${endDate}</span></p>
              </div>
              <div class="main-location">
              <div class="location-details">
                <div class="location-name">${facility}</div>
                <div class="location-info">
                  <div class="icon-wrapper">${image1}</div>
                  <p class="location-address">1010 N Broadway, Yonkers, NY,10701</p>
                </div>
                <div class="location-info">
                  <div class="icon-wrapper">${image1}</div>
                  <p class="location-contact">+718-733-1000</p>
                </div>
                <div class="location-info">
                  <div class="icon-wrapper">${image2}</div>
                  <p class="location-contact">+718-733-1000</p>
                </div>
              </div>      
            </div>
            </div>
            <div class="date-info">${formattedDate}</div>
            `;
      Object.keys(facilities[facility][appointmentDate]).forEach((patient) => {
        const appointments: object[] = facilities[facility][appointmentDate][patient];
        // Add patient's first appointment info in table format
        const firstAppointment: patientFirstAppointment = appointments[0];
        facilityPage += `
                      <table class="appointment-table">
                          <thead>
                              <tr>
                                  <th class="header-2">PATIENT NAME</th>
                                  <th class="header-2">DATE OF ACCIDENT</th>
                                  <th class="header-2">CASE TYPE</th>
                                  <th class="header-2">PHONE NUMBER</th>
                                  <th class="header-2">CELL NUMBER</th>
                                  <th class="header-2">INSURANCE</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  <td class="body-text">${firstAppointment.patient_name || 'N/A'}</td>
                                  <td class="body-text">${(firstAppointment.accident_date) || 'N/A'}</td>
                                  <td class="body-text">${firstAppointment.case_type_name || 'N/A'}</td>
                                  <td class="body-text">${firstAppointment.patient_phone_no || 'N/A'}</td> 
                                  <td class="body-text">${firstAppointment.patient_cell_no || 'N/A'}</td>
                                  <td class="body-text">${firstAppointment.insurance_name || 'N/A'}</td>
                              </tr>
                          </tbody>
                      </table>`;

        // Add subsequent visit information in table format
        facilityPage += `
                      <table class="appointment-table">
                          <thead>
                              <tr>
                                  <th class="header-2">TIME</th>
                                  <th class="header-2">CPT CODES & DESCRIPTION</th>
                                  <th class="header-2">SPECIALITY</th>
                                  <th class="header-2">VISIT TYPE</th>
                                  <th class="header-2">APPOINTMENT STATUS</th>
                                  <th class="header-2">       </th>
                              </tr>
                          </thead>
                          <tbody>`;

        appointments.forEach((appointment: eachPatientInfo) => {
          count += 1;
          facilityPage += `
                              <tr>
                                  <td class="body-text">${new Date(appointment.scheduled_date_time).toLocaleTimeString()}</td>
                                  <td class="body-text">${appointment.code_description || 'N/A'}</td> 
                                  <td class="body-text">${appointment.speciality_name || 'N/A'}</td>
                                  <td class="body-text">${appointment.appointment_type || 'N/A'}</td>
                                  <td class="body-text">${appointment.appointment_status_name || 'N/A'}</td>
                                  <td class="body-text"></td>
                              </tr>`;
        });

        facilityPage += `
                          </tbody>
                      </table>
                  `;
      });
      facilityPage += `</div>
        <table class="appointment-table">
        <th class="header-2">Total Visits Per Day (${count})</th>
        </table>
        `;
      allCount += count
      count = 0;
      pages += facilityPage;
    })
    pages += `<table class="appointment-table">
    <th class="header-2">Total Visits(${allCount})</th>
    </table>`
    allCount = 0;
  });
  if (pages) {
    pages += statusSummaryReportStyles
    return pages;
  }
  return ''
};
