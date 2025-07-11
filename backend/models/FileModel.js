// models/FileModel.js
const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  // Metadata only — not raw data
  farmerFileName: String,
  pilotFileName: String,
  processedFileName: String, // Optional: if you're storing exported Excel
  filePaths: {
    farmer: String, // e.g. path to uploaded file or GridFS reference
    pilot: String,
    processedFile: {
      path: String,
      contentType: String,
    },
  },
  totals: {
    farmers: Number,
    acres: Number,
    pilots: Number
  },
  dispatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DispatchRecord"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("File", FileSchema);
