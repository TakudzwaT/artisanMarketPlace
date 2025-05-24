import React from 'react';
import { Link } from 'react-router-dom';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
  return (
    <section className="payment-success-container">
      <section className="success-card">
        <h2>Payment Successful!</h2>
        <p className="message">Thank you for your purchase.</p>
        <Link to="/buyer" className="continue-link">Continue Shopping</Link>
      </section>
    </section>
  );
}