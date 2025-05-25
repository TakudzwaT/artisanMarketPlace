// src/components/AdminNavigation.js
import React, { useState, useEffect } from 'react'; // Import useEffect
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import './AdminNavigation.css';

export default function AdminNavigation() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Initial state

  // Effect to update isMobile on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <nav className="admin-nav">
      <header className="admin-nav-content">
        <h1 className="admin-brand">
          <Link to="/admin/dashboard" className="admin-brand-link" data-testid="brand-link">
            Artisan Market Admin
          </Link>
        </h1>

        {/* Conditionally render Desktop Menu or Mobile Toggle */}
        {isMobile ? (
          <button
            onClick={toggleMenu}
            className="admin-menu-button"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            data-testid="menu-toggle"
          >
            ☰
          </button>
        ) : (
          <ul className="admin-desktop-menu" data-testid="desktop-menu">
            <li>
              <Link to="/admin/dashboard" className="admin-nav-link" data-testid="desktop-dashboard">Dashboard</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="admin-logout-button" data-testid="desktop-logout">Logout</button>
            </li>
          </ul>
        )}
      </header>

      {/* Mobile Menu (only rendered if isMobile and open) */}
      {isMobile && isMenuOpen && ( // Only render if mobile and menu is open
        <ul className="admin-mobile-menu open" data-testid="mobile-menu">
          <li>
            <Link
              to="/admin/dashboard"
              className="admin-mobile-nav-link"
              onClick={() => setIsMenuOpen(false)}
              data-testid="mobile-dashboard"
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
              className="admin-mobile-logout-button"
              data-testid="mobile-logout"
            >
              Logout
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}