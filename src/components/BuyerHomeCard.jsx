


import React from "react";
import { BsFillBagFill } from "react-icons/bs";
import "./BuyerHomeCard.css";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";

const BuyerHomeCard = ({ img, title, star, reviews, prevPrice, newPrice, product = {} }) => {
  const { dispatch, shoppingCart } = useCart();
  const navigate = useNavigate();

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

  const addToCart = () => {
    dispatch({
      type: 'ADD',
      item: {
        ProductID: product?.id || Date.now(), // Safe access with optional chaining
        ProductName: title || "Product",
        ProductImg: img || "/placeholder.jpg",
        ProductPrice: newPrice || 0,
        qty: 1,
        TotalProductPrice: newPrice || 0
      }
    });
  };

  const viewCart = () => {
    navigate('/cart'); // Make sure you have a route for '/cart'
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
          
          <div className="buyer-card-actions">
            <button 
              className="buyer-bag-button" 
              aria-label="Add to cart"
              onClick={addToCart}
            >
              <BsFillBagFill className="buyer-bag-icon" />
            </button>
            
            <button 
              className="view-cart-button" 
              onClick={viewCart}
              disabled={shoppingCart.length === 0}
            >
              <BsCart className="cart-icon" />
              {shoppingCart.length > 0 && (
                <span className="cart-badge">{shoppingCart.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BuyerHomeCard;