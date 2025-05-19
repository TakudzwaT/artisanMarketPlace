import React, { useEffect, useState, useRef } from "react";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { format, isWithinInterval, parseISO } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./styling/dboardstyle.css";
import Navi from "./components/sellerNav";

const db = getFirestore();

function SellerDashboard() {
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [storeId, setStoreId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const dashboardRef = useRef(null);
  const auth = getAuth();
  
  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setIsLoggedIn(true);
        initializeDashboard(user.uid);
      } else {
        // Check if a seller ID is in localStorage as a fallback
        const storedSellerId = localStorage.getItem('sellerId');
        if (storedSellerId) {
          setIsLoggedIn(true);
          initializeDashboard(storedSellerId);
        } else {
          // No authentication found - redirect to login
          setLoading(false);
          setIsLoggedIn(false);
          setError("Please log in to access your seller dashboard");
        }
      }
    });
    
    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, []);

  const initializeDashboard = (sellerId) => {
    if (!sellerId) {
      setLoading(false);
      setError("Seller ID not found");
      return;
    }
    
    setStoreId(sellerId);
    
    // Set initial loading state
    setLoading(true);
    
    // Fetch all data in parallel
    Promise.all([
      fetchStoreInfo(sellerId),
      fetchInventory(sellerId),
      fetchSales(sellerId)
    ])
    .catch(err => {
      console.error("Error initializing dashboard:", err);
      setError("Failed to load dashboard data");
    })
    .finally(() => {
      setLoading(false);
    });
  };

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

  const fetchStoreInfo = async (sellerId) => {
    try {
      // From the images, I can see that store info is stored in the stores collection
      const storeRef = doc(db, "stores", sellerId);
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

  const fetchInventory = async (sellerId) => {
    try {
      // From the images, I can see products are stored as a subcollection of stores
      const productsRef = collection(db, "stores", sellerId, "products");
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

  const fetchSales = async (sellerId, dateRange = { start: startDate, end: endDate }) => {
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
        return Object.values(order.items).some(item => item.storeId === sellerId);
      });
      
      // Filter by date range if selected
      if (dateRange.start || dateRange.end) {
        storeOrders = storeOrders.filter(order => {
          let orderDate;
          
          // Handle different date formats from Firestore
          if (order.createdAt?.toDate) {
            orderDate = order.createdAt.toDate();
          } else if (order.createdAt instanceof Date) {
            orderDate = order.createdAt;
          } else if (order.purchasedAt?.toDate) {
            // From image 2, it seems purchasedAt is used instead of createdAt
            orderDate = order.purchasedAt.toDate();
          } else if (order.purchasedAt) {
            orderDate = new Date(order.purchasedAt);
          } else {
            orderDate = new Date();
          }
          
          // Apply date range filter
          if (dateRange.start && dateRange.end) {
            // Filter between start and end dates
            const start = parseISO(dateRange.start);
            const end = parseISO(dateRange.end);
            // Add one day to end date to include the full end date
            end.setDate(end.getDate() + 1);
            return isWithinInterval(orderDate, { start, end });
          } else if (dateRange.start) {
            // Filter for dates after start
            return orderDate >= parseISO(dateRange.start);
          } else if (dateRange.end) {
            // Filter for dates before end (inclusive)
            const end = parseISO(dateRange.end);
            end.setDate(end.getDate() + 1); // Include the full end date
            return orderDate < end;
          }
          
          return true;
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
            if (item.storeId === sellerId) {
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

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const applyDateFilter = () => {
    setLoading(true);
    fetchSales(storeId, { start: startDate, end: endDate })
      .catch(err => setError(`Date filter error: ${err.message}`))
      .finally(() => setLoading(false));
  };

  const resetDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setLoading(true);
    fetchSales(storeId)
      .catch(err => setError(`Reset filter error: ${err.message}`))
      .finally(() => setLoading(false));
  };

  // Function to export dashboard as PDF
  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    
    setExportLoading(true);
    
    try {
      // Get current date for filename
      const currentDate = format(new Date(), "yyyy-MM-dd");
      const storeName = storeInfo?.storeName || "Store";
      const fileName = `${storeName.replace(/\s+/g, '-').toLowerCase()}-dashboard-${currentDate}.pdf`;
      
      const dashboard = dashboardRef.current;
      
      // Calculate PDF dimensions (A4 page)
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const pdfRatio = pdfWidth / pdfHeight;
      
      // Create new PDF with A4 dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add a title to the PDF
      pdf.setFontSize(18);
      pdf.text(`${storeInfo?.storeName || "Store"} Dashboard`, 15, 15);
      
      // Add date range if filters are applied
      if (startDate || endDate) {
        pdf.setFontSize(12);
        let dateText = "Date Range: ";
        if (startDate && endDate) {
          dateText += `${startDate} to ${endDate}`;
        } else if (startDate) {
          dateText += `From ${startDate}`;
        } else if (endDate) {
          dateText += `Until ${endDate}`;
        }
        pdf.text(dateText, 15, 23);
      }
      
      // Add generation date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`, 15, 30);
      
      // Capture the dashboard content
      const canvas = await html2canvas(dashboard, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });
      
      // Calculate dimensions to fit on PDF
      const imgWidth = pdfWidth - 30; // 15mm margin on each side
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Add the captured content to the PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 15, 35, imgWidth, imgHeight);
      
      // If content doesn't fit on one page, create additional pages
      if (imgHeight > pdfHeight - 50) { // 50mm for the header space
        let heightLeft = imgHeight;
        let position = 35; // Starting position after the header
        let page = 1;
        
        heightLeft -= (pdfHeight - 35);
        
        while (heightLeft > 0) {
          pdf.addPage();
          page++;
          
          // Add page number
          pdf.setFontSize(8);
          pdf.text(`Page ${page}`, pdfWidth - 25, pdfHeight - 10);
          
          position = -pdfHeight + 35 * page;
          pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
          
          heightLeft -= pdfHeight;
        }
      }
      
      // Save the PDF
      pdf.save(fileName);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // Redirect to login if not logged in
  if (!isLoggedIn && !loading) {
    return (
      <div className="artisan-dashboard login-required">
        <h2>Seller Login Required</h2>
        <p>Please log in to access your seller dashboard.</p>
        <div className="action-buttons">
          <button onClick={() => window.location.href = "/login"}>Log In</button>
          <button onClick={() => window.location.href = "/seller-signup"}>Register as Seller</button>
        </div>
      </div>
    );
  }

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

  // If store info is missing after loading, show store creation prompt
  if (!loading && !storeInfo) {
    return (
      <div className="artisan-dashboard error-message">
        <h2>Store Information Not Found</h2>
        <p>Please complete your store profile before accessing the dashboard.</p>
        <button onClick={() => window.location.href = "/create-store"}>Create Store</button>
      </div>
    );
  }

  return (
    <>
      <Navi />
      <div className="artisan-dashboard" ref={dashboardRef}>
        <div className="dashboard-header">
          <div className="store-info">
            <h1>{storeInfo.storeName}</h1>
            <p>
              {storeInfo.storeBio} • 
              {storeInfo.paymentMethod} • 
              Owner: {storeInfo.ownerName}
            </p>
          </div>
          <div className="export-button-container">
            <button 
              className="export-pdf-button"
              onClick={exportToPDF}
              disabled={exportLoading}
            >
              {exportLoading ? "Generating PDF..." : "Export as PDF"}
            </button>
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
                <button onClick={() => window.location.href = "/add-product"}>Add a Product</button>
              </div>
            )}
          </section>
          
          <section className="sales-section">
            <div className="section-header">
              <h2>Sales</h2>
              <div className="date-filter">
                <div className="date-range-inputs">
                  <label>
                    From:
                    <input
                      type="date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      max={endDate || undefined}
                    />
                  </label>
                  <label>
                    To:
                    <input
                      type="date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      min={startDate || undefined}
                    />
                  </label>
                </div>
                <div className="filter-actions">
                  <button 
                    className="apply-btn" 
                    onClick={applyDateFilter}
                    disabled={!(startDate || endDate)}
                  >
                    Apply
                  </button>
                  {(startDate || endDate) && (
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
                <p>
                  {startDate && endDate 
                    ? `No sales found between ${startDate} and ${endDate}` 
                    : startDate 
                      ? `No sales found from ${startDate} onwards`
                      : endDate
                        ? `No sales found until ${endDate}`
                        : "No sales records found"
                  }
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default SellerDashboard;