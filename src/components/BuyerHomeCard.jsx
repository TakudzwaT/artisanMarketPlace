import React from "react";
import { BsFillBagFill, BsCart } from "react-icons/bs";
import "./BuyerHomeCard.css";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";

const BuyerHomeCard = ({ img, title, star, reviews, prevPrice, newPrice, product = {} }) => {
  const { dispatch, shoppingCart } = useCart();
  const navigate = useNavigate();

  const renderStars = () => {
    const starsDisplay = [];
    const rating = parseInt(star) || 0;

    for (let i = 0; i < 5; i++) {
      starsDisplay.push(
        <em key={i} className={i < rating ? "rating-star filled" : "rating-star"}>
          ★
        </em>
      );
    }

    return starsDisplay;
  };

  const addToCart = () => {
    dispatch({
      type: 'ADD',
      item: {
        ProductID: product?.id || Date.now(),
        ProductName: title || "Product",
        ProductImg: img || "/placeholder.jpg",
        ProductPrice: newPrice || 0,
        qty: 1,
        TotalProductPrice: newPrice || 0
      }
    });
  };

  const viewCart = () => {
    navigate('/cart');
  };

  return (
    <article className="buyer-card">
      <figure className="buyer-card-image-container">
        <img
          src={img || "/placeholder.jpg"}
          alt={title || "Product"}
          className="buyer-card-img"
        />
      </figure>

      <main className="buyer-card-details">
        <header>
          <h3 className="buyer-card-title">{title || "Product"}</h3>
        </header>

        {/* 
        <section className="buyer-card-reviews">
          <aside className="buyer-star-rating">
            {renderStars()}
          </aside>
          <strong className="buyer-total-reviews">({reviews || 0})</strong>
        </section>
        */}

        <section className="buyer-card-price">
          <strong className="buyer-new-price">{newPrice}</strong>

          <footer className="buyer-card-actions">
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
                <strong className="cart-badge">{shoppingCart.length}</strong>
              )}
            </button>
          </footer>
        </section>
      </main>
    </article>
  );
};

export default BuyerHomeCard;
