import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: "",
    userPhoneNumber: "",
    userEmail: "",
    userAddress: "",
    userPassword: "",
    confirmPassword: "",
    role: "renter",
  });

  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError({ ...error, [e.target.name]: "" }); // Clear error on input change
  };

  // Validate Individual Fields onBlur (when user leaves a field)
  const validateField = (name, value) => {
    let errorMessage = "";

    switch (name) {
      case "userName":
        if (!value.trim()) errorMessage = "Full Name is required.";
        else if (!/^[A-Za-z\s]+$/.test(value)) errorMessage = "Only letters are allowed.";
        break;
      case "userPhoneNumber":
        if (!value.trim()) errorMessage = "Phone Number is required.";
        else if (!/^\d{10}$/.test(value)) errorMessage = "Phone number must be 10 digits.";
        break;
        case "userEmail":
          if (!value.trim()) {
              errorMessage = "Email is required.";
          } else if (!/^[^\s@]+@[A-Za-z]+[A-Za-z0-9.-]*\.[A-Za-z]{2,}$/.test(value)) {
              errorMessage = "Invalid email format.";
          }
          break;
      

      case "userAddress":
        if (!value.trim()) errorMessage = "Address is required.";
        break;
      case "userPassword":
        if (!value.trim()) errorMessage = "Password is required.";
        else if (value.length < 6) errorMessage = "Password must be at least 6 characters.";
        break;
      case "confirmPassword":
        if (!value.trim()) errorMessage = "Confirm Password is required.";
        else if (value !== formData.userPassword) errorMessage = "Passwords do not match.";
        break;
      default:
        break;
    }

    setError((prevErrors) => ({ ...prevErrors, [name]: errorMessage }));
  };

  // Form Submit Validation
  const validateForm = () => {
    let errors = {};
    Object.keys(formData).forEach((key) => validateField(key, formData[key]));
    return Object.values(errors).every((msg) => msg === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
      if (!response.ok) {
        setError({ server: data.error || "Registration failed." });
        setLoading(false);
        return;
      }
  
      alert("Registration Successful!");
      navigate("/login");
    } catch (err) {
      setError({ server: "Error connecting to server. Please try again later." });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="register-container">
      <h2>Register</h2>
      {error.server && <p className="error-message">{error.server}</p>}

      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          name="userName"
          placeholder="Full Name"
          value={formData.userName}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
        />
        {error.userName && <p className="error-text">{error.userName}</p>}

        <input
          type="tel"
          name="userPhoneNumber"
          placeholder="Phone Number"
          value={formData.userPhoneNumber}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
        />
        {error.userPhoneNumber && <p className="error-text">{error.userPhoneNumber}</p>}

        <input
          type="email"
          name="userEmail"
          placeholder="Email Address"
          value={formData.userEmail}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
        />
        {error.userEmail && <p className="error-text">{error.userEmail}</p>}

        <input
          type="text"
          name="userAddress"
          placeholder="Address"
          value={formData.userAddress}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
        />
        {error.userAddress && <p className="error-text">{error.userAddress}</p>}

        <input
          type="password"
          name="userPassword"
          placeholder="Password"
          value={formData.userPassword}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
        />
        {error.userPassword && <p className="error-text">{error.userPassword}</p>}

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
        />
        {error.confirmPassword && <p className="error-text">{error.confirmPassword}</p>}

        <label>Register as:</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="renter">Renter</option>
          <option value="lender">Lender</option>
        </select>

        <button type="submit" className="register-btn" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default Register;
