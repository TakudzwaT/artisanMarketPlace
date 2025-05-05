
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
  query, 
  where 
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
import AdminNavigation from './AdminNavigation';

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
    const checkAuth = async () => {
      try {
        const adminId = localStorage.getItem('adminId');
        if (!adminId) {
          navigate('/admin/login');
          return;
        }
        
        const userRef = doc(db, 'users', adminId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists() || !userSnap.data().admin) {
          await signOut(auth);
          localStorage.removeItem('adminId');
          navigate('/admin/login');
          return;
        }
        
        fetchUsers();
        fetchProducts();
      } catch (error) {
        console.error("Authentication error:", error);
        navigate('/admin/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

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
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const storesSnapshot = await getDocs(collection(db, 'stores'));
      const productsList = [];
      
      for (const storeDoc of storesSnapshot.docs) {
        const storeId = storeDoc.id;
        const productsRef = collection(db, 'stores', storeId, 'products');
        const productsSnapshot = await getDocs(productsRef);
        
        productsSnapshot.forEach((productDoc) => {
          productsList.push({
            id: productDoc.id,
            storeId,
            storeName: storeDoc.data().storeName,
            ...productDoc.data()
          });
        });
      }
      
      setProducts(productsList);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setIsLoading(false);
    }
  };
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminEmail');
      navigate('/admin/login');
    } catch (error) {
      console.error("Logout error:", error);
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
  };

  const handleConfirmAction = async () => {
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
    
    setOpenDialog(false);
  };
  // ... (keep other functions the same until disableUser/deleteUser)

  const disableUser = async (user) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        admin: false,
        buyer: false,
        seller: false,
        disabled: true
      });
      fetchUsers();
    } catch (error) {
      console.error("Error disabling user:", error);
    }
  };

  const deleteUser = async (user) => {
    try {
      if (user.seller) {
        const storeRef = doc(db, 'stores', user.id);
        await deleteDoc(storeRef);
      }
      await deleteDoc(doc(db, 'users', user.id));
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const deleteProduct = async (product) => {
    try {
      await deleteDoc(doc(db, 'stores', product.storeId, 'products', product.id));
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  // ... (keep the rest of the component the same except products table cell)

  // In products table rendering:
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm) || 
    user.displayName?.toLowerCase().includes(searchTerm)
  );

  const filteredProducts = products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm) || 
    product.description?.toLowerCase().includes(searchTerm)
  );

  if (isLoading) {
    return (
      <main style={styles.loadingContainer} aria-label="Loading dashboard">
        <CircularProgress size={60} style={{ color: '#6D4C41' }} />
        <p style={styles.loadingText}>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <section style={styles.container}>
      <header style={styles.header}>
        <section style={styles.headerContent}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <section style={styles.userInfo}>
            <span>{localStorage.getItem('adminEmail')}</span>
            <Button 
              variant="outlined" 
              color="inherit" 
              size="small" 
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              Logout
            </Button>
          </section>
        </section>
      </header>

      <main style={styles.main}>
        <section style={styles.searchContainer}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={activeTab === 0 ? "Search users..." : "Search products..."}
            value={searchTerm}
            onChange={handleSearchChange}
            style={styles.searchInput}
            InputProps={{
              style: {
                backgroundColor: 'white',
                borderRadius: '8px',
              }
            }}
          />
        </section>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          style={styles.tabs}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Users Management" />
          <Tab label="Products Management" />
        </Tabs>

        <section style={styles.contentContainer}>
          {activeTab === 0 ? (
            <section style={styles.tableContainer}>
              <header style={styles.tableHeader}>
                <span style={{...styles.tableCell, ...styles.idColumn}}>User ID</span>
                <span style={{...styles.tableCell, ...styles.nameColumn}}>Name</span>
                <span style={{...styles.tableCell, ...styles.emailColumn}}>Email</span>
                <span style={{...styles.tableCell, ...styles.roleColumn}}>Roles</span>
                <span style={{...styles.tableCell, ...styles.statusColumn}}>Status</span>
                <span style={{...styles.tableCell, ...styles.actionsColumn}}>Actions</span>
              </header>
              
              <section style={styles.tableBody}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <article key={user.id} style={styles.tableRow}>
                      <span style={{...styles.tableCell, ...styles.idColumn}}>{user.id.substring(0, 8)}...</span>
                      <span style={{...styles.tableCell, ...styles.nameColumn}}>{user.name || 'N/A'}</span>
                      <span style={{...styles.tableCell, ...styles.emailColumn}}>{user.email || 'N/A'}</span>
                      <span style={{...styles.tableCell, ...styles.roleColumn}}>
                        {user.buyer && 'Buyer'} 
                        {user.buyer && user.seller && ', '} 
                        {user.seller && 'Seller'}
                        {!user.buyer && !user.seller && 'None'}
                      </span>
                      <span style={{...styles.tableCell, ...styles.statusColumn}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: user.disabled ? '#FFEBEE' : '#E8F5E9',
                          color: user.disabled ? '#C62828' : '#2E7D32',
                          fontSize: '0.8rem',
                        }}>
                          {user.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </span>
                      <span style={{...styles.tableCell, ...styles.actionsColumn}}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          onClick={() => openConfirmationDialog(user, 'disable', 'user')}
                          style={styles.actionButton}
                        >
                          {user.disabled ? 'Already Disabled' : 'Disable Access'}
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          onClick={() => openConfirmationDialog(user, 'delete', 'user')}
                          style={styles.actionButton}
                        >
                          Delete
                        </Button>
                      </span>
                    </article>
                  ))
                ) : (
                  <p style={styles.noContent}>No users found</p>
                )}
              </section>
            </section>
          ) : (
            <section style={styles.tableContainer}>
              <header style={styles.tableHeader}>
                <span style={{...styles.tableCell, ...styles.idColumn}}>ID</span>
                <span style={{...styles.tableCell, ...styles.nameColumn}}>Product</span>
                <span style={{...styles.tableCell, ...styles.priceColumn}}>Price</span>
                <span style={{...styles.tableCell, ...styles.sellerColumn}}>Seller</span>
                <span style={{...styles.tableCell, ...styles.actionsColumn}}>Actions</span>
              </header>
              
              <section style={styles.tableBody}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <article key={product.id} style={styles.tableRow}>
                      <span style={{...styles.tableCell, ...styles.idColumn}}>{product.id.substring(0, 8)}...</span>
                      <span style={{...styles.tableCell, ...styles.nameColumn}}>{product.name || 'N/A'}</span>
                      <span style={{...styles.tableCell, ...styles.priceColumn}}>R{product.price || 0}</span>
                      <span style={{...styles.tableCell, ...styles.sellerColumn}}>{product.sellerName || product.sellerId || 'Unknown'}</span>
                      <span style={{...styles.tableCell, ...styles.actionsColumn}}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          onClick={() => openConfirmationDialog(product, 'delete', 'product')}
                          style={styles.actionButton}
                        >
                          Remove Product
                        </Button>
                      </span>
                    </article>
                  ))
                ) : (
                  <p style={styles.noContent}>No products found</p>
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
              `Are you sure you want to disable all access for ${selectedItem?.displayName || selectedItem?.email || 'this user'}? They will not be able to log in as buyer or seller.`
            )}
            {dialogType === 'user' && dialogAction === 'delete' && (
              `Are you sure you want to permanently delete ${selectedItem?.displayName || selectedItem?.email || 'this user'}? This action cannot be undone.`
            )}
            {dialogType === 'product' && (
              `Are you sure you want to remove the product "${selectedItem?.name || 'this product'}"? This action cannot be undone.`
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

// Keep styles object the same



const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#4B3621',
    color: 'white',
    padding: '16px 24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logoutButton: {
    color: 'white',
    borderColor: 'white',
  },
  main: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    flex: 1,
  },
  searchContainer: {
    marginBottom: '24px',
  },
  searchInput: {
    backgroundColor: 'white',
  },
  tabs: {
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  tableHeader: {
    display: 'flex',
    borderBottom: '2px solid #f0f0f0',
    fontWeight: 'bold',
    backgroundColor: '#fafafa',
    borderRadius: '8px 8px 0 0',
  },
  tableBody: {
    maxHeight: '600px',
    overflowY: 'auto',
  },
  tableRow: {
    display: 'flex',
    borderBottom: '1px solid #f0f0f0',
    '&:hover': {
      backgroundColor: '#f9f9f9',
    },
  },
  tableCell: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  idColumn: {
    width: '15%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nameColumn: {
    width: '20%',
  },
  emailColumn: {
    width: '20%',
  },
  roleColumn: {
    width: '15%',
  },
  statusColumn: {
    width: '10%',
  },
  priceColumn: {
    width: '10%',
  },
  sellerColumn: {
    width: '25%',
  },
  actionsColumn: {
    width: '20%',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  actionButton: {
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
  },
  noContent: {
    padding: '24px',
    textAlign: 'center',
    color: '#757575',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: '20px',
    color: '#6D4C41',
    fontSize: '1.2rem',
  },
};