const express = require("express");
const router = express.Router();
const db = require("../db"); // Import database connection

// 🔎 Search Products by Name or Category
router.get("/search", (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Search query cannot be empty" });
  }

  const searchTerm = `%${q}%`;
  console.log(`🔎 Searching for: ${q}`); // Debugging log

  const query = `
  SELECT p.*, 
         COALESCE(CONCAT('http://localhost:5000', p.imageUrl), '') AS fullImageURL,
         COALESCE(u.userName, 'Unknown Lender') AS lenderName
  FROM product p
  LEFT JOIN user u ON p.addedByUserId = u.userId
  WHERE p.productName LIKE ? OR p.category LIKE ?;
  `;

  db.query(query, [searchTerm, searchTerm], (err, results) => {
    if (err) {
      console.error("❌ Error fetching search results:", err.sqlMessage);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }

    console.log(`✅ Found ${results.length} results`); // Debugging log
    res.json(results);
  });
});

// 🔍 Get Product Details by ID
router.get("/:id", (req, res) => {
  const productId = req.params.id;
  console.log(`🔍 Fetching product details for ID: ${productId}`); // Debugging log

  const query = `
    SELECT p.*, 
           COALESCE(CONCAT('http://localhost:5000', p.imageUrl), '') AS fullImageURL,
           COALESCE(u.userName, 'Unknown Lender') AS lenderName
    FROM product p
    LEFT JOIN user u ON p.addedByUserId = u.userId
    WHERE p.productId = ?;
  `;

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching product details:", err.sqlMessage);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(results[0]); // ✅ Return a single product object
  });
});

// Ensure you have the proper Express route for /random-database
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
