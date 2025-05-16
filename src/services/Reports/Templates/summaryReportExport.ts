import { image1, image2, logo, newLogo } from "./img/imagesData";
import { GroupByID } from '../report.enum';
import { summaryReportStyles } from "./styles/reportStyles";
import { summaryReportGroup } from "../../../interfaces/types";


export function newgenerateSummaryHTMLPages(groupedData, reportFilters, updatedEndDate, start_date, end_date) {

  function setDynamicLineHeight(lineHeight: number): string {
    return summaryReportStyles.replace(
      /line-height:\s*var\(--dynamic-line-height\);/,
      `line-height: ${lineHeight};`
    );
  }
  let pdfContent: string = '';
  if (reportFilters.group_by_id !== 1 && reportFilters.group_by_id !== 25) {
    pdfContent = setDynamicLineHeight(3);
  } else {
    pdfContent = setDynamicLineHeight(2);
  }
  // Iterate through the first level of grouping (facility or facility_location)
  if (reportFilters.group_by_id && !reportFilters.subgroup_by_id) {
    for (const facilityOrLocation in groupedData) {
      const facilityData: any = groupedData[facilityOrLocation];
      let currentVal: string;
      pdfContent += `<div class="PDF-appointment">
                <div class='header-format'>
                  <div class="main-logo">
                     <img src="data:image/png;base64,${newLogo}" width="160" height="140">
                    </div>
                       <div class="main-info">
                        <div class="text-wrapper-2">Office Procedures Report</div>
                        <p class="from"><span class="span">as of ${updatedEndDate}</span></p>
                        <p class="from color-diff"><span><strong>FROM  ${start_date}       TO     ${end_date} </strong></span></p>
                  </div>
                  <div class="main-location">
                  <div class="location-details">
                    <div class="location-name">${facilityOrLocation}</div>
                    <div class="location-info">
                      <div class="icon-wrapper">${image1}</div>
                      <p class="location-address">${facilityData.facility_address}</p>
                    </div>
                    <div class="location-info">
                      <div class="icon-wrapper">${image2}</div>
                      <p class="location-contact">${facilityData.facility_phone}</p>
                    </div>
                    <div class="location-info">
                      <div class="icon-wrapper">${image2}</div>
                      <p class="location-contact">${facilityData.facility_fax}</p>
                    </div>
                  </div>      
                </div>
              </div>
            </div>
      `;
      switch (reportFilters.group_by_id) {
        case 2:
          currentVal = `Speciality`;
          break;
        case 14:
          currentVal = 'Visit Type';
          break;
        case 3:
          currentVal = 'Provider';
          break;
        default:
          break;
      }

      pdfContent += `<div style="margin-left:20px;margin-right:20px">
                     <table class="appointment-table" style="width:100%">`;

      if (reportFilters.group_by_id == 1 || reportFilters.sub_group_by_id == 1) {
        pdfContent += `<thead>
              <tr>
                <th class="header-2 align-left" rowspan="2" colspan="1">OFFICE(S)</th>
                <th class="header-2 align-left" rowspan="2" colspan="1">ADDRESS</th>
                <th class="header-2 align-left" rowspan="2" colspan="1">PHONE</th>
                <th class="header-2 align-left" rowspan="2" colspan="1">FAX</th>
                `;
      } else if (reportFilters.viewbyPdf == 'facility') {
        pdfContent += `<thead>
              <tr>`;
      }

      if ((reportFilters.subgroup_by_id !== 1 || reportFilters.group_by_id !== 1) && currentVal) {
        pdfContent += `<th class="header-2 align-left" rowspan="2"  colspan="1">${currentVal}</th>`;
      }

      let evaluationHeaders: Set<string> = new Set();

      // Iterate over groups and handle two-level or three-level nested structure
      for (const groupName in facilityData.groups) {
        const groupDataArray: any = facilityData.groups[groupName];

        // Check if groupDataArray is directly the evaluation data (second-level nesting)
        if (Object.keys(groupDataArray).includes('vc')) {
          // Second level nesting, add 'vc', 'sc', 'ns' headers
          evaluationHeaders.add('Appointment Status');
        } else {
          // Third level nesting, iterate over the nested evaluation types (like 'Diagnostic', 'CH', etc.)
          Object.keys(groupDataArray).forEach(evaluationType => evaluationHeaders.add(evaluationType));
        }
      }

      const evaluationHeaderArray: string[] = Array.from(evaluationHeaders);

      evaluationHeaders.forEach(evaluationType => {
        pdfContent += `<th colspan="3" class="header-2">${evaluationType}</th>`;
      });

      pdfContent += `<th rowspan="2" class="header-2">Total</th>`;
      pdfContent += `</tr><tr>`;

      evaluationHeaders.forEach(() => {
        pdfContent += `<th class="header-3">VC</th>`;
        pdfContent += `<th class="header-3">SC</th>`;
        pdfContent += `<th class="header-3">NS</th>`;
      });

      pdfContent += `</tr>`;
      pdfContent += `</thead>`;
      pdfContent += `<tbody>`;

      for (const groupName in facilityData.groups) {
        const groupDataArray: summaryReportGroup = facilityData.groups[groupName];
        let i: number = 0;

        // Handle the case for second-level nesting (directly contains evaluation data)
        if (Object.keys(groupDataArray).includes('vc')) {
          pdfContent += `
          <tr class="${groupName == 'Grand Total' ? 'totalRowClass' : groupName == 'Sub Total' ? 'subTotalRowClass' : ''}" >`;
          pdfContent += `
            <td class="align-left minWidth bold">${groupName}</td>`

          if (reportFilters.group_by_id == 1) {
            pdfContent += `
            <td class="align-left minWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : groupDataArray.outside_referring_address || 'N/A'}</td>
            <td class="align-left specMinWidth color-diff ">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : groupDataArray.outside_phone || 'N/A'}</td>
            <td class="align-left specMinWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : groupDataArray.outside_fax || 'N/A'}</td>`;

          }

          evaluationHeaderArray.forEach(() => {

            pdfContent += `<td class="${groupName == 'Grand Total' ? 'grandTotalBold borderLeft' : groupName == 'Sub Total' ? 'TotalBold borderLeft' : 'simple-format borderLeft'}">${groupName == 'Grand Total' ? '' : groupDataArray.vc}</td>
            <td class="${groupName == 'Grand Total' ? 'grandTotalBold' : groupName == 'Sub Total' ? 'TotalBold' : 'simple-format'}">${groupDataArray.sc}</td>
            <td class="${groupName == 'Grand Total' ? 'grandTotalBold ' : groupName == 'Sub Total' ? 'TotalBold ' : 'simple-format'}">${groupName == 'Grand Total' ? '' : groupDataArray.ns}</td>`;
          });
          pdfContent += `<td class="${groupName == 'Grand Total' ? 'grandTotalBold borderLeft' : groupName == 'Sub Total' ? 'TotalBold borderLeft' : 'simple-format borderLeft'}">${groupName == 'Grand Total' ? '' : groupDataArray.total}</td></tr>`;
        } else {
          // Handle third-level nesting
          for (const evaluationType in groupDataArray) {
            const evaluationData: summaryReportGroup = groupDataArray[evaluationType];
            pdfContent += `
              <tr class="${groupName == 'Grand Total' ? 'totalRowClass' : groupName == 'Sub Total' ? 'subTotalRowClass' : ''}" >`;
            pdfContent += `
            <td class="align-left minWidth">${groupName}</td>
            <td class="align-left minWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : evaluationData.outside_referring_address || 'N/A'}</td>
            <td class="align-left color-diff specMinWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : evaluationData.outside_referring_address ? evaluationData.outside_phone || 'N/A' : ''}</td>
            <td class="align-left specMinWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : evaluationData.outside_referring_address ? evaluationData.outside_fax || 'N/A' : ''}</td>`;

            pdfContent += `<td>${evaluationType}</td>`;
            pdfContent += `<td class="${groupName == 'Grand Total' ? 'grandTotalBold borderLeft' : groupName == 'Sub Total' ? 'TotalBold borderLeft' : 'simple-format borderLeft'}">${groupName == 'Grand Total' ? '' : evaluationData.vc}</td>
                         <td class="${groupName == 'Grand Total' ? 'grandTotalBold' : groupName == 'Sub Total' ? 'TotalBold' : 'simple-format'}">${evaluationData.sc}</td>
                         <td class="${groupName == 'Grand Total' ? 'grandTotalBold ' : groupName == 'Sub Total' ? 'TotalBold ' : 'simple-format'}">${groupName == 'Grand Total' ? '' : evaluationData.ns}</td>`;

            pdfContent += `<td class="${groupName == 'Grand Total' ? 'grandTotalBold borderLeft' : groupName == 'Sub Total' ? 'TotalBold borderLeft' : 'simple-format borderLeft'}">${groupName == 'Grand Total' ? '' : evaluationData.total}</td></tr>`;
          }
        }
        // pdfContent += `<tr class="line-row"><td colspan="100"><div class="full-page-line"></div></td></tr>`
      }

      pdfContent += `</tbody></table></div>`;
    }
  } else {
    for (const facilityOrLocation in groupedData) {
      const facilityData: any = groupedData[facilityOrLocation];
      // Create a div for each facility or facility_location
      pdfContent += `<div class="PDF-appointment">
            <div class='header-format'>
              <div class="main-logo">
                 <img src="data:image/png;base64,${newLogo}" width="160" height="140">
                </div>
                   <div class="main-info">
                    <div class="text-wrapper-2">Office Procedures Report</div>
                    <p class="from"><span class="span">as of ${updatedEndDate}</span></p>
                    <p class="from color-diff"><span><strong>FROM  ${start_date}       TO     ${end_date} </strong></span></p>
              </div>
              <div class="main-location">
              <div class="location-details">
                <div class="location-name">${facilityOrLocation}</div>
                <div class="location-info">
                  <div class="icon-wrapper">${image1}</div>
                  <p class="location-address">${facilityData.facility_address}</p>
                </div>
                <div class="location-info">
                  <div class="icon-wrapper">${image2}</div>
                  <p class="location-contact">${facilityData.facility_phone}</p>
                </div>
                <div class="location-info">
                  <div class="icon-wrapper">${image2}</div>
                  <p class="location-contact">${facilityData.facility_fax}</p>
                </div>
              </div>      
            </div>
          </div>
        </div>`;
      let currentVal: string;
      switch (reportFilters.group_by_id) {
        case 2:
          currentVal = `Speciality`
          break;
        case 14:
          currentVal = 'Visit Type'
          break;
        case 3:
          currentVal = 'Provider'
          break;
        default:
          break;
      }
      // Create a table for groups

      pdfContent += `
    <div style="margin-left:20px;margin-right:20px">
    <table class="appointment-table" style="width:100%">
              `
      if (reportFilters.group_by_id == 1 || reportFilters.sub_group_by_id == 1 || reportFilters.in_house) {
        pdfContent += `<thead>
              <tr>
                <th class="header-2 align-left" rowspan="2" colspan="1">OFFICE(S)</th>
                <th class="header-2 align-left" rowspan="2" colspan="1">ADDRESS</th>
                <th class="header-2 align-left" rowspan="2" colspan="1">PHONE</th>
                <th class="header-2 align-left" rowspan="2" colspan="1">FAX</th>
                `;
      } else if (reportFilters.viewbyPdf == 'facility') {
        pdfContent += `<thead>
              <tr>

                `;
      }

      if ((reportFilters.subgroup_by_id !== 1 || reportFilters.group_by_id !== 1) && currentVal) {
        pdfContent += `<th class="header-2 align-left" rowspan="2"  colspan="1">${currentVal}</th>`;
      }
      // Collect all dynamic evaluation types across all groups to create headers
      let evaluationHeaders: Set<string> = new Set();
      for (const groupName in facilityData.groups) {
        const groupDataArray = facilityData.groups[groupName];
        Object.keys(groupDataArray).forEach(evaluationType => evaluationHeaders.add(evaluationType));
      }
      // Convert Set to Array when needed
      const evaluationHeaderArray: string[] = Array.from(evaluationHeaders);

      // Add dynamic evaluation type headers
      evaluationHeaders.forEach(evaluationType => {
        pdfContent += `<th colspan="3" class="header-2">${evaluationType}</th>`;
      });
      pdfContent += `<th rowspan="2" class="header-2">Total</th>`;
      pdfContent += `</tr><tr>`;

      // Add VC, SC, NS subheaders under each evaluation type
      evaluationHeaders.forEach(() => {
        pdfContent += `<th class="header-3">VC</th>`;
        pdfContent += `<th class="header-3">SC</th>`;
        pdfContent += `<th class="header-3">NS</th>`;
      });

      pdfContent += `</tr>`;
      pdfContent += `</thead>`;
      pdfContent += `<tbody>`;
      let i = 0;


      for (const groupName in facilityData.groups) {
        const groupDataArray: summaryReportGroup = facilityData.groups[groupName];
        let i = 0;

        // let firstAvailableGroupName = evaluationHeaderArray.find(name => facilityData.groups[name]);
        if (reportFilters.in_house && reportFilters.in_house !== 'all') {
          for (i = 0; i < evaluationHeaderArray.length; i++) {
            if (groupDataArray[evaluationHeaderArray[i]]) {
              pdfContent += `
              <tr class="${groupName == 'Grand Total' ? 'totalRowClass' : groupName == 'Sub Total' ? 'subTotalRowClass' : ''}" >`;
              pdfContent += `
              <td class="align-left minWidth bold" >${groupName}</td>`;
              pdfContent += `
              <td class="align-left minWidth" >${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : groupDataArray[evaluationHeaderArray[i]].outside_referring_address || 'N/A'}</td>`;
              pdfContent += `
              <td class="align-left color-diff specMinWidth" >${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : groupDataArray[evaluationHeaderArray[i]].outside_phone ? groupDataArray[evaluationHeaderArray[i]].outside_phone : 'N/A'}</td>`;
              pdfContent += `
              <td class="align-left specMinWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : groupDataArray[evaluationHeaderArray[i]].outside_fax ? groupDataArray[evaluationHeaderArray[i]].outside_fax : 'N/A'}</td>`;
              break;
            }
          }

        } else if ((reportFilters.subgroup_by_id !== 1 || reportFilters.group_by_id !== 1) && currentVal && reportFilters.in_house == 'all') {
          pdfContent += `
          <tr class="${groupName == 'Grand Total' ? 'totalRowClass' : groupName == 'Sub Total' ? 'subTotalRowClass' : ''}" >`;
          pdfContent += `
          <td></td>`;
          pdfContent += `
          <td class="align-left minWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : facilityData.facility_address}</td>`;
          pdfContent += `
          <td class="align-left specMinWidth color-diff">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : facilityData.facility_phone}</td>`;
          pdfContent += `
          <td class="align-left specMinWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : facilityData.facility_fax}</td>`;
          pdfContent += `
          <td class="align-left">${groupName}</td>`;
        } else if (reportFilters.viewbyPdf == 'facility' && (reportFilters.group_by_id == 1 || reportFilters.subgroup_by_id == 1)) {
          pdfContent += `
          <tr class="${groupName == 'Grand Total' ? 'totalRowClass' : groupName == 'Sub Total' ? 'subTotalRowClass' : ''}" >`;
          pdfContent += `
          <td class="align-left minWidth bold">${groupName}</td>`;
          pdfContent += `
          <td class="align-left minWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : facilityData.facility_address}</td>`;
          pdfContent += `
          <td class="align-left specMinWidth color-diff">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : facilityData.facility_phone}</td>`;
          pdfContent += `
          <td class="align-left specMinWidth">${(groupName == 'Sub Total' || groupName == 'Grand Total') ? '' : facilityData.facility_fax}</td>`;
        } else {
          pdfContent += `
          <tr class="${groupName == 'Grand Total' ? 'totalRowClass' : groupName == 'Sub Total' ? 'subTotalRowClass' : ''}" >`;
          pdfContent += `
          <td class="align-left bold specMinWidth">${groupName}</td>`;
        }

        let sum: number = 0;
        evaluationHeaders.forEach(evaluationType => {
          const evaluationData: summaryReportGroup = groupDataArray[evaluationType] || {}; // Fallback if the type doesn't exist in the current group
          pdfContent += `
          <td class="${groupName == 'Grand Total' ? 'grandTotalBold borderLeft' : groupName == 'Sub Total' ? 'TotalBold borderLeft' : 'simple-format borderLeft'}">${groupName == 'Grand Total' ? '' : evaluationData.vc || 0}</td>`;
          pdfContent += `
          <td class="${groupName == 'Grand Total' ? 'grandTotalBold' : groupName == 'Sub Total' ? 'TotalBold' : 'simple-format'}">${evaluationData.sc || 0}</td>`;
          pdfContent += `
          <td class="${groupName == 'Grand Total' ? 'grandTotalBold' : groupName == 'Sub Total' ? 'TotalBold ' : 'simple-format'}">${groupName == 'Grand Total' ? '' : evaluationData.ns || 0}</td>`;

          sum += parseInt(evaluationData.vc || '0') + parseInt(evaluationData.ns || '0') + parseInt(evaluationData.sc || '0');
        });
        // }
        pdfContent += `<td class="${groupName == 'Grand Total' ? 'grandTotalBold borderLeft' : groupName == 'Sub Total' ? 'TotalBold borderLeft' : 'simple-format borderLeft'}"><strong>${groupName == 'Grand Total' ? '' : sum || ''}</strong></td>`;
        pdfContent += `</tr>`;
        pdfContent += `</tr>`;
        // pdfContent += `<tr class="line-row"><td colspan="100" ><div class="full-page-line"></div></td></tr>`
        i++;
      }
      pdfContent += `</tbody>`;
      pdfContent += `</table>`;
      pdfContent += `</div>`;
    }
  }

  return pdfContent; // Return the HTML string for PDF generation
}


