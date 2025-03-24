import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Navbar.css";
import { Heart, ShoppingBag, UserCircle, LogIn } from "lucide-react";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")) || null);
  const navigate = useNavigate();

  // 🔄 Keep user state in sync with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle login
  const handleLogin = () => {
    fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Login Response:", data); // Debugging response
        if (data.success) {
          alert("Login Successful!");

          // 🌟 Store user object and userId separately
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("userId", data.user.userId);  // ✅ Store userId
          localStorage.setItem("role", data.user.role);  // ✅ Store role separately
          console.log("Stored Role in LocalStorage:", localStorage.getItem("role"));


          setUser(data.user);
          setShowModal(false);

          // 🌟 Navigate based on role
          console.log("Navigating to:", data.user.role === "lender" ? "/lender-dashboard" : "/");
          navigate(data.user.role === "lender" ? "/lender-dashboard" : "/");
        } else {
          alert("Invalid email or password!");
        }
      })
      .catch(() => alert("Error logging in!"));
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");  // ✅ Remove userId on logout
    setUser(null);
    setShowProfileDropdown(false);
    navigate("/");
  };

  // 📌 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showProfileDropdown &&
        !event.target.closest(".profile-dropdown") // Changed from `.dropdown-menu`
      ) {
        setShowProfileDropdown(false);
      }
    };
  
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showProfileDropdown]);
  

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="Brand Logo" />
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleSearch}>🔍</button>
        </div>

        <ul className="nav-links">
          <li>
            <Link to="/wishlist" className="nav-item">
              <Heart size={24} strokeWidth={1.5} />
              <span>Wishlist</span>
            </Link>
          </li>
          <li>
            <Link to="/cart" className="nav-item">
              <ShoppingBag size={24} strokeWidth={1.5} />
              <span>Bag</span>
            </Link>
          </li>

          {user ? (
            <li className="profile-dropdown">
              <div
                className="nav-item"
                onClick={() => setShowProfileDropdown((prev) => !prev)}
              >
                <UserCircle size={24} strokeWidth={1.5} />
                <span>Profile</span>
              </div>

              {showProfileDropdown && (
                <div className="dropdown-menu-container">
                  <div className="dropdown-items" onClick={() => navigate("/orders")}>
                    Your Order
                  </div>
                  <div className="dropdown-items" onClick={handleLogout}>Logout</div>
                </div>
              )}
            </li>
          ) : (
            <li>
              <div className="nav-item" onClick={() => setShowModal(true)}>
                <LogIn size={24} strokeWidth={1.5} />
                <span>Sign-in</span>
              </div>
            </li>
          )}
        </ul>
      </nav>

      {/* Login Modal */}
      {showModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowModal(false)}></div>
          <div className="signin-modal">
            <FaTimes className="close-modal" onClick={() => setShowModal(false)} />
            <h2>Login</h2>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="login-btn" onClick={handleLogin}>LOGIN</button>

            <p className="toggle-text">
              Not a member?{" "}
              <span
                onClick={() => {
                  setShowModal(false);
                  navigate("/register");
                }}
                className="toggle-link"
              >
                Sign up now
              </span>
            </p>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
