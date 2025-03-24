import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Import useNavigate for navigation
import './Home.css';
import Reviews from './Reviews';

const Home = ({ highlightSection }) => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate(); // ✅ Initialize navigation
  const aboutSectionRef = useRef(null);
  const productsSectionRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  const contactSectionRef = useRef(null);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/random-database"); // Updated API endpoint
      const data = await response.json();

      console.log("📦 API Response:", data); // Debugging log

      if (!data.success) {
        console.error("⚠️ No products found:", data.message);
        return;
      }

      setProducts(data.products); // ✅ Correctly store products in state
    } catch (error) {
      console.error("❌ Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Section Scrolling
  useEffect(() => {
    const scrollToSection = (ref) => {
      if (ref.current) {
        ref.current.scrollIntoView({ behavior: 'smooth' });
        ref.current.classList.add('highlight-border');
        setTimeout(() => ref.current.classList.remove('highlight-border'), 2000);
      }
    };

    if (highlightSection === 'about') scrollToSection(aboutSectionRef);
    if (highlightSection === 'features') scrollToSection(productsSectionRef);
    if (highlightSection === 'reviews') scrollToSection(reviewsSectionRef);
    if (highlightSection === 'contact') scrollToSection(contactSectionRef);
  }, [highlightSection]);

  return (
    <div className="main-content">
      {/* About Section */}
      <section ref={aboutSectionRef} className="about-section">
        <div className='about-content'>
          <h2>About Us</h2>
          <p>
            Welcome to <strong>GlamGear</strong>, your go-to accessories rental platform!<br />
          </p>
          <p>
            Whether you need a stunning piece for a special occasion or want <br />
            to try different styles before making a purchase, we’ve got you covered.<br />
            <br />
            Our platform offers a wide selection of earrings, necklaces, <br />
            bracelets, and more—ensuring you always find the <br />
            perfect match for any event.<br />
            <br />Search the product that you want to rent and get your accessories delivered at your doorstep.
            <br />
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section ref={productsSectionRef} className="products-section">
        <h2>Available Products</h2>
        <div className="products-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.productId} className="product-card">
                <img 
                  src={product.fullImageURL || '/fallback.jpg'} 
                  alt={product.productName} 
                  className="product-image" 
                />
                <h3>{product.productName}</h3>
                <p>{product.description}</p>
                <p className="product-price">₹{product.pricePerDay}/day</p>
                <button 
                  className="rent-button"
                  onClick={() => navigate(`/product/${product.productId}`)} // ✅ Navigate to product details page
                >
                  View
                </button>
              </div>
            ))
          ) : (
            <p>Loading products...</p>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section ref={reviewsSectionRef}>
        <Reviews />
      </section>

      {/* Contact Section */}
      <section ref={contactSectionRef} className="contact-section">
        <div className="contact-content">
          <h2>Contact Us</h2>
          <p>
            Have any questions or need assistance? Reach out to us!  
            We’d love to hear from you and help in any way we can.
          </p>
          <p>Contact: 78xxxxxxxx</p>          
          <p>Email: saloni112@gmail.com</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
