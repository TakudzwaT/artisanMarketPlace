import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from './CartContext';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './BuyerHomeCard.css';

const BuyerHomeCard = ({ product }) => {
  const { addToCart } = useCart();
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
    
    // Hide the success message after 2 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-link">
        <figure className="product-image">
          <img src={product.imageUrl || "/placeholder.jpg"} alt={product.name} />
        </figure>
        <section className="product-info">
          <h3 className="product-title">{product.name || "Product"}</h3>
          {product.star && (
            <figure className="product-rating">
              <figcaption className="stars">{"★".repeat(product.star)}</figcaption>
              <figcaption className="reviews">({product.reviews || 0} reviews)</figcaption>
            </figure>
          )}
          <section className="product-price">
            {product.prevPrice && (
              <del className="prev-price">R{product.prevPrice}</del>
            )}
            <strong className="current-price">R{product.price?.toFixed(2)}</strong>
          </section>
        </section>
      </Link>
      <button
        className="add-to-cart-btn"
        onClick={handleAddToCart}
        aria-label={`Add ${product.name} to cart`}
      >
        Add to Cart
      </button>
      
      {/* Success message overlay */}
      {showSuccess && (
        <aside className="success-message fade-in">
          <p>Added to cart successfully!</p>
        </aside>
      )}
    </article>
  );
};

export default BuyerHomeCard;