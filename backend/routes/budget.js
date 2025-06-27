const express = require('express');
const router = express.Router();

const divideBudget = require('../utils/divideBudget');

router.post('/budget', async (req, res) => {
  const { totalBudget } = req.body;
  if (!totalBudget || totalBudget <= 5) {
    return res.status(400).json({ message: 'Invalid budget amount' });
  }

  const parts = divideBudget(totalBudget);
  res.json({ divisions: parts });
});

module.exports = router;
