import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  db,
  auth
} from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch, // Import writeBatch for atomic operations
  query, // Import query
  where, // Import where for querying orders
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  CircularProgress,
  Tabs,
  Tab,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import AdminNavigation from './AdminNavigation'; // Assuming this component is still desired, though not used in the snippet logic
import './AdminDashbooard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogAction, setDialogAction] = useState('');
  const [dialogType, setDialogType] = useState('');

  useEffect(() => {
    let mounted = true;

    const checkAuthAndLoadData = async () => {
      setIsLoading(true);
      try {
        const adminId = localStorage.getItem('adminId');
        if (!adminId) {
          if (mounted) {
            setIsLoading(false);
            navigate('/admin/login');
          }
          return;
        }

        const userRef = doc(db, 'users', adminId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists() || !userSnap.data().admin) {
          await signOut(auth);
          localStorage.removeItem('adminId');
          localStorage.removeItem('adminEmail'); // Ensure email is also cleared
          if (mounted) {
            setIsLoading(false);
            navigate('/admin/login');
          }
          return;
        }

        // Fetch users and products concurrently for better performance
        await Promise.all([fetchUsers(), fetchProducts()]);

        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Authentication or Data Fetching Error:", error);
        if (mounted) {
          setIsLoading(false);
          // If adminId exists but auth fails (e.g., token expired), navigate to login
          if (localStorage.getItem('adminId')) { // Only navigate if there was an adminId but auth failed
             alert("Your admin session has expired or is invalid. Please log in again.");
             navigate('/admin/login');
             localStorage.removeItem('adminId');
             localStorage.removeItem('adminEmail');
          } else {
             // If no adminId, it means navigation already happened or is about to
          }
        }
      }
    };

    checkAuthAndLoadData();

    return () => {
      mounted = false;
    };
  }, [navigate]); // Added navigate to dependency array as it's used inside useEffect

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];

      querySnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users. Please try again."); // User feedback
    }
  };

  const fetchProducts = async () => {
    try {
      const storesSnapshot = await getDocs(collection(db, 'stores'));
      const productsList = [];

      for (const storeDoc of storesSnapshot.docs) {
        const storeId = storeDoc.id;
        const storeData = storeDoc.data();

        const productsRef = collection(db, 'stores', storeId, 'products');
        const productsSnapshot = await getDocs(productsRef);

        let sellerName = storeData.storeName || 'Unknown';
        if (storeData.ownerId) {
          const ownerRef = doc(db, 'users', storeData.ownerId);
          const ownerSnap = await getDoc(ownerRef);
          if (ownerSnap.exists()) {
            sellerName = ownerSnap.data().name || ownerSnap.data().displayName || sellerName;
          }
        }

        productsSnapshot.forEach((productDoc) => {
          productsList.push({
            id: productDoc.id,
            storeId,
            storeName: storeData.storeName || 'Unknown Store',
            sellerName,
            ...productDoc.data()
          });
        });
      }

      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch products. Please try again."); // User feedback
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm(''); // Clear search term when changing tabs
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminEmail');
      navigate('/admin/login');
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed. Please try again.");
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const openConfirmationDialog = (item, action, type) => {
    setSelectedItem(item);
    setDialogAction(action);
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null); // Clear selected item on close
    setDialogAction('');
    setDialogType('');
  };

  const handleConfirmAction = async () => {
    // Perform action based on dialog type and action
    if (dialogType === 'user') {
      if (dialogAction === 'disable') {
        await disableUser(selectedItem);
      } else if (dialogAction === 'delete') {
        await deleteUser(selectedItem);
      }
    } else if (dialogType === 'product') {
      if (dialogAction === 'delete') {
        await deleteProduct(selectedItem);
      }
    }

    handleCloseDialog(); // Close dialog after action
  };

  const disableUser = async (user) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        admin: false,
        buyer: false,
        seller: false,
        disabled: true
      });
      alert(`User ${user.email} has been disabled.`);
      await fetchUsers(); // Refresh user list
    } catch (error) {
      console.error("Error disabling user:", error);
      alert("Failed to disable user. Check console for details.");
    }
  };

  const deleteUser = async (user) => {
    try {
      const batch = writeBatch(db); // Use a batch for atomic operations

      // 1. Delete associated store and products if the user is a seller
      if (user.seller) {
        const storeRef = doc(db, 'stores', user.id); // Assuming store ID is the user's ID
        batch.delete(storeRef);

        const productsInStoreQuery = collection(db, 'stores', user.id, 'products');
        const productsSnapshot = await getDocs(productsInStoreQuery);
        productsSnapshot.forEach((productDoc) => {
          batch.delete(productDoc.ref);
        });

        // 2. Delete orders where this user's store was the seller
        // IMPORTANT: This assumes orders have a 'storeId' field matching the seller's user.id.
        // If an order can contain items from multiple sellers/stores, this logic
        // would need to be more complex (e.g., iterating all orders and modifying their 'items' array).
        const sellerOrdersQuery = query(collection(db, 'orders'), where('storeId', '==', user.id));
        const sellerOrdersSnapshot = await getDocs(sellerOrdersQuery);
        sellerOrdersSnapshot.forEach((orderDoc) => {
          batch.delete(orderDoc.ref);
        });
        console.log(`Deleted store, products, and seller orders for user ${user.id}`);
      }

      // 3. Delete user's own orders (as a buyer)
      const buyerOrdersQuery = query(collection(db, 'orders'), where('buyerId', '==', user.id));
      const buyerOrdersSnapshot = await getDocs(buyerOrdersQuery);
      buyerOrdersSnapshot.forEach((orderDoc) => {
        batch.delete(orderDoc.ref);
      });
      console.log(`Deleted buyer orders for user ${user.id}`);


      // 4. Delete the user document itself
      const userRef = doc(db, 'users', user.id);
      batch.delete(userRef);
      console.log(`Deleted user document for user ${user.id}`);


      await batch.commit(); // Commit all batch operations
      alert(`User ${user.email} and all associated data have been permanently deleted.`);

      // Refresh lists after deletion
      await Promise.all([fetchUsers(), fetchProducts()]);

    } catch (error) {
      console.error("Error deleting user and associated data:", error);
      alert("Failed to delete user and associated data. Check console for details.");
    }
  };

  const deleteProduct = async (product) => {
    try {
      const batch = writeBatch(db); // Use a batch for atomic operations

      // 1. Delete the product document from its store's subcollection
      const productRef = doc(db, 'stores', product.storeId, 'products', product.id);
      batch.delete(productRef);
      console.log(`Deleted product document: ${product.id}`);

      // 2. Update/Delete orders containing this product
      // CAUTION: This operation can be VERY inefficient for a large number of orders.
      // Fetching all orders and iterating through them client-side is not scalable.
      // For production, consider using Firebase Cloud Functions triggered by product deletion
      // or a more denormalized order structure.
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef); // Fetches ALL orders

      ordersSnapshot.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        let items = orderData.items || [];
        const initialItemCount = items.length;

        // Filter out the deleted product from the items array
        items = items.filter(item => item.productId !== product.id);

        if (items.length === 0 && initialItemCount > 0) { // Only delete if items were present and now are zero
          // If no items left in the order after removing the product, delete the entire order
          batch.delete(orderDoc.ref);
          console.log(`Deleted order ${orderDoc.id} as it became empty after product deletion.`);
        } else if (items.length < initialItemCount) {
          // If the product was removed but other items remain, update the order
          const newTotalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          batch.update(orderDoc.ref, { items: items, totalAmount: newTotalAmount });
          console.log(`Updated order ${orderDoc.id} after removing product ${product.id}.`);
        }
      });

      await batch.commit(); // Commit all batch operations
      alert(`Product "${product.name}" and references in orders have been permanently removed.`);

      await fetchProducts(); // Refresh product list after deletion

    } catch (error) {
      console.error("Error deleting product and updating orders:", error);
      alert("Failed to delete product and update associated orders. Check console for details.");
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm) ||
    user.displayName?.toLowerCase().includes(searchTerm) ||
    user.name?.toLowerCase().includes(searchTerm)
  );

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm) ||
    product.description?.toLowerCase().includes(searchTerm) ||
    product.storeName?.toLowerCase().includes(searchTerm) ||
    product.sellerName?.toLowerCase().includes(searchTerm)
  );

  if (isLoading) {
    return (
      <main className="loading-container" aria-label="Loading dashboard">
        <CircularProgress size={60} className="loading-spinner" />
        <p className="loading-text">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <section className="admin-container">
      {/* AdminNavigation is imported but not rendered. If it should be, add it here. */}
      {/* <AdminNavigation /> */}
      <header className="admin-header">
        <section className="admin-header-content">
          <h1 className="admin-title">Admin Dashboard</h1>
          <section className="admin-user-info">
            <section>{localStorage.getItem('adminEmail')}</section>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={handleLogout}
              className="admin-logout-button"
            >
              Logout
            </Button>
          </section>
        </section>
      </header>

      <main className="admin-main">
        <section className="admin-search-container">
          <TextField
            fullWidth
            variant="outlined"
            placeholder={activeTab === 0 ? "Search users..." : "Search products..."}
            value={searchTerm}
            onChange={handleSearchChange}
            className="admin-search-input"
            InputProps={{
              className: "admin-search-input-props"
            }}
          />
        </section>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          className="admin-tabs"
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Users Management" />
          <Tab label="Products Management" />
        </Tabs>

        <section className="admin-content-container">
          {activeTab === 0 ? (
            <section className="admin-table-container">
              <header className="admin-table-header">
                <section className="admin-table-cell admin-id-column">User ID</section>
                <section className="admin-table-cell admin-name-column">Name</section>
                <section className="admin-table-cell admin-email-column">Email</section>
                <section className="admin-table-cell admin-role-column">Roles</section>
                <section className="admin-table-cell admin-status-column">Status</section>
                <section className="admin-table-cell admin-actions-column">Actions</section>
              </header>

              <section className="admin-table-body">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <article key={user.id} className="admin-table-row">
                      <section className="admin-table-cell admin-id-column">{user.id.substring(0, 8)}...</section>
                      <section className="admin-table-cell admin-name-column">{user.name || user.displayName || 'N/A'}</section>
                      <section className="admin-table-cell admin-email-column">{user.email || 'N/A'}</section>
                      <section className="admin-table-cell admin-role-column">
                        {user.buyer && 'Buyer'}
                        {user.buyer && user.seller && ', '}
                        {user.seller && 'Seller'}
                        {user.admin && (user.buyer || user.seller) && ', '}
                        {user.admin && 'Admin'}
                        {!user.buyer && !user.seller && !user.admin && 'None'}
                      </section>
                      <section className="admin-table-cell admin-status-column">
                        <section className={`status-pill ${user.disabled ? 'status-pill-disabled' : 'status-pill-active'}`}>
                          {user.disabled ? 'Disabled' : 'Active'}
                        </section>
                      </section>
                      <section className="admin-table-cell admin-actions-column">
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => openConfirmationDialog(user, 'disable', 'user')}
                          className="admin-action-button"
                          disabled={user.disabled} // Disable if already disabled
                        >
                          {user.disabled ? 'Already Disabled' : 'Disable Access'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => openConfirmationDialog(user, 'delete', 'user')}
                          className="admin-action-button"
                        >
                          Delete
                        </Button>
                      </section>
                    </article>
                  ))
                ) : (
                  <p className="admin-no-content">No users found</p>
                )}
              </section>
            </section>
          ) : (
            <section className="admin-table-container">
              <header className="admin-table-header">
                <section className="admin-table-cell admin-id-column">ID</section>
                <section className="admin-table-cell admin-name-column">Product</section>
                <section className="admin-table-cell admin-price-column">Price</section>
                <section className="admin-table-cell admin-seller-column">Store / Seller</section>
                <section className="admin-table-cell admin-actions-column">Actions</section>
              </header>

              <section className="admin-table-body">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <article key={product.id} className="admin-table-row">
                      <section className="admin-table-cell admin-id-column">{product.id.substring(0, 8)}...</section>
                      <section className="admin-table-cell admin-name-column">{product.name || 'N/A'}</section>
                      <section className="admin-table-cell admin-price-column">R{product.price || 0}</section>
                      <section className="admin-table-cell admin-seller-column">
                        {product.storeName || 'Unknown Store'}
                        {product.sellerName && product.sellerName !== product.storeName && ` / ${product.sellerName}`}
                      </section>
                      <section className="admin-table-cell admin-actions-column">
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => openConfirmationDialog(product, 'delete', 'product')}
                          className="admin-action-button"
                        >
                          Remove Product
                        </Button>
                      </section>
                    </article>
                  ))
                ) : (
                  <p className="admin-no-content">No products found</p>
                )}
              </section>
            </section>
          )}
        </section>
      </main>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogTitle>
          {dialogAction === 'disable' ? 'Disable User Access' : 'Delete Confirmation'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogType === 'user' && dialogAction === 'disable' && (
              `Are you sure you want to disable all access for ${selectedItem?.name || selectedItem?.displayName || selectedItem?.email || 'this user'}? They will not be able to log in as buyer or seller. This action can be undone manually in the database if needed.`
            )}
            {dialogType === 'user' && dialogAction === 'delete' && (
              `Are you sure you want to permanently delete ${selectedItem?.name || selectedItem?.displayName || selectedItem?.email || 'this user'}? This action cannot be undone. This will also delete their store, all products in their store, and any orders associated with them (as a buyer or seller).`
            )}
            {dialogType === 'product' && (
              `Are you sure you want to permanently remove the product "${selectedItem?.name || 'this product'}"? This action cannot be undone. This will also remove this product from any existing orders.`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} color="error" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}