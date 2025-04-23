import Card from './components/card';
import Navigation from "./components/nav";
import BuyerTrack from './Buyer';
import SellerTrack from './sellerOrders';
import React from 'react';
import AboutUs from './About';
import { Routes, Route } from 'react-router-dom';
import CreateStore from './components/CreateStore';
import ManageStore from './components/ManageStore';
import AddProduct from './components/AddProducts';
import BuyerHome from './BuyerHome';
import LandingPage from './landingPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
function App() {

  return (
    <Routes>
      
      <Route path="/" element={<LandingPage/>} />
      <Route path="/createStore" element={<CreateStore/>} />
      <Route path="/login" element={<LoginPage/>} />
      <Route path="/signup" element={<SignupPage/>} />
      <Route path="/sellerOrders" element={<SellerTrack />} />
      <Route path="/buyerOrders" element={<BuyerTrack/>} />
      <Route path="/manage" element={<ManageStore />} />
      <Route path="/add-product" element={<AddProduct />} />
      <Route path="/buyer" element={<BuyerHome />} />
      <Route path="/about" element={<AboutUs/>} />
    </Routes>
  );
}

export default App;
