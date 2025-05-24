import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { useCart } from "./CartContext";
import { BsCart } from "react-icons/bs";
import "./Navigation.css";

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalQty } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  // Redirect to landing if no user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If user is signed out and trying to access protected routes, redirect
      const protectedPaths = ['/buyer', '/BuyerOrders', '/cart'];
      if (!user && protectedPaths.includes(location.pathname)) {
        navigate('/', { replace: true });
      }
    });
    return unsubscribe;
  }, [auth, navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Replace history so "back" can't return to protected pages
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const cartBadge = totalQty > 0 && (
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
