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
  const [exportType, setExportType] = useState("pdf"); // "pdf" or "csv"
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const dashboardRef = useRef(null);
  const auth = getAuth();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setTimeout(() => {
          initializeDashboard(user.uid);
        }, 0);
      } else {
        const storedSellerId = localStorage.getItem('sellerId');
        if (storedSellerId) {
          setIsLoggedIn(true);
          setTimeout(() => {
            initializeDashboard(storedSellerId);
          }, 0);
        } else {
          setLoading(false);
          setIsLoggedIn(false);
          setError("Please log in to access your seller dashboard");
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  const initializeDashboard = (sellerId) => {
    if (!sellerId) {
      setLoading(false);
      setError("Seller ID not found");
      return;
    }
    
    setStoreId(sellerId);
    setLoading(true);
    
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
      setDataLoaded(true);
      
      // Force a refresh if this is the first time loading
      if (!dataLoaded && window.location.pathname.includes("seller-dashboard")) {
        window.location.reload();
      }
    });
  };

  useEffect(() => {
    calculateStatistics();
  }, [sales]);

  const calculateStatistics = () => {
    if (sales.length > 0) {
      const revenue = sales.reduce((sum, order) => {
        if (!order.items) return sum;
        
        const orderTotal = Object.values(order.items).reduce((itemSum, item) => {
          return itemSum + (item.total || (item.price * item.qty) || 0);
        }, 0);
        
        return sum + orderTotal;
      }, 0);
      setTotalRevenue(revenue);
      
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
      const ordersRef = collection(db, "orders");
      
      const snapshot = await getDocs(ordersRef);
      
      if (snapshot.empty) {
        setSales([]);
        return [];
      }
      
      let allOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      let storeOrders = allOrders.filter(order => {
        if (!order.items) return false;
        
        return Object.values(order.items).some(item => item.storeId === sellerId);
      });
      
      if (dateRange.start || dateRange.end) {
        storeOrders = storeOrders.filter(order => {
          let orderDate;
          
          if (order.createdAt?.toDate) {
            orderDate = order.createdAt.toDate();
          } else if (order.createdAt instanceof Date) {
            orderDate = order.createdAt;
          } else if (order.purchasedAt?.toDate) {
            orderDate = order.purchasedAt.toDate();
          } else if (order.purchasedAt) {
            orderDate = new Date(order.purchasedAt);
          } else {
            orderDate = new Date();
          }
          
          if (dateRange.start && dateRange.end) {
            const start = parseISO(dateRange.start);
            const end = parseISO(dateRange.end);
            end.setDate(end.getDate() + 1);
            return isWithinInterval(orderDate, { start, end });
          } else if (dateRange.start) {
            return orderDate >= parseISO(dateRange.start);
          } else if (dateRange.end) {
            const end = parseISO(dateRange.end);
            end.setDate(end.getDate() + 1);
            return orderDate < end;
          }
          
          return true;
        });
      }
      
      const processedOrders = storeOrders.map(order => {
        const processedOrder = {...order};
        
        if (processedOrder.items) {
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

  const exportToCSV = () => {
    try {
      setExportLoading(true);
      
      const currentDate = format(new Date(), "yyyy-MM-dd");
      const storeName = storeInfo?.storeName || "Store";
      const fileName = `${storeName.replace(/\s+/g, '-').toLowerCase()}-dashboard-${currentDate}.csv`;
      
      // Create CSV header rows
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add store info
      csvContent += `Store Name,${storeInfo?.storeName || "Unknown"}\r\n`;
      csvContent += `Owner,${storeInfo?.ownerName || "Unknown"}\r\n`;
      csvContent += `Date Generated,${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\r\n\r\n`;
      
      // Add summary stats
      csvContent += "DASHBOARD SUMMARY\r\n";
      csvContent += `Total Sales,${sales.length}\r\n`;
      csvContent += `Revenue,${totalRevenue}\r\n`;
      csvContent += `Items Sold,${totalItems}\r\n`;
      csvContent += `Products,${inventory.length}\r\n\r\n`;
      
      // Add inventory table
      csvContent += "INVENTORY\r\n";
      csvContent += "Product,Category,Price,Stock,Status\r\n";
      
      inventory.forEach(product => {
        let status = product.status || (product.stock > 0 ? "In Stock" : "Out of Stock");
        csvContent += `"${product.name}","${product.category}",${product.price},${product.stock},"${status}"\r\n`;
      });
      
      csvContent += "\r\n";
      
      // Add sales table
      csvContent += "SALES\r\n";
      if (startDate || endDate) {
        let dateRange = "Date Range: ";
        if (startDate && endDate) {
          dateRange += `${startDate} to ${endDate}`;
        } else if (startDate) {
          dateRange += `From ${startDate}`;
        } else if (endDate) {
          dateRange += `Until ${endDate}`;
        }
        csvContent += `${dateRange}\r\n`;
      }
      
      csvContent += "Order ID,Item,Quantity,Price,Total,Date\r\n";
      
      sales.forEach(order => {
        const items = order.items || {};
        
        Object.values(items).forEach(item => {
          if (item.storeId !== storeId) return;
          
          let dateObj;
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
          const itemTotal = item.total || (item.price * item.qty);
          
          csvContent += `"${order.id.substring(0, 8)}","${item.name}",${item.qty},${item.price},${itemTotal},"${date}"\r\n`;
        });
      });
      
      // Create download link and trigger download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error("Error generating CSV:", err);
      alert("Failed to generate CSV. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    
    setExportLoading(true);
    
    try {
      const currentDate = format(new Date(), "yyyy-MM-dd");
      const storeName = storeInfo?.storeName || "Store";
      const fileName = `${storeName.replace(/\s+/g, '-').toLowerCase()}-dashboard-${currentDate}.pdf`;
      
      const dashboard = dashboardRef.current;
      
      const pdfWidth = 210;
      const pdfHeight = 297;
      const pdfRatio = pdfWidth / pdfHeight;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      pdf.setFontSize(18);
      pdf.text(`${storeInfo?.storeName || "Store"} Dashboard`, 15, 15);
      
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
      
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`, 15, 30);
      
      const canvas = await html2canvas(dashboard, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });
      
      const imgWidth = pdfWidth - 30;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 15, 35, imgWidth, imgHeight);
      
      if (imgHeight > pdfHeight - 50) {
        let heightLeft = imgHeight;
        let position = 35;
        let page = 1;
        
        heightLeft -= (pdfHeight - 35);
        
        while (heightLeft > 0) {
          pdf.addPage();
          page++;
          
          pdf.setFontSize(8);
          pdf.text(`Page ${page}`, pdfWidth - 25, pdfHeight - 10);
          
          position = -pdfHeight + 35 * page;
          pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
          
          heightLeft -= pdfHeight;
        }
      }
      
      pdf.save(fileName);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };
  
  const handleExport = () => {
    if (exportType === "pdf") {
      exportToPDF();
    } else {
      exportToCSV();
    }
  };

  if (!isLoggedIn && !loading) {
    return (
      <section className="artisan-dashboard login-required">
        <h2>Seller Login Required</h2>
        <p>Please log in to access your seller dashboard.</p>
        <section className="action-buttons">
          <button onClick={() => window.location.href = "/login"}>Log In</button>
          <button onClick={() => window.location.href = "/seller-signup"}>Register as Seller</button>
        </section>
      </section>
    );
  }

  if (loading && !inventory.length && !sales.length && !storeInfo) {
    return (
      <section className="artisan-dashboard loading-spinner">
        <section className="spinner"></section>
        <p>Loading your dashboard...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="artisan-dashboard error-message">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </section>
    );
  }

  if (!loading && !storeInfo) {
    return (
      <section className="artisan-dashboard error-message">
        <h2>Store Information Not Found</h2>
        <p>Please complete your store profile before accessing the dashboard.</p>
        <button onClick={() => window.location.href = "/create-store"}>Create Store</button>
      </section>
    );
  }

  return (
    <>
      <Navi />
      <section className="artisan-dashboard" ref={dashboardRef}>
        <section className="dashboard-header">
          <section className="store-info">
            <h1>{storeInfo.storeName}</h1>
            <p>
              {storeInfo.storeBio} • 
              {storeInfo.paymentMethod} • 
              Owner: {storeInfo.ownerName}
            </p>
          </section>
          <section className="export-button-container">
            <section className="export-options">
              <select 
                value={exportType} 
                onChange={(e) => setExportType(e.target.value)}
                className="export-select"
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
              <button 
                className="export-button"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? `Generating ${exportType.toUpperCase()}...` : `Export as ${exportType.toUpperCase()}`}
              </button>
            </section>
          </section>
        </section>
        
        <section className="dashboard-stats">
          <section className="stat-card">
            <h3>Total Sales</h3>
            <p className="stat-value">{sales.length}</p>
          </section>
          <section className="stat-card">
            <h3>Revenue</h3>
            <p className="stat-value">{totalRevenue}</p>
          </section>
          <section className="stat-card">
            <h3>Items Sold</h3>
            <p className="stat-value">{totalItems}</p>
          </section>
          <section className="stat-card">
            <h3>Products</h3>
            <p className="stat-value">{inventory.length}</p>
          </section>
        </section>
        
        {loading && (
          <section className="loading-spinner" style={{ padding: "20px" }}>
            <section className="spinner"></section>
            <p>Updating data...</p>
          </section>
        )}
        
        <section className="dashboard-content">
          <section className="inventory-section">
            <section className="section-header">
              <h2>Inventory</h2>
            </section>
            
            {inventory.length > 0 ? (
              <section className="table-container">
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
              </section>
            ) : (
              <section className="empty-state">
                <p>No products in inventory</p>
                <button onClick={() => window.location.href = "/add-product"}>Add a Product</button>
              </section>
            )}
          </section>
          
          <section className="sales-section">
            <section className="section-header">
              <h2>Sales</h2>
              <section className="date-filter">
                <section className="date-range-inputs">
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
                </section>
                <section className="filter-actions">
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
                </section>
              </section>
            </section>
            
            {sales.length > 0 ? (
              <section className="table-container">
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
                      const items = order.items || {};
                      
                      return Object.values(items).map((item, itemIndex) => {
                        if (item.storeId !== storeId) return null;
                        
                        let dateObj;
                        
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
                      }).filter(Boolean);
                    })}
                  </tbody>
                </table>
              </section>
            ) : (
              <section className="empty-state">
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
              </section>
            )}
          </section>
        </section>
      </section>
    </>
  );
}

export default SellerDashboard;