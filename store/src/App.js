/* ----- src/App.js ----- */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CreateStore from './components/CreateStore';
import ManageStore from './components/ManageStore';
import AddProduct from './components/AddProduct';

function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateStore />} />
      <Route path="/manage" element={<ManageStore />} />
      <Route path="/add-product" element={<AddProduct />} />
    </Routes>
  );
}

export default App;