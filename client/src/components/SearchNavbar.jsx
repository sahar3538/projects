import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Navbar.css"; // Use the same CSS

const SearchNavbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <button className="back-btn" onClick={() => navigate("/")}>
        <FaArrowLeft /> Back
      </button>
      <h2>Search Results</h2>
    </nav>
  );
};

export default SearchNavbar;
