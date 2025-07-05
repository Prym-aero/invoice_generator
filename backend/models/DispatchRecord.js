// models/DispatchRecord.js
const mongoose = require("mongoose");

const DispatchRecordSchema = new mongoose.Schema({
  fileRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File"
  },
  processedData: Array, // farmers with assigned crop, pilot, date
  stats: {
    totalFarmers: Number,
    totalAcres: Number,
    cropSplit: Object,
    landCategorySplit: Object,
    productUseSplit: Object,
  },
  metadata: {
    dateRange: {
      start: Date,
      end: Date
    },
    cropConfig: Array,
    landSplit: Object,
    productSplit: Object,
    assignedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("DispatchRecord", DispatchRecordSchema);
