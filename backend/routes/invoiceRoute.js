/*

*/

const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const File = require('../models/FileModel');
const { v4: uuidv4 } = require('uuid');

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

router.post('/generate-invoice', async (req, res) => {
    try {
        const { fileId, discountAmount, recipientsCount, preferredSerialNo, acresDivision } = req.body;

        // Validate acresDivision
        if (!Array.isArray(acresDivision) || acresDivision.length !== 5) {
            return res.status(400).json({ error: 'acresDivision must be an array of 5 numbers (one for each region)' });
        }

        const regions = {
            1: { name: "Konkan", ratePerAcre: 500 },
            2: { name: "Western Maharashtra", ratePerAcre: 400 },
            3: { name: "Marathwada", ratePerAcre: 350 },
            4: { name: "North Maharashtra", ratePerAcre: 300 },
            5: { name: "Vidarbha", ratePerAcre: 450 }
        };

        const { prefix, number } = parseSerialNumber(preferredSerialNo);
        let currentNumber = number;

        const fileDoc = await File.findById(fileId);
        if (!fileDoc) return res.status(404).json({ error: 'File not found' });

        const workbook = xlsx.read(fileDoc.originalFile.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        let farmerData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        farmerData = farmerData.map(farmer => {
            if (!farmer.district) throw new Error("Missing district");
            return farmer;
        });

        const farmersByRegion = {};
        farmerData.forEach(farmer => {
            const regionId = getRegionByDistrict(farmer.district);
            if (!farmersByRegion[regionId]) farmersByRegion[regionId] = [];
            farmersByRegion[regionId].push(farmer);
        });

        const processedData = [];
        let totalDiscountedFarmers = 0;

        Object.entries(farmersByRegion).forEach(([regionId, farmers]) => {
            const region = regions[regionId];
            const discountedIndices = new Set();
            const discountCount = Math.min(recipientsCount, farmers.length);
            totalDiscountedFarmers += discountCount;

            while (discountedIndices.size < discountCount) {
                const randomIndex = Math.floor(Math.random() * farmers.length);
                discountedIndices.add(randomIndex);
            }

            // Get acres for this region from acresDivision (0-based index)
            const regionIndex = parseInt(regionId) - 1;
            const totalRegionAcres = acresDivision[regionIndex] || 0;
            const distributedAcres = distributeAcres(farmers.length, totalRegionAcres);

            farmers.forEach((farmer, index) => {
                const isDiscounted = discountedIndices.has(index);
                const acres = distributedAcres[index];
                const originalAmount = (acres * region.ratePerAcre).toFixed(2);
                const finalAmount = isDiscounted
                    ? (originalAmount - discountAmount).toFixed(2)
                    : originalAmount;

                processedData.push({
                    serialNo: `${prefix}${currentNumber++}`,
                    farmerName: farmer.name || "",
                    farmerMobile: farmer.farmerMobile || "-",
                    city: farmer.city || "--",
                    district: farmer.district,
                    state: farmer.state || "maharashtra",
                    address: farmer.address || "--",
                    acres,
                    region: region.name,
                    regionId: parseInt(regionId),
                    ratePerAcre: region.ratePerAcre,
                    originalAmount,
                    discount: isDiscounted ? `₹${discountAmount}` : 'No',
                    finalAmount,
                    invoiceNo: `INV-${Date.now().toString().padStart(4, '0').slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
                });
            });
        });

        // Create Excel with ExcelJS
        const excelBuffer = await generateExcelWithExcelJS(regions, processedData, discountAmount);

        fileDoc.processedFile = {
            data: excelBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        fileDoc.processedData = {
            invoices: processedData,
            stats: {
                totalFarmers: processedData.length,
                discountedFarmers: totalDiscountedFarmers,
                totalDiscountAmount: calculateTotalDiscount(processedData, discountAmount),
                regionWiseStats: getRegionStats(processedData),
                totalAcres: acresDivision.reduce((a, b) => a + b, 0).toFixed(2)
            },
            metadata: {
                generatedAt: new Date(),
                discountApplied: discountAmount,
                recipientsPerDivision: recipientsCount,
                preferredSerialNo: req.body.preferredSerialNo || null,
                acresDivision
            }
        };
        await fileDoc.save();

        res.json({
            success: true,
            downloadUrl: `/download/${fileDoc._id}`,
            invoices: processedData,
            stats: {
                totalFarmers: processedData.length,
                discountedFarmers: totalDiscountedFarmers,
                totalDiscountAmount: calculateTotalDiscount(processedData, discountAmount),
                regionWiseStats: getRegionStats(processedData),
                totalAcres: acresDivision.reduce((a, b) => a + b, 0).toFixed(2)
            }
        });

    } catch (error) {
        console.error('Invoice generation error:', error);
        res.status(500).json({ error: error.message || 'Invoice generation failed' });
    }
});

// ExcelJS Generation Function
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
                farmer.city,
                farmer.district,
                farmer.state,
                farmer.address,
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

// --- Helpers ---
function getRegionByDistrict(district) {
    const districtMap = {
        "Mumbai": 1, "Thane": 1, "Raigad": 1, "Ratnagiri": 1, "Sindhudurg": 1,
        "Pune": 2, "Satara": 2, "Sangli": 2, "Kolhapur": 2, "Solapur": 2,
        "Aurangabad": 3, "Jalna": 3, "Parbhani": 3, "Hingoli": 3, "Nanded": 3,
        "Latur": 3, "Osmanabad": 3, "Beed": 3,
        "Nashik": 4, "Dhule": 4, "Jalgaon": 4, "Ahmednagar": 4,
        "Nagpur": 5, "Amravati": 5, "Wardha": 5, "Yavatmal": 5,
        "Akola": 5, "Washim": 5, "Buldhana": 5, "Chandrapur": 5,
        "Gadchiroli": 5, "Bhandara": 5, "Gondia": 5
    };
    return districtMap[district] || 1;
}

function getRegionStats(data) {
    const stats = {};
    data.forEach(farmer => {
        if (!stats[farmer.regionId]) {
            stats[farmer.regionId] = {
                name: farmer.region,
                totalFarmers: 0,
                totalAmount: 0,
                totalDiscount: 0,
                totalAcres: 0
            };
        }
        stats[farmer.regionId].totalFarmers++;
        stats[farmer.regionId].totalAmount += parseFloat(farmer.finalAmount);
        stats[farmer.regionId].totalAcres += parseFloat(farmer.acres);
        if (farmer.discount !== 'No') {
            stats[farmer.regionId].totalDiscount += parseFloat(farmer.discount.replace('₹', ''));
        }
    });
    return stats;
}

function calculateTotalDiscount(data, discountAmount) {
    return data.reduce((sum, farmer) => {
        return farmer.discount !== 'No' ? sum + parseFloat(discountAmount) : sum;
    }, 0).toFixed(2);
}

// Add this new route to your existing file
router.post('/get-single-invoice', async (req, res) => {
    try {
        const { fileId, division, serialNo } = req.body;

        const fileDoc = await File.findById(fileId);
        if (!fileDoc) return res.status(404).json({ error: 'File not found' });

        // Find the specific invoice
        const invoice = fileDoc.processedData.invoices.find(
            inv => inv.regionId === parseInt(division) && inv.serialNo === serialNo
        );

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json({
            success: true,
            invoice
        });

    } catch (error) {
        console.error('Single invoice error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch invoice' });
    }
});

module.exports = router;

