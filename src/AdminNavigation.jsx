import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import React from "react";

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
  
  // Inline styles without media queries that cause testing issues
  const navStyle = {
    backgroundColor: '#4B3621',
    padding: '1rem',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  };
  
  const navContentStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
  };
  
  const brandStyle = {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    margin: 0,
  };
  
  const brandLinkStyle = {
    color: 'white',
    textDecoration: 'none',
  };
  
  const desktopMenuStyle = {
    display: window.innerWidth > 768 ? 'flex' : 'none',
    alignItems: 'center',
    gap: '1.5rem',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  };
  
  const navLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    padding: '0.5rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  };
  
  const logoutButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid white',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };
  
  const menuButtonStyle = {
    display: window.innerWidth <= 768 ? 'block' : 'none',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
  };
  
  const mobileMenuStyle = {
    display: isMenuOpen ? 'flex' : 'none',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem 0',
    listStyle: 'none',
    margin: 0,
  };
  
  const mobileNavLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    padding: '0.5rem',
  };
  
  const mobileLogoutButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid white',
    color: 'white',
    padding: '0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  };
  
  return (
    <nav style={navStyle}>
      <header style={navContentStyle}>
        <h1 style={brandStyle}>
          <Link to="/admin/dashboard" style={brandLinkStyle} data-testid="brand-link">
            Artisan Market Admin
          </Link>
        </h1>
        
        <ul style={desktopMenuStyle} data-testid="desktop-menu">
          <li>
            <Link to="/admin/dashboard" style={navLinkStyle} data-testid="desktop-dashboard">Dashboard</Link>
          </li>
          <li>
            <button onClick={handleLogout} style={logoutButtonStyle} data-testid="desktop-logout">Logout</button>
          </li>
        </ul>
        
        <button 
          onClick={toggleMenu} 
          style={menuButtonStyle} 
          aria-label="Toggle menu" 
          aria-expanded={isMenuOpen}
          data-testid="menu-toggle"
        >
          ☰
        </button>
      </header>
      
      <ul style={mobileMenuStyle} data-testid="mobile-menu">
        <li>
          <Link 
            to="/admin/dashboard" 
            style={mobileNavLinkStyle}
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
            style={mobileLogoutButtonStyle}
            data-testid="mobile-logout"
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}