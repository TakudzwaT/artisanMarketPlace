import React,{useState } from "react";
import "./Navigation.css";

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="navigation">
      <h1>Artisan Marketplace</h1>
      
      {/* Desktop navigation */}
      <ul className="desktop-menu">
      <li><a href="/buyer">Home</a></li>
        <li><a href="/BuyerOrders">Orders</a></li>
        <li><a href="/about">About Us</a></li>
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
        <ul className="mobile-menu">
          <li><a href="/buyer">Home</a></li>
        <li><a href="/BuyerOrders">Orders</a></li>
        <li><a href="/about">About Us</a></li>
          
        </ul>
      )}
    </nav>
  );
}

export default Navigation;