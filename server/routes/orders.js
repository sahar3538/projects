const express = require("express");
const router = express.Router();
const db = require("../db");

// Place an order
router.post("/place-order", async (req, res) => {
    const { userId, cartItems, totalAmount, paymentMethod, address } = req.body;

    if (!userId || !cartItems || cartItems.length === 0 || !totalAmount || !address) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    try {
        // Insert order into `orders` table
        const orderQuery = `
            INSERT INTO orders (userId, totalAmount, paymentMethod, address)
            VALUES (?, ?, ?, ?)
        `;
        const [orderResult] = await db.promise().execute(orderQuery, [userId, totalAmount, paymentMethod, address]);

        const orderId = orderResult.insertId;

        // Insert each item into `order_items` table
        const itemQueries = cartItems.map(item => {
            return db.promise().execute(
                `INSERT INTO order_items (orderId, productId, quantity, pricePerDay) VALUES (?, ?, ?, ?)`,
                [orderId, item.productId, item.quantity, item.pricePerDay]
            );
        });

        const clearCartQuery = `DELETE FROM cart WHERE userId = ?`;
        await db.promise().execute(clearCartQuery, [userId]);

        return res.status(201).json({ success: true, message: "Order placed successfully", orderId });
    } catch (error) {
        console.error("Order placement error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Fetch all orders by a user
router.get("/user-orders/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const query = `
            SELECT o.orderId, o.totalAmount, o.paymentMethod, o.orderDate, o.status, o.address,
                   oi.productId, oi.quantity, oi.pricePerDay
            FROM orders o
            JOIN order_items oi ON o.orderId = oi.orderId
            WHERE o.userId = ?
            ORDER BY o.orderDate DESC
        `;

        const [orders] = await db.promise().execute(query, [userId]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No orders found" });
        }

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


router.put("/cancel-order/:orderId", async (req, res) => {
    const { orderId } = req.params;

    try {
        // Check order status and get order items
        const checkStatusQuery = `SELECT status FROM orders WHERE orderId = ?`;
        const [order] = await db.promise().execute(checkStatusQuery, [orderId]);

        if (order.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const currentStatus = order[0].status;

        if (currentStatus === "Cancelled") {
            return res.status(400).json({ success: false, message: "Order has already been canceled." });
        }

        if (order[0].status === "Delivered") {
            return res.status(400).json({ success: false, message: "Order cannot be canceled as it is already delivered." });
        }

        // Get ordered items to update stock
        const getOrderItemsQuery = `SELECT productId, quantity FROM order_items WHERE orderId = ?`;
        const [orderItems] = await db.promise().execute(getOrderItemsQuery, [orderId]);

        // Update order status
        const cancelOrderQuery = `UPDATE orders SET status = 'Cancelled' WHERE orderId = ?`;
        await db.promise().execute(cancelOrderQuery, [orderId]);

        // Update stock for each product in order_items
        for (const item of orderItems) {
            const updateStockQuery = `UPDATE product SET stockQuantity = stockQuantity + ? WHERE productId = ?`;
            await db.execute(updateStockQuery, [item.quantity, item.productId]); // No extra connection
            
        }

        return res.json({ success: true, message: "Order canceled successfully, stock updated." });

    } catch (error) {
        console.error("Error canceling order:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});



module.exports = router;
