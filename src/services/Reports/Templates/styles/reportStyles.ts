export const statusSummaryReportStyles: string = `
<style>
:root {
--sub-header-sub-7-font-family: "Open Sans", Helvetica;
--sub-header-sub-7-font-weight: 600;
--sub-header-sub-7-font-size: 12px;
--sub-header-sub-7-letter-spacing: 0px;
--sub-header-sub-7-line-height: normal;
--sub-header-sub-7-font-style: normal;
--body-display-5-font-family: "Open Sans", Helvetica;
--body-display-5-font-weight: 400;
--body-display-5-font-size: 12px;
--body-display-5-letter-spacing: 0px;
--body-display-5-line-height: normal;
--body-display-5-font-style: normal;
--header-heading-6-font-family: "Open Sans", Helvetica;
--header-heading-6-font-weight: 700;
--header-heading-6-font-size: 14px;
--header-heading-6-letter-spacing: 0px;
--header-heading-6-line-height: normal;
--header-heading-6-font-style: normal;
--header-heading-1-font-family: "Open Sans", Helvetica;
--header-heading-1-font-weight: 700;
--header-heading-1-font-size: 30px;
--header-heading-1-letter-spacing: 0px;
--header-heading-1-line-height: normal;
--header-heading-1-font-style: normal;
--body-display-4-font-family: "Open Sans", Helvetica;
--body-display-4-font-weight: 400;
--body-display-4-font-size: 14px;
--body-display-4-letter-spacing: 0px;
--body-display-4-line-height: normal;
--body-display-4-font-style: normal;
--sub-header-sub-3-font-family: "Open Sans", Helvetica;
--sub-header-sub-3-font-weight: 600;
--sub-header-sub-3-font-size: 20px;
--sub-header-sub-3-letter-spacing: 0px;
--sub-header-sub-3-line-height: normal;
--sub-header-sub-3-font-style: normal;
--header-heading-3-font-family: "Open Sans", Helvetica;
--header-heading-3-font-weight: 700;
--header-heading-3-font-size: 22px;
--header-heading-3-letter-spacing: 0px;
--header-heading-3-line-height: normal;
--header-heading-3-font-style: normal;
--color-styles-neutrals-dark: rgba(109, 126, 153, 1);
--color-styles-text-body-text: rgba(1, 16, 43, 1);
--color-styles-primary-dark: rgba(57, 127, 179, 1);
--color-styles-text-heading-alternative: rgba(6, 26, 61, 1);
--color-styles-primary-darker: rgba(38, 85, 119, 1);
--color-styles-primary-lightest-2: rgba(246, 251, 254, 1);
--color-styles-neutrals-menu-stroke: rgba(226, 232, 240, 1);
}

.PDF-appointment {
width: 1105px;
background-color: #ffffff;
padding-bottom: 20px;
position: relative;
display: flex;
flex-direction: column;
align-items: center;
page-break-before: always;
}

.PDF-appointment .text-wrapper-2 {
margin-top: 40px; /* Adjust this value to add space from the top */
font-family: var(--header-heading-1-font-family);
font-weight: var(--header-heading-1-font-weight);
color: var(--color-styles-text-heading-alternative);
font-size: var(--header-heading-1-font-size);
text-align: center;
line-height: var(--header-heading-1-line-height);
}

.PDF-appointment .from,
.PDF-appointment .to {
display: inline-block;
margin-top: 10px;
font-family: "Open Sans-SemiBold", Helvetica;
font-size: 20px;
color: var(--color-styles-primary-darker);
}


.appointment-table {
padding-top: 50px;
width: 100%;
border-collapse: collapse;
}

.appointment-table th {
    border-color: var(--color-styles-neutrals-menu-stroke);
  background-color: var(--color-styles-primary-lightest-2);
  text-align: left;
  padding: 10px;
}

.header-2 {
width: 100px;
font-family: "Open Sans-Bold", Helvetica;
font-weight: 700;
color: var(--color-styles-neutrals-dark);
font-size: 12px;
line-height: normal;
}

.appointment-table td, .visit-table td {
padding:10px;
border: 0px solid #ddd;
text-align: left;
}

.body-text {
width: 100px;
font-size: 14px;
color: #333;
}
.special-text{
font-family: var(--sub-header-sub-7-font-family);
font-weight: var(--sub-header-sub-7-font-weight);
position: relative;
flex: 1;
align-self: stretch;
margin-top: -0.8px;
color: var(--color-styles-primary-dark);
font-size: var(--sub-header-sub-7-font-size);
letter-spacing: var(--sub-header-sub-7-letter-spacing);
line-height: var(--sub-header-sub-7-line-height);
font-style: var(--sub-header-sub-7-font-style);
}


.text-wrapper-4 {
position: relative;
align-self: stretch;
margin-top: -1px;
font-family: var(--header-heading-6-font-family);
font-weight: var(--header-heading-6-font-weight);
color: var(--color-styles-primary-dark);
font-size: var(--header-heading-6-font-size);
letter-spacing: var(--header-heading-6-letter-spacing);
line-height: var(--header-heading-6-line-height);
font-style: var(--header-heading-6-font-style);
}
.group {
position: relative;
width: 24px;
height: 24px;
background-color: var(--color-styles-primary-dark);
border-radius: 12px;
}

.text-wrapper-3 {
font-family: var(--header-heading-3-font-family);
font-weight: var(--header-heading-3-font-weight);
font-size: var(--header-heading-3-font-size);
font-style: var(--header-heading-3-font-style);
letter-spacing: var(--header-heading-3-letter-spacing);
line-height: var(--header-heading-3-line-height);
}

.po{
width: 255px;
align-items: flex-start;
padding: 8px 7px 10px 10px;
top: 279px;
left: 0;
background-color: var(--color-styles-primary-lightest-2);
height: 35px;
gap: 7px 7px;
border-bottom-width: 0.8px;
border-bottom-style: solid;
border-color: var(--color-styles-neutrals-menu-stroke);
}
.text-wrapper-5 {
font-weight: 700;
color: #061a3d;
letter-spacing: 0.04px;
}

.text-wrapper-6 {
font-family: var(--body-display-4-font-family);
color: #397fb3;
letter-spacing: var(--body-display-4-letter-spacing);
font-style: var(--body-display-4-font-style);
font-weight: var(--body-display-4-font-weight);
line-height: var(--body-display-4-line-height);
font-size: var(--body-display-4-font-size);
}
.header-format {
height: auto;
width: 100%;
display: flex;
justify-content: space-between; /* Distributes space between items */
 /* Aligns items at the top */
padding-top: 10px; /* Adjusts overall padding as needed */
}

.main-logo img {
margin-right: 60px; /* Add space to the right of the logo */
margin-left: 0px;

}

.main-info {
flex: 1; /* Allows main info to take up available space */
text-align: center; /* Center the text horizontally */
margin: 20px; /* Add margin around main-info */
}
.header-3{
width: 76.07px;
margin-top: -0.8px;
font-family: "Open Sans-Bold", Helvetica;
font-weight: 700;
font-size: 12px;
letter-spacing: 0.24px;
line-height: normal;
}
.main-location {
/*padding-left: 20px;*/
padding: 30px;
margin-left: 20px; /* Add space to the left of the location */
margin-top: 20px; /* Add top spacing */
width: 200px; /* Set a fixed width or max-width for main-location */
/* Optional: Adjust the height or add padding if needed */
}

/* Additional spacing between elements */
.header-format > div {
margin: 10px; /* Adds space between each child div */
}
.main-location {
display: flex;
flex-direction: column;
align-items: flex-start;
}

.location-details {
display: flex;
flex-direction: column;
gap: 5px; /* Adjust the gap as needed to control spacing */
}

.location-name {
font-size: 18px;
font-weight: bold;
margin: 0;
padding: 0;
}

.location-info {
display: flex;
align-items: center;
gap: 8px; /* Space between icon and text */
}

.icon-wrapper {
width: 24px;
height: 24px;
background-color: var(--color-styles-primary-dark);
}

.icon {
width: 100%;
height: 100%;
}

.location-address, .location-contact {
margin: 0;
padding: 0;
font-size: 14px;
}
</style>`;

