import { useState, useEffect } from "react";
import axios from "axios";
import "./AddProduct.css";

const AddProduct = ({ product, fetchProducts, onClose }) => {
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    category: "",
    pricePerDay: "",
    stockQuantity: "",
    availability: "available",
    image: null,
    changeImage: false,
  });

  // Update the form when editing
  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || "",
        description: product.description || "",
        category: product.category || "",
        pricePerDay: product.pricePerDay || "",
        stockQuantity: product.stockQuantity || "",
        availability: product.availability || "available",
        image: null, // Prevent pre-filling the image
        changeImage: false,
      });
    } else {
      setFormData({
        productName: "",
        description: "",
        category: "",
        pricePerDay: "",
        stockQuantity: "",
        availability: "available",
        image: null,
        changeImage: false,
      });
    }
  }, [product]);

  // Handle text field changes
  const handleChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        image: file,
        changeImage: true, // Indicate that a new image is selected
      }));
    }
  };
  

  // Validate form before submission
  const validateForm = () => {
    const { productName, description, category, pricePerDay, stockQuantity } = formData;
  
    // Ensure required fields are not empty
    if (
      !productName.trim() ||
      !description.trim() ||
      !category.trim() ||
      pricePerDay === "" ||
      stockQuantity === ""
    ) {
      alert("All fields are required.");
      return false;
    }
  
    // Ensure numbers are greater than zero
    if (isNaN(pricePerDay) || isNaN(stockQuantity) || parseFloat(pricePerDay) <= 0 || parseInt(stockQuantity) <= 0) {
      alert("Price and stock quantity must be valid numbers greater than zero.");
      return false;
    }
  
    return true;
  };
   

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userId = localStorage.getItem("userId"); // Get logged-in user ID

    const data = new FormData();
    data.append("productName", formData.productName);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("pricePerDay", formData.pricePerDay);
    data.append("stockQuantity", formData.stockQuantity);
    data.append("availability", formData.availability);
    data.append("addedByUserId", userId); // Include the lender's ID

    if (formData.changeImage && formData.image) {
        data.append("image", formData.image);
    } else if (product?.imageUrl) {
        data.append("existingImageUrl", product.imageUrl);
    }

    try {
        const url = product
            ? `http://localhost:5000/api/edit-product/${product.productId}`
            : "http://localhost:5000/api/addProduct";
        const method = product ? "PUT" : "POST";

        await axios({
            method: method,
            url: url,
            data: data,
            headers: { "Content-Type": "multipart/form-data" },
        });

        alert(product ? "Product updated successfully!" : "Product added successfully!");
        fetchProducts();
        onClose();
    } catch (err) {
        console.error("Error adding/updating product:", err.response?.data);
        alert(err.response?.data?.error || "Failed to add/update product");
    }
};

  return (
    <div className="add-product-container">
      <h2 className="form-title">{product ? "Edit Product" : "Add Product"}</h2>
      <form onSubmit={handleSubmit} className="add-product-form">
        <input
          type="text"
          name="productName"
          value={formData.productName}
          placeholder="Product Name"
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          value={formData.description}
          placeholder="Product Description"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="category"
          value={formData.category}
          placeholder="Category"
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="pricePerDay"
          value={formData.pricePerDay}
          placeholder="Price Per Day"
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="stockQuantity"
          value={formData.stockQuantity}
          placeholder="Stock Quantity"
          onChange={handleChange}
          required
        />

        {/* Show current image when editing */}
        {product && product.imageUrl && !formData.changeImage && (
          <div className="current-image">
            <img
              src={`http://localhost:5000${product.imageUrl}`}
              alt="Current Product"
              className="current-image-preview"
            />
            <p>Current Image</p>
          </div>
        )}

        <input type="file" accept="image/*" onChange={handleImageChange} />

        <div className="button-group">
          <button type="submit" className="submit-btn">
            {product ? "Update Product" : "Add Product"}
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
