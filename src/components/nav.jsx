import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useCart } from "./CartContext";
import { BsCart } from "react-icons/bs";
import "./Navigation.css";

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { shoppingCart } = useCart();
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

  const cartBadge = shoppingCart.length > 0 && (
    <span className="cart-badge-nav">{shoppingCart.length}</span>
  );

  const menuItems = (
    <>
      <li>
        <NavLink to="/buyer" className="nav-link" activeClassName="active">
          Home
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/BuyerOrders"
          className="nav-link"
          activeClassName="active"
        >
          Orders
        </NavLink>
      </li>
      <li className="nav-cart">
        <NavLink to="/cart" className="nav-link" activeClassName="active">
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
        onClick={() => setIsMenuOpen((open) => !open)}
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
