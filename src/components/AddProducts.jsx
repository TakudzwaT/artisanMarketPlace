/* ----- src/components/AddProduct.js ----- */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import LoadingBar from './LoadingBar';
import "./ManageandCreate.css";

export default function AddProduct() {
  const navigate = useNavigate();
  const storeId = localStorage.getItem('storeId');
  const [product, setProduct] = useState({ imageFile: null, name: '', category: '', price: '', stock: '' });
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = e => {
    const { name, files, value } = e.target;
    if (name === 'imageFile') {
      setProduct(prev => ({ ...prev, imageFile: files[0] }));
    } else {
      setProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (isUploading) return;
    setIsUploading(true);

    try {
      const imageId = uuidv4();
      const storageRef = ref(storage, `stores/${storeId}/products/${imageId}`);
      await uploadBytes(storageRef, product.imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'stores', storeId, 'products'), {
        name: product.name,
        category: product.category,
        price: product.price,
        stock: parseInt(product.stock, 10),
        status: 'Active',
        imageUrl
      });

      navigate('/manage');
    } catch (error) {
      console.error("Error uploading product:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="container">
      <header className="site-header">
        <figure className="logo" aria-label="Store Logo" />
      </header>
      <main>
        <h1>Add New Product</h1>
        {isUploading && <LoadingBar />}
        <form onSubmit={handleSubmit} className="form">
          <fieldset>
            <legend>Product Information</legend>

            <label htmlFor="imageFile">Product Image</label>
            <input
              id="imageFile"
              name="imageFile"
              type="file"
              accept="image/*"
              onChange={handleChange}
              required
            />

            <label htmlFor="name">Product Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={product.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
            />

            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={product.category}
              onChange={handleChange}
              placeholder="Enter product category"
              required
            />

            <label htmlFor="price">Price</label>
            <input
              type="text"
              id="price"
              name="price"
              value={product.price}
              onChange={handleChange}
              placeholder="Enter price (e.g., R250)"
              required
            />

            <label htmlFor="stock">Quantity</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={product.stock}
              onChange={handleChange}
              placeholder="Enter stock quantity"
              required
            />
          </fieldset>

          <button type="submit" className="btn-primary" disabled={isUploading}>
            {isUploading ? "Saving..." : "Save Product"}
          </button>
        </form>
      </main>
    </section>
  );
}
