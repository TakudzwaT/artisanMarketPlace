import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CircularProgress, IconButton } from '@mui/material';
import { Add, Delete, Edit, Search, Cancel, CheckCircle, AttachMoney } from '@mui/icons-material';
import Navi from "./sellerNav";

export default function ManageStore() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState(null);
  const [store, setStore] = useState({ name: 'Loading...' });
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
            setStore({ name: user.displayName + "'s Store" });
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

  const styles = {
    container: {
      padding: '2rem',
      backgroundColor: '#f8f5f2',
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      marginBottom: '2rem',
      '@media (min-width: 768px)': {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }
    },
    title: {
      color: '#4B3621',
      fontSize: '1.8rem',
      margin: 0,
    },
    toolbar: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    searchInput: {
      flex: 1,
      padding: '0.8rem 1rem',
      border: '1px solid #e0d7d1',
      borderRadius: '8px',
      fontSize: '1rem',
      minWidth: '250px',
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.8rem 1.5rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    primaryButton: {
      backgroundColor: '#A9744F',
      color: 'white',
      ':hover': { backgroundColor: '#8c5d3d' }
    },
    dangerButton: {
      backgroundColor: '#dc3545',
      color: 'white',
      ':hover': { backgroundColor: '#bb2d3b' }
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    },
    tableHeader: {
      backgroundColor: '#DBA159',
      color: 'white',
      padding: '1rem',
      textAlign: 'left',
    },
    tableRow: {
      borderBottom: '1px solid #e0d7d1',
      ':hover': { backgroundColor: '#fffaf5' }
    },
    tableCell: {
      padding: '1rem',
      color: '#6D4C41',
    },
    productImage: {
      width: '60px',
      height: '60px',
      borderRadius: '8px',
      objectFit: 'cover',
    },
    status: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: '500',
    },
    activeStatus: {
      color: '#28a745',
    },
    outOfStockStatus: {
      color: '#dc3545',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      maxWidth: '500px',
      width: '90%',
    },
    modalList: {
      listStyle: 'none',
      padding: 0,
      margin: '1.5rem 0',
      maxHeight: '400px',
      overflowY: 'auto',
    },
    modalListItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
     	padding: '1rem',
     	borderBottom: '1px solid #eee',
     	cursor: 'pointer',
      ':hover': { backgroundColor: '#f8f5f2' }
    },
    modalActions: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'flex-end',
      marginTop: '1.5rem',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '4rem',
    },
    errorMessage: {
      color: '#dc3545',
      marginBottom: '1.5rem',
    }
  };

  if (error) {
    return (
      <>
        <Navi />
        <main style={styles.container}>
          <section style={styles.errorContainer}>
            <h2 style={styles.errorMessage}>{error}</h2>
            <button style={{ ...styles.button, ...styles.primaryButton }} onClick={() => navigate('/login')}>
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
        <main style={styles.loadingContainer}>
          <CircularProgress size={60} style={{ color: '#6D4C41' }} />
        </main>
      </>
    );
  }

  return (
    <>
      <Navi />
      <main style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Manage {store.storeName}</h1>
          <nav style={styles.toolbar}>
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <button style={{ ...styles.button, ...styles.primaryButton }} onClick={() => navigate('/add-product')}>
              <Add /> New Product
            </button>
            <button style={{ ...styles.button, ...styles.dangerButton }} onClick={openDelete} disabled={products.length === 0}>
              <Delete /> Delete
            </button>
          </nav>
        </header>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Image</th>
              <th style={styles.tableHeader}>Product</th>
              <th style={styles.tableHeader}>Category</th>
              <th style={styles.tableHeader}>Price</th>
              <th style={styles.tableHeader}>Stock</th>
              <th style={styles.tableHeader}>Status</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  <img
                    src={product.imageUrl || '/placeholder-image.png'}
                    alt={product.name}
                    style={styles.productImage}
                    onError={e => { e.target.onerror = null; e.target.src = '/placeholder-image.png'; }}
                  />
                </td>
                <td style={styles.tableCell}>{product.name}</td>
                <td style={styles.tableCell}>{product.category}</td>
                <td style={styles.tableCell}>R{product.price}</td>
                <td style={styles.tableCell}>{product.stock}</td>
                <td style={styles.tableCell}>
                  {product.status === 'Active' ? (
                    <strong style={styles.activeStatus}><CheckCircle /> Active</strong>
                  ) : (
                    <strong style={styles.outOfStockStatus}><Cancel /> Out of Stock</strong>
                  )}
                </td>
                <td style={styles.tableCell}>
                  <IconButton onClick={() => updateStock(product.id)} title="Update Stock" style={{ color: '#A9744F' }}><Edit /></IconButton>
                  <IconButton onClick={() => updatePrice(product.id)} title="Update Price" style={{ color: '#A9744F' }}><AttachMoney /></IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <aside style={styles.modalOverlay}>
            <section style={styles.modalContent}>
              <h2>Delete Products</h2>
              <ul style={styles.modalList}>
                {products.map(product => (
                  <li key={product.id} style={styles.modalListItem} onClick={() => toggleDeleteId(product.id)}>
                    <input type="checkbox" checked={toDeleteIds.includes(product.id)} onChange={() => toggleDeleteId(product.id)} />
                    <img src={product.imageUrl || '/placeholder-image.png'} alt={product.name} style={{ ...styles.productImage, width: '40px', height: '40px' }} />
                    <article>
                      <p>{product.name}</p>
                      <small style={{ color: '#6D4C41' }}>R{product.price} • {product.stock} in stock</small>
                    </article>
                  </li>
                ))}
              </ul>
              <footer style={styles.modalActions}>
                <button style={{ ...styles.button, ...styles.primaryButton }} onClick={closeDelete}>Cancel</button>
                <button style={{ ...styles.button, ...styles.dangerButton }} onClick={confirmDelete} disabled={!toDeleteIds.length}>Confirm Delete</button>
              </footer>
            </section>
          </aside>
        )}
      </main>
    </>
  );
}
