import React, { useEffect, useState } from "react";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { format } from "date-fns";
import "./styling/dboardstyle.css";
import Navi from "./components/sellerNav";

const db = getFirestore();

function SellerDashboard() {
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [storeId, setStoreId] = useState("");
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  useEffect(() => {
    // Get userId from localStorage or auth
    const userId = localStorage.getItem('userId') || currentUser?.uid;
    
    if (!userId) {
      setError("User not authenticated");
      return;
    }
    
    setStoreId(userId);
    
    // Set initial loading state
    setLoading(true);
    
    // Fetch all data in parallel
    Promise.all([
      fetchStoreInfo(userId),
      fetchInventory(userId),
      fetchSales(userId)
    ])
    .catch(err => {
      console.error("Error initializing dashboard:", err);
      setError("Failed to load dashboard data");
    })
    .finally(() => {
      setLoading(false);
    });
  }, [currentUser]);

  useEffect(() => {
    // Calculate statistics whenever sales data changes
    calculateStatistics();
  }, [sales]);

  const calculateStatistics = () => {
    if (sales.length > 0) {
      // Calculate total revenue - sum of relevant item totals for this store
      const revenue = sales.reduce((sum, order) => {
        if (!order.items) return sum;
        
        // Sum up totals for each item
        const orderTotal = Object.values(order.items).reduce((itemSum, item) => {
          return itemSum + (item.total || (item.price * item.qty) || 0);
        }, 0);
        
        return sum + orderTotal;
      }, 0);
      setTotalRevenue(revenue);
      
      // Calculate total items sold - only count items for this store
      const items = sales.reduce((sum, order) => {
        if (!order.items) return sum;
        
        const orderItems = Object.values(order.items).reduce((itemSum, item) => {
          return itemSum + (item.qty || 0);
        }, 0);
        
        return sum + orderItems;
      }, 0);
      setTotalItems(items);
    } else {
      setTotalRevenue(0);
      setTotalItems(0);
    }
  };

  const fetchStoreInfo = async (userId) => {
    try {
      // From the images, I can see that store info is stored in the stores collection
      const storeRef = doc(db, "stores", userId);
      const storeDoc = await getDoc(storeRef);
      
      if (!storeDoc.exists()) {
        throw new Error("Store data not found");
      }
      
      const data = storeDoc.data();
      setStoreInfo(data);
      return data;
    } catch (err) {
      console.error("Error fetching store info:", err);
      setError(`Store information error: ${err.message}`);
      throw err;
    }
  };

  const fetchInventory = async (userId) => {
    try {
      // From the images, I can see products are stored as a subcollection of stores
      const productsRef = collection(db, "stores", userId, "products");
      const snapshot = await getDocs(productsRef);
      
      if (snapshot.empty) {
        setInventory([]);
        return [];
      }
      
      const productData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      setInventory(productData);
      return productData;
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(`Inventory error: ${err.message}`);
      throw err;
    }
  };

  const fetchSales = async (userId, date = selectedDate) => {
    try {
      // Based on the images, orders are stored in a top-level collection
      // Important: From Image 3, we can see that storeId is in each item, not at the order level
      const ordersRef = collection(db, "orders");
      
      // We'll get all orders and then filter for this store's items
      const snapshot = await getDocs(ordersRef);
      
      if (snapshot.empty) {
        setSales([]);
        return [];
      }
      
      // Get all orders first
      let allOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Filter orders to only include those with items from this store
      let storeOrders = allOrders.filter(order => {
        if (!order.items) return false;
        
        // Check if any item in this order belongs to the current store
        return Object.values(order.items).some(item => item.storeId === userId);
      });
      
      // Filter by date if selected
      if (date) {
        storeOrders = storeOrders.filter(order => {
          let orderDate;
          
          // Handle different date formats from Firestore
          if (order.createdAt?.toDate) {
            orderDate = format(order.createdAt.toDate(), "yyyy-MM-dd");
          } else if (order.createdAt instanceof Date) {
            orderDate = format(order.createdAt, "yyyy-MM-dd");
          } else if (order.purchasedAt?.toDate) {
            // From image 2, it seems purchasedAt is used instead of createdAt
            orderDate = format(order.purchasedAt.toDate(), "yyyy-MM-dd");
          } else if (order.purchasedAt) {
            orderDate = format(new Date(order.purchasedAt), "yyyy-MM-dd");
          } else {
            orderDate = format(new Date(), "yyyy-MM-dd");
          }
          
          return orderDate === date;
        });
      }
      
      // For each order, keep only the items that belong to this store
      const processedOrders = storeOrders.map(order => {
        // Create a copy of the order
        const processedOrder = {...order};
        
        if (processedOrder.items) {
          // Filter items to only include those from this store
          const storeItems = {};
          Object.entries(processedOrder.items).forEach(([key, item]) => {
            if (item.storeId === userId) {
              storeItems[key] = item;
            }
          });
          processedOrder.items = storeItems;
        }
        
        return processedOrder;
      });
      
      setSales(processedOrders);
      return processedOrders;
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError(`Sales error: ${err.message}`);
      throw err;
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const applyDateFilter = () => {
    setLoading(true);
    fetchSales(storeId, selectedDate)
      .catch(err => setError(`Date filter error: ${err.message}`))
      .finally(() => setLoading(false));
  };

  const resetDateFilter = () => {
    setSelectedDate("");
    setLoading(true);
    fetchSales(storeId)
      .catch(err => setError(`Reset filter error: ${err.message}`))
      .finally(() => setLoading(false));
  };

  // Show loading spinner during initial load
  if (loading && !inventory.length && !sales.length && !storeInfo) {
    return (
      <div className="artisan-dashboard loading-spinner">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Display error message
  if (error) {
    return (
      <div className="artisan-dashboard error-message">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  // If store info is missing after loading, show error
  if (!loading && !storeInfo) {
    return (
      <div className="artisan-dashboard error-message">
        <h2>Store Information Not Found</h2>
        <p>Please complete your store profile before accessing the dashboard.</p>
        <button onClick={() => window.location.href = "/profile"}>Go to Profile</button>
      </div>
    );
  }

  return (
    <>
      <Navi />
      <div className="artisan-dashboard">
        <div className="dashboard-header">
          <div className="store-info">
            <h1>{storeInfo.storeName}</h1>
            <p>
              {storeInfo.storeBio} • 
              {storeInfo.paymentMethod} • 
              Owner: {storeInfo.ownerName}
            </p>
          </div>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Sales</h3>
            <p className="stat-value">{sales.length}</p>
          </div>
          <div className="stat-card">
            <h3>Revenue</h3>
            <p className="stat-value">{totalRevenue}</p>
          </div>
          <div className="stat-card">
            <h3>Items Sold</h3>
            <p className="stat-value">{totalItems}</p>
          </div>
          <div className="stat-card">
            <h3>Products</h3>
            <p className="stat-value">{inventory.length}</p>
          </div>
        </div>
        
        {loading && (
          <div className="loading-spinner" style={{ padding: "20px" }}>
            <div className="spinner"></div>
            <p>Updating data...</p>
          </div>
        )}
        
        <div className="dashboard-content">
          <section className="inventory-section">
            <div className="section-header">
              <h2>Inventory</h2>
            </div>
            
            {inventory.length > 0 ? (
              <div className="table-container">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((product) => (
                      <tr key={product.id}>
                        <td className="product-name">{product.name}</td>
                        <td>{product.category}</td>
                        <td>{product.price}</td>
                        <td>{product.stock}</td>
                        <td>
                          <span className={`status-pill ${product.status === "Active" ? "status-active" : "status-inactive"}`}>
                            {product.status || (product.stock > 0 ? "In Stock" : "Out of Stock")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No products in inventory</p>
              </div>
            )}
          </section>
          
          <section className="sales-section">
            <div className="section-header">
              <h2>Sales</h2>
              <div className="date-filter">
                <label>
                  Filter by date:
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                  />
                </label>
                <div className="filter-actions">
                  <button className="apply-btn" onClick={applyDateFilter}>Apply</button>
                  {selectedDate && (
                    <button className="reset-btn" onClick={resetDateFilter}>Reset</button>
                  )}
                </div>
              </div>
            </div>
            
            {sales.length > 0 ? (
              <div className="table-container">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.flatMap((order, orderIndex) => {
                      // Handle case where items might be nested differently
                      // Based on image 3, items are stored with numeric keys
                      const items = order.items || {};
                      
                      return Object.values(items).map((item, itemIndex) => {
                        // Skip items that don't belong to this store (should be filtered already, but as a safeguard)
                        if (item.storeId !== storeId) return null;
                        
                        let dateObj;
                        
                        // Handle different date formats
                        if (order.createdAt?.toDate) {
                          dateObj = order.createdAt.toDate();
                        } else if (order.createdAt instanceof Date) {
                          dateObj = order.createdAt;
                        } else if (order.purchasedAt?.toDate) {
                          dateObj = order.purchasedAt.toDate();
                        } else if (order.purchasedAt) {
                          dateObj = new Date(order.purchasedAt);
                        } else {
                          dateObj = new Date();
                        }
                        
                        const date = format(dateObj, "yyyy-MM-dd");
                        // Get total from item or calculate it
                        const itemTotal = item.total || (item.price * item.qty);
                          
                        return (
                          <tr key={`${order.id}-${itemIndex}`}>
                            <td>{order.id.substring(0, 8)}</td>
                            <td className="product-name">{item.name}</td>
                            <td>{item.qty}</td>
                            <td>{item.price}</td>
                            <td>{itemTotal}</td>
                            <td>{date}</td>
                          </tr>
                        );
                      }).filter(Boolean); // Remove any null entries from the mapping
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>{selectedDate ? `No sales found for ${selectedDate}` : "No sales records found"}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default SellerDashboard;