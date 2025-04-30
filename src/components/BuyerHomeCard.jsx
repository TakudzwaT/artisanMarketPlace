import React from 'react';
import { BsFillBagFill } from "react-icons/bs";
import "./BuyerHomeCard.css";

const BuyerHomeCard = ({ img, title, star, reviews, prevPrice, newPrice }) => {
  // Create star display
  const renderStars = () => {
    const starsDisplay = [];
    const rating = parseInt(star) || 0;
    
    for (let i = 0; i < 5; i++) {
      starsDisplay.push(
        <span key={i} className={i < rating ? "rating-star filled" : "rating-star"}>
          ★
        </span>
      );
    }
    
    return starsDisplay;
  };

  return (
    <article className="buyer-card">
      <div className="buyer-card-image-container">
        <img 
          src={img || "/placeholder.jpg"} 
          alt={title || "Product"} 
          className="buyer-card-img" 
        />
      </div>
      
      <div className="buyer-card-details">
        <h3 className="buyer-card-title">{title || "Product"}</h3>
        
        <div className="buyer-card-reviews">
          <div className="buyer-star-rating">
            {renderStars()}
          </div>
          <span className="buyer-total-reviews">({reviews || 0})</span>
        </div>
        
        <div className="buyer-card-price">
          <div className="buyer-price">
            {prevPrice && <del className="buyer-prev-price">{prevPrice}</del>}
            <span className="buyer-new-price">{newPrice}</span>
          </div>
          
          <button className="buyer-bag-button" aria-label="Add to cart">
            <BsFillBagFill className="buyer-bag-icon" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default BuyerHomeCard;
