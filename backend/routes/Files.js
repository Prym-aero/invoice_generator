const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const File = require('../models/FileModel');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const farmers = [];
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => farmers.push(data))
      .on('end', async () => {
        let totalAcres = 0;
        farmers.forEach(f => totalAcres += parseFloat(f.acres || 0));

        const fileDoc = new File({
          originalFile: {
            data: req.file.buffer,
            contentType: req.file.mimetype
          },
          totals: {
            farmers: farmers.length,
            acres: totalAcres
          }
        });

        await fileDoc.save();
        res.status(200).json({ id: fileDoc._id, totalFarmers: farmers.length, totalAcres });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.get('/download/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || !file.processedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set proper headers for file download
    res.set({
      'Content-Type': file.processedFile.contentType,
      'Content-Disposition': `attachment; filename=invoices_${file._id}.xlsx`
    });

    // Send the file buffer
    res.send(file.processedFile.data);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});


module.exports = router;
