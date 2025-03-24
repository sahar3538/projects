const express = require("express");
const router = express.Router();
const db = require("../db"); // Database connection file

// ✅ Add product to wishlist
router.post("/", (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
        return res.status(400).json({ status: "error", message: "User ID and Product ID are required" });
    }

    // Check if product is already in wishlist
    const checkQuery = "SELECT * FROM Wishlist WHERE userId = ? AND productId = ?";
    db.query(checkQuery, [userId, productId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ status: "error", message: "Database error", error: err });
        }

        if (results.length > 0) {
            return res.status(400).json({ status: "error", message: "⚠️ Product is already in the wishlist" });
        }

        // Insert product into wishlist
        const insertQuery = "INSERT INTO Wishlist (userId, productId) VALUES (?, ?)";
        db.query(insertQuery, [userId, productId], (err, result) => {
            if (err) {
                console.error("Insert error:", err);
                return res.status(500).json({ status: "error", message: "Failed to add to wishlist", error: err });
            }

            res.status(201).json({
                status: "success",
                message: "✅ Product added to wishlist successfully!",
                data: { wishlistId: result.insertId, userId, productId },
            });
        });
    });
});

// ✅ Get all wishlist items for a user
router.get("/:userId", (req, res) => {
    const { userId } = req.params;

    const query = `
        SELECT W.wishlistId, P.productId, P.productName, P.pricePerDay, P.imageUrl, P.stockQuantity
        FROM Wishlist W
        JOIN Product P ON W.productId = P.productId
        WHERE W.userId = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching wishlist:", err);
            return res.status(500).json({ status: "error", message: "Failed to fetch wishlist", error: err });
        }
        console.log("Wishlist data fetched:", results); 
        res.json({ status: "success", wishlist: results });
    });
});

// ✅ Remove product from wishlist
router.delete("/", async (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
        return res.status(400).json({ status: "error", message: "User ID and Product ID are required." });
    }

    const deleteQuery = "DELETE FROM Wishlist WHERE userId = ? AND productId = ?";

    try {
        const [result] = await db.promise().query(deleteQuery, [userId, productId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Product not found in wishlist." });
        }

        return res.status(200).json({ status: "success", message: "✅ Product removed from wishlist." });
    } catch (err) {
        console.error("❌ Error removing from wishlist:", err);
        return res.status(500).json({ status: "error", message: "Internal Server Error. Please try again later." });
    }
});

module.exports = router;
