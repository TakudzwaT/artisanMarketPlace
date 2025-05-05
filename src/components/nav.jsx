import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "./Navigation.css";

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="navigation">
      <h1>Artisan Marketplace</h1>

      {/* Desktop navigation */}
      <ul className="desktop-menu">
        <li><a href="/buyer">Home</a></li>
        <li><a href="/BuyerOrders">Orders</a></li>
        <li><a href="/cart">Cart</a></li>
        <li><a href="/">Logout</a></li>
      </ul>

      {/* Mobile menu button */}
      <button 
        className="mobile-menu-button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? "✕" : "☰"}
      </button>

      {/* Mobile menu */}
      {isMenuOpen && (
        <ul className="mobile-menu" data-testid="mobile-menu">
          <li><a href="/buyer">Home</a></li>
          <li><a href="/BuyerOrders">Orders</a></li>
          <li><a href="/cart">Cart</a></li>
          <li><a href="/">Logout</a></li>
        </ul>
      )}
    </nav>
  );
}

export default Navigation;
