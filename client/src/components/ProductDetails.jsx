import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ProductDetails.css";

// ✅ Modal component for notifications
const Modal = ({ message, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <p>{message}</p>
      <button className="close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const userId = localStorage.getItem("userId") || 1; // ✅ Replace with actual logged-in user ID

  // ✅ Fetch product details (including lender name)
  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch(() => setMessage("❌ Failed to load product"));
  }, [id]);

  // ✅ Fetch wishlist items
  useEffect(() => {
    fetch(`http://localhost:5000/api/wishlist/${userId}`)
      .then((res) => res.json())
      .then((data) => setWishlist(data.wishlist || []))
      .catch(() => setMessage("❌ Failed to load wishlist"));
  }, [userId]);

  // ✅ Add product to wishlist
  const handleAddToWishlist = async () => {
    if (!product) {
      alert("Product data not loaded. Please try again.");
      return;
    }

    const alreadyInWishlist = wishlist.some((item) => item.productId === product.productId);
    if (alreadyInWishlist) {
      setMessage("⚠️ Product already in wishlist!");
      setShowModal(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId: product.productId }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("✅ Added to wishlist!");
        setWishlist([...wishlist, { productId: product.productId, productName: product.productName }]);
      } else {
        setMessage(data.message || "❌ Failed to add to wishlist.");
      }
    } catch (error) {
      setMessage("❌ Error adding to wishlist.");
    }
    setShowModal(true);
  };

  // ✅ Add product to cart
  const handleAddToCart = async () => {
    if (!product) {
      alert("Product data not loaded. Please try again.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/api/cart", { // ✅ Ensure correct API path
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId: product.productId, quantity: 1 }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setMessage("🎉 Added to cart!");
      } else {
        setMessage(data.message || "❌ Failed to add to cart.");
      }
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      setMessage("❌ Error adding to cart.");
    }
  
    setShowModal(true);
  };
  
  return (
    <div className="product-page">
      {product ? (
        <div className="product-container">
          <div className="product-details">
            <img
              src={`http://localhost:5000${product.imageUrl}`}
              alt={product.productName}
              className="image"
              onError={(e) => (e.target.src = "/placeholder.jpg")}
            />
            <h2>{product.productName}</h2>
            <p>Category: {product.category}</p>
            <p>{product.description}</p>
            <p>Price: ₹{product.pricePerDay} / day</p>
            <p>Listed by: {product.lenderName || "Unknown Lender"}</p> {/* ✅ Display lender name */}

            <div className="product-actions">
              <button className="wishlist-btn" onClick={handleAddToWishlist}>
                Add to Wishlist
              </button>
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p>Loading product details...</p>
      )}

      {showModal && <Modal message={message} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default ProductDetails;
