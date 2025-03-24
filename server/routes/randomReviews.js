const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure you have your MySQL connection setup

// API Route: Fetch Random Reviews
router.get('/random-reviews', (req, res) => {
  const query = `
    SELECT r.*, u.userName, p.productName 
    FROM reviews r
    JOIN user u ON r.userId = u.userId
    JOIN product p ON r.productId = p.productId
    ORDER BY RAND()
    LIMIT 5;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ DB Query Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, reviews: results });
  });
});

module.exports = router;