export const summaryReportStyles: string = `<style>
    :root {
  --sub-header-sub-7-font-family: "Open Sans", Helvetica;
  --sub-header-sub-7-font-weight: 600;
  --sub-header-sub-7-font-size: 12px;
  --sub-header-sub-7-letter-spacing: 0px;
  --sub-header-sub-7-line-height: normal;
  --sub-header-sub-7-font-style: normal;
  --body-display-5-font-family: "Open Sans", Helvetica;
  --body-display-5-font-weight: 400;
  --body-display-5-font-size: 12px;
  --body-display-5-letter-spacing: 0px;
  --body-display-5-line-height: normal;
  --body-display-5-font-style: normal;
  --header-heading-6-font-family: "Open Sans", Helvetica;
  --header-heading-6-font-weight: 700;
  --header-heading-6-font-size: 14px;
  --header-heading-6-letter-spacing: 0px;
  --header-heading-6-line-height: normal;
  --header-heading-6-font-style: normal;
  --header-heading-1-font-family: "Open Sans", Helvetica;
  --header-heading-1-font-weight: 700;
  --header-heading-1-font-size: 30px;
  --header-heading-1-letter-spacing: 0px;
  --header-heading-1-line-height: normal;
  --header-heading-1-font-style: normal;
  --body-display-4-font-family: "Open Sans", Helvetica;
  --body-display-4-font-weight: 400;
  --body-display-4-font-size: 14px;
  --body-display-4-letter-spacing: 0px;
  --body-display-4-line-height: normal;
  --body-display-4-font-style: normal;
  --sub-header-sub-3-font-family: "Open Sans", Helvetica;
  --sub-header-sub-3-font-weight: 600;
  --sub-header-sub-3-font-size: 20px;
  --sub-header-sub-3-letter-spacing: 0px;
  --sub-header-sub-3-line-height: normal;
  --sub-header-sub-3-font-style: normal;
  --header-heading-3-font-family: "Open Sans", Helvetica;
  --header-heading-3-font-weight: 700;
  --header-heading-3-font-size: 22px;
  --header-heading-3-letter-spacing: 0px;
  --header-heading-3-line-height: normal;
  --header-heading-3-font-style: normal;
  --color-styles-neutrals-dark: rgba(109, 126, 153, 1);
  --color-styles-text-body-text: rgba(1, 16, 43, 1);
  --color-styles-primary-dark: rgba(57, 127, 179, 1);
  --color-styles-text-heading-alternative: rgba(6, 26, 61, 1);
  --color-styles-primary-darker: rgba(38, 85, 119, 1);
  --color-styles-primary-lightest-2: rgba(246, 251, 254, 1);
  --color-styles-neutrals-menu-stroke: rgba(226, 232, 240, 1);
}

.PDF-appointment {
    width: 100%;
    background-color: #ffffff;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    page-break-before: always;
    margin-top : -25px
}


.table-container {
    margin-top: 10px; 
    width: 100%;
}

.appointment-table, .visit-table {
    padding-top: 50px;
    width: 100%;
    border-collapse: collapse;
}

.appointment-table th, .visit-table th {
    border-color: var(--color-styles-neutrals-menu-stroke);
    background-color: #cfdfef;
    text-align: center;
}

.header-2 {
  width: 76.07px;
  margin-top: -0.8px;
  font-family: "Open Sans-Bold", Helvetica;
  font-weight: 700;
  color: var(--color-styles-neutrals-dark);
  font-size: 12px;
  letter-spacing: 0.24px;
  line-height: normal;
}

.appointment-table tr:not(.line-row):nth-child(odd), 
.visit-table tr:not(.line-row):nth-child(odd) {
    background-color: #f2f2f2; /* Light gray for odd rows */
}

.appointment-table tr:not(.line-row):nth-child(even), 
.visit-table tr:not(.line-row):nth-child(even) {
    background-color: #ffffff; /* White for even rows */
}

/* Line row specific styles (if any) */
.appointment-table .line-row, .visit-table .line-row {
    background-color: transparent; /* No background for line row */
    height: 1px; /* Adjust height for line row */
}

/* Align some td to left and some to center */
.appointment-table td.align-left, .visit-table td.align-left, th.align-left {
    text-align: left;
}
.appointment-table  th.align-left {
    text-align: left 
}

/* Keep the rest of the td aligned to center */
.appointment-table tr, .visit-table tr {
    height: auto !important; /* Ensure rows are not forced to a specific height */
}


.appointment-table td, .visit-table td {
    line-height: var(--dynamic-line-height);
    border: 0px solid #ddd;
    text-align: center;
    font-size: var(--sub-header-sub-7-font-size);
    font-family: var(--sub-header-sub-7-font-family);
    height: auto; /* Make sure height is dynamic */
    white-space : normal 
}

.minWidth {
  min-width : 145px;
}
.specMinWidth {
  min-width : 100px;
}

/* Make some td bold */
.appointment-table td.bold, .visit-table td.bold {
    font-weight: bold;
}

/* Add padding to increase row size */
.appointment-table td, .visit-table td {
    padding: 3px 2px; /* Increase the padding to make rows bigger */
}

.body-text {
    font-size: 14px;
    color: #333;
}
.special-text{
  font-family: var(--sub-header-sub-7-font-family);
  font-weight: var(--sub-header-sub-7-font-weight);
  position: relative;
  flex: 1;
  align-self: stretch;
  margin-top: -0.8px;
  color: var(--color-styles-primary-dark);
  font-size: var(--sub-header-sub-7-font-size);
  letter-spacing: var(--sub-header-sub-7-letter-spacing);
  line-height: var(--sub-header-sub-7-line-height);
  font-style: var(--sub-header-sub-7-font-style);
}
  .frame-3 {
  display: flex;
  align-items: flex-start;
  gap: 3px;
  position: relative;
  align-self: stretch;
  width: 100%;
  flex: 0 0 auto;
}

.header-3{
  width: 76.07px;
  margin-top: -0.8px;
  font-family: "Open Sans-Bold", Helvetica;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.24px;
  line-height: normal;
}

 .text-wrapper-4 {
  position: relative;
  align-self: stretch;
  margin-top: -1px;
  font-family: var(--header-heading-6-font-family);
  font-weight: var(--header-heading-6-font-weight);
  color: var(--color-styles-primary-dark);
  font-size: var(--header-heading-6-font-size);
  letter-spacing: var(--header-heading-6-letter-spacing);
  line-height: var(--header-heading-6-line-height);
  font-style: var(--header-heading-6-font-style);
}
.group {
  position: relative;
  width: 24px;
  height: 24px;
  background-color: var(--color-styles-primary-dark);
  border-radius: 12px;
}

.text-wrapper-3 {
  font-family: var(--header-heading-3-font-family);
  font-weight: var(--header-heading-3-font-weight);
  font-size: var(--header-heading-3-font-size);
  font-style: var(--header-heading-3-font-style);
  letter-spacing: var(--header-heading-3-letter-spacing);
  line-height: var(--header-heading-3-line-height);
}

.po{
  width: 255px;
  align-items: flex-start;
  padding: 8px 7px 10px 10px;
  top: 279px;
  left: 0;
  background-color: var(--color-styles-primary-lightest-2);
  height: 35px;
  gap: 7px 7px;
  border-bottom-width: 0.8px;
  border-bottom-style: solid;
  border-color: var(--color-styles-neutrals-menu-stroke);
}
.text-wrapper-5 {
  font-weight: 700;
  color: #061a3d;
  letter-spacing: 0.04px;
}

.text-wrapper-6 {
  font-family: var(--body-display-4-font-family);
  color: #397fb3;
  letter-spacing: var(--body-display-4-letter-spacing);
  font-style: var(--body-display-4-font-style);
  font-weight: var(--body-display-4-font-weight);
  line-height: var(--body-display-4-line-height);
  font-size: var(--body-display-4-font-size);
}
  .header-format {
    height: auto;
    width: 100%;
    display: flex;
    justify-content: space-between; 
    padding-top: 10px;
}

.main-logo img {
    margin-right: 60px; 
    margin-left: 0px;

}
.main-info {
    flex: 1; 
    text-align: center; 
    margin: 20px; 
}

.main-location {
    padding: 30px;
    margin-left: 20px;  
    margin-top: 20px; 
    width: 200px; 
}

.header-format > div {
    margin: 10px; 
}
.main-location {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.location-details {
    display: flex;
    flex-direction: column;
    gap: 5px; 
}

.location-name {
    font-size: 18px;
    font-weight: bold;
    margin: 0;
    padding: 0;
}

.location-info {
    display: flex;
    align-items: center;
}

.icon-wrapper {
    width: 24px;
    height: 24px;
    background-color: var(--color-styles-primary-dark);
    margin-right : 5px
}

.icon {
    width: 100%;
    height: 100%;
}
.text-wrapper-2 {
    margin-top: 40px; 
    font-family: var(--header-heading-1-font-family);
    font-weight: var(--header-heading-1-font-weight);
    color: var(--color-styles-text-heading-alternative);
    font-size: var(--header-heading-1-font-size);
    text-align: center;
    line-height: var(--header-heading-1-line-height);
}
.location-address, .location-contact {
  margin: 0;
  padding: 0;
  font-size: 14px;
}
.full-page-line {
      border-top: 0.5px solid grey;
  }
.simple-format{
align-text:center
}
.borderLeft{
border-left: 1px solid lightgrey !important;
}
.grandTotalBold{
  font-weight: bold;
}
.TotalBold{
  font-weight: bold;

}
.color-diff {
  color: var(--color-styles-neutrals-dark);
}
@media print {
  /* Create spacing on the new page when a table header appears */
  .appointment-table thead {
      margin-top: 0; /* Ensure no margin on the first page */
  }

  .appointment-table {
      page-break-before: auto; /* Add the page break before automatically */
  }
  body {
    margin: 0; /* Remove margins for the body */
    padding: 0;
  }
  .PDF-appointment {
    width: 100%; /* Ensure it takes full width */
    margin: 0;
    page-break-before: always; /* Ensure a break occurs where necessary */
  }
  .appointment-table {
    width: 100%; /* Force table to take full width */
    margin: 0;
    padding: 0;
    border-collapse: collapse;
  }
    

  .appointment-table tr {
      page-break-inside: avoid; /* Ensures the row moves to a new page if it's too large */
  }

  .appointment-table td {
      page-break-inside: avoid; /* Optionally applies to each td */
  }

  /* Add margin-top only when a new page starts */
  @page {
      margin-top: 20px;
  }
      }
  .spacing-div {
    height: 40px; /* Adjust the spacing size as needed */
    background-color: transparent; /* Ensure it's transparent or matches the table background */
}
  .subTotalRowClass {
    background-color : #e5eef3 !important;
}

.totalRowClass {
    background-color : #cfdfef !important;
}

  
 </style>`;