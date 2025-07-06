const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
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

const excelToJsonFarmer = async (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const properData = jsonData.map((farmer) => {
    return {
      name: farmer.farmer_name,
      mobile: farmer.mobile_number,
      acres: farmer.landholding_acres, // ← you missed `farmer.` here
      state: farmer.state,
      district: farmer.district.trim(),
      taluka: farmer.taluka_or_city,
      pincode: farmer.pincode
    };
  });

  console.log(properData);

  return properData;
}



const excelToJsonPilots = async (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const pilots = jsonData.map((data) => ({
    name: data['Drone_Pilot_Name'],
    district: data['District'],
    assignedTalukas:
      data["Taluka"]
        .split("/")
        .map(t => t.trim())
        .filter(Boolean)
  }));





  return pilots;
}

async function generateExcelWithExcelJS(processedData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Farmers Data');

  // Define styles
  const styles = {
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
    }
  };

  // Set column widths and headers
  worksheet.columns = [
    { header: 'Sr. No.', key: 'serialNumber', width: 8 },
    { header: 'Farmer Name', key: 'name', width: 25 },
    { header: 'Mobile', key: 'mobile', width: 15 },
    { header: 'Taluka_Or_City', key: 'taluka', width: 15 },
    { header: 'District', key: 'district', width: 18 },
    { header: 'State', key: 'state', width: 15 },
    { header: 'Pincode', key: 'pincode', width: 18 },
    { header: 'Acres', key: 'acres', width: 10 },
    { header: 'Crop', key: 'crop', width: 10 },
    { header: 'usedb medicine', key: 'used_medicine', width: 12 },
    { header: 'Pilot', key: 'assignedPilot', width: 18 },
    { header: 'Date', key: 'scheduledDate', width: 18 },
    { header: 'Rate', key: 'perRate', width: 13 },
    { header: 'Total Cost', key: 'totalCost', width: 14 },

  ];

  // Add column headers
  const headerRow = worksheet.getRow(1);
  headerRow.height = 20;
  headerRow.eachCell(cell => {
    cell.style = styles.columnHeader;
  });

  // Add farmer data
  processedData.forEach((farmer, index) => {
    const row = worksheet.addRow([
      index + 1, // Sr. No.
      farmer.name || '',
      farmer.mobile || '',
      farmer.taluka || '',
      farmer.district || '',
      farmer.state || '',
      farmer.pincode || '',
      farmer.acres || 0,
      farmer.crop || '',
      farmer.used_medicine.join(", ") || [],
      farmer.assignedPilot || "Unassigned",
      farmer.scheduledDate || "Unscheduled",
      farmer.perRate || 400,
      farmer.totalCost || "",
    ]);

    // Apply styles to each cell
    row.eachCell((cell, colNumber) => {
      if ([1, 3, 8].includes(colNumber)) { // Sr. No., Mobile, Acres
        cell.style = styles.centerAlignedCell;
      } else if (colNumber === 8) { // Acres (numeric)
        cell.style = styles.numberCell;
      } else {
        cell.style = styles.dataCell;
      }
    });
  });

  // Freeze the header row
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];

  // Add autofilter to headers
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length }
  };

  // Return the Excel buffer
  return await workbook.xlsx.writeBuffer();
}



module.exports = { parseSerialNumber, distributeAcres, excelToJsonFarmer, generateExcelWithExcelJS, excelToJsonPilots };
