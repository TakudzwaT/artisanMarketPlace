import React from 'react';
import { useCart } from './CartContext';
import { Link } from 'react-router-dom';
import './CartPage.css'; // Create this CSS file for styling

const CartPage = () => {
  const { shoppingCart, dispatch, totalPrice, totalQty } = useCart();

  const handleRemove = (productId) => {
    dispatch({ type: 'DELETE', id: productId });
  };

  const handleIncrement = (item) => {
    dispatch({ type: 'INC', id: item.ProductID, cart: item });
  };

  const handleDecrement = (item) => {
    if (item.qty > 1) {
      dispatch({ type: 'DEC', id: item.ProductID, cart: item });
    } else {
      handleRemove(item.ProductID);
    }
  };

  return (
    <div className="cart-container">
      <h1 className="cart-title">Your Shopping Cart</h1>
      
      {shoppingCart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/buyer" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {shoppingCart.map((item) => (
              <div key={item.ProductID} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.ProductImg} alt={item.ProductName} />
                </div>
                <div className="cart-item-details">
                  <h3>{item.ProductName}</h3>
                  <p className="price">Price: Rs {item.ProductPrice}.00</p>
                  <div className="quantity-controls">
                    <button onClick={() => handleDecrement(item)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => handleIncrement(item)}>+</button>
                  </div>
                  <p className="total">Total: Rs {item.TotalProductPrice}.00</p>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemove(item.ProductID)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Total Items:</span>
              <span>{totalQty}</span>
            </div>
            <div className="summary-row total">
              <span>Total Price:</span>
              <span>Rs {totalPrice}.00</span>
            </div>
            <Link to="/checkout" className="checkout-btn">
              Proceed to Checkout
            </Link>
            <Link to="/buyer" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;