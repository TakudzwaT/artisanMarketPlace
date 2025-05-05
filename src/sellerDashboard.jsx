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
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userId = currentUser?.uid;

  useEffect(() => {
    let userId = localStorage.getItem('userId');
    
    // Set initial loading state
    setLoading(true);
    
    // Fetch all data in parallel
    Promise.all([
      fetchStoreInfo(),
      fetchInventory(),
      fetchSales()
    ])
    .catch(err => {
      console.error("Error initializing dashboard:", err);
      setError("Failed to load dashboard data");
    })
    .finally(() => {
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    // Calculate statistics whenever sales data changes
    calculateStatistics();
  }, [sales]);

  const calculateStatistics = () => {
    if (sales.length > 0) {
      // Calculate total revenue
      const revenue = sales.reduce((sum, order) => {
        if (typeof order.total !== 'number') {
          throw new Error(`Invalid order total for order ${order.id}`);
        }
        return sum + order.total;
      }, 0);
      setTotalRevenue(revenue);
      
      // Calculate total items sold
      const items = sales.reduce((sum, order) => {
        if (!Array.isArray(order.items)) {
          throw new Error(`Missing items array for order ${order.id}`);
        }
        
        return sum + order.items.reduce((itemSum, item) => {
          if (typeof item.qty !== 'number') {
            throw new Error(`Invalid quantity for item in order ${order.id}`);
          }
          return itemSum + item.qty;
        }, 0);
      }, 0);
      setTotalItems(items);
    } else {
      setTotalRevenue(0);
      setTotalItems(0);
    }
  };

  const fetchStoreInfo = async () => {
    try {
    let userId = localStorage.getItem('userId');
      
      const storeRef = doc(db, "stores", userId);
      const storeDoc = await getDoc(storeRef);
      
      if (!storeDoc.exists()) {
        throw new Error("Store data not found");
      }
      
      const data = storeDoc.data();
      
      // Validate required store fields
      if (!data.storeName) throw new Error("Store name is missing");
      if (!data.storeBio) throw new Error("Store bio is missing");
      if (!data.ownerName) throw new Error("Owner name is missing");
      if (!data.paymentMethod) throw new Error("Payment method is missing");
      
      setStoreInfo(data);
    } catch (err) {
      console.error("Error fetching store info:", err);
      setError(`Store information error: ${err.message}`);
      throw err; // Re-throw to be caught by the Promise.all
    }
  };

  const fetchInventory = async () => {
    try {
        let userId = localStorage.getItem('userId');
      
      // Access the products subcollection within the store document
      const productsRef = collection(db, "stores", userId, "products");
      const snapshot = await getDocs(productsRef);
      
      if (snapshot.empty) {
        setInventory([]);
        return;
      }
      
      const productData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Validate required product fields
        if (!data.name) throw new Error(`Product name is missing for product ${doc.id}`);
        if (typeof data.price !== 'number') throw new Error(`Invalid price for product ${doc.id}`);
        if (typeof data.stock !== 'number') throw new Error(`Invalid stock for product ${doc.id}`);
        if (!data.status) throw new Error(`Status is missing for product ${doc.id}`);
        if (!data.category) throw new Error(`Category is missing for product ${doc.id}`);
        
        return {
          id: doc.id,
          ...data
        };
      });
      
      setInventory(productData);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(`Inventory error: ${err.message}`);
      throw err; // Re-throw to be caught by the Promise.all
    }
  };

  const fetchSales = async () => {
    try {
        let userId = localStorage.getItem('userId');
      
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef, 
        where("storeId", "==", userId), 
        where("status", "==", "collected")
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setSales([]);
        return;
      }
      
      let allSales = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Validate required order fields
        if (!data.createdAt) throw new Error(`Created date is missing for order ${doc.id}`);
        if (!Array.isArray(data.items)) throw new Error(`Items array is missing for order ${doc.id}`);
        if (typeof data.total !== 'number') throw new Error(`Invalid total for order ${doc.id}`);
        
        // Validate each item in the order
        data.items.forEach((item, index) => {
          if (!item.name) throw new Error(`Item name is missing in order ${doc.id}, item ${index}`);
          if (typeof item.qty !== 'number') throw new Error(`Invalid quantity in order ${doc.id}, item ${index}`);
          if (typeof item.price !== 'number') throw new Error(`Invalid price in order ${doc.id}, item ${index}`);
        });
        
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Filter by date if selected
      if (selectedDate) {
        allSales = allSales.filter(order => {
          // Handle Firestore timestamp or date string appropriately
          let orderDate;
          if (order.createdAt?.toDate) {
            orderDate = format(order.createdAt.toDate(), "yyyy-MM-dd");
          } else if (order.createdAt instanceof Date) {
            orderDate = format(order.createdAt, "yyyy-MM-dd");
          } else {
            orderDate = format(new Date(order.createdAt), "yyyy-MM-dd");
          }
          
          return orderDate === selectedDate;
        });
      }
      
      setSales(allSales);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError(`Sales error: ${err.message}`);
      throw err; // Re-throw to be caught by the Promise.all
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const applyDateFilter = () => {
    setLoading(true);
    fetchSales()
      .catch(err => setError(`Date filter error: ${err.message}`))
      .finally(() => setLoading(false));
  };

  const resetDateFilter = () => {
    setSelectedDate("");
    setLoading(true);
    fetchSales()
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
                          {product.status}
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
                  {sales.flatMap((order, orderIndex) => 
                    order.items.map((item, itemIndex) => {
                      let dateObj;
                      if (order.createdAt?.toDate) {
                        dateObj = order.createdAt.toDate();
                      } else if (order.createdAt instanceof Date) {
                        dateObj = order.createdAt;
                      } else {
                        dateObj = new Date(order.createdAt);
                      }
                      
                      const date = format(dateObj, "yyyy-MM-dd");
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
                    })
                  )}
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
    </div></>
    
  );
}

export default SellerDashboard;