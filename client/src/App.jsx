import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import SearchNavbar from "./components/SearchNavbar";
import Home from "./pages/Home";
import SearchResults from "./components/SearchResults";
import Register from "./components/Register";
import ProductDetails from "./components/ProductDetails";
import WishlistPage from "./components/WishlistPage";
import Cart from "./components/Cart";
import AddProduct from './components/AddProduct'; // Adjust the path as necessary
import LenderDashboard from "./components/LenderDashboard"; // Ensure this component exists
import OrderForm from "./components/OrderForm";
import Orders from "./components/Orders";


function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]); // For storing the fetched products

  // Fetch products from the server
  const fetchProducts = async (lenderId) => {
    if (!lenderId) {
      console.warn("No lenderId provided");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/lender-products/${lenderId}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      } else {
        console.error("Error fetching products:", data.error);
      }
    } catch (err) {
      console.error("Error fetching products:", err.message);
    }
  };

  // Close the AddProduct form
  const handleClose = () => {
    // You can handle the close logic here, maybe set a state to close a modal or navigate back.
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <MainLayout user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/order-form" element={<OrderForm />} />
        <Route path="/lender-dashboard" element={<LenderDashboard />} />
        <Route
          path="/add-product"
          element={<AddProduct fetchProducts={fetchProducts} onClose={handleClose} />}
        />
        <Route
          path="/edit-product/:productId"
          element={<AddProduct fetchProducts={fetchProducts} onClose={handleClose} />}
        />
      </Routes>
    </Router>
  );
}

// ✅ Hide Navbar on specific routes
const MainLayout = ({ user, setUser }) => {
  const location = useLocation();
  
  // List of routes where the Navbar should be hidden
  const hideNavbarRoutes = ["/register", "/lender-dashboard"];

  if (hideNavbarRoutes.includes(location.pathname)) {
    return null; // No navbar for these routes
  }

  return <Navbar user={user} setUser={setUser} />;
};

export default App;
