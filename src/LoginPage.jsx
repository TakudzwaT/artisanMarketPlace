// src/pages/LoginPage.js
import { useState } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (role) => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        alert('No account found. Please sign up first.');
        setIsLoading(false);
        return;
      }

      const userData = userSnap.data();

      if (!userData[role.toLowerCase()]) {
        await signOut(auth);
        alert(`You don't have a ${role} account. Please sign up as a ${role}.`);
        setIsLoading(false);
        return;
      }

      // Store appropriate ID based on role
      if (role === 'Seller') {
        localStorage.setItem('storeId', user.uid);
      } else {
        localStorage.setItem('userId', user.uid);
      }
      
      navigate(role === 'Seller' ? '/manage' : '/buyer');
    } catch (error) {
      console.error('Login Error:', error);
      alert('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section style={styles.loadingContainer}>
        <CircularProgress size={60} style={{ color: '#6D4C41' }} />
        <p style={styles.loadingText}>Logging in...</p>
      </section>
    );
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
  <img 
    src="https://cdn-icons-png.flaticon.com/512/6738/6738021.png" 
    alt="Market Icon" 
    style={styles.logo}
  />
        <h1 style={styles.title}>Artisan Market</h1>
        <p style={styles.subtitle}>Handcrafted treasures await</p>
        
        <section style={styles.buttonContainer}>
          <button 
            onClick={() => handleLogin('Buyer')}
            style={styles.buyerButton}
          >
            <img 
              src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
              alt="Google" 
              style={styles.icon}
            />
            Continue as Buyer
          </button>
          
          <button 
            onClick={() => handleLogin('Seller')}
            style={styles.sellerButton}
          >
            <img 
              src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
              alt="Google" 
              style={styles.icon}
            />
            Continue as Seller
          </button>
          <button
  onClick={() => navigate('/admin/login')}
  style={styles.adminButton}
>
  <img 
    src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
    alt="Admin Icon" 
    style={styles.icon}
  />
  Continue as Admin
</button>
        </section>
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5e9dd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '450px',
    width: '100%',
  },
  logo: {
    width: '80px',
    marginBottom: '20px',
  },
  title: {
    color: '#4B3621',
    fontSize: '2rem',
    margin: '0 0 8px 0',
    fontWeight: '700',
  },
  subtitle: {
    color: '#7a6552',
    fontSize: '1rem',
    marginBottom: '40px',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  buyerButton: {
    backgroundColor: '#DBA159',
    color: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'transform 0.2s, background-color 0.2s',
  },
  sellerButton: {
    backgroundColor: '#A9744F',
    color: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'transform 0.2s, background-color 0.2s',
  },
  icon: {
    width: '20px',
    height: '20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5e9dd',
  },
  adminButton: {
    backgroundColor: '#6D4C41',
    color: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'transform 0.2s, background-color 0.2s',
  },
  
  loadingText: {
    marginTop: '20px',
    color: '#6D4C41',
    fontSize: '1.2rem',
  },
};

['buyerButton', 'sellerButton'].forEach(key => {
  styles[key][':hover'] = {
    transform: 'translateY(-2px)',
  };
  styles[key][':active'] = {
    transform: 'translateY(0)',
  };
});