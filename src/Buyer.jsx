import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navigation from './components/nav';
import { useNavigate } from 'react-router-dom';
import OrderCard from './components/OrderCard';
import './styling/BuyerTrack.css';

function BuyerTrack() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  // Format Firestore timestamp
  const formatFirestoreDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return timestamp; // Return as-is if it's already a string
  };

  const fetchProductDetails = async (productId, storeId) => {
    try {
      const productRef = doc(db, 'stores', storeId, 'products', productId);
      const productSnap = await getDoc(productRef);
      return productSnap.exists() ? productSnap.data() : null;
    } catch (err) {
      console.error("Error fetching product:", err);
      return null;
    }
  };

  const fetchStoreDetails = async (storeId) => {
    if (!storeId) return null;
    try {
      const storeRef = doc(db, 'stores', storeId);
      const storeSnap = await getDoc(storeRef);
      return storeSnap.exists() ? storeSnap.data() : null;
    } catch (err) {
      console.error("Error fetching store:", err);
      return null;
    }
  };

  // Get current user's ID
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.error("No userId found in localStorage.");
      setError("Please login to view your orders");
      setLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  // Fetch orders for this user
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("userId", "==", userId)
        );
        const orderSnapshot = await getDocs(ordersQuery);
        
        const ordersData = [];
        
        // Process each order document
        for (const orderDoc of orderSnapshot.docs) {
          const orderData = orderDoc.data();
          const formattedDate = formatFirestoreDate(orderData.purchasedAt || orderData.createdAt);
          
          // Handle orders with multiple items
          if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
            // For each item in the order, create a separate card entry
            for (const item of orderData.items) {
              // Try to get product details if storeId and productId exist
              let productDetails = null;
              let storeDetails = null;
              
              if (item.productId && item.storeId) {
                try {
                  const productsQuery = query(
                    collection(db, "stores", item.storeId, "products"),
                    where("productId", "==", item.productId)
                  );
                  const productSnapshot = await getDocs(productsQuery);
                  
                  if (!productSnapshot.empty) {
                    productDetails = productSnapshot.docs[0].data();
                  } else {
                    // Try alternate path if product not found
                    productDetails = await fetchProductDetails(item.productId, item.storeId);
                  }
                  
                  // Fetch store details
                  storeDetails = await fetchStoreDetails(item.storeId);
                } catch (err) {
                  console.error(`Error fetching product ${item.productId}:`, err);
                }
              }
              
              // Create an entry for this item
              ordersData.push({
                id: orderDoc.id,
                orderId: orderDoc.id,
                itemId: item.productId,
                productId: item.productId,
                productName: (productDetails?.name || item.name || "Product"),
                productPrice: (item.price || productDetails?.price || 0),
                quantity: item.qty || 1,
                totalAmount: ((item.price || productDetails?.price || 0) * (item.qty || 1)),
                imageUrl: (productDetails?.imageUrl || item.imageUrl || "/api/placeholder/400/320"),
                formattedDate: formattedDate,
                // Use item-specific status if available, otherwise fall back to order status
                status: item.status || orderData.status || "processing",
                storeId: item.storeId,
                shopName: storeDetails?.storeName || item.storeName || "Shop"
              });
            }
          } else {
            // Handle single product orders
            let productDetails = null;
            let storeDetails = null;
            
            if (orderData.productId && orderData.storeId) {
              try {
                productDetails = await fetchProductDetails(orderData.productId, orderData.storeId);
                storeDetails = await fetchStoreDetails(orderData.storeId);
              } catch (err) {
                console.error(`Error fetching product ${orderData.productId}:`, err);
              }
            }
            
            ordersData.push({
              id: orderDoc.id,
              orderId: orderDoc.id,
              productId: orderData.productId,
              productName: (productDetails?.name || orderData.productName || "Your order"),
              productPrice: (orderData.price || productDetails?.price || 0),
              quantity: orderData.qty || 1,
              totalAmount: orderData.totalAmount || 
                          ((orderData.price || productDetails?.price || 0) * (orderData.qty || 1)),
              imageUrl: (productDetails?.imageUrl || orderData.imageUrl || "/api/placeholder/400/320"),
              formattedDate: formattedDate,
              status: orderData.status || "processing",
              storeId: orderData.storeId,
              shopName: storeDetails?.storeName || orderData.storeName || "Shop"
            });
          }
        }

        // Sort orders by date (newest first)
        ordersData.sort((a, b) => {
          const dateA = a.purchasedAt?.seconds || a.createdAt?.seconds || 0;
          const dateB = b.purchasedAt?.seconds || b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        setOrders(ordersData);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  return (
    <>
    <Navigation/>
    <main className="orders-page">
      
      <section className="orders-container">
        <header className="orders-header">
          <h1 className="orders-title" id="orders-heading">
            Your Handcrafted Orders
            <span className="title-decoration"></span>
          </h1>
          <p className="orders-subtitle">
            Track your unique artisanal purchases
          </p>
        </header>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Gathering your artisanal orders...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button 
              className="retry-button" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet. Discover unique handcrafted items from our artisans.</p>
          </div>
        ) : (
          <ul className="orders-list">
            {orders.map((order, index) => (
              <li key={`${order.id}-${order.itemId || index}`}>
                <OrderCard
                  description={order.productName}
                  price={order.totalAmount}
                  date={order.formattedDate}
                  OrderID={order.orderId}
                  ProductID={order.productId}
                  Img={order.imageUrl}
                  status={order.status}
                  shopName={order.shopName}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
    </>
  );
}

export default BuyerTrack;