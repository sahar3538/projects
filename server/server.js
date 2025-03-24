const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// Import routes
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const productsRoutes = require("./routes/products");
const wishlistRoutes = require("./routes/wishlist");
const cartRoutes = require("./routes/cart");
const addProductRoutes = require("./routes/addProduct"); 
const orderRoutes = require("./routes/orders");
const reviewRoutes = require("./routes/reviews"); // Add the review route
const randomDatabaseRouter = require('./routes/randomDatabase'); // Import the new route
const randomReviewsRoute = require('./routes/randomReviews'); // Import new route
const lenderOrdersRoutes = require("./routes/lenderorders"); // Import lender order routes



const app = express();
app.use(cors());
app.use(express.json());

// Serve static images
app.use("/images", express.static(path.join(__dirname, "images")));

// Use routes
app.use("/api", lenderOrdersRoutes);
app.use('/api', randomReviewsRoute); // Mount the random reviews route
app.use('/api', randomDatabaseRouter);  // Prefix the route with '/api' if needed
app.use("/api/orders", orderRoutes); // Add order routes
app.use("/api/reviews", reviewRoutes);  // Add review routes here
app.use("/api", addProductRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
