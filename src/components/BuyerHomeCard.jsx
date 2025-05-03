import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { useCart } from './CartContext';
import { BsFillBagFill, BsCart } from "react-icons/bs";
import './BuyerHomeCard.css';

const BuyerHomeCard = ({ product = {} }) => {
  const { addToCart, shoppingCart } = useCart();
  const auth = getAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    addToCart(product);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const viewCart = () => {
    navigate('/cart');
  };

  return (
    <article className="buyer-card">
      <Link to={`/product/${product.id}`} className="buyer-card-image-container">
        <img
          src={product.imageUrl || "/placeholder.jpg"}
          alt={product.name || "Product"}
          className="buyer-card-img"
        />
      </Link>

      <section className="buyer-card-details">
        <h3 className="buyer-card-title">{product.name || "Product"}</h3>

        <section className="buyer-card-price">
          <section className="buyer-price">
            {product.prevPrice && (
              <del className="buyer-prev-price">R{product.prevPrice}</del>
            )}
            <strong className="buyer-new-price">R{product.price?.toFixed(2)}</strong>
          </section>

          <section className="buyer-card-actions">
            <button
              className="buyer-bag-button"
              aria-label="Add to cart"
              onClick={handleAddToCart}
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
                <em className="cart-badge">{shoppingCart.length}</em>
              )}
            </button>
          </section>
        </section>
      </section>

      {showSuccess && (
        <aside className="success-message fade-in">
          <p>Added to cart successfully!</p>
        </aside>
      )}
    </article>
  );
};

export default BuyerHomeCard;
