import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import Navi from "./sellerNav";

export default function ManageStore() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState(null);
  const [store, setStore] = useState({ name: 'Loading...' });
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setError('Please login to access your store');
        return;
      }
      
      const uid = user.uid;
      setStoreId(uid);
      
      // Fetch store data - using uid as storeId
      try {
        const storeDoc = await getDoc(doc(db, 'stores', uid));
        if (storeDoc.exists()) {
          setStore(storeDoc.data());
        } else {
          // Check if user has a seller account
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists() && userDoc.data().seller) {
            setStore({ name: user.displayName + "'s Store" });
          } else {
            setError('No store found for this account');
          }
        }
      } catch (err) {
        console.error('Error fetching store:', err);
        setError('Failed to load store data');
      }
      
      // Set up products listener
      if (uid) {
        const q = query(collection(db, 'stores', uid, 'products'));
        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            setProducts(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
          },
          (err) => {
            console.error('Error loading products:', err);
            setError('Failed to load products');
          }
        );
        
        return () => unsubscribe();
      }
    });
    
    // Clean up auth listener on unmount
    return () => unsubscribeAuth();
  }, []);

  const openDelete = () => setShowModal(true);
  const closeDelete = () => { setShowModal(false); setToDeleteId(null); };

  const confirmDelete = async () => {
    if (!toDeleteId || !storeId) return;
    
    try {
      await deleteDoc(doc(db, 'stores', storeId, 'products', toDeleteId));
      closeDelete();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const updateStock = async (id) => {
    if (!storeId) {
      alert('Authentication error. Please login again.');
      navigate('/login');
      return;
    }
    
    const qty = parseInt(window.prompt('Enter new stock quantity:'), 10);
    if (isNaN(qty)) return;
    
    try {
      const refDoc = doc(db, 'stores', storeId, 'products', id);
      await updateDoc(refDoc, { 
        stock: qty, 
        status: qty > 0 ? 'Active' : 'Out of Stock' 
      });
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Failed to update stock');
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <>
        <Navi />
        <section className="container">
          <header className="site-header">
            <h1>Store Manager</h1>
          </header>
          <main>
            <div className="error-message">
              <h2>{error}</h2>
              <button 
                className="btn-secondary" 
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </main>
        </section>
      </>
    );
  }
  
  if (!storeId) {
    return (
      <>
        <Navi />
        <section className="container">
          <header className="site-header">
            <h1>Store Manager</h1>
          </header>
          <main>
            <div className="loading-message">
              <h2>Loading store information...</h2>
            </div>
          </main>
        </section>
      </>
    );
  }

  return (
    <>
      <Navi />
      <section className="container">
        <header className="site-header">
          <h1>Store Manager</h1>
        </header>

        <main>
          <section>
            <h2>Welcome to {store.storeName}</h2>
            <form className="toolbar" role="search" onSubmit={e => e.preventDefault()}>
              <input
                type="search"
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Search products"
              />
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/add-product')}
              >
                Add New Product
              </button>
              <button 
                type="button" 
                className="btn-delete" 
                onClick={openDelete}
                disabled={products.length === 0}
              >
                Delete Product
              </button>
            </form>

            <article>
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center' }}>
                        {products.length === 0 ? "No products found" : "No products match your search"}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(p => (
                      <tr key={p.id}>
                        <td>
                          <img 
                            src={p.imageUrl || '/placeholder-image.png'} 
                            alt={p.name} 
                            className="img-placeholder" 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-image.png';
                            }}
                          />
                        </td>
                        <td>{p.name}</td>
                        <td>{p.category}</td>
                        <td>{p.price}</td>
                        <td>{p.stock}</td>
                        <td>
                          {p.status === 'Out of Stock'
                            ? <mark className="out-of-stock">{p.status}</mark>
                            : <strong className="active">{p.status}</strong>}
                        </td>
                        <td>
                          <button 
                            className="btn-update" 
                            onClick={() => updateStock(p.id)}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </article>
          </section>

          {showModal && (
            <section className="modal-overlay" role="dialog" aria-modal="true">
              <section className="modal">
                <h3>Select Product to Delete</h3>
                <ul>
                  {products.map(p => (
                    <li key={p.id}>
                      <label>
                        <input
                          type="radio"
                          name="delete"
                          value={p.id}
                          checked={toDeleteId === p.id}
                          onChange={() => setToDeleteId(p.id)}
                        />
                        {p.name}
                      </label>
                    </li>
                  ))}
                </ul>
                <footer className="modal-actions">
                  <button 
                    className="btn-delete" 
                    onClick={confirmDelete} 
                    disabled={!toDeleteId}
                  >
                    Confirm
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={closeDelete}
                  >
                    Cancel
                  </button>
                </footer>
              </section>
            </section>
          )}
        </main>
      </section>
    </>
  );
}