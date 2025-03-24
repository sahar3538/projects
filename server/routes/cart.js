const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware to check if the user is a renter
const isRenter = async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ status: "error", message: "User ID is required" });
  }

  try {
    const query = "SELECT role FROM user WHERE userId = ?";
    const [result] = await db.promise().execute(query, [userId]);

    if (result.length === 0 || result[0].role !== 'renter') {
      return res.status(403).json({ status: "error", message: "Only renters can add products to the cart" });
    }

    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error("Error checking user role:", error);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

// Add product to cart
router.post("/", isRenter, async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || !quantity) {
    return res.status(400).json({ status: "error", message: "User ID, Product ID, and Quantity are required" });
  }

  try {
    // Step 1: Check stock availability
    const checkStockQuery = "SELECT stockQuantity, addedByUserId FROM Product WHERE productId = ?";
    const [stockResult] = await db.promise().execute(checkStockQuery, [productId]);

    if (stockResult.length === 0) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    const availableStock = stockResult[0].stockQuantity;
    const productLenderId = stockResult[0].addedByUserId;

    if (availableStock < quantity) {
      return res.status(400).json({
        status: "error",
        message: `Only ${availableStock} items are available in stock.`,
      });
    }

    // Step 2: Check if the cart already contains items from a different lender
    const checkCartQuery = `
      SELECT P.addedByUserId 
      FROM Cart C
      JOIN Product P ON C.productId = P.productId
      WHERE C.userId = ?
      LIMIT 1
    `;
    const [cartResult] = await db.promise().execute(checkCartQuery, [userId]);

    if (cartResult.length > 0) {
      const cartLenderId = cartResult[0].addedByUserId;

      // Check if the new product belongs to the same lender as the products already in the cart
      if (cartLenderId !== productLenderId) {
        return res.status(400).json({
          status: "error",
          message: "All products in the cart must belong to the same lender",
        });
      }
    }

    // Step 3: Insert into cart (or update quantity if item already exists)
    const insertCartQuery = `
      INSERT INTO Cart (userId, productId, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);
    `;
    const [insertResult] = await db.promise().execute(insertCartQuery, [userId, productId, quantity]);

    // Step 4: Decrease stock by the quantity added to cart
    const updateStockQuery = "UPDATE Product SET stockQuantity = stockQuantity - ? WHERE productId = ?";
    await db.promise().execute(updateStockQuery, [quantity, productId]);

    res.status(201).json({
      status: "success",
      message: `✅ Product added to cart. Stock updated.`,
      data: { cartId: insertResult.insertId, userId, productId, quantity, remainingStock: availableStock - quantity },
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// Get all cart items for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT C.cartId, C.quantity, P.productId, P.productName, P.pricePerDay, P.imageUrl, P.addedByUserId
      FROM Cart C
      JOIN Product P ON C.productId = P.productId
      WHERE C.userId = ?
    `;

    const [results] = await db.promise().execute(query, [userId]);

    res.json({ status: "success", cart: results });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch cart items" });
  }
});

// Remove product from cart
router.delete("/:cartId", async (req, res) => {
  const { cartId } = req.params;

  try {
    // Step 1: Get productId & quantity from cart before deleting
    const checkCartQuery = "SELECT productId, quantity FROM Cart WHERE cartId = ?";
    const [results] = await db.promise().execute(checkCartQuery, [cartId]);

    if (results.length === 0) {
      return res.status(404).json({ status: "error", message: "Cart item not found" });
    }

    const { productId, quantity } = results[0];

    // Step 2: Delete the cart item
    const deleteCartQuery = "DELETE FROM Cart WHERE cartId = ?";
    await db.promise().execute(deleteCartQuery, [cartId]);

    // Step 3: Increase the stock quantity
    const updateStockQuery = "UPDATE Product SET stockQuantity = stockQuantity + ? WHERE productId = ?";
    await db.promise().execute(updateStockQuery, [quantity, productId]);

    res.status(200).json({
      status: "success",
      message: `✅ Product removed from cart. Stock updated by ${quantity}.`,
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ status: "error", message: "Failed to remove product from cart" });
  }
});

// Update cart item quantity
router.put("/update-quantity", async (req, res) => {
  const { cartId, newQuantity } = req.body;

  if (!cartId || newQuantity < 1) {
    return res.status(400).json({ status: "error", message: "Invalid cart item or quantity" });
  }

  try {
    // Step 1: Get current quantity and productId
    const getCartQuery = "SELECT productId, quantity FROM Cart WHERE cartId = ?";
    const [results] = await db.promise().execute(getCartQuery, [cartId]);

    if (results.length === 0) {
      return res.status(404).json({ status: "error", message: "Cart item not found" });
    }

    const { productId, quantity: currentQuantity } = results[0];
    const quantityDifference = newQuantity - currentQuantity;

    // Step 2: Check stock availability if increasing quantity
    if (quantityDifference > 0) {
      const checkStockQuery = "SELECT stockQuantity FROM Product WHERE productId = ?";
      const [stockResults] = await db.promise().execute(checkStockQuery, [productId]);

      const availableStock = stockResults[0]?.stockQuantity || 0;
      if (availableStock < quantityDifference) {
        return res.status(400).json({
          status: "error",
          message: `Only ${availableStock} items are available in stock.`,
        });
      }
    }

    // Step 3: Update cart quantity
    const updateCartQuery = "UPDATE Cart SET quantity = ? WHERE cartId = ?";
    await db.promise().execute(updateCartQuery, [newQuantity, cartId]);

    // Step 4: Adjust stock quantity
    const updateStockQuery = "UPDATE Product SET stockQuantity = stockQuantity - ? WHERE productId = ?";
    await db.promise().execute(updateStockQuery, [quantityDifference, productId]);

    res.json({
      status: "success",
      message: `Cart updated successfully. Quantity: ${newQuantity}`,
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).json({ status: "error", message: "Failed to update cart quantity" });
  }
});

module.exports = router;