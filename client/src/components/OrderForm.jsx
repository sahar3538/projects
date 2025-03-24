import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OrderForm.css";

const OrderForm = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  const totalAmount = localStorage.getItem("totalAmount");

  const [formData, setFormData] = useState({
    address: "",
    paymentMethod: "Cash on Delivery",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    if (!formData.address) {
      alert("Please enter your address.");
      return;
    }

    const orderData = {
      userId,
      cartItems,
      totalAmount,
      paymentMethod: formData.paymentMethod,
      address: formData.address,
    };

    try {
      const response = await fetch("http://localhost:5000/api/orders/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (data.success) {
        alert("Order placed successfully! Order ID: " + data.orderId);
        localStorage.removeItem("cartItems"); // Clear cart
        localStorage.removeItem("totalAmount");
        navigate("/orders"); // Redirect to order list page
      } else {
        alert(data.message || "Failed to place order.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Error placing order. Please try again.");
    }
  };

  return (
    <div className="order-form-page">
      <h1>Complete Your Order</h1>
      <form onSubmit={handleOrderSubmit}>
        <label>Shipping Address:</label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <label>Payment Method:</label>
        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
          <option value="Cash on Delivery">Cash on Delivery</option>
        </select>

        <button type="submit">Confirm Order</button>
      </form>
    </div>
  );
};

export default OrderForm;
