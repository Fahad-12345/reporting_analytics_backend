import * as ExcelJS from "exceljs";
import { Helper, Http } from "../../shared";
import { ReportService } from "./report.service"; // Assuming that your ReportService file is named "index.ts" or similar
import { GroupByID, ReportType, groupByNameMapping, viewByNameMapping } from "./report.enum";
import { reportExcel } from "./ReportContract/RequestInterface/request-model";
import { SummaryRow } from "../../interfaces/types";

export class ExcelService extends Helper {
    public __http: Http;
    public constructor(public http: typeof Http) {
        super();
        this.__http = new http();
    }
    public generateExcelDataByReportType = async (body) => {

        try {
            let reportData: any;
            const headerName: string[] = [];
            const reportService = new ReportService(Http);
            let workSheetName = "Report";
            const headerExclusions: { [key: string]: string[] } = {
                [ReportType.Denial_Report]: [
                    'group_by_id',
                    'subgroup_by_id', 'denial_type_id'
                ],
                [ReportType.Denial_Detail_Report]: [
                    'denied_amount', 'total_denied_amount', 'balance_0_to_29_days',
                    'balance_30_to_59_days', 'balance_60_to_89_days', 'balance_90_to_119_days',
                    'balance_120_to_149_days', 'balance_150_to_179_days', 'balance_150_to_179_days',
                    'balance_180plusdays',
                ],
                [ReportType.Payment_Detail_Report]: [
                    'data', 'total_count'
                ],
                [ReportType.Account_Receivable_Report]: [
                    'bill_recipient_type_id', 'invoice_recipient_id',
                    'bill_recipient_id', 'group_by_id', 'subgroup_by_id',
                    'bill_recipient_name', 'invoice_recipient_name'
                ]

            };
            const reportType = body.report_type;
            if (reportType === ReportType.Denial_Report) {
                workSheetName = reportType === ReportType.Denial_Report ? "DenialReport" : 'Denial Detail Report';
                reportData = await reportService.getDenialReport(body);
                let group_by_id = body.group_by_id
                let subgroup_by_id = body.subgroup_by_id
                if (reportData && reportData.detailResults && reportData.detailResults.length > 0) {
                    const detailResultsHeaders = Object.keys(reportData.detailResults[0]);
                    detailResultsHeaders.forEach(header => {
                        if (header === 'balance_0_to_29_days') {
                            header = '30 Days'
                        }
                        if (header === 'balance_30_to_59_days') {
                            header = '60 Days'
                        }
                        if (header === 'balance_60_to_89_days') {
                            header = '90 Days'
                        }
                        if (header === 'balance_90_to_119_days') {
                            header = '120 Days'
                        }
                        if (header === 'balance_120_to_149_days') {
                            header = '150 Days'
                        }
                        if (header === 'balance_150_to_179_days') {
                            header = '180 Days'
                        }
                        if (header === 'balance_180plusdays') {
                            header = '180+ Days'
                        }
                        if (header === 'total_denied_amount') {
                            header = 'Total Denied Amount'
                        }

                        if (header === 'group_by_name') {
                            headerName.push(groupByNameMapping[group_by_id]);
                        } else if (header === 'sub_group_by_name' && group_by_id !== null) {
                            headerName.push(groupByNameMapping[subgroup_by_id]);
                        } else if (!headerExclusions[reportType].includes(header)) {
                            headerName.push(header);
                        }
                    });
                }
                const dataRows = reportType === ReportType.Denial_Report ? [...reportData.detailResults, ...reportData.summaryResults] : reportData.Arraydata;

                const filteredDataRows = dataRows.map(row => {
                    const newRow = { ...row }; // Create a copy of the row object
                    // Remove columns based on header exclusions
                    Object.keys(newRow).forEach(header => {
                        if (headerExclusions[reportType].includes(header)) {
                            delete newRow[header];
                        }
                    });

                    return newRow;
                });
                const csvData = [headerName]?.concat(filteredDataRows.map((row) => Object.values(row)));


                const csvContent = csvData.map((row) => row.map(value => {
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    return value;
                }).join(",")).join("\n");




                return csvContent;
            }
            else if (reportType === ReportType.Payment_Detail_Report) {
                workSheetName = reportType === ReportType.Payment_Detail_Report ? "Payment Detail Report" : 'Payment Summary Report';
                reportData = await reportService.getPaymentReport(body);
                const headerMapping: { [key: string]: string } = {};
                if (reportData && reportData.actualdata && reportData.actualdata.length > 0) {
                    const PaymentHeaders = Object.keys(reportData.actualdata[0]);
                    // Map headers and store renamed versions
                    PaymentHeaders.forEach(originalHeader => {
                        let newHeader = originalHeader; // Default to the original name

                        // Rename specific headers and store the mappings
                        if (originalHeader === 'bill_no') {
                            newHeader = 'Bill/Invoice ID';
                        } else if (originalHeader === 'billed_amount') {
                            newHeader = 'Billed/Invoice Amount';
                        } else if (originalHeader === 'billed_date') {
                            newHeader = 'Bill/Invoice Date';
                        } else if (originalHeader === 'bill_recipient_type') {
                            newHeader = 'Bill/Invoice Recipient Type';
                        } else if (originalHeader === 'bill_recipient_name') {
                            newHeader = 'Bill/Invoice Recipient Name';
                        }

                        // Store the mapping and add the renamed header to the array if not excluded
                        headerMapping[originalHeader] = newHeader;
                        if (!headerExclusions[reportType].includes(originalHeader)) {
                            headerName.push(newHeader);
                        }
                    });

                    // Map the original data rows to match the renamed headers
                    const filteredDataRows = reportData.actualdata.map(row => {
                        const newRow: { [key: string]: any } = {};

                        // Use the headerMapping to assign values to the correct renamed headers
                        Object.keys(row).forEach(originalHeader => {
                            const renamedHeader = headerMapping[originalHeader];
                            if (renamedHeader && !headerExclusions[reportType]?.includes(originalHeader)) {
                                newRow[renamedHeader] = row[originalHeader];
                            }
                        })
                        return newRow; // Return the newly ordered row
                    });


                    const csvData = [headerName].concat(filteredDataRows.map((row) => Object.values(row)));
                    const csvContent = csvData.map((row) => row.map(value => {
                        if (typeof value === 'string' && value.includes(',')) {
                            return `"${value}"`;
                        }
                        return value;
                    }).join(",")).join("\n");


                    return csvContent;
                }
            }
            else if (reportType === ReportType.Account_Receivable_Report) {
                workSheetName = reportType === ReportType.Account_Receivable_Report ? "A/R report" : 'Report';
                reportData = await reportService.getAccountReceivableReport(body);
                const group_by_id: number = body.group_by_id
                const subgroup_by_id: number = body.subgroup_by_id

                if (reportData && reportData.detailResults && reportData.detailResults.length > 0) {
                    const detailResults: reportExcel['detailResult'] = reportData.detailResults;
                    detailResults.forEach(row => {
                        const recipientName: reportExcel['recipientName'] = row.invoice_recipient_name || row.bill_recipient_name;
                        const recipientTypeName: reportExcel['recipientTypeName'] = row.bill_recipient_type_name;

                        if (recipientName) {
                            row['Bill/Invoice Recipient'] = recipientName;
                        } else if (recipientTypeName) {
                            row['Bill/Invoice Recipient'] = recipientTypeName;
                        }
                        else {
                            delete row['Bill/Invoice Recipient']; // Delete the header if it's empty
                        }
                    });

                    const headerresult: reportExcel['headerresult'] = Object.keys(detailResults[0]);

                    const desiredOrder: reportExcel['desiredOrder'] = [
                        'resulttype',
                        'group_by_name',
                        'subgroup_by_name',
                        'Bill/Invoice Recipient',
                        'category',
                        'bill_recipient_name',
                        'invoice_recipient_name',
                        'bill_recipient_id',
                        'group_by_id',
                        'subgroup_by_id',
                        'invoice_recipient_id',
                        'billed_amount',
                        'check_amount',
                        'write_off_amount',
                        'balance_0_to_29_days',
                        'balance_30_to_59_days',
                        'balance_60_to_89_days',
                        'balance_90_to_119_days',
                        'balance_120_to_149_days',
                        'balance_150plusdays',
                        'total_outstanding_amount',
                    ];

                    const orderedHeader: reportExcel['orderedHeader'] = desiredOrder.filter(header => headerresult.includes(header));

                    orderedHeader.forEach(header => {
                        if (header === 'bill_recipient_type_name') {
                            header = 'Bill/Invoice Recipient'
                        }

                        if (header === 'balance_0_to_29_days') {
                            header = '30 Days'
                        }
                        if (header === 'balance_30_to_59_days') {
                            header = '60 Days'
                        }
                        if (header === 'balance_60_to_89_days') {
                            header = '90 Days'
                        }
                        if (header === 'balance_90_to_119_days') {
                            header = '120 Days'
                        }
                        if (header === 'balance_120_to_149_days') {
                            header = '150 Days'
                        }
                        if (header === 'balance_150plusdays') {
                            header = '150+ Days'
                        }
                        if (header === 'total_denied_amount') {
                            header = 'Total Outstanding Amount'
                        }
                        if (header === 'total_outstanding_amount') {
                            header = 'Bill/Invoice Total Outstanding'
                        }
                        if (header === 'billed_amount') {
                            header = 'Billed/Invoice Amount'
                        }
                        if (header === 'check_amount') {
                            header = 'Check Amount'
                        }
                        if (header === 'write_off_amount') {
                            header = 'Bill/Invoice Write Off'
                        }
                        if (header === 'group_by_name') {
                            headerName.push(groupByNameMapping[group_by_id]);
                        } else if (header === 'subgroup_by_name' && group_by_id !== null) {
                            headerName.push(groupByNameMapping[subgroup_by_id]);
                        } else if (!headerExclusions[reportType].includes(header)) {
                            headerName.push(header);
                        }
                    });



                    const dataRows = reportType === ReportType.Account_Receivable_Report ? [...reportData.detailResults, ...reportData.sumResults, ...reportData.PercentageResults] : [];

                    const filteredDataRows = dataRows.map(row => {
                        const newRow = {};
                        orderedHeader.forEach(header => {
                            if (row.hasOwnProperty(header)) {
                                newRow[header] = row[header];
                            }
                        });

                        // Remove columns based on header exclusions
                        Object.keys(newRow).forEach(header => {
                            if (headerExclusions[reportType]?.includes(header)) {
                                delete newRow[header]; // Exclude specified headers
                            }
                        });

                        return newRow; // Return the newly ordered row
                    });

                    const csvData = [headerName]?.concat(filteredDataRows.map((row) => Object.values(row)));
                    const csvContent = csvData.map((row) => row.map(value => {
                        if (typeof value === 'string' && value.includes(',')) {
                            return `"${value}"`;
                        }
                        return value;
                    }).join(",")).join("\n");
                    return csvContent;
                }
            }

            else if (reportType === ReportType.Payment_Summary_Report) {
                const { group_by_id, subgroup_by_id } = body;
                workSheetName = "PaymentSummaryReport";
                reportData = await reportService.getPaymentSummaryReport(body);
                // Create a new workbook and add a worksheet
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet(workSheetName);

                // Add headers to the worksheet
                const headers = Object.keys(reportData[0]);

                // Filter out the 'id_no' column from headers
                const filteredHeaders = headers?.filter((header?: string) => header !== 'id_no');

                // Rename two header names
                const renamedHeaders = filteredHeaders?.map((header?: string) => {
                    if (header === 'group_by_name') {
                        return `${groupByNameMapping[group_by_id]}`;
                    } else if (header === 'subgroup_by_name') {
                        return `${groupByNameMapping[subgroup_by_id]}`;
                    }
                    // Keep other headers unchanged
                    return header;
                });

                worksheet.addRow(renamedHeaders);

                // Add data to the worksheet, excluding 'id_no' column
                reportData.forEach((row?: string) => {
                    const rowData = filteredHeaders.map((header?: string) => {
                        const value = row[header];
                        return typeof value === 'string' ? value?.replace(/,/g, '') : value;
                    });
                    worksheet.addRow(rowData);
                });

                // Create CSV content with the renamed headers
                const csvData = [renamedHeaders].concat(reportData?.map((row?: string) => filteredHeaders?.map((header?: string) => {
                    const value = row[header];
                    return typeof value === 'string' ? value?.replace(/,/g, '') : value;
                })));

                const csvContent = csvData?.map(row => row.join(',')).join('\n');
                return csvContent;
            }
            else if (reportType === ReportType.Appointment_Status_Report) {
                workSheetName = "AppointmentStatusReport";
                reportData = await reportService.getStatusReport(body, true);
                // Create a new workbook and add a worksheet
                const workbook: ExcelJS.Workbook = new ExcelJS.Workbook();
                const worksheet: ExcelJS.Worksheet = workbook.addWorksheet(workSheetName);

                const excludedHeaders: string[] = ['group_by_qualifier', 'subgroup_by_qualifier'];
                const headers: string[] = Object.keys(reportData[0]).filter(header => !excludedHeaders.includes(header));
                worksheet.addRow(headers);

                // Add data to the worksheet, excluding 'id_no' and the excluded headers
                reportData.forEach((row) => {
                    const rowData: string[] = headers.map((header) => {
                        const value: string = row[header];
                        return typeof value === 'string' ? value?.replace(/,/g, '') : value;
                    });
                    worksheet.addRow(rowData);
                });

                // Create CSV content with the renamed headers
                const csvData: string[][] = [headers].concat(reportData.map((row) => headers.map((header) => {
                    const value: string = row[header];
                    return typeof value === 'string' ? value?.replace(/#/g, ' ').replace(/,/g, '') : value;
                })));


                const csvContent: string = csvData.map(row => row.join(',')).join('\n');

                return csvContent;
            }



            else if (reportType === ReportType.Appointment_Summary_Report) {
                const { view_by_id, group_by_id, subgroup_by_id } = body;
                workSheetName = "AppointmentSummaryReport";
                reportData = await reportService.getAppointmentSummaryReport(body);
                const columnNameForSummaryRow: string = 'Grand Total';
                let columnsToLeave: number = 0;

                // Create a new workbook and add a worksheet
                const workbook: ExcelJS.Workbook = new ExcelJS.Workbook();
                const worksheet: ExcelJS.Worksheet = workbook.addWorksheet(workSheetName);

                // Add headers to the worksheet
                const headers: string[] = Object.keys(reportData[0]);

                // Filter out the 'id_no', 'group_by_qualifier', and 'subgroup_by_qualifier' columns from headers
                const excludedHeaders: string[] = ['id_no', 'group_by_qualifier', 'subgroup_by_qualifier', 'facility_name'];
                if (group_by_id == GroupByID.Practice_Location && view_by_id) {
                    if (!subgroup_by_id) {
                        excludedHeaders.push("subgroup_by_name")
                    }
                }
                const filteredHeaders: string[] = headers?.filter((header) => !excludedHeaders.includes(header));
                // Rename headers, adjusting for the new logic
                const renamedHeaders: string[] = filteredHeaders?.map((header) => {
                    switch (header) {
                        case 'group_by_name':
                            return `${groupByNameMapping[group_by_id]}`;
                        case 'subgroup_by_name':
                            columnsToLeave += 1;
                            return `${groupByNameMapping[subgroup_by_id]}`;
                        case 'view_by_name':
                            columnsToLeave += 1;
                            return `${viewByNameMapping[view_by_id]}`;
                        case 'outside_referring':
                            return `Clinic`;
                        case 'facility_qualifier':
                            return `Practice`;
                        case 'outside_referring_address':
                            return `Clinic Address`;
                        case 'outside_fax':
                            return `Clinic Fax`;
                        case 'outside_phone':
                            return `Clinic Phone`;
                        default:
                            if (header.includes('facility')) {
                                return header.replace('facility', 'Practice');
                            }
                            return header;
                    }
                });
                worksheet.addRow(renamedHeaders);

                if (group_by_id == GroupByID.Practice_Location && view_by_id) {
                    reportData.forEach((row) => {
                        if (row.group_by_name) {
                            row.outside_referring = row.group_by_name
                            delete row.group_by_name
                        }
                    });
                }
                reportData.forEach((row) => {
                    const rowData: string[] = filteredHeaders.map((header) => {
                        const value: string = row[header];
                        return typeof value === 'string' ? value?.replace(/,/g, '') : value;
                    });
                    worksheet.addRow(rowData);
                });
                const dataRows: string[] = reportData.slice(0, -1); // All rows except the last one
                const summaryRow: SummaryRow = reportData[reportData.length - 1]; // Last row, which is the summary

                // Create CSV data without the excluded headers
                const csvData: string[][] = [renamedHeaders].concat(dataRows?.map((row) => filteredHeaders.map((header) => {
                    const value: string = row[header];
                    return typeof value === 'string' ? value?.replace(/,/g, '') : value;
                })));
                let summaryRowData: any = [];
                summaryRowData = [columnNameForSummaryRow];

                if (group_by_id == 25 && !view_by_id) {
                    summaryRowData = summaryRowData.concat(Array(8).fill(null));
                }
                summaryRowData = summaryRowData.concat([
                    summaryRow.totalVC,
                    summaryRow.totalNS,
                    summaryRow.totalSC,
                    summaryRow.grandTotal
                ]);

                summaryRowData.splice(1, 0, ...Array(columnsToLeave).fill(" "));
                csvData.push(summaryRowData);

                const csvContent: string = csvData?.map(row => row.join(',')).join('\n');
                return csvContent;
            }

            else {
                return "Invalid Report"
            }
        } catch (error) {
            throw error;
        }
    };
}

