const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  originalFile: {
    data: Buffer,      // Stores original file binary
    contentType: String // MIME type (e.g., 'text/csv')
  },
  processedFile: {
    data: Buffer,      // Stores processed CSV binary
    contentType: String
  },
  processedData: {
    invoices: Array,
    stats: Object,
    metadata: Object
  },
  totals: {
    farmers: Number,
    acres: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);