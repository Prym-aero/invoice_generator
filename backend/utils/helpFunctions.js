const xlsx = require('xlsx');
function parseSerialNumber(input) {
  if (!input) return { prefix: 'SR', number: 10000 }; // Default

  // Extract letters (prefix) and numbers separately
  const letters = input.replace(/\d/g, '');
  const numbers = input.replace(/\D/g, '');

  return {
    prefix: letters || 'SR', // Use extracted letters or default to 'SR'
    number: numbers ? parseInt(numbers) : 10000
  };
}

// New helper function for acre distribution
function distributeAcres(numFarmers, totalAcres) {
  if (numFarmers === 0 || totalAcres === 0) return new Array(numFarmers).fill(0);

  const weights = Array.from({ length: numFarmers }, () => Math.random() + 0.1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  let distributed = weights.map(weight => (weight / totalWeight) * totalAcres);
  distributed = distributed.map(a => parseFloat(a.toFixed(2)));

  const currentSum = distributed.reduce((sum, a) => sum + a, 0);
  const difference = parseFloat((totalAcres - currentSum).toFixed(2));

  if (difference !== 0) {
    const maxIndex = distributed.indexOf(Math.max(...distributed));
    distributed[maxIndex] = parseFloat((distributed[maxIndex] + difference).toFixed(2));
  }

  return distributed.map(a => Math.max(0.1, a)); // Minimum 0.1 acres per farmer
}

// this fuction is used to convert excel file to json
const excelToJson = async (fileBuffer, region = "Marathwada", district = "Aurangabad") => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  console.log("jsonData:", jsonData.slice(0, 5)); // Log first 5 rows for debugging

  let filteredData = [];

  if (region !== "" && district !== "") {
    filteredData = jsonData.filter(row =>
      row.region?.toLowerCase() === region.toLowerCase() &&
      row.district?.toLowerCase() === district.toLowerCase()
    );
  } else if (region !== "") {
    filteredData = jsonData.filter(row =>
      row.region?.toLowerCase() === region.toLowerCase()
    );
  } else {
    filteredData = jsonData;
  }

  return filteredData;
};

async function generateExcelWithExcelJS(regions, processedData, discountAmount) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoices');

  // Define styles
  const styles = {
    regionHeader: {
      font: { name: 'Calibri', size: 14, bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
      alignment: { horizontal: 'center', vertical: 'middle' }
    },
    subHeader: {
      font: { name: 'Calibri', size: 12, italic: true },
      alignment: { horizontal: 'center', vertical: 'middle' }
    },
    columnHeader: {
      font: { name: 'Calibri', size: 11, bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    },
    dataCell: {
      font: { name: 'Calibri', size: 11 },
      alignment: { vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
      }
    },
    numberCell: {
      font: { name: 'Calibri', size: 11 },
      alignment: { horizontal: 'right', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
      },
      numFmt: '#,##0.00'
    },
    centerAlignedCell: {
      font: { name: 'Calibri', size: 11 },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
      }
    },
    currencyCell: {
      font: { name: 'Calibri', size: 11 },
      alignment: { horizontal: 'right', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
      },
      numFmt: '"₹"#,##0.00'
    }
  };

  let rowIndex = 1;
  const headerRows = [];

  // Set column widths
  worksheet.columns = [
    { header: 'Sr. No.', key: 'serialNo', width: 8 },
    { header: 'Farmer Name', key: 'farmerName', width: 25 },
    { header: 'Mobile', key: 'farmerMobile', width: 15 },
    { header: 'City', key: 'city', width: 15 },
    { header: 'District', key: 'district', width: 18 },
    { header: 'State', key: 'state', width: 15 },
    { header: 'Address', key: 'address', width: 40 },
    { header: 'Acres', key: 'acres', width: 10 },
    { header: 'Total Amount', key: 'originalAmount', width: 15 },
    { header: 'Discount', key: 'discount', width: 12 },
    { header: 'Final Amount', key: 'finalAmount', width: 15 },
    { header: 'Invoice No', key: 'invoiceNo', width: 25 }
  ];

  Object.entries(regions).forEach(([regionId, region]) => {
    const regionFarmers = processedData.filter(f => f.regionId === parseInt(regionId));
    if (regionFarmers.length === 0) return;

    // Add region header
    const regionHeaderRow = worksheet.addRow([`${region.name} Region`]);
    regionHeaderRow.height = 24;
    worksheet.mergeCells(`A${rowIndex}:L${rowIndex}`);
    regionHeaderRow.eachCell(cell => {
      cell.style = styles.regionHeader;
    });

    rowIndex++;

    // Add subheader
    const subHeaderRow = worksheet.addRow([`${regionFarmers.length} farmers | Rate: ₹${region.ratePerAcre} per acre`]);
    subHeaderRow.height = 20;
    worksheet.mergeCells(`A${rowIndex}:L${rowIndex}`);
    subHeaderRow.eachCell(cell => {
      cell.style = styles.subHeader;
    });

    rowIndex++;

    // Add empty row
    worksheet.addRow([]);
    rowIndex++;

    // Add column headers
    const headerRow = worksheet.addRow([
      'Sr. No.', 'Farmer Name', 'Mobile', 'City', 'District', 'State',
      'Address', 'Acres', 'Total Amount', 'Discount', 'Final Amount', 'Invoice No'
    ]);
    headerRow.height = 20;
    headerRow.eachCell(cell => {
      cell.style = styles.columnHeader;
    });
    headerRows.push(rowIndex);
    rowIndex++;

    // Add farmer data
    regionFarmers.forEach(farmer => {
      const row = worksheet.addRow([
        farmer.serialNo,
        farmer.farmerName,
        farmer.farmerMobile,
        farmer.address,
        farmer.city,
        farmer.district,
        farmer.state,
        farmer.acres,
        farmer.originalAmount,
        farmer.discount === 'No' ? '-' : -discountAmount,
        farmer.finalAmount,
        farmer.invoiceNo
      ]);

      // Apply styles to each cell
      row.eachCell((cell, colNumber) => {
        if ([1, 3, 8].includes(colNumber)) { // Sr. No., Mobile, Acres
          cell.style = styles.centerAlignedCell;
        } else if ([8, 9, 10, 11].includes(colNumber)) { // Numeric columns
          if (colNumber === 10 && cell.value === '-') {
            cell.style = styles.centerAlignedCell;
          } else if ([9, 11].includes(colNumber)) {
            cell.style = styles.currencyCell;
          } else {
            cell.style = styles.numberCell;
          }
        } else {
          cell.style = styles.dataCell;
        }
      });
      rowIndex++;
    });

    // Add empty rows after region
    worksheet.addRow([]);
    worksheet.addRow([]);
    rowIndex += 2;
  });

  // Freeze the first header row
  if (headerRows.length > 0) {
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: headerRows[0], activeCell: 'A1' }
    ];
  }

  // Add autofilter to each region's headers
  headerRows.forEach(row => {
    worksheet.autoFilter = {
      from: { row: row, column: 1 },
      to: { row: row, column: 12 }
    };
  });

  // Return the Excel buffer
  return await workbook.xlsx.writeBuffer();
}



module.exports = { parseSerialNumber, distributeAcres, excelToJson, generateExcelWithExcelJS };
