import React, { useContext, useEffect } from 'react';
import { Navigation } from './nav';
import { Icon } from 'react-icons-kit';
import { ic_add } from 'react-icons-kit/md/ic_add';
import { ic_remove } from 'react-icons-kit/md/ic_remove';
import { iosTrashOutline } from 'react-icons-kit/ionicons/iosTrashOutline';
import { Link } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { auth } from '../firebase';
import { CartContext } from './CartContext';
import './Cart.css'; // Make sure to create this CSS file

export const Cart = ({ user }) => {
    const { shoppingCart, dispatch, totalPrice, totalQty } = useContext(CartContext);
    const history = useHistory();

    useEffect(() => {
        auth.onAuthStateChanged(user => {
            if (!user) {
                history.push('/login');
            }
        });
    }, [history]);

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
            <Navbar user={user} />
            <div className="cart-page-container">
                {shoppingCart.length !== 0 && <h1 className="cart-title">Your Shopping Cart</h1>}
                
                <div className='cart-container'>
                    {shoppingCart.length === 0 ? (
                        <div className="empty-cart">
                            <div className="empty-cart-message">
                                Your cart is empty
                            </div>
                            <div className="return-home">
                                <Link to="/" className="return-home-link">
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items">
                                {shoppingCart.map(cart => (
                                    <div className='cart-card' key={cart.ProductID}>
                                        <div className='cart-img'>
                                            <img src={cart.ProductImg} alt={cart.ProductName} />
                                        </div>

                                        <div className='cart-details'>
                                            <div className='cart-name'>{cart.ProductName}</div>
                                            <div className='cart-price-original'>Rs {cart.ProductPrice}.00</div>
                                        </div>

                                        <div className='cart-quantity-controls'>
                                            <button className='quantity-btn dec' onClick={() => handleDecrement(cart)}>
                                                <Icon icon={ic_remove} size={20} />
                                            </button>
                                            <div className='quantity'>{cart.qty}</div>
                                            <button className='quantity-btn inc' onClick={() => handleIncrement(cart)}>
                                                <Icon icon={ic_add} size={20} />
                                            </button>
                                        </div>

                                        <div className='cart-price'>
                                            R {cart.TotalProductPrice}.00
                                        </div>

                                        <button className='delete-btn' onClick={() => handleDelete(cart)}>
                                            <Icon icon={iosTrashOutline} size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className='cart-summary'>
                                <h3 className='cart-summary-heading'>Order Summary</h3>
                                <div className='cart-summary-item'>
                                    <span>Total Items:</span>
                                    <span>{totalQty}</span>
                                </div>
                                <div className='cart-summary-item'>
                                    <span>Subtotal:</span>
                                    <span>R {totalPrice}.00</span>
                                </div>
                                <div className='cart-summary-item'>
                                    <span>Estimated Shipping:</span>
                                    <span>R 0.00</span>
                                </div>
                                <div className='cart-summary-total'>
                                    <span>Total:</span>
                                    <span>R {totalPrice}.00</span>
                                </div>
                                <Link to='cashout' className='cashout-link'>
                                    <button className='checkout-btn'>
                                        Proceed to Checkout
                                    </button>
                                </Link>
                                <Link to="/" className="continue-shopping-link">
                                    Continue Shopping
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};