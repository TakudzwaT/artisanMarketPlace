// src/components/CreateStore.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './../firebase';
import Navi from "./sellerNav";

export default function CreateStore() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', bio: '', payment: 'card', delivery: [] });

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setForm(prev => {
        const delivery = prev.delivery.includes(value)
          ? prev.delivery.filter(v => v !== value)
          : [...prev.delivery, value];
        return { ...prev, delivery };
      });
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      alert("Please log in to create a store.");
      return;
    }

    const storeData = {
      uid: user.uid,
      ownerName: user.displayName,
      ownerEmail: user.email,
      storeName: form.name,
      storeBio: form.bio,
      paymentMethod: form.payment,
      deliveryOptions: form.delivery,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'stores', user.uid), storeData);
      localStorage.setItem('storeId', user.uid);
      navigate('/manage');
    } catch (error) {
      console.error('Error creating store:', error);
      alert("There was a problem creating the store.");
    }
  };

  return (
    <>
      <Navi />
      <header><h1>Create your store</h1></header>
      <main>
        <form onSubmit={handleSubmit}>
          <section>
            <h2>Store Details</h2>
            <label>
              Store name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Store Bio
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
              />
            </label>
          </section>

          <section>
            <h2>Payment & Delivery</h2>
            <label>
              Payment Method
              <select
                name="payment"
                value={form.payment}
                onChange={handleChange}
              >
                <option value="card">Card Only</option>
                <option value="cash">Cash Only</option>
                <option value="cash&card">Cash & Card</option>
              </select>
            </label>

            <label>
              <input
                type="checkbox"
                name="delivery"
                value="pickup"
                checked={form.delivery.includes('pickup')}
                onChange={handleChange}
              />
              Pick-up
            </label>
            <label>
              <input
                type="checkbox"
                name="delivery"
                value="local"
                checked={form.delivery.includes('local')}
                onChange={handleChange}
              />
              Local Delivery
            </label>
          </section>

          <button type="submit">Save & Continue</button>
        </form>
      </main>
    </>
  );
}
