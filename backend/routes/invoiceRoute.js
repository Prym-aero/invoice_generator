/*

*/

const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const File = require('../models/FileModel');
const { parseSerialNumber, distributeAcres, excelToJsonFarmer, generateExcelWithExcelJS } = require('../utils/helpFunctions');
const { getProcessedData, divideBySet } = require('../utils/processData');
const { v4: uuidv4 } = require('uuid');









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


        let farmerData = await excelToJsonFarmer(fileDoc.farmersFile.data); // 

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



        const getProcessedDatas = getProcessedData(farmersByRegion, regions, recipientsCount, distributeAcres, acresDivision, prefix, currentNumber, discountAmount);

        const processedData = getProcessedDatas.processedData;
        let totalDiscountedFarmers = getProcessedDatas.totalDiscountedFarmers;


        // Object.entries(farmersByRegion).forEach(([regionId, farmers]) => {  // farmersByRegion, regions, recipientsCount, acresDivision, prefix, currentNumber, discountAmount
        //     const region = regions[regionId];
        //     const discountedIndices = new Set();
        //     const discountCount = Math.min(recipientsCount, farmers.length);
        //     totalDiscountedFarmers += discountCount;

        //     while (discountedIndices.size < discountCount) {
        //         const randomIndex = Math.floor(Math.random() * farmers.length);
        //         discountedIndices.add(randomIndex);
        //     }

        //     // Get acres for this region from acresDivision (0-based index)
        //     const regionIndex = parseInt(regionId) - 1;
        //     const totalRegionAcres = acresDivision[regionIndex] || 0;
        //     const distributedAcres = distributeAcres(farmers.length, totalRegionAcres);

        //     farmers.forEach((farmer, index) => {
        //         const isDiscounted = discountedIndices.has(index);
        //         const acres = distributedAcres[index];
        //         const originalAmount = (acres * region.ratePerAcre).toFixed(2);
        //         const finalAmount = isDiscounted
        //             ? (originalAmount - discountAmount).toFixed(2)
        //             : originalAmount;

        //         processedData.push({
        //             serialNo: `${prefix}${currentNumber++}`,
        //             farmerName: farmer.name || "",
        //             farmerMobile: farmer.farmerMobile || "-",
        //             city: farmer.city || "--",
        //             district: farmer.district,
        //             state: farmer.state || "maharashtra",
        //             address: farmer.address || "--",
        //             acres,
        //             region: region.name,
        //             regionId: parseInt(regionId),
        //             ratePerAcre: region.ratePerAcre,
        //             originalAmount,
        //             discount: isDiscounted ? `₹${discountAmount}` : 'No',
        //             finalAmount,
        //             invoiceNo: `INV-${Date.now().toString().padStart(4, '0').slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
        //         });
        //     });
        // });

        // Create Excel with ExcelJS

        const excelBuffer = await generateExcelWithExcelJS(regions, processedData, discountAmount);

        fileDoc.processedFile = {
            data: excelBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        fileDoc.processedFarmerData = {
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

