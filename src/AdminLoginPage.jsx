import React,{ useState } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import './AdminLoginPage.css'; // Import the CSS file

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async () => {
    try {
      setIsLoading(true);
      setError(''); // Clear previous errors
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // Check if user exists and has admin privileges
      if (!userSnap.exists() || !userSnap.data().admin) {
        await signOut(auth); // Sign out non-admin user
        setError('Admin privileges required.');
        setIsLoading(false);
        return;
      }

      // Successful admin login
      localStorage.setItem('adminId', user.uid);
      localStorage.setItem('adminEmail', user.email);
      navigate('/admin/dashboard');

    } catch (firebaseError) {
      // Catch specific Firebase errors if needed, otherwise a generic message
      console.error('Admin Login Error:', firebaseError);
      setError('Login failed. Please check your internet connection or try again.');
    } finally {
      // Ensure loading state is reset even if navigation happens quickly
      setIsLoading(false);
    }
  };

  const goToLandingPage = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <main className="loading-screen">
        <CircularProgress size={60} style={{ color: '#6D4C41' }} data-testid="loading-spinner" />
        <p className="loading-text">Logging in...</p>
      </main>
    );
  }

  return (
    <main className="login-container">
      <section className="login-card">
        <img
          src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
          alt="Market Logo"
          className="login-logo"
          data-testid="market-logo"
        />
        <h1 className="login-title">Artisan Market</h1>
        <p className="login-subtitle">Admin Portal</p>

        {error && <p className="error-message" data-testid="error-message">{error}</p>}

        <nav className="button-group">
          <button
            onClick={handleAdminLogin}
            className="login-button admin"
            data-testid="admin-login-button"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
              alt="Google icon"
              className="button-icon"
            />
            Login as Admin
          </button>
          <button
            onClick={goToLandingPage}
            className="login-button home"
            data-testid="home-button"
          >
            ← Back to Home
          </button>
        </nav>

        <p className="login-note">
          Only authorized administrators can access this portal.
        </p>
      </section>
    </main>
  );
}