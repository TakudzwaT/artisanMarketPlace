import React, { useEffect, useState, useRef, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { format, isWithinInterval, parseISO } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./styling/dboardstyle.css";
import Navi from "./components/sellerNav";
import DashboardSummary from "./components/DashboardSummary";
import InventoryTable from "./components/InventoryTable";
import SalesTable from "./components/SalesTable";
import DateFilter from "./components/DateFilter";

const db = getFirestore();
const auth = getAuth();

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
  const [authChecked, setAuthChecked] = useState(false);

  const dashboardRef = useRef(null);

  const formatFirestoreDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  const calculateStatistics = useCallback((salesData) => {
    if (!salesData || salesData.length === 0) {
      setTotalRevenue(0);
      setTotalItems(0);
      return;
    }

    const revenue = salesData.reduce((sum, order) => {
      if (!order.items) return sum;
      const orderTotal = Object.values(order.items).reduce((itemSum, item) => {
        return itemSum + (item.total || (item.price * item.qty) || 0);
      }, 0);
      return sum + orderTotal;
    }, 0);
    setTotalRevenue(revenue);

    const items = salesData.reduce((sum, order) => {
      if (!order.items) return sum;
      const orderItems = Object.values(order.items).reduce((itemSum, item) => {
        return itemSum + (item.qty || 0);
      }, 0);
      return sum + orderItems;
    }, 0);
    setTotalItems(items);
  }, []);

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
      const productData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(productData);
      return productData;
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(`Inventory error: ${err.message}`);
      throw err;
    }
  };

  const fetchSales = useCallback(async (sellerId, dateRange = { start: "", end: "" }) => {
    try {
      const ordersRef = collection(db, "orders");
      const snapshot = await getDocs(ordersRef);

      let allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let storeOrders = allOrders.filter(order =>
        order.items && Object.values(order.items).some(item => item.storeId === sellerId)
      );

      if (dateRange.start || dateRange.end) {
        storeOrders = storeOrders.filter(order => {
          const orderDate = formatFirestoreDate(order.purchasedAt || order.createdAt);
          if (dateRange.start && dateRange.end) {
            const start = parseISO(dateRange.start);
            const end = parseISO(dateRange.end);
            end.setDate(end.getDate() + 1); // Include the end date fully
            return isWithinInterval(orderDate, { start, end });
          } else if (dateRange.start) {
            return orderDate >= parseISO(dateRange.start);
          } else if (dateRange.end) {
            const end = parseISO(dateRange.end);
            end.setDate(end.getDate() + 1); // Include the end date fully
            return orderDate < end;
          }
          return true;
        });
      }

      const processedOrders = storeOrders.map(order => {
        const processedOrder = { ...order };
        if (processedOrder.items) {
          processedOrder.items = Object.fromEntries(
            Object.entries(processedOrder.items).filter(([, item]) => item.storeId === sellerId)
          );
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
  }, []);

  const loadDashboardData = useCallback(async (sellerId) => {
    if (!sellerId) {
      setLoading(false);
      setError("Seller ID not found");
      return;
    }
    setLoading(true);
    try {
      await fetchStoreInfo(sellerId);
      const salesData = await fetchSales(sellerId, { start: startDate, end: endDate });
      await fetchInventory(sellerId);
      calculateStatistics(salesData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      // Error state already set by insectionidual fetch functions
    } finally {
      setLoading(false);
    }
  }, [fetchSales, calculateStatistics, startDate, endDate]); // Added startDate, endDate dependencies

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setStoreId(user.uid);
        loadDashboardData(user.uid);
      } else {
        const storedSellerId = localStorage.getItem('sellerId');
        if (storedSellerId) {
          setIsLoggedIn(true);
          setStoreId(storedSellerId);
          loadDashboardData(storedSellerId);
        } else {
          setLoading(false);
          setIsLoggedIn(false);
          setError("Please log in to access your seller dashboard");
        }
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [loadDashboardData]);

  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);

  const applyDateFilter = useCallback(() => {
    setLoading(true);
    fetchSales(storeId, { start: startDate, end: endDate })
      .then(calculateStatistics)
      .catch(err => setError(`Date filter error: ${err.message}`))
      .finally(() => setLoading(false));
  }, [fetchSales, calculateStatistics, storeId, startDate, endDate]);

  const resetDateFilter = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setLoading(true);
    fetchSales(storeId)
      .then(calculateStatistics)
      .catch(err => setError(`Reset filter error: ${err.message}`))
      .finally(() => setLoading(false));
  }, [fetchSales, calculateStatistics, storeId]);

  const exportToCSV = useCallback(() => {
    try {
      setExportLoading(true);
      const currentDate = format(new Date(), "yyyy-MM-dd");
      const storeName = storeInfo?.storeName || "Store";
      const fileName = `${storeName.replace(/\s+/g, '-').toLowerCase()}-dashboard-${currentDate}.csv`;

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Store Name,${storeInfo?.storeName || "Unknown"}\r\n`;
      csvContent += `Owner,${storeInfo?.ownerName || "Unknown"}\r\n`;
      csvContent += `Date Generated,${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\r\n\r\n`;

      csvContent += "DASHBOARD SUMMARY\r\n";
      csvContent += `Total Sales,${sales.length}\r\n`;
      csvContent += `Revenue,${totalRevenue}\r\n`;
      csvContent += `Items Sold,${totalItems}\r\n`;
      csvContent += `Products,${inventory.length}\r\n\r\n`;

      csvContent += "INVENTORY\r\n";
      csvContent += "Product,Category,Price,Stock,Status\r\n";
      inventory.forEach(product => {
        let status = product.status || (product.stock > 0 ? "In Stock" : "Out of Stock");
        csvContent += `"${product.name}","${product.category}",${product.price},${product.stock},"${status}"\r\n`;
      });
      csvContent += "\r\n";

      csvContent += "SALES\r\n";
      if (startDate || endDate) {
        let dateRange = "Date Range: ";
        if (startDate && endDate) dateRange += `${startDate} to ${endDate}`;
        else if (startDate) dateRange += `From ${startDate}`;
        else if (endDate) dateRange += `Until ${endDate}`;
        csvContent += `${dateRange}\r\n`;
      }
      csvContent += "Order ID,Item,Quantity,Price,Total,Date\r\n";
      sales.forEach(order => {
        Object.values(order.items || {}).forEach(item => {
          if (item.storeId !== storeId) return;
          const date = format(formatFirestoreDate(order.purchasedAt || order.createdAt), "yyyy-MM-dd");
          const itemTotal = item.total || (item.price * item.qty);
          csvContent += `"${order.id.substring(0, 8)}","${item.name}",${item.qty},${item.price},${itemTotal},"${date}"\r\n`;
        });
      });

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
  }, [sales, totalRevenue, totalItems, inventory, storeInfo, startDate, endDate, storeId]);

  const exportToPDF = useCallback(async () => {
    if (!dashboardRef.current) return;
    setExportLoading(true);
    try {
      const currentDate = format(new Date(), "yyyy-MM-dd");
      const storeName = storeInfo?.storeName || "Store";
      const fileName = `${storeName.replace(/\s+/g, '-').toLowerCase()}-dashboard-${currentDate}.pdf`;

      const dashboard = dashboardRef.current;
      const pdfWidth = 210;
      const pdfHeight = 297;
      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.setFontSize(18);
      pdf.text(`${storeInfo?.storeName || "Store"} Dashboard`, 15, 15);
      if (startDate || endDate) {
        pdf.setFontSize(12);
        let dateText = "Date Range: ";
        if (startDate && endDate) dateText += `${startDate} to ${endDate}`;
        else if (startDate) dateText += `From ${startDate}`;
        else if (endDate) dateText += `Until ${endDate}`;
        pdf.text(dateText, 15, 23);
      }
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`, 15, 30);

      const canvas = await html2canvas(dashboard, {
        scale: 2, useCORS: true, logging: false, allowTaint: true, backgroundColor: "#ffffff"
      });

      const imgWidth = pdfWidth - 30;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 15, 35, imgWidth, imgHeight);

      let heightLeft = imgHeight;
      let position = 35;
      let page = 1;

      heightLeft -= (pdfHeight - 35);
      while (heightLeft > 0) {
        pdf.addPage();
        page++;
        pdf.setFontSize(8);
        pdf.text(`Page ${page}`, pdfWidth - 25, pdfHeight - 10);
        position = -pdfHeight + 35 * page; // Corrected position calculation for multi-page
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(fileName);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExportLoading(false);
    }
  }, [storeInfo, startDate, endDate]);

  const handleExport = () => {
    if (exportType === "pdf") {
      exportToPDF();
    } else {
      exportToCSV();
    }
  };

  if (!authChecked || (loading && !inventory.length && !sales.length && !storeInfo)) {
    return (
      <section className="artisan-dashboard loading-spinner">
        <section className="spinner"></section>
        <p>Loading your dashboard...</p>
      </section>
    );
  }

  if (!isLoggedIn) {
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

  if (error) {
    return (
      <section className="artisan-dashboard error-message">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </section>
    );
  }

  if (!storeInfo) {
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
              {storeInfo.storeBio} • {storeInfo.paymentMethod} • Owner: {storeInfo.ownerName}
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

        <DashboardSummary
          totalSales={sales.length}
          totalRevenue={totalRevenue}
          totalItems={totalItems}
          totalProducts={inventory.length}
          loading={loading}
        />

        <section className="dashboard-content">
          <InventoryTable inventory={inventory} loading={loading} />

          <SalesTable
            sales={sales}
            startDate={startDate}
            endDate={endDate}
            handleStartDateChange={handleStartDateChange}
            handleEndDateChange={handleEndDateChange}
            applyDateFilter={applyDateFilter}
            resetDateFilter={resetDateFilter}
            storeId={storeId}
            loading={loading}
          />
        </section>
      </section>
    </>
  );
}

export default SellerDashboard;