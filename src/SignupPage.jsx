// src/pages/SignupPage.js
import { useState } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { Google, Storefront, ShoppingBag } from '@mui/icons-material';

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

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f5f2',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Inter', sans-serif"
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '3rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      textAlign: 'center',
      maxWidth: '500px',
      width: '100%'
    },
    title: {
      color: '#4B3621',
      fontSize: '2rem',
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#7a6552',
      fontSize: '1rem',
      marginBottom: '2rem'
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    roleButton: {
      padding: '1.2rem',
      borderRadius: '12px',
      border: 'none',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem'
    },
    buyerButton: {
      backgroundColor: '#DBA159',
      color: 'white'
    },
    sellerButton: {
      backgroundColor: '#A9744F',
      color: 'white'
    },
    errorMessage: {
      color: '#dc3545',
      marginTop: '1.5rem',
      fontSize: '0.9rem'
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem'
    }
  };

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h1 style={styles.title}>Join Artisan Market</h1>
        <p style={styles.subtitle}>Choose your role to get started</p>
        
        {loading ? (
          <section style={styles.loadingContainer}>
            <CircularProgress size={40} style={{ color: '#6D4C41' }} />
            <p>Creating your account...</p>
          </section>
        ) : (
          <>
            <section style={styles.buttonContainer}>
              <button 
                onClick={() => handleSignup('Buyer')}
                style={{ ...styles.roleButton, ...styles.buyerButton }}
                disabled={loading}
              >
                <Google />
                <ShoppingBag />
                Continue as Buyer
              </button>
              
              <button 
                onClick={() => handleSignup('Seller')}
                style={{ ...styles.roleButton, ...styles.sellerButton }}
                disabled={loading}
              >
                <Google />
                <Storefront />
                Continue as Seller
              </button>
            </section>

            {error && <p style={styles.errorMessage}>{error}</p>}

            <p style={{ marginTop: '2rem', color: '#7a6552' }}>
              Already have an account? <br />
              Just sign in with Google - we'll recognize your account!
            </p>
          </>
        )}
      </section>
    </main>
  );
}