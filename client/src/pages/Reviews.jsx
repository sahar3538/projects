import React, { useEffect, useState } from 'react';
import './Reviews.css';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/random-reviews");
      const data = await response.json();

      console.log("📝 Reviews API Response:", data);

      if (!data.success) {
        console.error("⚠️ No reviews found:", data.message);
        return;
      }

      setReviews(data.reviews);
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []); // ✅ Proper dependency array

  return (
    <div className="reviews-section">
      <h2>Customer Reviews</h2>
      <div className="reviews-grid">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.reviewId} className="review-card">
              <h3>{review.userName}</h3>
              <p><strong>Product:</strong> {review.productName}</p>
              <p><strong>Rating:</strong> ⭐{review.rating}</p>
              <p>"{review.reviewText}"</p>
            </div>
          ))
        ) : (
          <p>Loading reviews...</p>
        )}
      </div>
    </div>
  );
};

export default Reviews;
