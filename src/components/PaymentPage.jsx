// src/pages/PaymentPage.jsx
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
    if (!user) return;
    if (isNaN(amt) || amt < 1) {
      setErrorMsg('Please enter a valid amount to load.');
      setSuccessMsg('');
      return;
    }
    if (amt > 10000) {
      setErrorMsg('You can load a maximum of 10000 credits at once.');
      setSuccessMsg('');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { credits: credits + amt });
      setCredits(prev => prev + amt);
      setSuccessMsg(`Added ${amt} credits successfully.`);
      setErrorMsg('');
      setAmountToAdd('');
    } catch {
      setErrorMsg('Failed to add credits. Please try again.');
      setSuccessMsg('');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (credits < totalAmount) {
      setErrorMsg('Insufficient credits to complete the purchase.');
      setSuccessMsg('');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Check all product stock before continuing
      for (const item of shoppingCart) {
        const productRef = doc(db, 'stores', item.storeId, 'products', item.productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          throw new Error(`Product ${item.name} no longer exists.`);
        }

        const currentStock = productSnap.data().stock;
        if (item.qty > currentStock) {
          throw new Error(`Not enough stock for ${item.name}. Available: ${currentStock}, In cart: ${item.qty}`);
        }
      }

      // 2. Deduct user credits
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { credits: credits - totalAmount });

      // 3. Create order document
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
          storeId: item.storeId,
          status: 'pending'
        })),
        total: totalAmount,
        createdAt: serverTimestamp()
      });

      // 4. Reflect in each store's orders + update product stock and status
      for (const item of shoppingCart) {
        const productRef = doc(db, 'stores', item.storeId, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        const currentStock = productSnap.data().stock;

        // Create store-specific order record
        const storeOrderRef = doc(collection(db, 'stores', item.storeId, 'orders'));
        await setDoc(storeOrderRef, {
          orderId: orderRef.id,
          productId: item.productId || item.id,
          qty: item.qty,
          status: 'pending',
          purchasedAt: serverTimestamp()
        });

        // Calculate new stock
        const newStock = currentStock - item.qty;
        // Update stock and flag out-of-stock status
        await updateDoc(productRef, {
          stock: newStock,
          ...(newStock === 0 && { status: 'out_of_stock' })
        });
      }

      // 5. Clear cart & navigate
      await clearCart();
      navigate('/payment-success');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Payment failed. Please try again.');
      setSuccessMsg('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="payment-page-container">
      <section className="payment-card">
        <h2>Payment</h2>
        <p className="info">Order Total: R{totalAmount.toFixed(2)}</p>
        <p className="info">Your Credits: {credits}</p>

        <section className="load-credits">
          <input
            type="number"
            min="1"
            placeholder="Enter credits to load (max 10000)"
            value={amountToAdd}
            onChange={e => setAmountToAdd(e.target.value)}
          />
          <button onClick={handleAddCredits} disabled={loading}>Load Credits</button>
        </section>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}
        {successMsg && <p className="success-msg">{successMsg}</p>}

        <button className="pay-btn" onClick={handlePay} disabled={loading}>Pay with Credits</button>
        <Link to="/cart" className="back-link">Back to Cart</Link>
      </section>
    </main>
  );
}
