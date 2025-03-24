import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import "./WishlistPage.css";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState({}); 
  const navigate = useNavigate();
  
  const userId = localStorage.getItem("userId"); // Fetch dynamic userId
  
  // Redirect to login if user is not logged in
  useEffect(() => {
    if (!userId) {
      alert("Please log in to view your wishlist.");
      navigate("/login");
      return;
    }

    // Fetch Wishlist & Cart in Parallel
    Promise.all([
      fetch(`http://localhost:5000/api/wishlist/${userId}`).then((res) => res.json()),
      fetch(`http://localhost:5000/api/cart/${userId}`).then((res) => res.json())
    ])
      .then(([wishlistData, cartData]) => {
        setWishlist(wishlistData.wishlist || []);
        setCart(cartData.cart || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Failed to fetch wishlist and cart items.");
        setLoading(false);
      });

  }, [userId, navigate]);

  // Handle Adding Item to Shopping Bag (Cart)
  const handleAddToBag = async (item) => {
    if (!userId) {
      alert("You must be logged in to add items to your bag.");
      navigate("/login");
      return;
    }

    if (cart.find((cartItem) => cartItem.productId === item.productId)) {
      alert("⚠️ This item is already in your shopping bag.");
      return;
    }

    if (item.stockQuantity <= 0) {
      alert("⚠️ This product is out of stock.");
      return;
    }

    try {
      // Add item to cart
      const addResponse = await fetch("http://localhost:5000/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId: item.productId, quantity: 1 }),
      });

      if (addResponse.ok) {
        alert(`🛍️ ${item.productName} added to your bag!`);

        // Update stock quantity
        const updatedStockQuantity = item.stockQuantity - 1;
        await fetch(`http://localhost:5000/api/product/${item.productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stockQuantity: updatedStockQuantity }),
        });

        setCart([...cart, { productId: item.productId, quantity: 1 }]);
        navigate("/bag");
      } else {
        alert("❌ Failed to add item to bag.");
      }
    } catch (error) {
      console.error("Error adding item to bag:", error);
      alert("❌ An error occurred.");
    }
  };

  // Handle Removing Item from Wishlist
  const handleRemoveFromWishlist = async (productId) => {
    if (!userId) {
      alert("You must be logged in to modify your wishlist.");
      navigate("/login");
      return;
    }

    setRemoving((prevState) => ({ ...prevState, [productId]: true }));

    try {
      const response = await fetch("http://localhost:5000/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId }),
      });

      if (response.ok) {
        setWishlist((prevWishlist) => prevWishlist.filter((item) => item.productId !== productId));
      } else {
        alert("❌ Failed to remove item from wishlist.");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      alert("❌ An error occurred.");
    } finally {
      setRemoving((prevState) => ({ ...prevState, [productId]: false }));
    }
  };

  if (loading) return <p>Loading wishlist...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="wishlist-page">
      <h1>Your Wishlist</h1>
      {wishlist.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <div className="wishlist-container">
          {wishlist.map((item) => (
            <div key={item.productId} className="wishlist-item">
              <div className="wishlist-image">
                <img
                  src={item.imageUrl ? `http://localhost:5000${item.imageUrl}` : "/placeholder.jpg"}
                  alt={item.productName}
                  onError={(e) => (e.target.src = "/placeholder.jpg")}
                />
              </div>

              <div className="wishlist-details">
                <h3>{item.productName}</h3>
                <p>{item.description}</p>
                <p className={`availability ${item.stockQuantity > 0 ? "available" : "out-of-stock"}`}>
                  {item.stockQuantity > 0 ? `✅ In Stock (${item.stockQuantity})` : "❌ Out of Stock"}
                </p>

                <button
                  className="add-to-bag-btn"
                  onClick={() => handleAddToBag(item)}
                  disabled={item.stockQuantity <= 0}
                >
                  Add to shopping bag
                </button>
              </div>

              <div className="wishlist-price">
                <p>${Number(item.pricePerDay).toFixed(2)}</p>

                <button
                  className="remove-btn"
                  onClick={() => handleRemoveFromWishlist(item.productId)}
                  disabled={removing[item.productId]}
                >
                  {removing[item.productId] ? "Removing..." : <Trash2 size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
