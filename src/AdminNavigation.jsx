import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export default function AdminNavigation() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminEmail');
      navigate('/admin/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <nav style={styles.nav}>
      <header style={styles.navContent}>
        <h1 style={styles.brand}>
          <Link to="/admin/dashboard" style={styles.brandLink}>
            Artisan Market Admin
          </Link>
        </h1>
        
        <ul style={styles.desktopMenu}>
          <li>
            <Link to="/admin/dashboard" style={styles.navLink}>Dashboard</Link>
          </li>
          <li>
            <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
          </li>
        </ul>
        
        <button onClick={toggleMenu} style={styles.menuButton} aria-label="Toggle menu" aria-expanded={isMenuOpen}>
          ☰
        </button>
      </header>
      
      {isMenuOpen && (
        <ul style={styles.mobileMenu}>
          <li>
            <Link 
              to="/admin/dashboard" 
              style={styles.mobileNavLink}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <button 
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }} 
              style={styles.mobileLogoutButton}
            >
              Logout
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#4B3621',
    padding: '1rem',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  navContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  brand: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    margin: 0,
  },
  brandLink: {
    color: 'white',
    textDecoration: 'none',
  },
  desktopMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    padding: '0.5rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  logoutButton: {
    backgroundColor: 'transparent',
    border: '1px solid white',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  menuButton: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'block',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'white',
      fontSize: '1.5rem',
      cursor: 'pointer',
    },
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem 0',
    listStyle: 'none',
    margin: 0,
    '@media (min-width: 769px)': {
      display: 'none',
    },
  },
  mobileNavLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    padding: '0.5rem',
  },
  mobileLogoutButton: {
    backgroundColor: 'transparent',
    border: '1px solid white',
    color: 'white',
    padding: '0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
};