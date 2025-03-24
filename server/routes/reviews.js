const express = require("express");
const db = require("../db"); // MySQL connection pool

const router = express.Router();

// Submit a review (Callback-based)
router.post("/submit-review", (req, res) => {
  const { orderId, productId, review, rating, userId } = req.body;

  if (!review || !rating || rating < 1 || rating > 5 || !orderId || !userId || !productId) {
    return res.status(400).json({ success: false, message: "Invalid input data" });
  }

  // Check if orderId exists
  db.query(`SELECT orderId FROM orders WHERE orderId = ?`, [orderId], (err, orderCheck) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database query failed." });
    }
    if (orderCheck.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid orderId." });
    }

    // Check if productId exists
    db.query(`SELECT productId FROM product WHERE productId = ?`, [productId], (err, productCheck) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Database query failed." });
      }
      if (productCheck.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid productId." });
      }

      // Check if userId exists
      db.query(`SELECT userId FROM user WHERE userId = ?`, [userId], (err, userCheck) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ success: false, message: "Database query failed." });
        }
        if (userCheck.length === 0) {
          return res.status(400).json({ success: false, message: "Invalid userId." });
        }

        // Check if the review already exists
        db.query(
          `SELECT * FROM reviews WHERE orderId = ? AND productId = ? AND userId = ?`,
          [orderId, productId, userId],
          (err, existingReview) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ success: false, message: "Database query failed." });
            }
            if (existingReview.length > 0) {
              return res.status(400).json({ success: false, message: "You have already reviewed this product." });
            }

            // Insert the review
            db.query(
              `INSERT INTO reviews (orderId, productId, userId, reviewText, rating) VALUES (?, ?, ?, ?, ?)`,
              [orderId, productId, userId, review, rating],
              (err, result) => {
                if (err) {
                  console.error("🔥 Database Error:", err);
                  return res.status(500).json({ success: false, message: "Failed to submit review." });
                }
                return res.status(200).json({ success: true, message: "Review submitted successfully!" });
              }
            );
          }
        );
      });
    });
  });
});

module.exports = router;
