import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LenderDashboard.css";
import AddProduct from "./AddProduct"; // Import the AddProduct form component

const LenderDashboard = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]); // Store products added by the lender
  const [orders, setOrders] = useState([]); // Store orders for the lender
  const [showForm, setShowForm] = useState(false); // Controls form visibility
  const [loading, setLoading] = useState(false); // Loading state
  const [productToEdit, setProductToEdit] = useState(null); // Store product to edit
  const [error, setError] = useState(""); // Store error messages
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const userData = JSON.parse(storedUser);

      if (userData.role !== "lender") {
        navigate("/"); // Redirect if not a lender
      }

      setUser(userData);
      fetchProducts(userData.userId); // Fetch products
      fetchOrders(userData.userId); // Fetch orders for the lender
    } else {
      navigate("/"); // Redirect if no user is logged in
    }

    return () => setProducts([]); // Cleanup function
  }, [navigate]);

  // Fetch products added by the lender
  const fetchProducts = async (lenderId) => {
    if (!lenderId) {
      console.warn("No lenderId provided");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/lender-products/${lenderId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${data.error || "Unknown error"}`);
      }

      setProducts(data.products || []);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching products:", err.message);
      setError("There was an error fetching your products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders for the lender
  const fetchOrders = async (lenderId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/lender-orders/${lenderId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(`Failed to fetch orders: ${data.error || "Unknown error"}`);
      }

      setOrders(data.orders || []);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching orders:", err.message);
      setError("There was an error fetching your orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle product deletion
  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/delete-product/${productId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to delete product");

        fetchProducts(user?.userId); // Refresh list after deletion
      } catch (err) {
        console.error("Error deleting product:", err.message);
        setError("There was an error deleting the product. Please try again later.");
      }
    }
  };

// Handle order status change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/update-order-status/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }), // Send new status to the backend
      });

      if (!response.ok) throw new Error("Failed to update order status");

      // Update the order status in the UI instantly
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );

      alert("Order status updated successfully.");
    } catch (err) {
      alert("Error updating order status: " + err.message);
    }
  };

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/"); // Redirect to the home page after logout
  };

  // Handle edit button click
  const handleEdit = (product) => {
    setProductToEdit(product); // Set the product to be edited
    setShowForm(true); // Show the form in edit mode
  };

  // Handle Add Product button click to reset productToEdit
  const handleAddProduct = () => {
    setProductToEdit(null); // Reset the productToEdit to trigger fresh form
    setShowForm(true); // Show the form
  };

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.userName}</h1>

      <button onClick={handleLogout} className="logout-btn">Logout</button>

      <button onClick={handleAddProduct} className="add-btn">
        {showForm ? "Cancel" : "+ Add Product"}
      </button>

      {error && <p className="error-message">{error}</p>} {/* Display error message */}

      {showForm && (
        <AddProduct
          product={productToEdit} // Pass the product to the AddProduct form
          fetchProducts={() => fetchProducts(user?.userId)} // Refresh products after adding or editing
          onClose={() => setShowForm(false)} // Close form when canceling or after success
        />
      )}

      {/* Display Products */}
      <div className="product-list">
        {loading ? (
          <p>Loading products...</p>
        ) : (
          products.length > 0 ? (
            products.map((product) => (
              <div key={product.productId} className="product-card">
                <img
                  src={`http://localhost:5000${product.imageUrl || "/placeholder.jpg"}`} // Ensure fallback image
                  alt={product.productName}
                  className="product-image"
                  onError={(e) => { e.target.src = "/placeholder.jpg"; }} // Fallback for broken images
                />
                <h3>{product.productName}</h3>
                <p>{product.description}</p>
                <p>Price: ₹{product.pricePerDay}/day</p>
                <button onClick={() => handleEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product.productId)} className="delete-btn">Delete</button>
              </div>
            ))
          ) : (
            <p>No products listed yet.</p>
          )
        )}
      </div>

      {/* Display Orders */}
      <div className="order-list">
        {loading ? (
          <p>Loading orders...</p>
        ) : (
          orders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product Name</th>
                  <th>User ID</th>
                  <th>Status</th>
                  <th>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>{order.productName}</td>
                    <td>{order.userId}</td>
                    <td>{order.status}</td>
                    <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Returned">Returned</option>
                    </select>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No orders yet.</p>
          )
        )}
      </div>
    </div>
  );
};

export default LenderDashboard;
