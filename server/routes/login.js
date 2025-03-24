const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../db");

// Login Route
router.post("/", (req, res) => {
  const { email, password } = req.body;

  // Validate input fields
  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Fetch user from database by email
  const query = "SELECT * FROM user WHERE userEmail = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Database error", details: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = results[0];

    // Compare provided password with stored hashed password
    bcrypt.compare(password, user.userPassword, (err, isMatch) => {
      if (err) {
        console.error("Error comparing passwords:", err.message);
        return res.status(500).json({ error: "Server error during password verification" });
      }

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Ensure correct role key (database has 'role', not 'userRole')
      const userRole = user.role || "renter"; // Default to 'renter' if missing

      // Successful login response
      res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          userPhoneNumber: user.userPhoneNumber,
          userAddress: user.userAddress,
          role: userRole, // Correct key name
        },
      });
    });
  });
});

module.exports = router;
