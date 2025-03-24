import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./Cart.css";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate(); // Inside Cart component
  const [rentalDays, setRentalDays] = useState(1); // Default rental days




  // Fetch cart items
  useEffect(() => {
    fetch(`http://localhost:5000/api/cart/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          setCartItems(data.cart);
        } else {
          setError("Failed to fetch cart items.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch cart items.");
        setLoading(false);
      });
  }, [userId]);

  const handleProceedToCheckout = () => {
    const userRole = localStorage.getItem("role");
  
    if (!userId) {
      alert("You must be signed in to proceed to checkout.");
      navigate("/login"); // Redirect to login page
      return;
    }
  
    if (userRole !== "renter") {
      alert("Sign in to proceed furthur!");
      return;
    }
  
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
  
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    localStorage.setItem("totalAmount", calculateTotal());
  
    navigate("/order-form"); // Redirect to order form
  };
  
  
  

  // Remove item from cart
  const handleRemoveFromCart = (cartId) => {
    fetch(`http://localhost:5000/api/cart/${cartId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          setCartItems(cartItems.filter((item) => item.cartId !== cartId));
        } else {
          alert("Failed to remove item from cart.");
        }
      })
      .catch(() => {
        alert("Failed to remove item from cart.");
      });
  };

  // Update quantity
  const handleQuantityChange = async (cartId, newQuantity) => {
    if (newQuantity < 1) return; // Prevent reducing below 1
    try {
      const response = await fetch("http://localhost:5000/api/cart/update-quantity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, newQuantity }),
      });
      const data = await response.json();
      if (response.ok) {
        setCartItems((prevCart) =>
          prevCart.map((item) =>
            item.cartId === cartId ? { ...item, quantity: newQuantity } : item
          )
        );
      } else {
        alert(data.message || "Failed to update quantity.");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Error updating quantity. Please try again.");
    }
  };

  const handleRentalDaysChange = (e) => {
    const days = parseInt(e.target.value, 10);
    if (days >= 1) setRentalDays(days);
  };

  const calculateTotal = () => {
    return (
      cartItems.reduce((total, item) => total + item.pricePerDay * item.quantity, 0) * rentalDays
    ).toFixed(2);
  };

  // Handle placing order
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    for (const item of cartItems) {
      const response = await fetch(`http://localhost:5000/api/product/${item.productId}`);
      const product = await response.json();
      if (product.stockQuantity < item.quantity) {
        alert(`⚠️ Not enough stock for ${item.productName}. Please adjust your cart.`);
        return;
      }
    }
    const orderData = {
      userId,
      cartItems,
      totalAmount: calculateTotal(),
      paymentMethod: "Cash on Delivery",
      address: "User's shipping address", // Make dynamic later
    };
    try {
      const response = await fetch("http://localhost:5000/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const data = await response.json();
      if (data.success) {
        alert("Order placed successfully! Order ID: " + data.orderId);
        setCartItems([]); // Clear cart after order
      } else {
        alert("Failed to place order. Try again.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Error placing order. Please try again.");
    }
  };

  if (loading) return <p>Loading your cart...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="cart-page">
      <h1>Your Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="cart-container">
          {cartItems.map((item) => (
            <div key={item.cartId} className="cart-item">
              <div className="cart-image">
                <img src={`http://localhost:5000${item.imageUrl}`} alt={item.productName} />
              </div>
              <div className="cart-details">
                <h3>{item.productName}</h3>
                <p>{item.description}</p>
                <p>Price per day: ₹{Number(item.pricePerDay).toFixed(2)}</p>
                <div className="quantity-control">
                  <button onClick={() => handleQuantityChange(item.cartId, item.quantity - 1)} disabled={item.quantity <= 1}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleQuantityChange(item.cartId, item.quantity + 1)}>+</button>
                </div>
              </div>
              <div className="cart-actions">
                <button className="remove-btn" onClick={() => handleRemoveFromCart(item.cartId)}>
                  <Trash2 size={20} /> Remove
                </button>
              </div>
            </div>
          ))}
          <div className="cart-total">
            <label>
              Rental Days:{" "}
              <input type="number" value={rentalDays} onChange={handleRentalDaysChange} min="1" />
            </label>
            <h2>Total: ₹{calculateTotal()}</h2>
            <button className="checkout-btn" onClick={handleProceedToCheckout} disabled={!userId || (localStorage.getItem("role") !== "renter" && localStorage.getItem("role") !== null)}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
