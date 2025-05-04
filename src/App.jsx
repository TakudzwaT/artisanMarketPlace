import React from 'react';
import Card from './components/card';
import BuyerTrack from './Buyer';
import SellerTrack from './sellerOrders';
import AboutUs from './About';
import { Routes, Route } from 'react-router-dom';
import CreateStore from './components/CreateStore';
import ManageStore from './components/ManageStore';
import AddProduct from './components/AddProducts';
import BuyerHome from './BuyerHome';
import LandingPage from './landingPage';
import CartPage from './components/CartPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import { CartProvider } from './components/CartContext';
import BuyerHomeCard from './components/BuyerHomeCard';
import PaymentPage from './components/PaymentPage';
import PaymentSuccess from './components/PaymentSuccess';

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/createStore" element={<CreateStore />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/sellerOrders" element={<SellerTrack />} />
        <Route path="/buyerOrders" element={<BuyerTrack />} />
        <Route path="/manage" element={<ManageStore />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/buyer" element={<BuyerHome />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/card" element={<Card />} />
        <Route path="/buyerHomeCard" element={<BuyerHomeCard />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
      </Routes>
    </CartProvider>
  );
}

export default App;