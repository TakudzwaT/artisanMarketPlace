import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './../firebase';
import Navi from "./sellerNav";

export default function CreateStore() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    bio: '',
    payment: 'card',
    delivery: [],
    category: 'Jewelery' // Default value
  });

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
      category: form.category,
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

  // Inline styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f5f2',
      fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#4B3621',
    },
    header: {
      padding: '1.5rem 0',
      textAlign: 'center',
      marginBottom: '2rem',
      borderBottom: '1px solid #e6ddd6',
      backgroundColor: 'white'
    },
    headerTitle: {
      fontSize: '2.2rem',
      fontWeight: '700',
      color: '#6D4C41',
      margin: 0,
      fontFamily: "'Playfair Display', serif",
    },
    main: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0 1.5rem 4rem'
    },
    form: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      padding: '2.5rem',
      border: '1px solid #e6ddd6'
    },
    section: {
      marginBottom: '2.5rem',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      paddingBottom: '0.75rem',
      borderBottom: '2px solid #DBA159',
      color: '#6D4C41',
    },
    formGroup: {
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      fontWeight: '500', 
      marginBottom: '0.5rem',
      color: '#6D4C41',
      fontSize: '1rem',
    },
    input: {
      width: '100%',
      padding: '0.8rem 1rem',
      fontSize: '1rem',
      border: '1px solid #e0d7d1',
      borderRadius: '8px',
      backgroundColor: '#fff',
      transition: 'border-color 0.3s, box-shadow 0.3s',
      marginTop: '0.25rem',
    },
    textarea: {
      width: '100%',
      padding: '0.8rem 1rem',
      fontSize: '1rem',
      border: '1px solid #e0d7d1',
      borderRadius: '8px',
      backgroundColor: '#fff',
      transition: 'border-color 0.3s, box-shadow 0.3s',
      minHeight: '120px',
      resize: 'vertical',
      marginTop: '0.25rem',
    },
    select: {
      width: '100%',
      padding: '0.8rem 1rem',
      fontSize: '1rem',
      border: '1px solid #e0d7d1',
      borderRadius: '8px',
      backgroundColor: '#fff',
      transition: 'border-color 0.3s, box-shadow 0.3s',
      cursor: 'pointer',
      marginTop: '0.25rem',
      appearance: 'none',
      backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236D4C41\'%3e%3cpath d=\'M7 10l5 5 5-5z\'/%3e%3c/svg%3e")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 1rem center',
      backgroundSize: '1.5em',
      paddingRight: '2.5rem'
    },
    checkboxGroup: {
      marginTop: '0.5rem',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      marginBottom: '0.75rem',
      fontSize: '1rem',
      color: '#333'
    },
    checkbox: {
      marginRight: '0.75rem',
      width: '18px',
      height: '18px',
      accentColor: '#A9744F'
    },
    submitButton: {
      display: 'block',
      width: '100%',
      padding: '1rem 0',
      backgroundColor: '#A9744F',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      marginTop: '1.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    hoverInput: {
      borderColor: '#DBA159',
      boxShadow: '0 0 0 3px rgba(169, 116, 79, 0.15)'
    },
    hoverSubmit: {
      backgroundColor: '#8C5E3D'
    }
  };

  return (
    <main style={styles.container}>
      <Navi />
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Create Your Artisan Store</h1>
      </header>
      
      <form 
        onSubmit={handleSubmit} 
        data-testid="create-store-form" 
        style={styles.form}
      >
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Store Details</h2>
  
          <label style={styles.label}>
            Store name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              style={styles.input}
              onFocus={(e) => e.target.style.boxShadow = styles.hoverInput.boxShadow}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
              placeholder="Your unique store name"
            />
          </label>
  
          <label style={styles.label}>
            Store Bio
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              style={styles.textarea}
              onFocus={(e) => e.target.style.boxShadow = styles.hoverInput.boxShadow}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
              placeholder="Tell customers about your craft and what makes your products special..."
            />
          </label>
  
          <label style={styles.label}>
            Category
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              style={styles.select}
              onFocus={(e) => e.target.style.boxShadow = styles.hoverInput.boxShadow}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              <option value="Jewelery">Jewelery</option>
              <option value="Textile">Textile</option>
              <option value="Woodwork">Woodwork</option>
              <option value="Ceramics">Ceramics</option>
            </select>
          </label>
        </section>
  
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Payment & Delivery</h2>
  
          <label style={styles.label}>
            Payment Method
            <select
              name="payment"
              value={form.payment}
              onChange={handleChange}
              style={styles.select}
              onFocus={(e) => e.target.style.boxShadow = styles.hoverInput.boxShadow}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              <option value="card">Card Only</option>
              <option value="cash">Cash Only</option>
              <option value="cash&card">Cash & Card</option>
            </select>
          </label>
  
          <p style={styles.label}>Delivery Options</p>
  
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="delivery"
              value="pickup"
              checked={form.delivery.includes('pickup')}
              onChange={handleChange}
              style={styles.checkbox}
            />
            Pick-up (Customers can collect from your location)
          </label>
        </section>
  
        <button 
          type="submit" 
          style={styles.submitButton}
          onMouseOver={(e) => e.target.style.backgroundColor = styles.hoverSubmit.backgroundColor}
          onMouseOut={(e) => e.target.style.backgroundColor = styles.submitButton.backgroundColor}
        >
          Save & Continue
        </button>
      </form>
    </main>
  );
  
}