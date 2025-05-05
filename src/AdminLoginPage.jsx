import { useState } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || !userSnap.data().admin) {
        await signOut(auth);
        setError('Admin privileges required');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('adminId', user.uid);
      localStorage.setItem('adminEmail', user.email);
      navigate('/admin/dashboard');
      
    } catch (error) {
      console.error('Admin Login Error:', error);
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const goToLandingPage = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <main style={styles.loadingContainer}>
        <CircularProgress size={60} style={{ color: '#6D4C41' }} />
        <p style={styles.loadingText}>Logging in...</p>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <img 
          src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png" 
          alt="Market Logo" 
          style={styles.logo}
        />
        <h1 style={styles.title}>Artisan Market</h1>
        <p style={styles.subtitle}>Admin Portal</p>
        
        {error && <p style={styles.errorMessage}>{error}</p>}
        
        <nav style={styles.buttonContainer}>
          <button 
            onClick={handleAdminLogin}
            style={styles.adminButton}
          >
            <img 
              src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
              alt="Google" 
              style={styles.icon}
            />
            Login as Admin
          </button>
          <button 
            onClick={goToLandingPage}
            style={styles.homeButton}
          >
            ← Back to Home
          </button>
        </nav>
        
        <p style={styles.note}>
          Only authorized administrators can access this portal.
        </p>
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
  adminButton: {
    backgroundColor: '#3E2723',
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
  homeButton: {
    backgroundColor: 'transparent',
    color: '#4B3621',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #4B3621',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
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
  loadingText: {
    marginTop: '20px',
    color: '#6D4C41',
    fontSize: '1.2rem',
  },
  errorMessage: {
    color: '#D32F2F',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#FFEBEE',
    borderRadius: '8px',
  },
  note: {
    fontSize: '0.9rem',
    color: '#7a6552',
    marginTop: '30px',
  }
};

// Add hover effects
['adminButton', 'homeButton'].forEach(key => {
  styles[key][':hover'] = {
    transform: 'translateY(-2px)',
  };
  styles[key][':active'] = {
    transform: 'translateY(0)',
  };
});