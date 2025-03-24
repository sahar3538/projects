const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../db"); // Ensure this uses mysql (not mysql2/promise)

// Register Route
router.post("/", (req, res) => {
  const { userName, userPhoneNumber, userEmail, userAddress, userPassword, role = "renter" } = req.body;

  // Validate input fields
  if (![userName, userPhoneNumber, userEmail, userAddress, userPassword].every(field => field?.trim())) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  // Validate role (only "renter" or "lender" allowed)
  const allowedRoles = ["renter", "lender"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, error: "Invalid role selected" });
  }

  // Validate email and phone formats
  if (!/^[^\s@]+@[A-Za-z]+[A-Za-z0-9.-]*\.[A-Za-z]{2,}$/.test(userEmail)) {
    return res.status(400).json({ success: false, error: "Invalid email format" });
}
  if (!/^\d{10}$/.test(userPhoneNumber)) {
    return res.status(400).json({ success: false, error: "Phone number must be 10 digits" });
  }

  // Check if email already exists
  db.query("SELECT userEmail FROM user WHERE userEmail = ?", [userEmail], (err, emailCheck) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, error: "Internal server error", details: err.message });
    }
    if (emailCheck.length > 0) {
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    // Check if phone number already exists
    db.query("SELECT userPhoneNumber FROM user WHERE userPhoneNumber = ?", [userPhoneNumber], (err, phoneCheck) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, error: "Internal server error", details: err.message });
      }
      if (phoneCheck.length > 0) {
        return res.status(409).json({ success: false, error: "Phone number is already registered" });
      }

      // Hash the password before inserting
      bcrypt.hash(userPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error("Hashing error:", err);
          return res.status(500).json({ success: false, error: "Password hashing failed" });
        }

        // Insert new user into the "user" table
        db.query(
          "INSERT INTO user (userName, userPhoneNumber, userEmail, userAddress, userPassword, role) VALUES (?, ?, ?, ?, ?, ?)",
          [userName, userPhoneNumber, userEmail, userAddress, hashedPassword, role],
          (err, result) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ success: false, error: "Internal server error", details: err.message });
            }
            res.status(201).json({
              success: true,
              message: "User registered successfully!",
              userId: result.insertId,
            });
          }
        );
      });
    });
  });
});

module.exports = router;
