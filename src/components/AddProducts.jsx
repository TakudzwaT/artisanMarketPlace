// src/components/AddProduct.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { CircularProgress, IconButton } from '@mui/material';
import { ArrowBack, CloudUpload, Category, AttachMoney, Inventory } from '@mui/icons-material';
import './AddProducts.css'

const categoryOptions = [
  'Textile', 'Jewelry', 'Artwork', 'Clothing', 'Pottery',
  'Woodwork', 'Textiles','Ceramics' ,'Accessories', 'Stationery', 'Other'
];

export default function AddProduct() {
  const navigate = useNavigate();
  const storeId = localStorage.getItem('storeId');
  const [product, setProduct] = useState({ 
    imageFile: null, name: '', category: '', price: '', stock: '', previewUrl: null 
  });
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!product.imageFile) newErrors.imageFile = 'Product image is required';
    if (!product.name.trim()) newErrors.name = 'Product name is required';
    if (!product.category.trim()) newErrors.category = 'Category is required';
    if (product.price <= 0) newErrors.price = 'Valid price is required';
    if (product.stock <= 0) newErrors.stock = 'Valid quantity is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct(prev => ({
        ...prev,
        imageFile: file,
        previewUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isUploading) return;
    setIsUploading(true);

    try {
      const imageId = uuidv4();
      const storageRef = ref(storage, `stores/${storeId}/products/${imageId}`);
      await uploadBytes(storageRef, product.imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      // Create the document first
      const docRef = await addDoc(collection(db, 'stores', storeId, 'products'), {
        name: product.name.trim(),
        category: product.category.trim(),
        price: parseFloat(product.price),
        stock: parseInt(product.stock, 10),
        status: 'Active',
        imageUrl,
        storeId: storeId, // Add storeId to the product document
        createdAt: new Date()
      });

      // Update the document with its own ID as productId
      await updateDoc(docRef, {
        productId: docRef.id
      });

      navigate('/manage');
    } catch (error) {
      console.error("Error uploading product:", error);
      setErrors({ submit: 'Failed to save product. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };



  return (
  <section className="container">
    <article className="formCard">
      <header className="formHeader">
        <IconButton onClick={() => navigate('/manage')} className="backButton">
          <ArrowBack />
        </IconButton>
        <h1 className="formTitle">Create New Product</h1>
      </header>

      <form onSubmit={handleSubmit}>
        <section>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
          <label htmlFor="imageUpload" className="uploadArea">
            {product.previewUrl ? (
              <img src={product.previewUrl} alt="Preview" className="imagePreview" />
            ) : (
              <>
                <CloudUpload className="uploadIcon" />
                <p className="uploadText">Click to upload product image</p>
                <p className="uploadSubtext">Recommended size: 800x800px</p>
              </>
            )}
          </label>
          {errors.imageFile && <p className="errorMessage">{errors.imageFile}</p>}
        </section>

        <section className="formGroup">
          <label className="inputLabel">
            <Inventory className="inputIcon" />
            Product Name
          </label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            className={`formInput${errors.name ? ' inputError' : ''}`}
            placeholder="e.g., Handcrafted Ceramic Vase"
          />
          {errors.name && <p className="errorMessage">{errors.name}</p>}
        </section>

        <section className="formGroup">
          <label className="inputLabel">
            <Category className="inputIcon" />
            Category
          </label>
          <select
            value={product.category}
            onChange={(e) => setProduct({ ...product, category: e.target.value })}
            className={`formSelect${errors.category ? ' inputError' : ''}`}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="errorMessage">{errors.category}</p>}
        </section>

        <section className="priceStockRow">
          <section className="formGroup halfWidth">
            <label className="inputLabel">
              <AttachMoney className="inputIcon" />
              Price
            </label>
            <input
              type="number"
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: e.target.value })}
              className={`formInput${errors.price ? ' inputError' : ''}`}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {errors.price && <p className="errorMessage">{errors.price}</p>}
          </section>

          <section className="formGroup halfWidth">
            <label className="inputLabel">
              <Inventory className="inputIcon" />
              Stock Quantity
            </label>
            <input
              type="number"
              value={product.stock}
              onChange={(e) => setProduct({ ...product, stock: e.target.value })}
              className={`formInput${errors.stock ? ' inputError' : ''}`}
              placeholder="0"
              min="0"
            />
            {errors.stock && <p className="errorMessage">{errors.stock}</p>}
          </section>
        </section>

        {errors.submit && <p className="errorMessage">{errors.submit}</p>}

        <button
          type="submit"
          className={`submitButton${isUploading ? ' buttonDisabled' : ''}`}
          disabled={isUploading}
        >
          {isUploading ? (
            <CircularProgress size={24} style={{ color: 'white' }} />
          ) : (
            'Publish Product'
          )}
        </button>
      </form>
    </article>
  </section>
);

}