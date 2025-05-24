import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CircularProgress, IconButton } from '@mui/material';
import { Add, Delete, Edit, Search, Cancel, CheckCircle, AttachMoney } from '@mui/icons-material';
import Navi from "./sellerNav";
import './ManageStore.css';

export default function ManageStore() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState(null);
  const [store, setStore] = useState({ storeName: 'Loading...' });
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toDeleteIds, setToDeleteIds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setError('Please login to access your store');
        setLoading(false);
        return;
      }
      const uid = user.uid;
      setStoreId(uid);

      try {
        const storeDoc = await getDoc(doc(db, 'stores', uid));
        if (storeDoc.exists()) {
          setStore(storeDoc.data());
        } else {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists() && userDoc.data().seller) {
            setStore({ storeName: user.displayName + "'s Store" });
          } else {
            setError('No store found for this account');
          }
        }
      } catch (err) {
        console.error('Error fetching store:', err);
        setError('Failed to load store data');
      }

      if (uid) {
        const q = query(collection(db, 'stores', uid, 'products'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            setProducts(snapshot.docs.map(d => ({
              id: d.id,
              ...d.data(),
              price: d.data().price.toFixed(2)
            })));
            setLoading(false);
          },
          (err) => {
            console.error('Error loading products:', err);
            setError('Failed to load products');
            setLoading(false);
          }
        );
        return () => unsubscribe();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const openDelete = () => {
    setToDeleteIds([]);
    setShowModal(true);
  };

  const closeDelete = () => {
    setShowModal(false);
    setToDeleteIds([]);
  };

  const confirmDelete = async () => {
    if (!toDeleteIds.length || !storeId) return;
    try {
      await Promise.all(
        toDeleteIds.map(id => deleteDoc(doc(db, 'stores', storeId, 'products', id)))
      );
      closeDelete();
    } catch (err) {
      console.error('Error deleting products:', err);
      alert('Failed to delete selected products');
    }
  };

  const updateStock = async (id) => {
    if (!storeId) {
      alert('Authentication error. Please login again.');
      navigate('/login');
      return;
    }
    const qty = parseInt(prompt('Enter new stock quantity:'), 10);
    if (isNaN(qty)) return;
    try {
      const ref = doc(db, 'stores', storeId, 'products', id);
      await updateDoc(ref, { stock: qty, status: qty > 0 ? 'Active' : 'Out of Stock' });
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Failed to update stock');
    }
  };

  const updatePrice = async (id) => {
    if (!storeId) {
      alert('Authentication error. Please login again.');
      navigate('/login');
      return;
    }
    const input = prompt('Enter new product price (e.g. 29.99):');
    if (!input) return;
    const newPrice = parseFloat(input);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Invalid price entered.');
      return;
    }
    try {
      const ref = doc(db, 'stores', storeId, 'products', id);
      await updateDoc(ref, { price: newPrice });
    } catch (err) {
      console.error('Error updating price:', err);
      alert('Failed to update price');
    }
  };

  const toggleDeleteId = (id) => {
    setToDeleteIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <>
        <Navi />
        <main className="container">
          <section className="error-container">
            <h2 className="error-message">{error}</h2>
            <button className="button primary" onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </section>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navi />
        <main className="loading-container">
          <CircularProgress size={60} style={{ color: '#6D4C41' }} />
        </main>
      </>
    );
  }

  return (
    <>
      <Navi />
      <main className="container">
        <header className="header">
          <h1 className="title">Manage {store.storeName}</h1>
          <nav className="toolbar" role="toolbar" aria-label="Store management actions">
            <fieldset className="search-container">
              <label htmlFor="product-search" className="sr-only">Search products</label>
              <input
                id="product-search"
                type="search"
                className="search-input"
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Search products by name or category"
              />
            </fieldset>
            <button 
              className="button primary" 
              onClick={() => navigate('/add-product')}
              aria-label="Add new product"
            >
              <Add aria-hidden="true" /> New Product
            </button>
            <button
              className="button danger"
              onClick={openDelete}
              disabled={products.length === 0}
              aria-label="Delete selected products"
            >
              <Delete aria-hidden="true" /> Delete
            </button>
          </nav>
        </header>

        <section className="products-section" aria-label="Products list">
          <table className="table" role="table" aria-label="Products information">
            <thead>
              <tr>
                <th className="table-header" scope="col">Image</th>
                <th className="table-header" scope="col">Product</th>
                <th className="table-header" scope="col">Category</th>
                <th className="table-header" scope="col">Price</th>
                <th className="table-header" scope="col">Stock</th>
                <th className="table-header" scope="col">Status</th>
                <th className="table-header" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-cell no-products">
                    {products.length === 0 ? 'No products found' : 'No products match your search'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="table-row">
                    <td className="table-cell">
                      <img
                        src={product.imageUrl || '/placeholder-image.png'}
                        alt={`${product.name} product image`}
                        className="product-image"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.png';
                        }}
                      />
                    </td>
                    <td className="table-cell">{product.name}</td>
                    <td className="table-cell">{product.category}</td>
                    <td className="table-cell">R{product.price}</td>
                    <td className="table-cell">{product.stock}</td>
                    <td className="table-cell">
                      {product.status === 'Active' ? (
                        <strong className="status active" aria-label="Product is active">
                          <CheckCircle aria-hidden="true" /> Active
                        </strong>
                      ) : (
                        <strong className="status out-of-stock" aria-label="Product is out of stock">
                          <Cancel aria-hidden="true" /> Out of Stock
                        </strong>
                      )}
                    </td>
                    <td className="table-cell">
                      <menu className="action-buttons" role="group" aria-label={`Actions for ${product.name}`}>
                        <li>
                          <IconButton
                            onClick={() => updateStock(product.id)}
                            title="Update Stock"
                            aria-label={`Update stock for ${product.name}`}
                            style={{ color: '#A9744F' }}
                          >
                            <Edit />
                          </IconButton>
                        </li>
                        <li>
                          <IconButton
                            onClick={() => updatePrice(product.id)}
                            title="Update Price"
                            aria-label={`Update price for ${product.name}`}
                            style={{ color: '#A9744F' }}
                          >
                            <AttachMoney />
                          </IconButton>
                        </li>
                      </menu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {showModal && (
          <section className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <section className="modal-content">
              <header>
                <h2 id="delete-modal-title">Delete Products</h2>
              </header>
              <section className="modal-body">
                <fieldset>
                  <legend className="sr-only">Select products to delete</legend>
                  <ul className="modal-list" role="list">
                    {products.map(product => (
                      <li
                        key={product.id}
                        className="modal-list-item"
                        onClick={() => toggleDeleteId(product.id)}
                      >
                        <label className="product-checkbox-label">
                          <input
                            type="checkbox"
                            checked={toDeleteIds.includes(product.id)}
                            onChange={() => toggleDeleteId(product.id)}
                            aria-describedby={`product-${product.id}-details`}
                          />
                          <img
                            src={product.imageUrl || '/placeholder-image.png'}
                            alt={`${product.name} product image`}
                            className="product-image"
                            style={{ width: '40px', height: '40px' }}
                          />
                          <section id={`product-${product.id}-details`}>
                            <p>{product.name}</p>
                            <small style={{ color: '#6D4C41' }}>
                              ${product.price} • {product.stock} in stock
                            </small>
                          </section>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              </section>
              <footer className="modal-actions">
                <button className="button primary" onClick={closeDelete}>Cancel</button>
                <button
                  className="button danger"
                  onClick={confirmDelete}
                  disabled={!toDeleteIds.length}
                >
                  Confirm Delete ({toDeleteIds.length})
                </button>
              </footer>
            </section>
          </section>
        )}
      </main>
    </>
  );
}