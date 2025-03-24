const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db"); // Ensure MySQL connection is set up

// Ensure the "images" directory exists
const imageDir = path.join(__dirname, "../images");
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Multer Storage for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter to ensure only images are uploaded
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files (jpeg, jpg, png) are allowed!"));
    }
  },
});

// Add Product Route
router.post("/addProduct", upload.single("image"), (req, res) => {
  try {
    console.log("Received body:", req.body);
    console.log("Received file:", req.file);

    const { productName, description, category, pricePerDay, stockQuantity, availability, addedByUserId } = req.body;

    if (!productName || !category || !pricePerDay || !stockQuantity || !addedByUserId) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image upload is required" });
    }

    const descriptionValue = description?.trim() !== "" ? description : null;
    const availabilityValue = availability?.trim() !== "" ? availability : null;
    const imageUrl = `/images/${req.file.filename}`;

    const sql = `
      INSERT INTO product (productName, description, category, pricePerDay, stockQuantity, availability, imageUrl, addedByUserId, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;

    db.query(sql, [productName, descriptionValue, category, pricePerDay, stockQuantity, availabilityValue, imageUrl, addedByUserId], (err) => {
      if (err) {
        console.error("Error inserting product:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Product added successfully! Awaiting admin approval." });
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error occurred" });
  }
});

// Lender Products Route (Includes Lender Name)
router.get("/lender-products/:lenderId", (req, res) => {
  const lenderId = req.params.lenderId;

  const sql = `
    SELECT p.*, u.userName AS lenderName 
    FROM product p
    JOIN user u ON p.addedByUserId = u.userId
    WHERE p.addedByUserId = ?`;

  db.query(sql, [lenderId], (err, result) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.json({ products: result });
  });
});

// Delete Product Route
router.delete("/delete-product/:productId", (req, res) => {
  const { productId } = req.params;

  const getProductSql = "SELECT imageUrl FROM product WHERE productId = ?";
  db.query(getProductSql, [productId], (err, result) => {
    if (err) {
      console.error("Error fetching product:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const imageUrl = result[0].imageUrl;

    // Delete image from folder if exists
    if (imageUrl) {
      const imagePath = path.join(__dirname, "../images", path.basename(imageUrl));
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Error deleting image:", err);
      });
    }

    // Delete product from database
    const deleteSql = "DELETE FROM product WHERE productId = ?";
    db.query(deleteSql, [productId], (err) => {
      if (err) {
        console.error("Error deleting product:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Product deleted successfully" });
    });
  });
});

// Fetch Product for Editing
router.get("/edit-product/:productId", (req, res) => {
  const { productId } = req.params;

  const sql = "SELECT * FROM product WHERE productId = ?";
  db.query(sql, [productId], (err, result) => {
    if (err) {
      console.error("Error fetching product:", err);
      return res.status(500).json({ error: "Server error while fetching product" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: `Product with ID ${productId} not found` });
    }

    res.json(result[0]);
  });
});

// Edit Product Route
router.put("/edit-product/:id", upload.single("image"), (req, res) => {
  const productId = req.params.id;
  const { productName, description, category, pricePerDay, stockQuantity, availability } = req.body;

  const getProductSql = "SELECT * FROM product WHERE productId = ?";
  db.query(getProductSql, [productId], (err, result) => {
    if (err) {
      console.error("Error fetching product:", err);
      return res.status(500).json({ error: "Error fetching product from database" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: `Product with ID ${productId} not found` });
    }

    let product = result[0];
    let imageUrl = product.imageUrl;

    if (req.file) {
      if (product.imageUrl) {
        const oldImagePath = path.join(__dirname, "../images", path.basename(product.imageUrl));
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Error deleting old image:", err);
        });
      }
      imageUrl = `/images/${req.file.filename}`;
    }

    if (!productName || !description || !category || !pricePerDay || !stockQuantity || !availability) {
      return res.status(400).json({ error: "All fields must be filled" });
    }

    const price = parseFloat(pricePerDay);
    const stock = parseInt(stockQuantity, 10);

    if (isNaN(price) || isNaN(stock)) {
      return res.status(400).json({ error: "Invalid price or stock quantity" });
    }

    const updateProductSql = `
      UPDATE product 
      SET productName = ?, description = ?, category = ?, pricePerDay = ?, stockQuantity = ?, availability = ?, imageUrl = ? 
      WHERE productId = ?`;

    db.query(updateProductSql, [productName, description, category, price, stock, availability, imageUrl, productId], (err) => {
      if (err) {
        console.error("Error updating product:", err);
        return res.status(500).json({ error: "Failed to update product" });
      }
      res.status(200).json({ message: "Product updated successfully!" });
    });
  });
});

// Global Error Handler for Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
