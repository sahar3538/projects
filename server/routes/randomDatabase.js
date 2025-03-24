// routes/randomDatabase.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Define the random-database route
router.get('/random-database', (req, res) => {
  const fetchRandomIdsQuery = `
    SELECT productId 
    FROM product 
    WHERE availability = 'available' 
    ORDER BY RAND() 
    LIMIT 6;
  `;

  db.query(fetchRandomIdsQuery, (err, ids) => {
    if (err) {
      console.error("❌ DB Error:", err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }

    if (ids.length === 0) {
      console.log("⚠️ No available products found");
      return res.status(404).json({ message: "No products available" });
    }

    const productIds = ids.map(id => id.productId);

    const fetchProductsQuery = `
      SELECT p.*, 
             COALESCE(CONCAT('http://localhost:5000', p.imageUrl), '') AS fullImageURL,
             COALESCE(u.userName, 'Unknown Lender') AS lenderName
      FROM product p
      LEFT JOIN user u ON p.addedByUserId = u.userId
      WHERE p.productId IN (?);
    `;

    db.query(fetchProductsQuery, [productIds], (err, products) => {
      if (err) {
        console.error("❌ DB Error:", err.sqlMessage);
        return res.status(500).json({ error: err.sqlMessage });
      }

      res.json({ success: true, products });
    });
  });
});

module.exports = router;
