/* ----- src/components/CreateStore.js ----- */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

export default function CreateStore() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', bio: '', payment: 'card', delivery: [] });

  const handleChange = e => {
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

  const handleSubmit = async e => {
    e.preventDefault();
    const id = uuidv4();
    await setDoc(doc(db, 'stores', id), form);
    localStorage.setItem('storeId', id);
    navigate('/manage');
  };

  return (
    <div className="container">
      <header className="site-header"><div className="logo">Name of Website</div></header>
      <main>
        <h1>Create your store</h1>
        <form onSubmit={handleSubmit} className="form">
          <section><h2>Store Details</h2>
            <label>Store name<input type="text" name="name" value={form.name} onChange={handleChange} required/></label>
            <label>Store Bio<textarea name="bio" value={form.bio} onChange={handleChange}/></label>
          </section>
          <section><h2>Payment & Delivery</h2>
            <label>Payment Method<select name="payment" value={form.payment} onChange={handleChange}><option value="card">Card Only</option><option value="cash">Cash Only</option><option value="cash&card">Cash & Card</option></select></label>
            <div><label><input type="checkbox" name="delivery" value="pickup" checked={form.delivery.includes('pickup')} onChange={handleChange}/> Pick-up</label><label><input type="checkbox" name="delivery" value="local" checked={form.delivery.includes('local')} onChange={handleChange}/> Local Delivery</label></div>
          </section>
          <button type="submit" className="btn-primary">Save & Continue</button>
        </form>
      </main>
    </div>
  );
}