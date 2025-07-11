const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require('path')
const fs = require('fs')
const File = require("../models/FileModel");
const DispatchRecord = require('../models/DispatchRecord');
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

router.post(
  "/upload",
  upload.fields([
    { name: "farmersFile", maxCount: 1 },
    { name: "pilotsFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const farmersFile = req.files.farmersFile?.[0];
      const pilotsFile = req.files.pilotsFile?.[0];
      const state = req.body.state;

      if (!farmersFile || !pilotsFile) {
        return res.status(400).json({ message: "Both farmersFile and pilotsFile are required." });
      }

      // Read Excel files from disk (not memory)
      const farmers = await excelToJsonFarmer(farmersFile.path);
      const pilots = await excelToJsonPilots(pilotsFile.path);

      const totalFarmers = farmers.length;
      const totalAcres = farmers.reduce((acc, f) => acc + parseFloat(f.acres || 0), 0);
      const totalPilots = pilots.length;

      const fileDoc = await File.create({
        farmerFileName: farmersFile.originalname,
        pilotFileName: pilotsFile.originalname,
        filePaths: {
          farmer: farmersFile.path,
          pilot: pilotsFile.path,
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
        message: "Files uploaded successfully",
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

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
