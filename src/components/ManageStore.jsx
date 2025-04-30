/* ----- src/components/ManageStore.js ----- */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navi from "./sellerNav";

export default function ManageStore() {
  const navigate = useNavigate();
  const storeId = localStorage.getItem('storeId');
  const [store, setStore] = useState({ name: '' });
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  useEffect(() => {
    getDoc(doc(db, 'stores', storeId)).then(snap => setStore(snap.data()));
    const q = query(collection(db, 'stores', storeId, 'products'));
    return onSnapshot(q, snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [storeId]);

  const openDelete = () => setShowModal(true);
  const closeDelete = () => { setShowModal(false); setToDeleteId(null); };

  const confirmDelete = async () => {
    if (toDeleteId) {
      await deleteDoc(doc(db, 'stores', storeId, 'products', toDeleteId));
      closeDelete();
    }
  };

  const updateStock = async id => {
    const qty = parseInt(window.prompt('Enter new stock quantity:'), 10);
    if (!isNaN(qty)) {
      const refDoc = doc(db, 'stores', storeId, 'products', id);
      await updateDoc(refDoc, { stock: qty, status: qty > 0 ? 'Active' : 'Out of Stock' });
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navi />
      <section className="container">
        <header className="site-header">
          <h1>Store Manager</h1>
          
        </header>

        <main>
          <section>
            <h2>Welcome to {store.name}</h2>
            <form className="toolbar" role="search" onSubmit={e => e.preventDefault()}>
              <input
                type="search"
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Search products"
              />
              <button type="button" className="btn-secondary" onClick={() => navigate('/add-product')}>
                Add New Product
              </button>
              <button type="button" className="btn-delete" onClick={openDelete}>
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
                        No products match your search
                      </td>
                    </tr>
                  ) : (
                    filtered.map(p => (
                      <tr key={p.id}>
                        <td><img src={p.imageUrl} alt={p.name} className="img-placeholder" /></td>
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
                          <button className="btn-update" onClick={() => updateStock(p.id)}>Update</button>
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
                  <button className="btn-delete" onClick={confirmDelete} disabled={!toDeleteId}>Confirm</button>
                  <button className="btn-secondary" onClick={closeDelete}>Cancel</button>
                </footer>
              </section>
            </section>
          )}
        </main>
      </section>
    </>
  );
}
