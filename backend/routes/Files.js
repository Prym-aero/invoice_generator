const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require('path')
const fs = require('fs')
const File = require("../models/FileModel");
const DispatchRecord = require('../models/DispatchRecord');
const axios = require('axios');
const xlsx = require('xlsx');
const { excelToJsonFarmer, excelToJsonPilots } = require("../utils/helpFunctions");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

async function downloadAndParseCsv(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const workbook = xlsx.read(response.data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

router.post("/upload", async (req, res) => {
  try {
    const { farmerFileUrl, pilotFileUrl, state } = req.body;

    if (!farmerFileUrl || !pilotFileUrl) {
      return res.status(400).json({ message: "Both farmerFileUrl and pilotFileUrl are required." });
    }

    const farmers = await excelToJsonFarmer(farmerFileUrl);
    const pilots = await excelToJsonPilots(pilotFileUrl);

    const totalFarmers = farmers.length;
    const totalAcres = farmers.reduce((acc, f) => acc + parseFloat(f.acres || 0), 0);
    const totalPilots = pilots.length;

    const fileDoc = await File.create({
      farmerFileName: farmerFileUrl,
      pilotFileName: pilotFileUrl,
      filePaths: {
        farmer: farmerFileUrl,
        pilot: pilotFileUrl,
      },
      totals: {
        farmers: totalFarmers,
        acres: totalAcres,
        pilots: totalPilots,
      }
    });

    res.status(200).json({
      success: true,
      id: fileDoc._id,
      farmersData: farmers,
      pilotsData: pilots,
      totalFarmers,
      totalAcres,
      totalPilots,
      message: "Files uploaded & parsed successfully",
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Failed to process upload" });
  }
});

router.post('/uploadMultiple', async (req, res) => {
  try {
    const { farmerUrls, pilotUrl, state } = req.body;

    if (!farmerUrls || !pilotUrl) {
      return res.status(400).json({ message: "farmerUrls and pilotUrl are required" });
    }

    let allFarmersData = [];
    for (const url of farmerUrls) {
      const chunkData = await downloadAndParseCsv(url);
      allFarmersData = allFarmersData.concat(chunkData);
    }

    const pilotsData = await downloadAndParseCsv(pilotUrl);

    const totalFarmers = allFarmersData.length;
    const totalAcres = allFarmersData.reduce((acc, f) => acc + parseFloat(f.acres || 0), 0);
    const totalPilots = pilotsData.length;

    const fileDoc = await File.create({
      farmerFileNames: farmerUrls, // ⬅️ array of URLs
      pilotFileName: pilotUrl,     // ⬅️ single URL
      filePaths: {
        farmer: farmerUrls,        // ⬅️ array
        pilot: pilotUrl,
      },
      totals: {
        farmers: totalFarmers,
        acres: totalAcres,
        pilots: totalPilots,
      },
      state, // optionally save state if needed
    });

    await fileDoc.save();

    return res.json({
      success: true,
      id: fileDoc._id,
      farmersData: allFarmersData,
      pilotsData,
      totalFarmers,
      totalAcres,
      totalPilots,
    });
  } catch (error) {
    console.error("Error in /uploadMultiple:", error);
    res.status(500).json({ message: "Failed to process uploaded files" });
  }
});

// Download route (optional: keep if you plan Excel export)
router.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    const processed = file?.filePaths?.processedFile;

    if (!processed || !processed.path || !fs.existsSync(processed.path)) {
      return res.status(404).json({ error: "Processed file not found" });
    }

    const fileName = `farmers_data_${file._id}.xlsx`;
    res.download(processed.path, fileName); // Automatically sets content-type and headers
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

// Danger: Dev only — delete all
router.delete("/deleteAll", async (req, res) => {
  try {
    const result = await File.deleteMany({});
    const result2 = await DispatchRecord.deleteMany({});
    res.status(200).json({
      message: `${result.deletedCount} files deleted successfully`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete all files" });
  }
});

module.exports = router;
