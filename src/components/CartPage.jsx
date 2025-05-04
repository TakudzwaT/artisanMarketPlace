import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { useCart } from './CartContext';
import Navbar from './nav';
import './CartPage.css';

export default function CartPage() {
  const { shoppingCart, totalPrice, totalQty, loading, incrementItem, decrementItem, removeItem } = useCart();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) navigate('/login');
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleProceed = () => navigate('/payment', { state: { totalAmount: totalPrice } });

  if (loading) {
    return (
      <main className="cart-container">
        <Navbar />
        <section className="loading-container animate-pulse">
          <p>Loading your cart...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-container fade-in">
      <Navbar />
      <header>
        <h1 className="cart-title">Your Shopping Cart</h1>
      </header>

      {shoppingCart.length === 0 ? (
        <section className="empty-cart slide-up">
          <p>Your cart is empty</p>
          <Link to="/buyer" className="continue-shopping">
            Continue Shopping
          </Link>
        </section>
      ) : (
        <>
          <section className="cart-items">
            {shoppingCart.map(item => (
              <article key={item.id} className="cart-item slide-in">
                <figure className="cart-item-image">
                  <img src={item.imageUrl} alt={item.name} />
                </figure>
                <section className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p className="price">Price: R {item.price.toFixed(2)}</p>
                  <section className="quantity-controls">
                    <button type="button" onClick={() => decrementItem(item)} aria-label="Decrease quantity">-</button>
                    <span className="quantity">{item.qty}</span>
                    <button type="button" onClick={() => incrementItem(item)} aria-label="Increase quantity">+</button>
                  </section>
                  <p className="total">Total: R {item.totalProductPrice.toFixed(2)}</p>
                </section>
                <button type="button" className="remove-btn" onClick={() => removeItem(item)} aria-label="Remove item">
                  Remove
                </button>
              </article>
            ))}
          </section>

          <aside className="cart-summary slide-up">
            <h3>Order Summary</h3>
            <section className="summary-row">
              <p>Total Items:</p>
              <p>{totalQty}</p>
            </section>
            <section className="summary-row total">
              <p>Total Price:</p>
              <p>R {totalPrice.toFixed(2)}</p>
            </section>
            <button type="button" className="checkout-btn" onClick={handleProceed}>
              Proceed to Checkout
            </button>
            <Link to="/buyer" className="continue-shopping">
              Continue Shopping
            </Link>
          </aside>
        </>
      )}
    </main>
  );
}