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
        <main className="manage-store-container">
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
        <main className="manage-store-container">
          <section className="loading-container">
            <CircularProgress size={60} style={{ color: '#6D4C41' }} />
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navi />
      <main className="manage-store-container">
        <header className="page-header">
          <h1 className="page-title">Manage {store.storeName}</h1>
        </header>

        <section className="controls-section">
          <fieldset className="search-section">
            <legend className="sr-only">Search Products</legend>
            <label className="search-container">
              <Search className="search-icon" />
              <input
                type="search"
                className="search-input"
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Search products by name or category"
              />
            </label>
          </fieldset>
          
          <nav className="action-buttons-section" aria-label="Product actions">
            <button 
              className="button primary add-button" 
              onClick={() => navigate('/add-product')}
              aria-label="Add new product"
            >
              <Add /> Add Product
            </button>
            <button
              className="button danger delete-button"
              onClick={openDelete}
              disabled={products.length === 0}
              aria-label="Delete products"
            >
              <Delete /> Delete Products
            </button>
          </nav>
        </section>

        <section className="products-table-section" aria-labelledby="products-heading">
          <h2 id="products-heading" className="sr-only">Products List</h2>
          <table className="products-table" aria-label="Products information">
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
                  <td colSpan="7" className="no-products-cell">
                    {products.length === 0 ? 'No products found. Click "Add Product" to get started.' : 'No products match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="product-row">
                    <td className="table-cell image-cell">
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
                    <td className="table-cell product-name-cell">
                      <strong className="product-name">{product.name}</strong>
                    </td>
                    <td className="table-cell category-cell">{product.category}</td>
                    <td className="table-cell price-cell">
                      <data className="price" value={product.price}>R{product.price}</data>
                    </td>
                    <td className="table-cell stock-cell">
                      <data className="stock-number" value={product.stock}>{product.stock}</data>
                    </td>
                    <td className="table-cell status-cell">
                      {product.status === 'Active' ? (
                        <mark className="status-badge active" aria-label="Product is active">
                          <CheckCircle className="status-icon" /> Active
                        </mark>
                      ) : (
                        <mark className="status-badge out-of-stock" aria-label="Product is out of stock">
                          <Cancel className="status-icon" /> Out of Stock
                        </mark>
                      )}
                    </td>
                    <td className="table-cell actions-cell">
                      <menu className="action-buttons-group">
                        <li>
                          <IconButton
                            onClick={() => updateStock(product.id)}
                            title="Update Stock"
                            aria-label={`Update stock for ${product.name}`}
                            className="action-btn stock-btn"
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                        </li>
                        <li>
                          <IconButton
                            onClick={() => updatePrice(product.id)}
                            title="Update Price"
                            aria-label={`Update price for ${product.name}`}
                            className="action-btn price-btn"
                            size="small"
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
          <dialog className="modal-overlay" open aria-labelledby="delete-modal-title">
            <article className="modal-content">
              <header className="modal-header">
                <h2 id="delete-modal-title">Delete Products</h2>
                <p className="modal-subtitle">Select products to delete permanently</p>
              </header>
              
              <section className="modal-body">
                <fieldset className="products-list">
                  <legend className="sr-only">Select products to delete</legend>
                  <ul>
                    {products.map(product => (
                      <li
                        key={product.id}
                        className={`product-item ${toDeleteIds.includes(product.id) ? 'selected' : ''}`}
                        onClick={() => toggleDeleteId(product.id)}
                      >
                        <label className="product-checkbox-label">
                          <input
                            type="checkbox"
                            checked={toDeleteIds.includes(product.id)}
                            onChange={() => toggleDeleteId(product.id)}
                            className="product-checkbox"
                          />
                          <img
                            src={product.imageUrl || '/placeholder-image.png'}
                            alt={`${product.name} product image`}
                            className="product-thumbnail"
                          />
                          <address className="product-details">
                            <strong className="product-name">{product.name}</strong>
                            <small className="product-info">
                              R{product.price} • {product.stock} in stock
                            </small>
                          </address>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              </section>
              
              <footer className="modal-footer">
                <button className="button secondary" onClick={closeDelete}>
                  Cancel
                </button>
                <button
                  className="button danger"
                  onClick={confirmDelete}
                  disabled={!toDeleteIds.length}
                >
                  Delete Selected ({toDeleteIds.length})
                </button>
              </footer>
            </article>
          </dialog>
        )}
      </main>
    </>
  );
}