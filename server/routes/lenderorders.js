const express = require("express");
const router = express.Router();
const db = require("../db"); // Database connection

// Get all orders for a specific lender
router.get("/lender-orders/:userId", (req, res) => {
  const { userId } = req.params;

  // Check if the user exists and is a lender
  db.query("SELECT role FROM user WHERE userId = ?", [userId], (err, userRole) => {
    if (err) {
      console.error("Error checking user role:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (userRole.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (userRole[0].role !== "lender") {
      return res.status(403).json({ success: false, message: "User is not a lender" });
    }

    // Fetch all orders related to products added by this lender
    db.query(
      `SELECT o.orderId, o.status, o.userId, oi.productId, p.productName
       FROM orders o
       JOIN order_items oi ON o.orderId = oi.orderId
       JOIN product p ON oi.productId = p.productId
       WHERE p.addedByUserId = ?`,
      [userId],
      (err, orders) => {
        if (err) {
          console.error("Error fetching lender orders:", err);
          return res.status(500).json({ success: false, message: "Error fetching orders" });
        }

        if (orders.length === 0) {
          return res.status(404).json({ success: false, message: "No orders found for this lender." });
        }

        res.json({ success: true, orders });
      }
    );
  });
});

// Update the status of a specific order
router.put("/update-order-status/:orderId", (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const validStatuses = ["Pending", "Shipped", "Delivered", "Returned", "Cancelled"];
  
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing status. Valid statuses: 'Pending', 'Shipped', 'Delivered', 'Returned', 'Cancelled'.",
      });
    }
  
    // Fetch current order status
    db.query("SELECT status FROM orders WHERE orderId = ?", [orderId], (err, orderStatus) => {
      if (err) {
        console.error("Error fetching order status:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
  
      if (orderStatus.length === 0) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
  
      if (orderStatus[0].status === "Returned") {
        return res.status(400).json({ success: false, message: "Order status cannot be changed once it is returned" });
      }
  
      // Update order status directly
      db.query(
        "UPDATE orders SET status = ? WHERE orderId = ?",
        [status, orderId],
        (err, result) => {
          if (err) {
            console.error("Error updating order status:", err);
            return res.status(500).json({ success: false, message: "Error updating status" });
          }
  
          if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
          }
  
          // If status is "Returned", update stockQuantity
          if (status === "Returned") {
            db.query(
              "SELECT productId, quantity FROM order_items WHERE orderId = ?",
              [orderId],
              (err, orderItems) => {
                if (err) {
                  console.error("Error fetching order items:", err);
                  return res.status(500).json({ success: false, message: "Error fetching order items" });
                }
  
                let updateCount = 0;
                let hasError = false;
  
                orderItems.forEach((item) => {
                  db.query(
                    "UPDATE product SET stockQuantity = stockQuantity + ? WHERE productId = ?",
                    [item.quantity, item.productId],
                    (err) => {
                      if (err) {
                        hasError = true;
                        console.error("Error updating stock quantity:", err);
                        return res.status(500).json({ success: false, message: "Error updating stock" });
                      }
                      updateCount++;
  
                      // If all updates are done, send response
                      if (updateCount === orderItems.length && !hasError) {
                        res.json({ success: true, message: "Order status updated successfully" });
                      }
                    }
                  );
                });
              }
            );
          } else {
            res.json({ success: true, message: "Order status updated successfully" });
          }
        }
      );
    });
});

module.exports = router;
