const express = require("express");
const router = express.Router();
const multer = require("multer");
const File = require("../models/FileModel");
const DispatchRecord = require('../models/DispatchRecord');
const { excelToJsonFarmer, excelToJsonPilots } = require("../utils/helpFunctions");

const upload = multer({ storage: multer.memoryStorage() });

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

      console.log('Received files:', req.files);
      console.log('Received body:', req.body);


      if (!farmersFile || !pilotsFile) {
        return res
          .status(400)
          .json({ message: "Both farmersFile and pilotsFile are required." });
      }

      // Parse the files
      const farmers = await excelToJsonFarmer(farmersFile.buffer);
      const pilots = await excelToJsonPilots(pilotsFile.buffer);

      const totalFarmers = farmers.length;
      const totalAcres = farmers.reduce(
        (acc, f) => acc + parseFloat(f.acres || 0),
        0
      );
      const totalPilots = pilots.length;

      // Save metadata (not full buffers to avoid MongoDB size limits)
      const fileDoc = await File.create({
        farmerFileName: farmersFile.originalname,
        pilotFileName: pilotsFile.originalname,
        totals: {
          farmers: totalFarmers,
          acres: totalAcres,
          pilots: totalPilots,
        },
        filePaths: {
          farmer: farmersFile.buffer, // you're storing in memory for now
          pilot: pilotsFile.buffer,
        },
        farmersFile: {
          data: farmersFile.buffer,
          contentType: farmersFile.mimetype,
        },
        pilotsFile: {
          data: pilotsFile.buffer,
          contentType: pilotsFile.mimetype,
        },
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
      res.status(500).json({ message: err.message || "Upload failed" });

    }
  }
);

// Download route (optional: keep if you plan Excel export)
router.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || !file.filePaths.processedFile) {
      return res.status(404).json({ error: "Processed file not found" });
    }

    res.set({
      "Content-Type": file.filePaths.processedFile.contentType,
      "Content-Disposition": `attachment; filename="farmers_data_${file._id}.xlsx"`,
      "Content-Length": file.filePaths.processedFile.data.length
    });

    res.send(file.filePaths.processedFile.data);
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
