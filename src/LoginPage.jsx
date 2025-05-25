// src/pages/LoginPage.js
import { useState } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import './LoginPage.css'; // Import the CSS file
import React from 'react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (role) => {
    // Special handling for Admin button: navigate directly
    if (role === 'Admin') {
      navigate('/admin/login');
      return;
    }

    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        alert('No account found. Please sign up first.');
        setIsLoading(false); // Ensure loading is off before returning
        return;
      }

      const userData = userSnap.data();

      // Check if the user has the selected role
      if (!userData[role.toLowerCase()]) {
        await signOut(auth);
        alert(`You don't have a ${role} account. Please sign up as a ${role}.`);
        setIsLoading(false); // Ensure loading is off before returning
        return;
      }

      // Store appropriate ID based on role
      if (role === 'Seller') {
        localStorage.setItem('storeId', user.uid);
      } else {
        localStorage.setItem('userId', user.uid);
      }
      
      // FIX: Set isLoading to false *before* navigating
      setIsLoading(false);
      navigate(role === 'Seller' ? '/manage' : '/buyer');
    } catch (error) {
      console.error('Login Error:', error);
      alert('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="loading-container">
        <CircularProgress size={60} className="loading-spinner" />
        <p className="loading-text">Logging in...</p>
      </section>
    );
  }

  return (
    <main className="login-container">
      <section className="login-card">
        <img 
          src="https://cdn-icons-png.flaticon.com/512/6738/6738021.png" 
          alt="Market Icon" 
          className="login-logo"
        />
        <h1 className="login-title">Artisan Market</h1>
        <p className="login-subtitle">Handcrafted treasures await</p>
        
        <section className="button-container">
          <button 
            onClick={() => handleLogin('Buyer')}
            className="buyer-button"
          >
            <img 
              src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
              alt="Google" 
              className="icon"
            />
            Continue as Buyer
          </button>
          
          <button 
            onClick={() => handleLogin('Seller')}
            className="seller-button"
          >
            <img 
              src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
              alt="Google" 
              className="icon"
            />
            Continue as Seller
          </button>
          <button
            onClick={() => handleLogin('Admin')}
            className="admin-button"
          >
            <img 
              src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
              alt="Admin Icon" 
              className="icon"
            />
            Continue as Admin
          </button>
        </section>
      </section>
    </main>
  );
}