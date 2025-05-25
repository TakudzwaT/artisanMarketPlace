import React, { useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from 'react-icons-kit';
import { ic_add } from 'react-icons-kit/md/ic_add';
import { ic_remove } from 'react-icons-kit/md/ic_remove';
import { iosTrashOutline } from 'react-icons-kit/ionicons/iosTrashOutline';
import { auth } from '../firebase';
import { CartContext } from './CartContext';
import Navigation from './nav'; // Assuming your navigation component
import './Cart.css';

export const Cart = ({ user }) => {
  const { shoppingCart, dispatch, totalPrice, totalQty } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleIncrement = (cart) => {
    dispatch({ type: 'INC', id: cart.ProductID, cart });
  };

  const handleDecrement = (cart) => {
    if (cart.qty > 1) {
      dispatch({ type: 'DEC', id: cart.ProductID, cart });
    } else {
      dispatch({ type: 'DELETE', id: cart.ProductID, cart });
    }
  };

  const handleDelete = (cart) => {
    dispatch({ type: 'DELETE', id: cart.ProductID, cart });
  };

  return (
    <>
      <Navigation user={user} />
      <main className="cart-page-container">
        {shoppingCart.length !== 0 && <h1 className="cart-title">Your Shopping Cart</h1>}

        <section className="cart-container">
          {shoppingCart.length === 0 ? (
            <article className="empty-cart">
              <p className="empty-cart-message">Your cart is empty</p>
              <nav className="return-home">
                <Link to="/" className="return-home-link">Continue Shopping</Link>
              </nav>
            </article>
          ) : (
            <>
              <ul className="cart-items">
                {shoppingCart.map(cart => (
                  <li className="cart-card" key={cart.ProductID}>
                    <figure className="cart-img">
                      <img src={cart.ProductImg} alt={cart.ProductName} />
                    </figure>

                    <article className="cart-details">
                      <h3 className="cart-name">{cart.ProductName}</h3>
                      <p className="cart-price-original">Rs {cart.ProductPrice}.00</p>
                    </article>

                    <section className="cart-quantity-controls">
                      <button
                        className="quantity-btn dec"
                        aria-label={`Decrease quantity of ${cart.ProductName}`}
                        onClick={() => handleDecrement(cart)}
                      >
                        <Icon icon={ic_remove} size={20} />
                      </button>
                      <p className="quantity">{cart.qty}</p>
                      <button
                        className="quantity-btn inc"
                        aria-label={`Increase quantity of ${cart.ProductName}`}
                        onClick={() => handleIncrement(cart)}
                      >
                        <Icon icon={ic_add} size={20} />
                      </button>
                    </section>

                    <p className="cart-price">R{cart.TotalProductPrice}.00</p>

                    <button
                      className="delete-btn"
                      aria-label={`Remove ${cart.ProductName} from cart`}
                      onClick={() => handleDelete(cart)}
                    >
                      <Icon icon={iosTrashOutline} size={20} />
                    </button>
                  </li>
                ))}
              </ul>

              <aside
                className="cart-summary"
                aria-label="Order Summary"
                data-testid="order-summary"   // <---- Added this line
              >
                <h3 className="cart-summary-heading">Order Summary</h3>
                <p className="cart-summary-item">Total Items: {totalQty}</p>
                <p className="cart-summary-item">Subtotal: R {totalPrice}.00</p>
                <p className="cart-summary-item">Estimated Shipping: R 0.00</p>
                <p className="cart-summary-total">Total: R {totalPrice}.00</p>
                <Link to="/cashout" className="cashout-link">
                  <button className="checkout-btn">Proceed to Checkout</button>
                </Link>
                <Link to="/" className="continue-shopping-link">Continue Shopping</Link>
              </aside>
            </>
          )}
        </section>
      </main>
    </>
  );
};
