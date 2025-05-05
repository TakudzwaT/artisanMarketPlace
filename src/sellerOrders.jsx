import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import Card from './components/seller_card';
import Navi from './components/sellerNav';
import { useNavigate } from 'react-router-dom';
import './styling/sellerOrders.css';

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const navigate = useNavigate();

  // Get current user's store ID - in a real app, this would come from authentication
  useEffect(() => {
    const storedStoreId = localStorage.getItem("storeId");
    if (storedStoreId) {
      setStoreId(storedStoreId);
    } else {
      console.error("No storeId found in localStorage.");
      setError("Unable to retrieve store information.");
      setLoading(false);
    }
  }, []);
  
  // Fetch orders related to this store
  useEffect(() => {
    const fetchOrders = async () => {
      if (!storeId) return;
      
      setLoading(true);
      try {
        // First, get all orders
        const ordersQuery = collection(db, "orders");
        const orderSnapshot = await getDocs(ordersQuery);
        
        const ordersData = [];
        
        // Process each order document
        for (const orderDoc of orderSnapshot.docs) {
          const orderData = orderDoc.data();
          
          // Check if this order belongs to our store
          if (orderData.storeId === storeId || 
              (orderData.items && orderData.items.some(item => item.storeId === storeId))) {
            
            // Get product details for each order item
            const enrichedItems = [];
            
            if (orderData.items) {
              for (const item of orderData.items) {
                if (item.storeId === storeId) {
                  enrichedItems.push({
                    ...item,
                    orderId: orderDoc.id
                  });
                }
              }
            } else {
              // Handle case where order structure is different
              enrichedItems.push({
                productId: orderData.productId,
                name: "Product", // Will be updated with actual product name
                price: 0, // Will be updated with actual price
                qty: orderData.qty || 1,
                orderId: orderDoc.id,
                // Properly handle timestamps by not directly including them here
                // They'll be properly formatted in the Card component
                orderDate: orderData.purchasedAt || orderData.createdAt
              });
            }
            
            // Add enriched order to our list
            if (enrichedItems.length > 0) {
              // Convert Firestore timestamps to strings to avoid rendering issues
              const processedOrderData = {
                ...orderData,
                // Format the dates if they are Firestore timestamps
                createdAt: orderData.createdAt,
                purchasedAt: orderData.purchasedAt
              };
              
              ordersData.push({
                id: orderDoc.id,
                ...processedOrderData,
                enrichedItems
              });
            }
          }
        }
        
        // Now get product details for each product ID
        const productsToFetch = new Set();
        ordersData.forEach(order => {
          if (order.productId) productsToFetch.add(order.productId);
          if (order.enrichedItems) {
            order.enrichedItems.forEach(item => {
              if (item.productId) productsToFetch.add(item.productId);
            });
          }
        });
        
        // Fetch product details
        const productDetails = {};
        for (const productId of productsToFetch) {
          try {
            const productsQuery = query(
              collection(db, "stores", storeId, "products"),
              where("productId", "==", productId)
            );
            const productSnapshot = await getDocs(productsQuery);
            
            if (!productSnapshot.empty) {
              productDetails[productId] = productSnapshot.docs[0].data();
            }
          } catch (err) {
            console.error(`Error fetching product ${productId}:`, err);
          }
        }
        
        // Enrich orders with product details
        const fullyEnrichedOrders = ordersData.map(order => {
          if (order.productId && productDetails[order.productId]) {
            return {
              ...order,
              productName: productDetails[order.productId].name,
              productPrice: productDetails[order.productId].price,
              imageUrl: productDetails[order.productId].imageUrl
            };
          }
          
          // Enrich items with product details
          if (order.enrichedItems) {
            const updatedItems = order.enrichedItems.map(item => {
              if (item.productId && productDetails[item.productId]) {
                return {
                  ...item,
                  name: productDetails[item.productId].name || item.name,
                  price: productDetails[item.productId].price || item.price,
                  imageUrl: productDetails[item.productId].imageUrl
                };
              }
              return item;
            });
            
            return {
              ...order,
              enrichedItems: updatedItems
            };
          }
          
          return order;
        });
        
        setOrders(fullyEnrichedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [storeId]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
      
      // Update local state to reflect the change
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status. Please try again.");
    }
  };

  // Render order cards from our orders data
  const renderOrderCards = () => {
    if (orders.length === 0) {
      return <p className="no-orders">No orders found for your store.</p>;
    }
    
    // Flatten orders that have multiple items into individual cards
    const orderCards = [];
    
    orders.forEach(order => {
      if (order.enrichedItems && order.enrichedItems.length > 0) {
        order.enrichedItems.forEach(item => {
          orderCards.push(
            <Card 
              key={`${order.id}-${item.productId}`}
              OrderID={order.id}
              description={item.name || "Product"}
              price={item.price || 0}
              date={order.createdAt || order.purchasedAt || "Unknown date"}
              Img={item.imageUrl || "/api/placeholder/400/320"}
              status={order.status || "processing"}
              onStatusChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
              quantity={item.qty || 1}
              notes={order.notes}
            />
          );
        });
      } else {
        // Handle single product orders
        orderCards.push(
          <Card 
            key={order.id}
            OrderID={order.id}
            description={order.productName || "Product"}
            price={order.productPrice || 0}
            date={order.createdAt || order.purchasedAt || "Unknown date"}
            Img={order.imageUrl || "/api/placeholder/400/320"}
            status={order.status || "processing"}
            onStatusChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
            quantity={order.qty || 1}
            notes={order.notes}
          />
        );
      }
    });
    
    return orderCards;
  };

  return (
    <div className="seller-orders-container">
      <Navi />
      <div className="orders-header">
        <h1>Manage Orders</h1>
        <p>View and update the status of your store's orders</p>
      </div>
      
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <section className="orders-section">
          {renderOrderCards()}
        </section>
      )}
    </div>
  );
}

export default SellerOrders;