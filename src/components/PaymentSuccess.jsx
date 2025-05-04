import React from 'react';
import { Link } from 'react-router-dom';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
  return (
    <div className="payment-success-container">
      <div className="success-card">
        <h2>Payment Successful!</h2>
        <p className="message">Thank you for your purchase.</p>
        <Link to="/buyer" className="continue-link">Continue Shopping</Link>
      </div>
    </div>
  );
}