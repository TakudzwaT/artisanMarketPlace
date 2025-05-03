// src/components/LoadCredits.jsx
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './LoadCredits.css';

export default function LoadCredits() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const auth = getAuth();

  const handleLoad = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setMessage('Enter a valid amount');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setMessage('Please login first');
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const current = snap.exists() && snap.data().credits ? snap.data().credits : 0;
      await updateDoc(userRef, { credits: current + value });
      setMessage(`Successfully loaded R${value.toFixed(2)}`);
      setAmount('');
    } catch (err) {
      console.error('Failed to load credits', err);
      setMessage('Error loading credits');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <section className="load-credits">
      <label htmlFor="credit-amount">Load Credits:</label>
      <input
        id="credit-amount"
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="R0.00"
      />
      <button onClick={handleLoad} disabled={loading}>
        {loading ? 'Loading...' : 'Load'}
      </button>
      {message && <p className="message">{message}</p>}
    </section>
  );
}