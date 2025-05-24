import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "./Navigation.css";

function Navi() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Create a function that returns menu items with context-specific test IDs
  const getMenuItems = (context) => (
    <>
      <li>
        <button onClick={handleLogout} className="nav-link logout-button">
          Logout
        </button>
      </li>
      <li>
        <NavLink 
          to="/manage" 
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          data-testid={`${context}-manage-link`}
        >
          Manage Store
        </NavLink>
      </li>
      <li>
        <NavLink 
          to="/sellerOrders" 
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          Orders
        </NavLink>
      </li>
      <li>
        <NavLink 
          to="/seller/dashboard" 
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          Dashboard
        </NavLink>
      </li>
      <li>
        <NavLink 
          to="/about" 
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          About Us
        </NavLink>
      </li>
    </>
  );

  return (
    <nav className="navigation">
      <h1 className="logo">Artisan Marketplace</h1>
      
      {/* Desktop menu */}
      <ul className="desktop-menu">
        {getMenuItems("desktop")}
      </ul>
      
      {/* Mobile menu button */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsMenuOpen(prev => !prev)}
      >
        {isMenuOpen ? "✕" : "☰"}
      </button>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <ul className="mobile-menu" data-testid="mobile-menu">
          {getMenuItems("mobile")}
        </ul>
      )}
    </nav>
  );
}

export default Navi;