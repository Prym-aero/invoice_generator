    const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
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


router.post('/generate-invoice', async (req, res) => {
    try {
        const { fileId, discountAmount, recipientsCount, preferredSerialNo } = req.body;

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
            if (!farmer.district || !farmer.acres) throw new Error("Missing district/acres");
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

            farmers.forEach((farmer, index) => {
                const isDiscounted = discountedIndices.has(index);
                const acres = parseFloat(farmer.acres) || 0;
                const originalAmount = (acres * region.ratePerAcre).toFixed(2);
                const finalAmount = isDiscounted
                    ? (originalAmount - discountAmount).toFixed(2)
                    : originalAmount;

                processedData.push({
                    serialNo: `${prefix}${currentNumber++}`,
                    farmerName: farmer.name || "",
                    farmerMobile: farmer.farmerMobile || "-",
                    city: farmer.city || "undefined",
                    district: farmer.district,
                    state: farmer.state || "maharashtra",
                    address: farmer.address || "udefined",
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

        // ---------- Create Excel with Section Headers ---------- //
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet([]);

        // Define styles for different elements
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } }, // Blue background
            alignment: { horizontal: "center", vertical: "center" }
        };

        const regionHeaderStyle = {
            font: { bold: true, size: 14, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "F2F2F2" } }, // Light gray background
            alignment: { horizontal: "center" }
        };

        const subHeaderStyle = {
            font: { italic: true, color: { rgb: "000000" } },
            alignment: { horizontal: "center" }
        };

        const columnHeaderStyle = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "D9E1F2" } }, // Light blue background
            alignment: { horizontal: "center" }
        };

        let rowIndex = 0;

        Object.entries(regions).forEach(([regionId, region]) => {
            const regionFarmers = processedData.filter(f => f.regionId === parseInt(regionId));
            if (regionFarmers.length === 0) return;

            // Region header with spacing
            xlsx.utils.sheet_add_aoa(ws, [
                [""], // Empty row for spacing
                [`${region.name} Region`],
                [`${regionFarmers.length} farmers | Rate: ₹${region.ratePerAcre} per acre`],
                [""] // Empty row for spacing
            ], {
                origin: { r: rowIndex, c: 0 }
            });

            // Apply styles to region headers
            ws[`A${rowIndex + 2}`] = { ...ws[`A${rowIndex + 2}`], s: regionHeaderStyle };
            ws[`A${rowIndex + 3}`] = { ...ws[`A${rowIndex + 3}`], s: subHeaderStyle };

            // Merge region header cells
            if (!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push(
                { s: { r: rowIndex + 1, c: 0 }, e: { r: rowIndex + 1, c: 11 } },
                { s: { r: rowIndex + 2, c: 0 }, e: { r: rowIndex + 2, c: 11 } }
            );

            rowIndex += 4;

            // Column headers with style
            const headers = [
                "Sr. No.", "Farmer Name", "Mobile", "City", "District", "State",
                "Address", "Acres", "Total Amount", "Discount", "Final Amount", "Invoice No"
            ];
            xlsx.utils.sheet_add_aoa(ws, [headers], { origin: { r: rowIndex, c: 0 } });

            // Apply style to column headers
            headers.forEach((_, colIndex) => {
                const cellAddress = xlsx.utils.encode_cell({ r: rowIndex, c: colIndex });
                ws[cellAddress] = { ...ws[cellAddress], s: columnHeaderStyle };
            });

            rowIndex++;

            // Farmer rows
            regionFarmers.forEach(f => {
                const row = [
                    f.serialNo,
                    f.farmerName,
                    f.farmerMobile,
                    f.city,
                    f.district,
                    f.state,
                    f.address,
                    f.acres,
                    `₹${f.originalAmount}`,
                    f.discount === 'No' ? '-' : `-₹${discountAmount}`,
                    `₹${f.finalAmount}`,
                    f.invoiceNo
                ];
                xlsx.utils.sheet_add_aoa(ws, [row], { origin: { r: rowIndex, c: 0 } });
                rowIndex++;
            });

            rowIndex += 2; // Extra spacing after each region
        });

        // Set column widths
        ws['!cols'] = [
            { wch: 10 },  // Sr. No.
            { wch: 25 },  // Farmer Name
            { wch: 15 },  // Mobile
            { wch: 15 },  // City
            { wch: 18 },  // District
            { wch: 15 },  // State
            { wch: 25 },  // Address
            { wch: 8 },   // Acres
            { wch: 15 },  // Total Amount
            { wch: 12 },  // Discount
            { wch: 15 },  // Final Amount
            { wch: 25 }   // Invoice No
        ];

        // Freeze header row
        ws['!freeze'] = { xSplit: 0, ySplit: 1 };

        xlsx.utils.book_append_sheet(wb, ws, 'Invoices');

        const excelBuffer = Buffer.from(
            xlsx.write(wb, { type: 'binary', bookType: 'xlsx' }),
            'binary'
        );

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
                regionWiseStats: getRegionStats(processedData)
            },
            metadata: {
                generatedAt: new Date(),
                discountApplied: discountAmount,
                recipientsPerDivision: recipientsCount,
                preferredSerialNo: req.body.preferredSerialNo || null
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
                regionWiseStats: getRegionStats(processedData)
            }
        });

    } catch (error) {
        console.error('Invoice generation error:', error);
        res.status(500).json({ error: error.message || 'Invoice generation failed' });
    }
});

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
                totalDiscount: 0
            };
        }
        stats[farmer.regionId].totalFarmers++;
        stats[farmer.regionId].totalAmount += parseFloat(farmer.finalAmount);
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