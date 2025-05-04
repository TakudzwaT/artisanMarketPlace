import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { useCart } from '../components/CartContext';
import './PaymentPage.css';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const totalAmount = state?.totalAmount ?? 0;
  const auth = getAuth();
  const user = auth.currentUser;
  const { shoppingCart, clearCart } = useCart();

  const [credits, setCredits] = useState(0);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then(docSnap => {
        if (docSnap.exists()) setCredits(docSnap.data().credits || 0);
      });
    }
  }, [user]);

  const handleAddCredits = async () => {
    const amt = parseInt(amountToAdd, 10);
    if (!user || isNaN(amt) || amt < 1) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { credits: credits + amt });
      setCredits(c => c + amt);
      setSuccessMsg(`Added ${amt} credits successfully.`);
      setErrorMsg('');
      setAmountToAdd('');
    } catch {
      setErrorMsg('Failed to add credits.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (credits < totalAmount) {
      setErrorMsg('Insufficient credits to complete the purchase.');
      return;
    }
    setLoading(true);
    try {
      // Deduct credits
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { credits: credits - totalAmount });

      // Create order document
      const orderRef = doc(collection(db, 'orders'));
      await setDoc(orderRef, {
        id: orderRef.id,
        userId: user.uid,
        items: shoppingCart.map(item => ({
          productId: item.productId || item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          total: item.totalProductPrice,
          storeId: item.storeId
        })),
        total: totalAmount,
        createdAt: serverTimestamp()
      });

      // Reflect in each store's orders
      for (const item of shoppingCart) {
        const storeOrderRef = doc(collection(db, 'stores', item.storeId, 'orders'));
        await setDoc(storeOrderRef, {
          orderId: orderRef.id,
          productId: item.productId || item.id,
          qty: item.qty,
          purchasedAt: serverTimestamp()
        });
      }

      // Clear cart
      await clearCart();

      navigate('/payment-success');
    } catch (err) {
      console.error(err);
      setErrorMsg('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page-container">
      <div className="payment-card">
        <h2>Payment</h2>
        <p className="info">Order Total: R{totalAmount.toFixed(2)}</p>
        <p className="info">Your Credits: {credits}</p>

        <div className="load-credits">
          <input
            type="number"
            min="1"
            placeholder="Enter credits to load"
            value={amountToAdd}
            onChange={e => setAmountToAdd(e.target.value)}
          />
          <button onClick={handleAddCredits} disabled={loading}>Load Credits</button>
        </div>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}
        {successMsg && <p className="success-msg">{successMsg}</p>}

        <button className="pay-btn" onClick={handlePay} disabled={loading}>Pay with Credits</button>
        <Link to="/cart" className="back-link">Back to Cart</Link>
      </div>
    </div>
  );
}