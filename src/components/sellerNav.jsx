import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="navigation">
      <h1>Artisan Marketplace</h1>
      
      {/* Desktop navigation */}
      <ul className="desktop-menu">
      <li><a href="/">Logout</a></li>
        <li><a href="/manage">Manage Store</a></li>
        <li><a href="/sellerOrders">Orders</a></li>
        <li><a href="/seller/dashboard">Dashboard</a></li>       
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
          <li><a href="/">Logout</a></li>
          <li><a href="/manage">Manage Store</a></li>
          <li><a href="/sellerOrders">Orders</a></li>
          <li><a href="/seller/dashboard">Dashboard</a></li>
          <li><a href="/about">About Us</a></li>
        </ul>
      )}
    </nav>
  );
}

export default Navi;
