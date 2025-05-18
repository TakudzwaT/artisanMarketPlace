import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useCart } from "./CartContext";
import { BsCart } from "react-icons/bs";
import "./Navigation.css";

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalQty } = useCart();        // ← grab totalQty
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); 
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const cartBadge = totalQty > 0 && (        // ← use totalQty
    <span className="cart-badge-nav">{totalQty}</span>
  );

  const menuItems = (
    <>
      <li>
        <NavLink to="/buyer" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Home
        </NavLink>
      </li>
      <li>
        <NavLink to="/BuyerOrders" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Orders
        </NavLink>
      </li>
      <li className="nav-cart">
        <NavLink to="/cart" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <BsCart className="cart-icon-nav" />
          {cartBadge}
        </NavLink>
      </li>
      <li>
        <button onClick={handleLogout} className="nav-link logout-button">
          Logout
        </button>
      </li>
    </>
  );

  return (
    <nav className="navigation">
      <h1 className="logo">Artisan Marketplace</h1>

      {/* Desktop navigation */}
      <ul className="desktop-menu">{menuItems}</ul>

      {/* Mobile menu button */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsMenuOpen(open => !open)}
      >
        {isMenuOpen ? "✕" : "☰"}
      </button>

      {/* Mobile menu */}
      {isMenuOpen && (
        <ul className="mobile-menu" data-testid="mobile-menu">
          {menuItems}
        </ul>
      )}
    </nav>
  );
}

export default Navigation;
