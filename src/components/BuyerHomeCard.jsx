// src/components/BuyerHomeCard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { useCart } from '../components/CartContext';
import { BsFillBagFill } from 'react-icons/bs';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './BuyerHomeCard.css';

const BuyerHomeCard = ({ product = {} }) => {
  const { addToCart } = useCart();
  const auth = getAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [stock, setStock] = useState(null);

  // Fetch stock on mount
  useEffect(() => {
    const fetchStock = async () => {
      if (!product.storeId || !product.id) return;
      const productRef = doc(db, 'stores', product.storeId, 'products', product.id);
      const snap = await getDoc(productRef);
      if (snap.exists()) setStock(snap.data().stock);
    };
    fetchStock();
  }, [product.storeId, product.id]);

  const handleAddToCart = () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    addToCart(product);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <article className="buyer-card">
      <Link className="buyer-card-image-container" >
        <img
          src={product.imageUrl || '/placeholder.jpg'}
          alt={product.name}
          className="buyer-card-img"
          loading="eager"
        />
      </Link>

      <section className="buyer-card-details">
        <h3 className="buyer-card-title">{product.name || 'Product'}</h3>

        {/* Stock display: red text if zero, inline style applied */}
        {stock !== null && (
          stock > 0 ? (
            <p className="buyer-card-stock">In stock: {stock}</p>
          ) : (
            <p className="buyer-card-stock" style={{ color: 'red' }}>Out of stock</p>
          )
        )}

        <section className="buyer-card-price">
          <section className="buyer-price">
            {product.prevPrice && (
              <del className="buyer-prev-price">R{product.prevPrice}</del>
            )}
            <strong className="buyer-new-price">
              R{(product.newPrice || product.price)?.toFixed(2)}
            </strong>
          </section>

          <button
            className="buyer-bag-button"
            aria-label="Add to cart"
            onClick={handleAddToCart}
            disabled={stock === 0}
          >+
            <BsFillBagFill className="buyer-bag-icon" />
          </button>
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
