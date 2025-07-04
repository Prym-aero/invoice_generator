const express = require("express");
const router = express.Router();
const File = require("../models/FileModel");
const DispatchRecord = require("../models/DispatchRecord");
const { generateDispatchData } = require("../utils/dispatchGenerator");
const { excelToJsonFarmer, excelToJsonPilots, generateExcelWithExcelJS } = require("../utils/helpFunctions");


router.post("/generate", async (req, res) => {
    try {
        const { fileId, totalBudget, rate, district, numberOfFarmers, crops,
            landSizePercentages, productUsePercentages, dateRange, startSerial } = req.body;



        // Validate inputs more thoroughly
        if (!fileId || !district || !numberOfFarmers) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!Array.isArray(crops) || crops.length === 0) {
            return res.status(400).json({ error: "Invalid crops configuration" });
        }

        const fileDoc = await File.findById(fileId);
        if (!fileDoc) return res.status(404).json({ error: "File not found" });

        // Convert Excel to JSON with error handling
        let farmers, pilots;
        try {
            farmers = await excelToJsonFarmer(fileDoc.filePaths.farmer);
            pilots = await excelToJsonPilots(fileDoc.filePaths.pilot);
        } catch (parseError) {
            console.error("Excel parsing failed:", parseError);
            return res.status(500).json({ error: "Failed to parse uploaded files" });
        }

        if (!farmers || !Array.isArray(farmers)) {
            return res.status(500).json({ error: "Invalid farmers data" });
        }

        if (!pilots || !Array.isArray(pilots)) {
            return res.status(500).json({ error: "Invalid pilots data" });
        }

        // Generate dispatch data with validation
        const processedData = generateDispatchData({
            farmers,
            pilots,
            totalBudget,
            rate,
            district,
            numberOfFarmers,
            crops,
            landSizePercentages,
            productUsePercentages,
            dateRange,
            startSerial
        });

        console.log(processedData);




        if (!processedData || !Array.isArray(processedData)) {
            return res.status(500).json({ error: "Data generation returned invalid format" });
        }

        const excelBuffer = await generateExcelWithExcelJS(processedData);

        

        // Create dispatch record with size validation
        try {
            const dispatch = await DispatchRecord.create({
                fileRef: fileDoc._id,
                processedData: processedData, // Limit stored data if needed
                stats: {
                    totalFarmers: processedData.length,
                    totalAcres: processedData.reduce((a, b) => a + (b.acres || 0), 0),
                    cropSplit: crops.reduce((acc, crop) => {
                        acc[crop.name] = processedData.filter(f => f.cropType === crop.name).length;
                        return acc;
                    }, {}),
                    landCategorySplit: landSizePercentages,
                    productUseSplit: productUsePercentages
                },
                metadata: {
                    cropConfig: crops,
                    landSplit: landSizePercentages,
                    productSplit: productUsePercentages,
                    dateRange,
                    assignedAt: new Date()
                }
            });

            fileDoc.dispatchId = dispatch._id;

            fileDoc.filePaths.processedFile = {
                data: excelBuffer,
                contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }


            await fileDoc.save();

            // Respond with success and sample data
            res.json({
                success: true,
                dispatchId: dispatch._id,
                stats: dispatch.stats,
                sampleData: processedData // Send just a sample
            });

        } catch (dbError) {
            console.error("Database save failed:", dbError);
            if (dbError.message.includes('BSON size')) {
                return res.status(413).json({
                    error: "Data too large",
                    suggestion: "Try with fewer farmers or implement pagination"
                });
            }
            return res.status(500).json({ error: "Database operation failed" });
        }

    } catch (err) {
        console.error("Dispatch generation failed:", err);
        res.status(500).json({
            error: "Failed to generate dispatch",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router;
