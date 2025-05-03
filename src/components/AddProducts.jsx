// src/components/AddProduct.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { CircularProgress, IconButton } from '@mui/material';
import { ArrowBack, CloudUpload, Category, AttachMoney, Inventory } from '@mui/icons-material';

const categoryOptions = [
  'Home Decor', 'Jewelry', 'Artwork', 'Clothing', 'Pottery',
  'Woodworking', 'Textiles', 'Accessories', 'Stationery', 'Other'
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

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f5f2',
      display: 'flex',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Inter', sans-serif"
    },
    formCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      padding: '2.5rem',
      width: '100%',
      maxWidth: '700px'
    },
    formHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '2rem'
    },
    backButton: {
      color: '#6D4C41',
      marginRight: '1rem'
    },
    formTitle: {
      color: '#4B3621',
      margin: 0,
      fontSize: '1.8rem'
    },
    uploadArea: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px dashed #DBA159',
      borderRadius: '12px',
      padding: '2rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: '#fffaf5',
      minHeight: '250px',
      marginBottom: '2rem'
    },
    uploadIcon: {
      fontSize: '3rem',
      color: '#DBA159',
      marginBottom: '1rem'
    },
    uploadText: {
      color: '#6D4C41',
      margin: 0,
      fontWeight: '500'
    },
    uploadSubtext: {
      color: '#A9744F',
      margin: '0.5rem 0 0',
      fontSize: '0.9rem'
    },
    imagePreview: {
      maxWidth: '100%',
      maxHeight: '300px',
      borderRadius: '8px',
      objectFit: 'cover'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    inputLabel: {
      display: 'flex',
      alignItems: 'center',
      color: '#6D4C41',
      marginBottom: '0.5rem',
      fontWeight: '500'
    },
    inputIcon: {
      marginRight: '0.5rem',
      color: '#A9744F',
      fontSize: '1.2rem'
    },
    formInput: {
      width: '100%',
      padding: '0.8rem 1rem',
      border: '1px solid #e0d7d1',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      backgroundColor: '#fff'
    },
    formSelect: {
      width: '100%',
      padding: '0.8rem 1rem',
      border: '1px solid #e0d7d1',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      backgroundColor: '#fff',
      appearance: 'none',
      backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236D4C41\'%3e%3cpath d=\'M7 10l5 5 5-5z\'/%3e%3c/svg%3e")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 1rem center',
      backgroundSize: '1em',
      paddingRight: '2.5rem'
    },
    inputError: {
      borderColor: '#dc3545'
    },
    priceStockRow: {
      display: 'flex',
      gap: '1.5rem',
      marginBottom: '1.5rem'
    },
    halfWidth: {
      flex: 1
    },
    errorMessage: {
      color: '#dc3545',
      margin: '0.5rem 0 0',
      fontSize: '0.9rem'
    },
    submitButton: {
      width: '100%',
      padding: '1rem',
      backgroundColor: '#A9744F',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    buttonDisabled: {
      backgroundColor: '#DBA159',
      cursor: 'not-allowed',
      opacity: '0.8'
    }
  };

  return (
    <section style={styles.container}>
      <article style={styles.formCard}>
        <header style={styles.formHeader}>
          <IconButton onClick={() => navigate('/manage')} style={styles.backButton}>
            <ArrowBack />
          </IconButton>
          <h1 style={styles.formTitle}>Create New Product</h1>
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
            <label htmlFor="imageUpload" style={styles.uploadArea}>
              {product.previewUrl ? (
                <img src={product.previewUrl} alt="Preview" style={styles.imagePreview} />
              ) : (
                <>
                  <CloudUpload style={styles.uploadIcon} />
                  <p style={styles.uploadText}>Click to upload product image</p>
                  <p style={styles.uploadSubtext}>Recommended size: 800x800px</p>
                </>
              )}
            </label>
            {errors.imageFile && <p style={styles.errorMessage}>{errors.imageFile}</p>}
          </section>

          <section style={styles.formGroup}>
            <label style={styles.inputLabel}>
              <Inventory style={styles.inputIcon} />
              Product Name
            </label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              style={{ ...styles.formInput, ...(errors.name && styles.inputError) }}
              placeholder="e.g., Handcrafted Ceramic Vase"
            />
            {errors.name && <p style={styles.errorMessage}>{errors.name}</p>}
          </section>

          <section style={styles.formGroup}>
            <label style={styles.inputLabel}>
              <Category style={styles.inputIcon} />
              Category
            </label>
            <select
              value={product.category}
              onChange={(e) => setProduct({ ...product, category: e.target.value })}
              style={{ 
                ...styles.formSelect, 
                ...(errors.category && styles.inputError) 
              }}
            >
              <option value="" disabled>Select a category</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p style={styles.errorMessage}>{errors.category}</p>}
          </section>

          <section style={styles.priceStockRow}>
            <section style={{ ...styles.formGroup, ...styles.halfWidth }}>
              <label style={styles.inputLabel}>
                <AttachMoney style={styles.inputIcon} />
                Price
              </label>
              <input
                type="number"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: e.target.value })}
                style={{ ...styles.formInput, ...(errors.price && styles.inputError) }}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.price && <p style={styles.errorMessage}>{errors.price}</p>}
            </section>

            <section style={{ ...styles.formGroup, ...styles.halfWidth }}>
              <label style={styles.inputLabel}>
                <Inventory style={styles.inputIcon} />
                Stock Quantity
              </label>
              <input
                type="number"
                value={product.stock}
                onChange={(e) => setProduct({ ...product, stock: e.target.value })}
                style={{ ...styles.formInput, ...(errors.stock && styles.inputError) }}
                placeholder="0"
                min="0"
              />
              {errors.stock && <p style={styles.errorMessage}>{errors.stock}</p>}
            </section>
          </section>

          {errors.submit && <p style={styles.errorMessage}>{errors.submit}</p>}

          <button 
            type="submit" 
            style={{ ...styles.submitButton, ...(isUploading && styles.buttonDisabled) }}
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