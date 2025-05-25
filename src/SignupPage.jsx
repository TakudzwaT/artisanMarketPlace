import {useState } from 'react';
import React from 'react'; 
import { auth, provider, db } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { Google, Storefront, ShoppingBag } from '@mui/icons-material';
import './signup.css'; // Import the CSS file

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (role) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, {
          [role.toLowerCase()]: true,
        });
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          buyer: role === 'Buyer',
          seller: role === 'Seller',
          createdAt: new Date()
        });
      }

      // Store appropriate ID based on role
      if (role === 'Seller') {
        localStorage.setItem('storeId', user.uid);
      } else {
        localStorage.setItem('userId', user.uid);
      }
      
      navigate(role === 'Seller' ? '/createStore' : '/buyer');
    } catch (error) {
      console.error('Signup Error:', error);
      setError(error.message || 'Sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-container">
      <section className="signup-card">
        {/* Market Logo */}
        <img
          src="https://cdn-icons-png.flaticon.com/512/6738/6738021.png"
          alt="Market Logo"
          className="signup-logo"
        />

        <h1 className="signup-title">Join Artisan Market</h1>
        <p className="signup-subtitle">Choose your role to get started</p>
        
        {loading ? (
          <section className="loading-container">
            <CircularProgress size={40} className="loading-spinner" />
            <p>Creating your account...</p>
          </section>
        ) : (
          <>
            <section className="button-container">
              <button 
                onClick={() => handleSignup('Buyer')}
                className="role-button buyer-button"
                disabled={loading}
              >
                <Google />
                <ShoppingBag />
                Continue as Buyer
              </button>
              
              <button 
                onClick={() => handleSignup('Seller')}
                className="role-button seller-button"
                disabled={loading}
              >
                <Google />
                <Storefront />
                Continue as Seller
              </button>
            </section>

            {error && <p className="error-message">{error}</p>}

            <p className="signin-message">
              Already have an account? <br />
              Just sign in with Google - we'll recognize your account!
            </p>
          </>
        )}
      </section>
    </main>
  );
}