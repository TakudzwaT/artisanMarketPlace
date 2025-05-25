import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
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

  useEffect(() => {
    const storedStoreId = localStorage.getItem("storeId");
    if (storedStoreId) {
      setStoreId(storedStoreId);
    } else {
      setError("Unable to retrieve store information.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!storeId) return;
      setLoading(true);
      try {
        const ordersQuery = collection(db, "orders");
        const orderSnapshot = await getDocs(ordersQuery);

        const ordersData = [];
        for (const orderDoc of orderSnapshot.docs) {
          const orderData = orderDoc.data();
          if (orderData.storeId === storeId || (orderData.items && orderData.items.some(item => item.storeId === storeId))) {
            const enrichedItems = [];
            if (orderData.items) {
              for (const item of orderData.items) {
                if (item.storeId === storeId) {
                  enrichedItems.push({ ...item, orderId: orderDoc.id, status: item.status || orderData.status || "processing" });
                }
              }
            } else {
              enrichedItems.push({
                productId: orderData.productId,
                name: "Product",
                price: 0,
                qty: orderData.qty || 1,
                orderId: orderDoc.id,
                orderDate: orderData.purchasedAt || orderData.createdAt,
                status: orderData.status || "processing"
              });
            }

            if (enrichedItems.length > 0) {
              ordersData.push({
                id: orderDoc.id,
                ...orderData,
                enrichedItems,
                createdAt: orderData.createdAt,
                purchasedAt: orderData.purchasedAt
              });
            }
          }
        }

        const productsToFetch = new Set();
        ordersData.forEach(order => {
          if (order.enrichedItems) {
            order.enrichedItems.forEach(item => {
              if (item.productId) productsToFetch.add(item.productId);
            });
          }
        });

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

        const fullyEnrichedOrders = ordersData.map(order => {
          if (order.enrichedItems) {
            const updatedItems = order.enrichedItems.map(item => {
              const details = productDetails[item.productId] || {};
              return {
                ...item,
                name: details.name || item.name,
                price: details.price || item.price,
                imageUrl: details.imageUrl || item.imageUrl
              };
            });
            return { ...order, enrichedItems: updatedItems };
          }
          return order;
        });

        setOrders(fullyEnrichedOrders);
      } catch (err) {
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [storeId]);

  const updateOrderItemStatus = async (orderId, productId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) throw new Error("Order not found");
      const orderData = orderDoc.data();

      if (orderData.items && Array.isArray(orderData.items)) {
        const updatedItems = orderData.items.map(item => {
          if (item.productId === productId && item.storeId === storeId) {
            return { ...item, status: newStatus };
          }
          return item;
        });

        await updateDoc(orderRef, { items: updatedItems });

        const storeOrderQuery = query(
          collection(db, "stores", storeId, "orders"),
          where("orderId", "==", orderId),
          where("productId", "==", productId)
        );
        const storeOrderSnapshot = await getDocs(storeOrderQuery);
        if (!storeOrderSnapshot.empty) {
          const storeOrderDoc = storeOrderSnapshot.docs[0];
          await updateDoc(doc(db, "stores", storeId, "orders", storeOrderDoc.id), { status: newStatus });
        }

        const updatedStoreItems = updatedItems.filter(item => item.storeId === storeId);
        const allSameStatus = updatedStoreItems.every(item => item.status === newStatus);

        if (allSameStatus) {
          await updateDoc(orderRef, { status: newStatus });
        }
      } else {
        await updateDoc(orderRef, { status: newStatus });
      }

      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.enrichedItems.map(item => {
            if (item.productId === productId) {
              return { ...item, status: newStatus };
            }
            return item;
          });
          const allSame = updatedItems.every(item => item.status === newStatus);
          return { ...order, enrichedItems: updatedItems, ...(allSame && { status: newStatus }) };
        }
        return order;
      }));
    } catch (err) {
      console.error("Error updating order item status:", err);
      alert("Failed to update order item status. Please try again.");
    }
  };

  const renderOrderCards = () => {
    if (orders.length === 0) return <p className="no-orders">No orders found for your store.</p>;
    return orders.flatMap(order =>
      order.enrichedItems.map(item => (
        <Card
          key={`${order.id}-${item.productId}`}
          OrderID={order.id}
          ProductID={item.productId}
          description={item.name || "Product"}
          price={item.price || 0}
          date={order.createdAt || order.purchasedAt || "Unknown date"}
          Img={item.imageUrl || "/api/placeholder/400/320"}
          status={item.status || "processing"}
          onStatusChange={(newStatus) => updateOrderItemStatus(order.id, item.productId, newStatus)}
          quantity={item.qty || 1}
          notes={order.notes}
        />
      ))
    );
  };

  return (
    <><Navi />
    <section className="seller-orders-container">
      
      <section className="orders-header">
        <h1>Manage Orders</h1>
        <p>View and update the status of your store's orders</p>
      </section>
      {loading ? (
        <section className="loading-spinner">
          <section className="spinner"></section>
          <p>Loading orders...</p>
        </section>
      ) : error ? (
        <section className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </section>
      ) : (
        <section className="orders-section">{renderOrderCards()}</section>
      )}
    </section>
    </>
  );
}

export default SellerOrders;
